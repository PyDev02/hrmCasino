const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const options = { timestamps: true };

const userSchema = new mongoose.Schema(
  {
    username: {
      trim: true,
      type: String,
      required: true,
      unique: true,
    },

    walletAddress: {
      type: String,
      required: true,
    },

    walletSecret: {
      type: String,
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    uuid: {
      type: String,
      required: true,
      unique: true,
    },
  },
  options
);

// Hash password
userSchema.pre("save", async function (next) {
  // If password field has been altered hash it using bcrypt
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
});

const User = mongoose.model("user", userSchema);

module.exports = User;
