var express = require('express');
var postRouter = express.Router();
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;
var fs = require('fs');
var event = require('events');
var multer = require('multer');

var db = require('../config/database');

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
    
    var fileDir = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + req.user._id + '/';
    var files = [];
    fs.readdirSync(fileDir).forEach(file => {
        files.push(file);
    })
    
    var url = db.url;    

    mongoClient.connect(url, function(err, database) {

        if (database.isConnected()) {
            var myDb = database.db('postLibrary');
            var postCollection = myDb.collection('post');

            var categoryCollection = myDb.collection('category');
            var categories = [];
            var currentPost;
            if(postID) {
                // The findOne function returns a promise. Not a standard object.
                var result = postCollection.findOne({_id: new objectID(postID)});
                result.then(function(postValues) {
                    // Remove paragraph and breaks
                    var formattedContent = postValues.content.replace(/(?:<\/p><p>)/g, '\r\n\r\n').replace(/<br\/>/g, '\r\n').replace(/<p>/, '').replace(/<\/p>/, '');

                    // Remove images tags
                    formattedContent = formattedContent.replace(/<img.*src="(\/.*\/)(\w*\.\w{3,})">/, '{image: $2}');

                    postValues.content = formattedContent;
                    currentPost = postValues;
                });
                
                categoryCollection.find().toArray(function(err, results) {
                    categories = results;
                    res.render('editPost', {files: files, post: currentPost, loggedIn: req.isAuthenticated(), user: req.user, categories: categories});
                });
            } else {
                categoryCollection.find().toArray(function(err, results) {
                    categories = results;
                    res.render('editPost', {files: files, post: '', loggedIn: req.isAuthenticated(), user: req.user, categories: categories});
                });
            }
            database.close();
        } else {
            console.log('Database is not connected.');
        }
    });
});

postRouter.route('/manage').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = db.url;

    mongoClient.connect(url, function(err, database) {

        if (database.isConnected()) {
            var myDb = database.db('postLibrary');
            var postCollection = myDb.collection('post');

            var currentPosts = [];
            postCollection.find().sort({timestamp: -1}).toArray(function(err, results) {
                currentPosts = results;

                database.close();
                res.render('managePost', {posts: currentPosts, loggedIn: req.isAuthenticated(), user: req.user});
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
    let category = req.body['category'];
    let timestamp = new Date();
    let thumbnail = '';

    var userUrl = '/' + req.user._id + '/';
    var newString = content.replace(/(?:\r\n){2,}/g, '</p><p>').replace(/\r\n/g, '<br/>').replace(/\{image\: ?(.*\..{3,})\}/, '<img src="' + userUrl + '$1">');
    var htmlContent = '<p>' + newString + '</p>';
    
    let postID = req.query.postID;

    // setup a schema for this?
    var postInsert = 
        {
            title: title,
            content: htmlContent,
            timestamp: timestamp,
            thumbnail: thumbnail,
            published: false,
            author: req.user._id,
            category: category,
            tag: ''
        };

    var url = db.url;

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

// This should have something akin to a search engine. It might be fun to try and get elastcsearch going on this project.
postRouter.route('/search').get(function(req, res) {
    var url = db.url;

    category = req.query.category;
    
    mongoClient.connect(url, function(err, database) {

        if (database.isConnected()) {
            var myDb = database.db('postLibrary');
            var postCollection = myDb.collection('post');
            var userCollection = myDb.collection('user');

            var currentPosts = [];
            var query = { published: true };
            postCollection.find(query).sort({timestamp: -1}).toArray(function(err, results) {
                currentPosts = results;
                
                for(var i=0; i<currentPosts.length; i++) {
                    var authorID = currentPosts[i].author;
                    var authorName;
                    userCollection.findOne({_id: new objectID(authorID)}, function (err, value) {
                        if (err) { console.log('Error: ' + JSON.stringify(err)); }
                        
                        authorName = value.firstname + ' ' + value.lastname;
                    });
                    currentPosts[i].author = authorName;
                }
                
                database.close();
                res.render('post', {posts: currentPosts, loggedIn: req.isAuthenticated(), user: req.user});
            });
        } else {
            console.log('Database is not connected.');
        }
    });
});

postRouter.route('/manageFiles').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    // Get a list of files and add them to the page. Have a way to upload new files and delete old files.
    var fileDir = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + req.user._id + '/';
    var files = [];
    fs.readdirSync(fileDir).forEach(file => {
        files.push(file);
    })
    
    res.render('manageFiles', {files: files, loggedIn: req.isAuthenticated(), user: req.user});
});

postRouter.route("/fileUpload").all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).post(function(req, res) {
    let upload_image = req.files.image_upload;

    var userUrl = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + req.user._id + '/';
    if (upload_image) {
        upload_image.mv(userUrl + upload_image.name, function(err) {
            console.log('Moving err: ' + err);
        });
    }
    
    res.redirect('/post/manageFiles');
});

postRouter.route('/delete').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    let postID = req.query.postID;
    let url = db.url;
    
    mongoClient.connect(url, function(err, database) {
        var myDb = database.db('postLibrary');
        var collection = myDb.collection('post');
        
        var query = {_id: new objectID(postID)};
        collection.remove(query, function(err, result) {
            if (err) throw err;
            console.log(result.result.n + ' post(s) deleted.');
            database.close();
        })
    })
});

postRouter.route('/publish').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = db.url;
    var postID = req.query.postID;
    
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if(database.isConnected) {
            let myDb = database.db('postLibrary');
            let collection = myDb.collection('post');
            
            var query = {_id: new objectID(postID)};
            var values = {$set: {published: true}};
            collection.updateOne(query, values, function(err, response) {
                if (err) throw err;
                console.log('Post has been published.');
                database.close();
            });
        }
    });
    
    res.redirect('/post/manage');
});

var callSite = function(req, res) {
    res.render('post', {posts: currentPosts, loggedIn: req.isAuthenticated(), user: req.user});
}

postRouter.route('/readPost').get(function(req, res) {
    var url = db.url;
    var postID = req.query.postID;
    
    mongoClient.connect(url, function(err, database) {
        var myDb = database.db('postLibrary');
        var postCollection = myDb.collection('post');
        var userCollection = myDb.collection('user');
        
        var currentPost;
        if (postID) {
            postCollection.findOne({_id: new objectID(postID)}, function(err, result) {
                userCollection.findOne({_id: new objectID(result.author)}, function(err, value) {
                    authorName = value.firstname + ' ' + value.lastname;
                    
                    res.render('postDetail', {post: result, name: authorName, loggedIn: req.isAuthenticated(), user: res.user});
                });
            });
        }
    });
});

module.exports = postRouter;