//jshint esversion:6

//External denpendencies needed, you can also check out the package.json file to see all dependencies.
require("dotenv").config();
const path = require("path");
const http = require('http');
const express = require("express");
const socketio =  require("socket.io");
const formatMessage = require("./utils/messages");
const {userJoin, getCurrentUser} = require("./utils/users");
const { get, set } = require("./utils/session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const md5 = require("md5");

//Intializing all needed variables.
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Setting stactic folder.
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended:true }));
app.set("view engine", "ejs");

//Chat-Bot 
const chatBot = {
    name : "Chatter Bot",
    firtName : "Justin",
    lastName : "Sider",
    age : 6
}

let accountName = "";


//To run when a client connects.
io.on("connection", socket => {

    
    socket.on('joinRoom', ({username, room}) => {

        //console.log(get("user_name"));

        const user = userJoin(socket.id, username, room);
       
        socket.join(user.room);

        //For testing to see whether connection has been made.
        //console.log("New Web Socket Connectionm");

        socket.emit("message", formatMessage(chatBot.name, "Welcome to Chatter Box"));

        //Broadcast to a single user when a user connects.
        socket.broadcast.to(user.room).emit("message", formatMessage(chatBot.name, `${user.username} joined the chat`));
        //To broadcast to everyone.
        //io.emit();
        
    
    });

    //Listen for chatMessage
    socket.on("chatMessage", (msg) => {
        

        const user = getCurrentUser( socket.id );

        io.emit('message', formatMessage(user.username, msg));
    });

    //This will run when a User disconnects
    socket.on("disconnect", () => {
        io.emit("message", formatMessage(chatBot.name, `${user.username} has Disconnected from the Chat`));
    });
    
}); 

//Database handling
mongoose.connect("mongodb://localhost:27017/UserDB", { useNewUrlParser : true, useUnifiedTopology : true });
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema ({
    
    firstName : String,
    lastName : String,
    email : String,
    userName : String, 
    password : String,
    gender : String,
    age : Number,
    rooms : []
});

const User = mongoose.model( "Users",  userSchema );

//Page handling
app.get("/", function(req, res) {
    res.render( "login" );
});

app.get("/homepage", function(req, res) {
    res.render( "homepage", {userName: get("user_name")} );
});

app.get("/login", function(req, res) {
    res.render( "login" );
});

app.get("/signup", function(req, res) {
    res.render( "signup" );
});

app.get( "/editProfile", function(req, res) {

    console.log( get( "user_id" ) );

    User.findOne( { _id : get( "user_id" )}, function (err, foundUser) {
        if( err ) {
            console.log(err);
        } else {
            if( foundUser ) {
                res.render( "editProfile", {username : foundUser.userName, firstName : foundUser.firstName, lastName : foundUser.lastName, email : foundUser.email} );
            } else {
                res.redirect( "/login" );
            }
        }
    });
});

app.post( "/editProfile", function(req,res) {

    const username = req.body.username;
    const oldPassword = req.body.password;
    const newPassword = req.body.newPassword;
    const newEmail = req.body.email;
    const newFirstName = req.body.firstName;
    const newLastName = req.body.lastName;


    User.findOne({ _id: get( "user_id" ) }, (error, foundUser) => {
        if( error ) {
            console.log( error );
        } else {
            if( foundUser ) {
                console.log( foundUser.password + "\n" + oldPassword );
                if( foundUser.password === md5(oldPassword) ){
                    console.log(oldPassword);
                    User.findOneAndUpdate({_id: get( "user_id" )}, {userName : username, firstName : newFirstName, lastName : newLastName, email : newEmail, password : md5(newPassword)}, {new : true}, (error, data) => {
                        if( error ) {
                            console.log(error);
                        } else {
                            console.log(data);
                            res.redirect( "/homepage" );
                        }
                    });
                } else {
                    //console.log("Big Failure");
                    res.redirect("/editProfile");
                }
            } else {
                res.redirect( "/login" );
            }
        }
    });    
});

app.post("/login", function(req, res) {

    const emailAddress = req.body.email;
    const password = md5(req.body.password);


    User.findOne({ email : emailAddress }, function(err, foundUser) {
        
        if(err) {
            console.log(err);
        } else {
            if( foundUser ) {
                //This is to compare login password.
                if(foundUser.password === password) {

                    set( "user_id", foundUser._id );
                    set( "user_name", foundUser.firstName );

                    accountName = foundUser.firstName;

                    console.log( "Password entered is: " + password + "\nPassword expected was: " + foundUser.password);
                    res.redirect( "/homepage");

                } else {
                    res.redirect( "/login" );
                }
            } else {
                res.redirect( "/login" );
            } 
        }
    });
});

app.post("/signup", function(req, res) {
    
    //If the password matches the Retyped password then we make an account for the person
    if( req.body.password === req.body.retypePassword ) {

        const newUser = new User({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email : req.body.email,
            userName : req.body.username, 
            password : md5(req.body.password),
            gender : req.body.gender
        });

        newUser.save( function( err ) {
            if( err ) {
                console.log( err );
            } else {
                console.log("\nNew user was successfully added to the Database...\n");
                res.redirect("/homepage");
            }
        });

    } else {
        res.redirect("/signup");
    }
});

server.listen(3000 || process.env.PORT, function () {
    console.log( "Server is live on port 3000..." );
});