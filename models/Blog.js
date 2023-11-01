const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    likes: Number,
    dislikes: Number,
    comments:
        [{
            comment: String,
            likes: Number,
            dislikes: Number,
            date: Date,
            user: String,
        }],
    dateCreated: Date,
    createdBy: String,
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;