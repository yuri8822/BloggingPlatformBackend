const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    likes: [String],
    dislikes: [String],
    comments:
        [{
            comment: String,
            likes: [String],
            dislikes: [String],
            date: {type: Date, default: Date.now},
            user: String,
        }],
    dateCreated: {type: Date, default: Date.now},
    createdBy: String,
    disabled: { type: Boolean, default: false }
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;