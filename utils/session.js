const storage = require("node-sessionstorage");

function get( key ) {
    return storage.getItem( key );
}

function set( key, value ) {
    storage.setItem(key, value);
}

module.exports = {
    get,
    set
}