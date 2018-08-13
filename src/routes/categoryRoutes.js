var express = require('express');
var categoryRouter = express.Router();
var db = require('../config/database');
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

categoryRouter.route('/manage').all(function(req,res,next) {
    if(req.isAuthenticated()){
        //if user is logged in, req.isAuthenticated() will return true 
        next();
    } else{
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = db.url;
    
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if (database.isConnected) {
            var myDb = database.db('postLibrary');
            var categoryCollection = myDb.collection('category');
            
            categoryCollection.find().toArray(function(err, results) {
                database.close();
                res.render('manageCategory', {loggedIn: req.isAuthenticated(), user: req.user, categories: results});
            });
        }
    });
});

categoryRouter.route('/edit').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    var url = db.url;
    let categoryID = req.query.categoryID;
    
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if(database.isConnected) {
            let myDb = database.db('postLibrary');
            let categoryCollection = myDb.collection('category');
            
            if(categoryID) {
                var result = categoryCollection.findOne({_id: new objectID(categoryID)});
                
                result.then(function(categoryValues) {
                    res.render('editCategory', {loggedIn: req.isAuthenticated(), user: req.user, category: categoryValues});
                });
            } else {
                res.render('editCategory', {loggedIn: req.isAuthenticated(), user: req.user, category: ''});
            }
            console.log('Closing db connection.');
            database.close;
        }
    });
});

categoryRouter.route('/create').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).post(function(req,res) {
    var url = db.url;
    
    let categoryName = req.body['name'];
    let description = req.body['description'];
    
    var categoryID = req.query.categoryID;
    
    categoryInsert = {
        name: categoryName,
        description: description
    };
    
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if (database.isConnected) {
            var myDb = database.db('postLibrary');
            var categoryCollection = myDb.collection('category');
            
            if (categoryID) {
                var query = {_id: new objectID(categoryID)};
                var values = {$set: {name: categoryName, description: description}};
                
                categoryCollection.updateOne(query, values, function(err, response) {
                    database.close();
                });
            } else {
                categoryCollection.insertOne(categoryInsert, function(err, response) {
                    database.close();
                });
            }
        }
    });
    
    res.redirect('/category/manage');
});

categoryRouter.route('/delete').all(function(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}).get(function(req, res) {
    let url = db.url;
    
    let categoryID = req.query.categoryID;
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, database) {
        if (err) throw err;
        if (database.isConnected) {
            let myDb = database.db('postLibrary');
            let collection = myDb.collection('category');
            
            var query = {_id: new objectID(categoryID)};
            collection.remove(query, function(err, result) {
                if (err) throw err;
                console.log(result.result.n + ' documents(s) removed.');
                database.close();
            })
        }
    });
    
    res.redirect('/category/manage');
});

module.exports = categoryRouter;