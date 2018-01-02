var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var mongoClient = require('mongodb').MongoClient;

var cookieParser = require('cookie-parser');
var passport = require('passport');
var expressSession = require('express-session');

var db = require('./src/config/database');

var mathjax = require('mathjax-node');

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
    mathjax.config({
        displayMessages: false, // determines whether Message.Set() calls are logged
        displayErrors:   true, // determines whether error messages are shown on the console
        undefinedCharError: false, // determines whether "unknown characters" (i.e., no glyph in the configured fonts) are saved in the error array
        extensions: '', // a convenience option to add MathJax extensions
        fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
    });
    
    mathjax.start();
    
    var mathString = 'A_{m,n} = \\begin{pmatrix}a_{1,1} & a_{1,2} & \\cdots & a_{1,n} \\\\ a_{2,1} & a_{2,2} & \\cdots & a_{2,n} \\\\ \\vdots  & \\vdots  & \\ddots & \\vdots  \\\\ a_{m,1} & a_{m,2} & \\cdots & a_{m,n} \\end{pmatrix}';
    
    mathjax.typeset({
        math: mathString,
        format: "TeX", // "inline-TeX", "MathML"
        mml:true, //  svg:true,
    }, function (data) {
        if (!data.errors) {console.log(data.mml)}
        res.render('test', {data: data});
    });
})



// Start the server listening for activity on the given port.
app.listen(port, function(err) {
    if (!err) {
        console.log('Server running on port ' + port);
    } else {
        console.log('There was an error running this server: ' + err);
    }
});