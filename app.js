var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var mongoClient = require('mongodb').MongoClient;

var cookieParser = require('cookie-parser');
var passport = require('passport');
var expressSession = require('express-session');

var db = require('./src/config/database');

var mathjax = require('./src/config/mathjax');
mathjax.config();

var app = express();

var port = 2468;

// Parses the body of post requests.
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// Addes the location of static files to the server.
app.use(express.static('public'));
app.use(express.static('src/img'));

// Set up the templating engine for ejs.
app.set('views', './src/views');
app.set('view engine', 'ejs');

// Start setting up authentication
app.use(cookieParser());
app.use(expressSession(
    {
        secret: 'postLibrary',
        resave: false,
        saveUninitialized: false
    })
);

require('./src/config/passport')(app);

// Configure the external routing files.
var postRouter = require('./src/routes/postRoutes');
app.use('/Post', postRouter);

var adminRouter = require('./src/routes/adminRoutes');
app.use('/admin', adminRouter);

var authRouter = require('./src/routes/authRoutes');
app.use('/auth', authRouter);

app.get('/', function(req, res) {    
    var latestPost = 'This is not the latest post.';
    mongoClient.connect(db.url, function(err, database) {
        assert.equal(null, err);
        
        var myDb = database.db('postLibrary');
        var collection = myDb.collection('post');
        
        var mysort = { timestamp: -1 };
        collection.find().sort(mysort).toArray(function(err, result) {
            database.close()
            latestPost = result[0].content;
            console.log('User: ' + req.user);
            res.render('intro.ejs', {post: latestPost, loggedIn: req.isAuthenticated(), user: req.user});
        });
    });
});



// Mathjax test function
// This works !!!!BUT!!!! Chrome does not support the MathML format. These equations can be viewed in Firefox or Safari browsers.
app.get('/test', function(req, res) {
    var mathString = '\\int\\limits_0^\\infty x^2\\mathrm{d}x';
    
    mathjax.writeEquation(mathString, function(err, result) {
        res.render('test', {data: result});
    });
});



// Start the server listening for activity on the given port.
app.listen(port, function(err) {
    if (!err) {
        console.log('Server running on port ' + port);
    } else {
        console.log('There was an error running this server: ' + err);
    }
});