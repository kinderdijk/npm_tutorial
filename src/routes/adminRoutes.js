var express = require('express');
var adminRouter = express.Router();
var mongodb = require('mongodb').MongoClient;
var db = require('../config/database');

adminRouter.route('/configureStartPage').all(function(req,res,next) {
    if(req.isAuthenticated()){
        //if user is logged in, req.isAuthenticated() will return true 
        next();
    } else{
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = db.url;

    mongodb.connect(url, function(err, database) {
        var myDb = database.db('postLibrary');
        var postCollection = myDb.collection('post');

        var currentPosts = [];
        postCollection.find().sort({timestamp: -1}).toArray(function(err, results) {
            currentPosts = results;

            database.close();   
            console.log('Results: ' + currentPosts);
            res.render('configureStartPage', {loggedIn: req.isAuthenticated(), user: req.user, currentPosts: currentPosts});
        });
    });
});

module.exports = adminRouter;