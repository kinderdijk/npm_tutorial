var express = require('express');
var postRouter = express.Router();
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;
var fs = require('fs');

// TODO: Likely need to add these to a function that the app calls and then
// pass in the database function with the URL so that does not need to be redfined all the time.


// TODO: Need to add a preview button to this page, that will parse out the math formulas and 
// show the user what they look like.
var whitelist = ['jpg','png','tiff','tif','jpeg'];
    
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

                    // Remove paragraph and breaks
                    var formattedContent = postValues.content.replace(/(?:<\/p><p>)/g, '\r\n\r\n').replace(/<br\/>/g, '\r\n').replace(/<p>/, '').replace(/<\/p>/, '');

                    // Remove images tags
                    formattedContent = formattedContent.replace(/<img.*src="(\/.*\/)(\w*\.\w{3,})">/, '{image: $2}');

                    postValues.content = formattedContent;
                    res.render('editPost', {post: postValues, loggedIn: req.isAuthenticated, user: req.user});
                });
                database.close();

            } else {
                console.log('Database is not connected.');
            }
        });
    } else {
        res.render('editPost', {post: '', loggedIn: req.isAuthenticated, user: req.user});
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
                res.render('managePost', {posts: currentPosts, loggedIn: req.isAuthenticated, user: req.user});
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

    var userUrl = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + req.user._id + '/';
    var newString = content.replace(/(?:\r\n){2,}/g, '</p><p>').replace(/\r\n/g, '<br/>').replace(/\{image\: ?(.*\..{3,})\}/, '<img src="' + userUrl + '$1">');
    var htmlContent = '<p>' + newString + '</p>';

    let postID = req.query.postID;
    let upload_image = req.files.image_upload;

    if (upload_image) {
        upload_image.mv(userUrl + upload_image.name, function(err) {
            console.log('Moving err: ' + err);
        });
    }

    // setup a schema for this?
    var postInsert = 
        {
            title: title,
            content: htmlContent,
            timestamp: timestamp,
            thumbnail: thumbnail,
            published: false,
            author: req.user._id,
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
                var values = { $set : {title: title, content: htmlContent} }

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

    res.redirect('/Post/manage');
});



module.exports = postRouter;