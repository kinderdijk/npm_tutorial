var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var mongoClient = require('mongodb').MongoClient;

var crypto = require('crypto');

module.exports = function(db) {
    passport.use(new Strategy(function(username, password, done) {
        mongoClient.connect(db.url, function(err, database) {
            var myDb = database.db('postLibrary');
            var collection = myDb.collection('user');
            
            collection.find({username: username}).toArray(function(err, results) {
                if (results.length > 1) {
                    done(null, false, {message: 'More than one username in the database.'});
                } else if (results.length == 1) {
                    const hash = crypto.createHash('sha512');
                    var saltPass = password + results[0].salt;
                    hash.update(saltPass, 'utf-8');
                    generatedHash = hash.digest('hex');
                    
                    if (results[0].password == generatedHash) {
                        var user = results[0]._id;
                        done(null, user);
                    } else {
                        done(null, false, {message: 'Bad password'});
                    }
                } else {
                    done(null, false, {message: 'There is no username like this in the database.'});
                }
            });
        });
    }));
}