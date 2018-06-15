var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var mongoClient = require('mongodb').MongoClient;
var fs = require('fs');

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
                    var saltValue = results[0].password.substring(0,20);
                    var saltPass = password + saltValue;
                    hash.update(saltPass, 'utf-8');
                    generatedHash = hash.digest('hex');
                    generatedHash = saltValue + generatedHash;
                    
                    if (results[0].password == generatedHash) {
                        var user = results[0]._id;
                        
                        var userImageDir = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + user;
                        fs.access(userImageDir, function(err) {
                            if (err && err.code === 'ENOENT') {
                                console.log('Making new directory for this user.');
                                fs.mkdir(userImageDir);
                            }
                        });
                        
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