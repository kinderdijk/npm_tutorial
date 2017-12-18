var express = require('express');
var adminRouter = express.Router();
var mongodb = require('mongodb').MongoClient;

var router = function() {
    adminRouter.route('/addPost')
        .get(function(req, res) {
            var url = 'mongodb://localhost:27017/postLibrary';
        
            mongodb.connect(url, function(err, bd) {
                var collection = bd.collection('posts');
            });
            res.render('managePost.ejs');
        });
    
    return adminRouter;
}

module.exports = router;