const express = require("express");
const { addFriend, getFriends, removeFriend, getAllUser } = require("./../Controller/friendController");

const router = express.Router();

router.post("/add-friend", addFriend);  // Add a friend
router.get("/friends/:userId", getFriends);  // Get friends list
router.get("/allUser", getAllUser);  // Get friends list

router.post("/remove-friend", removeFriend);  // Remove a friend

module.exports = router;
