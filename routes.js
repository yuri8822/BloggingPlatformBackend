const express = require('express');
const User = require('./models/User');
const Blog = require('./models/Blog');
const router = express.Router();
const passport = require('passport');

// this file contains all of the routes used for the different
// modules of my blogging platform app:

// 1.User Authentication Module:
router.post('/register', (req, res), {
    
    // User = new User({
    //     username: req.body.username,
    //     email: req.body.email,
    //     password: req.body.password,
    // });
    
});















module.exports = router;
