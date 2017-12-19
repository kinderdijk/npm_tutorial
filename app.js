var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var mongoClient = require('mongodb').MongoClient;

var app = express();

var port = 2468;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.static('src/img'));

app.set('views', './src/views');
app.set('view engine', 'ejs');

var postRouter = require('./src/routes/postRoutes');
app.use('/Post', postRouter);

var adminRouter = require('./src/routes/adminRoutes');
app.use('/admin', adminRouter);

app.get('/', function(req, res) {
    var url = 'mongodb://localhost:27017/postLibrary';
    
    var latestPost = 'This is not the latest post.';
    mongoClient.connect(url, function(err, database) {
        assert.equal(null, err);
        
        var myDb = database.db('postLibrary');
        var collection = myDb.collection('post');
        
        var mysort = { timestamp: -1 };
        collection.find().sort(mysort).toArray(function(err, result) {
            database.close()
            latestPost = result[0].content;
            res.render('intro.ejs', {post: latestPost});
        });
    });
});

app.listen(port, function(err) {
    if (!err) {
        console.log('Server running on port ' + port);
    } else {
        console.log('There was an error running this server: ' + err);
    }
});