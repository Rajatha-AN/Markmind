const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const notificationPreferencesSchema = new mongoose.Schema({
  loginAlerts:        { type: Boolean, default: true },
  bookmarkEmails:     { type: Boolean, default: true },
  collaborationEmails:{ type: Boolean, default: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Password reset fields
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null },

  // Notification preferences
  notificationPreferences: {
    type: notificationPreferencesSchema,
    default: () => ({}),
  },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
