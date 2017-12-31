var passport = require('passport');
var db = require('./database');
var mongoClient = require('mongodb').MongoClient;

module.exports = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.serializeUser(function(user, done) {
        console.log('Serial user: ' + user);
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        console.log('Deserialize: ' + user);
        done(null, user);
    });
    
    require('./strategies/local.strategy')(db);
}