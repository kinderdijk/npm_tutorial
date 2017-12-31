var express = require('express');
var authRouter = express.Router();
var mongoClient = require('mongodb').MongoClient;
var passport = require('passport');

var crypto = require('crypto');
var cryptoRandomString = require('crypto-random-string');

authRouter.route('/login').post(
    passport.authenticate('local', {
        failureRedirect: '/auth/signup'
    }), function(req, res) {
        res.redirect('/');
    }
);

authRouter.route('/login').get(function(req, res) {
    res.render('login');
});

authRouter.route('/signup').post(function(req, res) {
    var url = 'mongodb://localhost:27017/postLibrary';
    
    mongoClient.connect(url, function(err, database) {
        if (err) console.log(err);
        
        // Before doing any inserting, need to check the database for an user with that email address or username.
        var myDb = database.db('postLibrary');
        var collection = myDb.collection('user');
        
        var usernameQuery = {$or: [{username: req.body.username}, {email: req.body.email}]};
        var userFound = false;
        
        collection.find(usernameQuery).toArray(function(err, results) {
            if (err) console.log(err);
            
            if (results.length == 0) {
                console.log('Inserting user into the database.');
                var generatedHash = '';
                var salt = cryptoRandomString(20);

                if (req.body.password !== '') {
                    if (req.body.password === req.body.confirm_password) {
                        const hash = crypto.createHash('sha512');
                        var saltPass = req.body.password + salt;
                        hash.update(saltPass, 'utf-8');
                        generatedHash = hash.digest('hex');
                    }
                }

                var user = {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    username: req.body.username,
                    password: generatedHash,
                    salt: salt
                }

                collection.insertOne(user, function(err, response) {
                    if (err) console.log(err);

                    console.log('1 User inserted.');
                    database.close();
                });
            } else {
                console.log('User already found in the database.');
            }
        });
    });
    
    res.render('signup');
}).get(function(req, res) {
    res.render('signup');
});

module.exports = authRouter;