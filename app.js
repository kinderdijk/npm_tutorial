var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var mongoClient = require('mongodb').MongoClient;
var fileUpload = require('express-fileupload');

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
app.use(fileUpload());
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
app.use('/post', postRouter);

var adminRouter = require('./src/routes/adminRoutes');
app.use('/admin', adminRouter);

var authRouter = require('./src/routes/authRoutes');
app.use('/auth', authRouter);

var categoryRouter = require('./src/routes/categoryRoutes');
app.use('/category', categoryRouter);

var searchRouter = require('./src/routes/searchRoutes');
app.use('/search', searchRouter);

app.get('/', function(req, res) {    
    var latestPost = 'This is not the latest post.';
    mongoClient.connect(db.url, {useNewUrlParser: true}, function(err, database) {
        assert.equal(null, err);
        
        var myDb = database.db('postLibrary');
        var collection = myDb.collection('post');
        
        var categoryCollection = myDb.collection('category');
        var categories = [];
        categoryCollection.find().toArray(function(err, result) {
            categories = result;
        });
        
        var mysort = { timestamp: -1 };
        collection.find().sort(mysort).toArray(function(err, result) {
            database.close()
            if(result[0]) {
                latestPost = result[0].content;
                res.render('intro', {post: latestPost, loggedIn: req.isAuthenticated(), user: req.user, categories: categories});
            } else {
                res.render('intro', {post: 'Latest post', loggedIn: req.isAuthenticated(), user: req.user, categories: categories});
            }
        });
    });
});

app.get('/about', function(req, res) {
    res.render('about.ejs', {post: '', loggedIn: req.isAuthenticated(), user: req.user});
});

postRouter.route('/imageUpload').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).post(function(req, res) {
    var userUrl = '/Users/jonathonpendlebury/Documents/dht_ble/npm_tutorial/src/img/' + req.user._id + '/';

    let upload_image = req.files.image_upload;
    
    console.log(req.file);

    if (upload_image) {
        upload_image.mv(userUrl + upload_image.name, function(err) {
            console.log('Moving err: ' + err);
        });
    }
});


// Start the server listening for activity on the given port.
app.listen(port, function(err) {
    if (!err) {
        console.log('Server running on port ' + port);
    } else {
        console.log('There was an error running this server: ' + err);
    }
});