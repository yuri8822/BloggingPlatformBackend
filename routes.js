const express = require('express');
const User = require('./models/User');
const Blog = require('./models/Blog');
const router = express.Router();
const passport = require('passport');

// this file contains all of the routes used for the different
// modules of my blogging platform app:

// 1.User Authentication Module:

// registration:
router.post('/register', (req, res) => {

    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        admin: req.body.admin
    });

    newUser.save().then((user) => {
        if (user) {
            console.log("user saved successfully!");
        }
        else {
            console.log("user not saved!");
        }
    });
});

// login with JWT-based authentication:
router.post('/login', (req, res) => {

    User.findOne({ username: req.body.username, password: req.body.password }).then((user) => {
        if (user) {
            const payload = { id: user.id, username: user.username, admin: user.admin };
            const options = { expiresIn: '1d' };
            const secret = 'mySecret';
            const token = jwt.sign(payload, secret, options);
            res.json({ token: token });
        }
        else {
            res.sendStatus(401);
        }
    });
});

// 2.Blog Post Management Module:

// create a new blog post:
router.post('/blog', passport.authenticate('jwt', { session: false }), (req, res) => {

    const newBlog = new Blog({
        title: req.body.title,
        content: req.body.content,

        // the user who created the blog post is the owner of the blog post:
        owner: req.user.id
    });

    newBlog.save().then((blog) => {
        if (blog) {
            console.log("blog saved successfully!");
        }
        else {
            console.log("blog not saved!");
        }
    });
});

// read a blog post:
router.get('/blog/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.findOne({ _id: req.params.id }).then((blog) => {
        if (blog) {
            res.json(blog);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// update a blog post:
router.put('/blog/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.findOne({ _id: req.params.id }).then((blog) => {
        if (blog) {
            blog.title = req.body.title;
            blog.content = req.body.content;
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog updated successfully!");
                }
                else {
                    console.log("blog not updated!");
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// delete a blog post:
router.delete('/blog/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.findOne({ _id: req.params.id }).then((blog) => {
        if (blog) {
            blog.remove().then((blog) => {
                if (blog) {
                    console.log("blog deleted successfully!");
                }
                else {
                    console.log("blog not deleted!");
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// retrieve a list of all blog posts:
router.get('/blog', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.find().then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// allow users to rate and comment on blog posts:
router.post('/blog/:id/rating', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.findOne({ _id: req.params.id }).then((blog) => {
        if (blog) {
            blog.rating = req.body.rating;
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog rated successfully!");
                }
                else {
                    console.log("blog not rated!");
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

router.post('/blog/:id/comment', passport.authenticate('jwt', { session: false }), (req, res) => {
    
        Blog.findOne({ _id: req.params.id }).then((blog) => {
            if (blog) {
                blog.comments.push(req.body.comment);
                blog.save().then((blog) => {
                    if (blog) {
                        console.log("blog commented successfully!");
                    }
                    else {
                        console.log("blog not commented!");
                    }
                });
            }
            else {
                res.sendStatus(404);
            }
        });
});

// implement sorting and filtering options for posts:
router.get('/blog/sort/:sort', passport.authenticate('jwt', { session: false }), (req, res) => {

    Blog.find().sort(req.params.sort).then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});

router.get('/blog/filter/:filter', passport.authenticate('jwt', { session: false }), (req, res) => {
    
        Blog.find({ title: req.params.filter }).then((blogs) => {
            if (blogs) {
                res.json(blogs);
            }
            else {
                res.sendStatus(404);
            }
        });
});
    






module.exports = router;