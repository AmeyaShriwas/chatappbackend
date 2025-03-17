const {
    addFriendService,
    getFriendsService,
    removeFriendService
  } = require("./../Services/friendServices");
  
  // Controller to add a friend
  const addFriend = async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      const result = await addFriendService(userId, friendId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  // Controller to get friends list
  const getFriends = async (req, res) => {
    try {
      const { userId } = req.params;
      const friends = await getFriendsService(userId);
      res.status(200).json({ friends });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  // Controller to remove a friend
  const removeFriend = async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      const result = await removeFriendService(userId, friendId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  module.exports = {
    addFriend,
    getFriends,
    removeFriend
  };
  