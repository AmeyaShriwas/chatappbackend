const User = require("./../Models/UserModel");

// Add a friend (store both ID and name)
const addFriendService = async (userId, friendId) => {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
  
    if (!user || !friend) {
      throw new Error("User not found");
    }
  
    if (user.friends.some(f => f._id.toString() === friendId)) {
      throw new Error("Already friends");
    }
  
    // Add friend to both users' lists
    user.friends.push({ _id: friendId, name: friend.name });
    friend.friends.push({ _id: userId, name: user.name });
  
    await user.save();
    await friend.save();
  
    return { message: "Friend added successfully", user };
  };
  
// Get friends list
const getFriendsService = async (userId) => {
  const user = await User.findById(userId).populate("friends", "name email profilePicture");

  if (!user) {
    throw new Error("User not found");
  }

  return user.friends;
};

// Remove a friend
const removeFriendService = async (userId, friendId) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend) {
    throw new Error("User not found");
  }

  user.friends = user.friends.filter(id => id.toString() !== friendId);
  friend.friends = friend.friends.filter(id => id.toString() !== userId);

  await user.save();
  await friend.save();

  return { message: "Friend removed successfully" };
};

module.exports = {
  addFriendService,
  getFriendsService,
  removeFriendService
};
