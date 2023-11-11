const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments:
        [{
            comment: String,
            likes: { type: Number, default: 0 },
            dislikes: { type: Number, default: 0 },
            date: {type: Date, default: Date.now},
            user: String,
        }],
    dateCreated: {type: Date, default: Date.now},
    createdBy: String,
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;