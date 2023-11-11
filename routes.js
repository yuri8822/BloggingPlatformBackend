const express = require('express');
const User = require('./models/User');
const Blog = require('./models/Blog');
const router = express.Router();
const jwt = require('jsonwebtoken');

// this file contains all of the routes used for the different
// modules of my blogging platform app:

// Middleware for authenticating using JWT
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, 'mySecret', (err, user) => {
        if (err)
        {
            console.log(err);
            return res.sendStatus(403);
        }
        req.user = user;
        next(); // pass the execution off to whatever request the client intended
    });
}

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
            res.json({ message: "user saved successfully!"});
        }
        else {
            console.log("user not saved!");
            res.json({ message: "user not saved!"});
        }
    });
});

// login with JWT-based authentication:
router.post('/login', (req, res) => {

    User.findOne({ username: req.body.username, password: req.body.password }).then((user) => {
        if (user) {
            if (user.blocked) {
                res.sendStatus({ message: "You are blocked!" });
            }
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

// User profile retrieval and update:

router.get('/user/:id', authenticate, (req, res) => {

    User.findOne({ _id: req.params.id}).then((user) => {
        if (user) {
            res.json(user);
        }
        else {
            res.sendStatus(404);
        }
    });
});

router.put('/user/:id', authenticate, (req, res) => {

    User.findByIdAndUpdate({ _id: req.params.id }).then((user) => {
        if (user) {
            user.username = req.body.username;
            user.email = req.body.email;
            user.password = req.body.password;
            user.save().then((user) => {
                if (user) {
                    console.log("user updated successfully!");
                }
                else {
                    console.log("user not updated!");
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// 2.Blog Post Management Module:

// create a new blog post:
router.post('/blog', authenticate, (req, res) => {

    const newBlog = new Blog({
        title: req.body.title,
        content: req.body.content,

        // the user who created the blog post is the owner of the blog post:
        owner: req.user.username
    });

    newBlog.save().then((blog) => {
        if (blog) {
            console.log("blog saved successfully!");
            res.json({ message: "blog saved successfully!"});
        }
        else {
            console.log("blog not saved!");
            res.json({ message: "blog not saved!"});
        }
    });
});

// read a blog post:
router.get('/blog/:id', authenticate, (req, res) => {

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
router.put('/blog/:id', authenticate, (req, res) => {

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
router.delete('/blog/:id', authenticate, (req, res) => {

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
router.get('/blog', authenticate, (req, res) => {

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
router.post('/blog/:id/rating', authenticate, (req, res) => {

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

router.post('/blog/:id/comment', authenticate, (req, res) => {

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
router.get('/blog/sort/:sort', authenticate, (req, res) => {

    Blog.find().sort(req.params.sort).then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});

router.get('/blog/filter/:filter', authenticate, (req, res) => {

    Blog.find({ title: req.params.filter }).then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});


// 3. User Interaction Module:

router.post('/user/:id/follow', authenticate, (req, res) => {

    User.findOne({ _id: req.params.id }).then((user) => {

        if (user) {
            user.followers.push(req.user.id);
            user.save().then((user) => {
                if (user) {
                    console.log("user followed successfully!");
                }
                else {
                    console.log("user not followed!");
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// display a user's feed with posts from followed bloggers:

router.get('/user/:id/feed', authenticate, (req, res) => {

    User.findOne({ _id: req.params.id }).then((user) => {

        if (user) {
            Blog.find({ owner: user.followers }).then((blogs) => {
                if (blogs) {
                    res.json(blogs);
                }
                else {
                    res.sendStatus(404);
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// implement notifications for new followers and comments on the user's posts:


module.exports = router;