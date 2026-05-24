const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  username: String,
  text: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const spaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  description: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookmark',
    },
  ],

  comments: [commentSchema],

}, { timestamps: true });

module.exports = mongoose.model('Space', spaceSchema);