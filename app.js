var express = require('express');
var bodyParser = require('body-parser');

var app = express();

var port = 2468;
var postRouter = require('./src/routes/postRoutes');
var adminRouter = require('./src/routes/adminRoutes');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.static('src/img'));

app.set('views', './src/views');
app.set('view engine', 'ejs');

app.use('/Post', postRouter);

app.get('/', function(req, res) {
    res.render('intro.ejs');
});

app.listen(port, function(err) {
    if (!err) {
        console.log('Server running on port ' + port);
    } else {
        console.log('There was an error running this server: ' + err);
    }
});