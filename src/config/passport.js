var passport = require('passport');
var db = require('./database');
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

module.exports = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        mongoClient.connect(db.url, function(err, database) {
            var myDb = database.db('postLibrary');
            var collection = myDb.collection('user');
            
            collection.find({_id: new objectID(user)}).toArray(function(err, results) {
                done(null, results[0]);
            });
        });
    });
    
    require('./strategies/local.strategy')(db);
}