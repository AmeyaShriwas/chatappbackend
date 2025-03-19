const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    number: { type: String, required: true },
    otp: { type: String, required: false },
    isVerified: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    profilePicture: { type: String, default: "" },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetToken: { type: String, required: false },
    resetTokenExpiry: { type: Date, required: false },
    friends: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        image: {type: String}
      }
    ],    status: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("User", userSchema);
