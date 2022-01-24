const express = require("express");
const router = new express.Router();
const { createUser, login } = require("../controllers/user");

// @route   POST api/user/create
// @desc    create user
// @access  Public
router.post("/create", createUser);

// @route   POST api/user/login
// @desc    login user
// @access  Public
router.post("/login", login);

module.exports = router;
