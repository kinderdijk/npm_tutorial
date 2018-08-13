var express = require('express');
var searchRouter = express.Router();
var db = require('../config/database');
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

searchRouter.route('/category').get(function(req, res) {
    var url = db.url;
    var categoryName = req.query.categoryName;
    
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if (database.isConnected) {
            let myDb = database.db('postLibrary');
            let collection = myDb.collection('post');
            
            var query = {category: categoryName};
            collection.find(query).sort({timestamp: -1}).toArray(function(err, results) {
                if (err) throw err;
                res.render('post', {loggedIn: req.isAuthenticated(), user: req.user, posts: results});
            });
        }
    });
    
});

module.exports = searchRouter;