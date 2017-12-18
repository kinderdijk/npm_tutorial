var express = require('express');
var postRouter = express.Router();
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');

postRouter.route('/edit').get(function(req, res) {
    console.log('Loading post from separate routing file.');
    res.render('editPost.ejs');
});

postRouter.post('/write', function(req, res) {
    let title = req.body['title'];
    let content = req.body['content'];
    let timestamp = new Date();
    let thumbnail = '';
    
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
        assert.equal(null, err);
        console.log('Connection to the database correctly: ' + database);
        
        if (database.isConnected()) {
            console.log('Database is connected. Attempting function calls.');
            var myDb = database.db('postLibrary');
            var collection = myDb.collection('post');
            
            collection.insertOne(postInsert, function(err, response) {
                assert.equal(null, err);
                console.log('1 record inserted.');
                database.close();
            });
        } else {
            console.log('Database is not connected.');
        }
    });
    
    res.send('DB connection created and closed successfully.');
});

module.exports = postRouter;