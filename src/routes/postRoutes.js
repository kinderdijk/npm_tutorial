var express = require('express');
var postRouter = express.Router();
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

// TODO: Likely need to add these to a function that the app calls and then
// pass in the database function with the URL so that does not need to be redfined all the time.


// TODO: Need to add a preview button to this page, that will parse out the math formulas and 
// show the user what they look like.
// TODO: Need to parse the input of the text field and find all the instances of an equation.
// Then escape them properly and replace them with the mathML equivalent.
postRouter.route('/edit').all(function(req,res,next) {
    if(req.isAuthenticated()){
        //if user is logged in, req.isAuthenticated() will return true 
        next();
    } else{
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var postID = req.query.postID;
    if(postID) {
        var url = 'mongodb://localhost:27017/postLibrary';
        
        mongoClient.connect(url, function(err, database) {

            if (database.isConnected()) {
                var myDb = database.db('postLibrary');
                var postCollection = myDb.collection('post');

                var currentPosts = [];
                // The findOne function returns a promise. Not a standard object.
                var result = postCollection.findOne({_id: new objectID(postID)});
                result.then(function(postValues) {
                    res.render('editPost', {post: postValues});
                });
                database.close();
                
            } else {
                console.log('Database is not connected.');
            }
        });
    } else {
        res.render('editPost', {post: ''});
    }
    
});

postRouter.route('/manage').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = 'mongodb://localhost:27017/postLibrary';
        
    mongoClient.connect(url, function(err, database) {
        console.log('Connection to the database correctly: ' + database);
        
        if (database.isConnected()) {
            console.log('Database is connected. Attempting function calls.');
            var myDb = database.db('postLibrary');
            var postCollection = myDb.collection('post');
            
            var currentPosts = [];
            postCollection.find().sort({timestamp: -1}).toArray(function(err, results) {
                currentPosts = results;
                
                database.close();
                res.render('managePost', {posts: currentPosts});
            });
        } else {
            console.log('Database is not connected.');
        }
    });
})

postRouter.route('/write').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).post(function(req, res) {
    let title = req.body['title'];
    let content = req.body['content'];
    let timestamp = new Date();
    let thumbnail = '';
    
    let postID = req.query.postID;
    
    // setup a schema for this?
    // Use the name of the authenticated user for the author in this aspect.
    var postInsert = 
        {
            title: title,
            content: content,
            timestamp: timestamp,
            thumbnail: thumbnail,
            published: false,
            author: 'Jon Pendlebury',
            tag: ''
        };
    
    var url = 'mongodb://localhost:27017/postLibrary';
        
    mongoClient.connect(url, function(err, database) {
        if (err) {
            console.log('There was an error connecting to the database: ' + err);
            return err;
        }
        
        if (database.isConnected()) {
            var myDb = database.db('postLibrary');
            var collection = myDb.collection('post');
            
            if(postID) {
                var query = {_id: new objectID(postID)};
                var values = { $set : {title: title, content: content} }
                
                collection.updateOne(query, values, function(err, response) {
                    if (err) console.log(err);
                    console.log('1 record updated.');
                    database.close();
                });
            } else {
                collection.insertOne(postInsert, function(err, response) {
                    if (err) throw err;
                    console.log('1 record inserted.');
                    database.close();
                });
            }
        } else {
            console.log('Database is not connected.');
        }
    });
    
    res.send('DB connection created and closed successfully.');
});

module.exports = postRouter;