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
        if (err) {
            console.log(err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
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
            res.json({ message: "user saved successfully!" });
        }
        else {
            console.log("user not saved!");
            res.json({ message: "user not saved!" });
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
            const options = { expiresIn: '1h' };
            const secret = 'mySecret';
            const token = jwt.sign(payload, secret, options);
            res.json({ token: token });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// User profile retrieval

router.get('/user/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    User.findOne({ username: req.params.id }).then((user) => {
        if (user) {
            res.json(user);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// User profile update:

router.put('/user/:id', authenticate, (req, res) => {

    User.findOne({ username: req.params.id }).then((user) => {
        if (user) {
            if (user.username != req.user.username && !req.user.admin) {
                console.log("You are not the owner of this blog!");
                return res.sendStatus(403);
            }
            user.username = req.body.username;
            user.email = req.body.email;
            user.password = req.body.password;
            user.save().then((user) => {
                if (user) {
                    console.log("user updated successfully!");
                    res.json({ message: "user updated successfully!" });
                }
                else {
                    console.log("user not updated!");
                    res.json({ message: "user not updated!" });
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
        createdBy: req.user.username
    });

    newBlog.save().then((blog) => {
        if (blog) {
            console.log("blog saved successfully!");
            res.json({ message: "blog saved successfully!" });
        }
        else {
            console.log("blog not saved!");
            res.json({ message: "blog not saved!" });
        }
    });
});

// read a blog post:
router.get('/blog/:id', authenticate, (req, res) => {

    Blog.findOne({ title: req.params.id, blocked: false }).then((blog) => {
        if (blog) {
            res.json(blog.content);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// update a blog post:
router.put('/blog/:id', authenticate, (req, res) => {

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            if (blog.createdBy != req.user.username) {
                console.log("You are not the owner of this blog!");
                return res.sendStatus(403);
            }
            blog.title = req.body.title;
            blog.content = req.body.content;
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog updated successfully!");
                    res.json({ message: "blog updated successfully!" });
                }
                else {
                    console.log("blog not updated!");
                    res.json({ message: "blog not updated!" });
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

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            if (blog.createdBy != req.user.username && !req.user.admin) {
                console.log("You are not the owner of this blog!");
                return res.sendStatus(403);
            }
            Blog.deleteOne({ title: req.params.id })
            console.log("blog deleted successfully!");
            res.json({ message: "blog deleted successfully!" });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// retrieve a list of all blog posts:
router.get('/blog', authenticate, (req, res) => {

    Blog.find({ disabled: false }).then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// allow users to like or dislike blog posts, a user can only like or dislike a blog post once:
router.post('/blog/rate/:id/:rate', authenticate, (req, res) => {
    if (req.params.rate != "like" && req.params.rate != "dislike") {
        console.log("Invalid rate!");
        return res.json({ message: "Please choose like or dislike!" });
    }

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            if (req.params.rate == "like") {
                // If the user has already liked the blog, remove their like
                const index = blog.likes.indexOf(req.user.username);
                if (index > -1) {
                    blog.likes.splice(index, 1);
                } else {
                    // Otherwise, add their like
                    blog.likes.push(req.user.username);
                    // And make sure to remove any dislike they might have added before
                    const dislikeIndex = blog.dislikes.indexOf(req.user.username);
                    if (dislikeIndex > -1) {
                        blog.dislikes.splice(dislikeIndex, 1);
                    }
                }
            } else if (req.params.rate == "dislike") {
                // If the user has already disliked the blog, remove their dislike
                const index = blog.dislikes.indexOf(req.user.username);
                if (index > -1) {
                    blog.dislikes.splice(index, 1);
                } else {
                    // Otherwise, add their dislike
                    blog.dislikes.push(req.user.username);
                    // And make sure to remove any like they might have added before
                    const likeIndex = blog.likes.indexOf(req.user.username);
                    if (likeIndex > -1) {
                        blog.likes.splice(likeIndex, 1);
                    }
                }
            }

            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog rated successfully!");
                    return res.json(blog);
                } else {
                    console.log("blog not rated!");
                    return res.json({ message: "blog not rated!" });
                }
            });
        } else {
            return res.sendStatus(404);
        }
    });
});

// allow users to comment on blog posts:
router.post('/blog/comment/:id', authenticate, (req, res) => {

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            if (req.body.comment == "") {
                console.log("Comment cannot be empty!");
                return res.json({ message: "Comment cannot be empty!" });
            }
            blog.comments.push({
                comment: req.body.comment,
                user: req.user.username
            });
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog commented successfully!");
                    res.json({ message: "blog commented successfully!" });
                }
                else {
                    console.log("blog not commented!");
                    res.json({ message: "blog not commented!" });
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// sort posts:
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

// filter posts:
router.get('/blog/filter/:filter', authenticate, (req, res) => {

    Blog.find({ createdBy: req.params.filter }).then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});


// 3. User Interaction Module:

// allow users to follow other bloggers:
router.post('/user/follow/:id', authenticate, (req, res) => {
    User.findOne({ username: req.params.id }).then((user) => {
        if (user) {
            // Check if the user is already following the blogger
            if (!user.followers.includes(req.user.username)) {
                user.followers.push(req.user.username);
                user.save().then((user) => {
                    if (user) {
                        console.log("user followed successfully!");
                        res.json({ message: "user followed successfully!" });
                    } else {
                        console.log("user not followed!");
                        res.json({ message: "user not followed!" });
                    }
                });
            } else {
                const index = user.followers.indexOf(req.user.username);
                if (index > -1) {
                    user.followers.splice(index, 1);
                }
                user.save().then((user) => {
                    if (user) {
                        console.log("user unfollowed successfully!");
                        res.json({ message: "user unfollowed successfully!" });
                    } else {
                        console.log("user not unfollowed!");
                        res.json({ message: "user not unfollowed!" });
                    }
                });
            }
        } else {
            res.sendStatus(404);
        }
    });
});

// display a user's feed with posts from followed bloggers:

router.get('/user/feed', authenticate, (req, res) => {

    User.findOne({ username: req.user.username }).then((user) => {
        if (user) {
            Blog.find({ createdBy: user.followers }).then((blogs) => {
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


// 4. Search Module:

//Implement a search functionality to find blog posts based on keywords, categories, and authors:


// 5. Admin Operations Module:

// View all users:
router.get('/admin/users', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    User.find().then((users) => {
        if (users) {
            res.json(users);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// Block/Disable a user:
router.put('/admin/users/block/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    User.findOne({ username: req.params.id }).then((user) => {
        if (user) {
            user.blocked = true;
            user.save().then((user) => {
                if (user) {
                    console.log("user blocked successfully!");
                    res.json({ message: "user blocked successfully!" });
                }
                else {
                    console.log("user not blocked!");
                    res.json({ message: "user not blocked!" });
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// Unblock/Enable a user:
router.put('/admin/users/unblock/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    User.findOne({ username: req.params.id }).then((user) => {
        if (user) {
            user.blocked = false;
            user.save().then((user) => {
                if (user) {
                    console.log("user unblocked successfully!");
                    res.json({ message: "user unblocked successfully!" });
                }
                else {
                    console.log("user not unblocked!");
                    res.json({ message: "user not unblocked!" });
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// List all Blog Posts:
router.get('/admin/blogs', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    Blog.find().then((blogs) => {
        if (blogs) {
            res.json(blogs);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// View a Particular Blog Post:
router.get('/admin/blogs/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            res.json(blog);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// Disable a blog:
router.put('/admin/blogs/disable/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            blog.disabled = true;
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog disabled successfully!");
                    res.json({ message: "blog disabled successfully!" });
                }
                else {
                    console.log("blog not disabled!");
                    res.json({ message: "blog not disabled!" });
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

// Enable a blog:
router.put('/admin/blogs/enable/:id', authenticate, (req, res) => {

    if (!req.user.admin) {
        return res.sendStatus(403);
    }

    Blog.findOne({ title: req.params.id }).then((blog) => {
        if (blog) {
            blog.disabled = false;
            blog.save().then((blog) => {
                if (blog) {
                    console.log("blog enabled successfully!");
                    res.json({ message: "blog enabled successfully!" });
                }
                else {
                    console.log("blog not enabled!");
                    res.json({ message: "blog not enabled!" });
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
});

module.exports = router;