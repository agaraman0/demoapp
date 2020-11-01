var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var fs = require('fs-extra');
var isAdmin = auth.isAdmin;

// Get Category model
var Category = require('../models/category');
var Product = require('../models/product')

/*
 * GET category index
 */
router.get('/', isAdmin, function (req, res) {
    Category.find(function (err, categories) {
        if (err)
            return console.log(err);
        res.render('admin/categories', {
            categories: categories
        });
    });
});

/*
 * GET add category
 */
router.get('/add-category', isAdmin, function (req, res) {

    var title = "";
    var bool;

    res.render('admin/add_category', {
        title: title,
        active:bool
    });

});

/*
 * POST add category
 */
router.post('/add-category', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();

    var title = req.body.title;
    var status = req.body.active;
    var slug = title.replace(/\s+/g, '-').toLowerCase();

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title,
            active:status
        });
    } else {
        Category.findOne({slug: slug}, function (err, category) {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.');
                res.render('admin/add_category', {
                    title: title,
                    active:status
                });
            } else {
                var category = new Category({
                    title: title,
                    slug: slug,
                    active:status
                });

                category.save(function (err) {
                    if (err)
                        return console.log(err);

                    Category.find(function (err, categories) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.categories = categories;
                        }
                    });

                    req.flash('success', 'Category added!');
                    res.redirect('/admin/categories');
                });
            }
        });
    }

});

/*
 * GET edit category
 */
router.get('/edit-category/:id', isAdmin, function (req, res) {

    Category.findById(req.params.id, function (err, category) {
        if (err)
            return console.log(err);

        res.render('admin/edit_category', {
            title: category.title,
            id: category._id,
            active:category.active
        });
    });

});

/*
 * POST edit category
 */
router.post('/edit-category/:id', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;
    var status = req.body.active;

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id,
            active:status
        });
    } else {
        Category.findOne({slug: slug, _id: {'$ne': id}}, function (err, category) {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.');
                res.render('admin/edit_category', {
                    title: title,
                    id: id,
                    active:status
                });
            } else {
                Category.findById(id, function (err, category) {
                    if (err)
                        return console.log(err);

                    category.title = title;
                    category.slug = slug;
                    category.active = status;

                    category.save(function (err) {
                        if (err)
                            return console.log(err);

                        Category.find(function (err, categories) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success', 'Category edited!');
                        res.redirect('/admin/categories/edit-category/' + id);
                    });

                });


            }
        });
    }

});

/*
 * GET delete category
 */
router.get('/delete-category/:id', isAdmin, function (req, res) {
    Category.findByIdAndRemove(req.params.id, function (err,cat) {
        if (err)
            return console.log(err);
        
        Product.find({category:cat.slug},function(err, products) {
            for(let i = 0; i < products.length;i++) {
                let id = products[i].id;
                let path = 'public/product_images/' + id;
                fs.remove(path, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        Product.findByIdAndRemove(id, function (err) {
                            console.log(err);
                        });
                    }
                });
            }
        })

        Category.find(function (err, categories) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.categories = categories;
            }
        });

        req.flash('success', 'Category deleted!');
        res.redirect('/admin/categories/');
    });
});


// Exports
module.exports = router;


