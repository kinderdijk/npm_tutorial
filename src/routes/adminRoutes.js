var express = require('express');
var adminRouter = express.Router();
var mongodb = require('mongodb').MongoClient;

adminRouter.route('/configureStartPage').get(function(req, res) {
    var url = 'mongodb://localhost:27017/postLibrary';

    mongodb.connect(url, function(err, database) {
        var myDb = database.db('postLibrary');
        var postCollection = myDb.collection('post');

        var currentPosts = [];
        postCollection.find().sort({timestamp: -1}).toArray(function(err, results) {
            currentPosts = results;

            database.close();   
            console.log('Results: ' + currentPosts);
            res.render('configureStartPage', {currentPosts: currentPosts});
        });
    });
});

module.exports = adminRouter;