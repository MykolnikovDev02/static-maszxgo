const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = mongoose.model('User'); // from your user.js

// ——— FriendRequest schema ———
const friendRequestSchema = new mongoose.Schema({
  userId:       { type: Number, required: true }, // receiver
  friendId:     { type: Number, required: true }, // sender
  message:      { type: String, default: '' },
  picUrl:       String,
  nickname:     String,
  sex:          Number,
  country:      String,
  language:     String,
  status:       { type: String, enum: ['PENDING','REFUSED','ACCEPTED'], default: 'PENDING' },
  creationTime: { type: Number, default: Date.now }
});
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// ——— Helpers ———
async function isFriend(userId, friendId) {
  const user = await User.findOne({ userId });
  return !!(user && Array.isArray(user.friends) && user.friends.includes(friendId));
}

async function deleteFriend(userId, friendId) {
  if (!await isFriend(userId, friendId)) throw new Error('Not friends');
  await User.updateOne({ userId }, { $pull: { friends: friendId } });
  await User.updateOne({ userId: friendId }, { $pull: { friends: userId } });
}

async function rejectFriendRequest(userId, friendId) {
  if (userId === friendId || !await User.exists({ userId: friendId })) {
    throw new Error('Invalid user');
  }
  const req = await FriendRequest.findOne({ userId, friendId, status: 'PENDING' });
  if (!req) throw new Error('No pending request');
  req.status = 'REFUSED';
  await req.save();
}

async function getFriendInfo(userId, friendId) {
  if (!await User.exists({ userId: friendId })) throw new Error('User not found');
  const target = await User.findOne({ userId: friendId })
    .select('userId nickname picUrl sex country language');
  return {
    userId:   target.userId,
    nickname: target.nickname,
    picUrl:   target.picUrl,
    sex:      target.sex,
    country:  target.country,
    language: target.language,
    friend:   await isFriend(userId, friendId),
    alias:    null  // implement if you have per-user aliases
  };
}
router.get('/api/v1/friends/recommendation', async (req, res) => {
    const currentUser = req.headers.userid;
    const currentUserData = uuser.findOne({ currentUser });
    const users = await uuser.find({ userId: { $ne: currentUser } }).select('userId sex nickname');

    // Transform the nickname field to nickName in the response
    const formattedUsers = users.map(user => ({
      userId: user.userId,
      sex: user.sex,
      nickName: user.nickname,
    }));
    res.status(200).json({ code: 1, message: 'SUCCESS', data: formattedUsers });
});
// ——— v1: list your friends ———
router.get('/api/v1/friends', async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ code: 0, message: 'User not found' });
  const friends = user.friends || [];
  const docs = await User.find({ userId: { $in: friends } })
    .select('userId nickname picUrl sex country language');
  res.json({ code: 1, data: docs });
});

// ——— v1: send a friend request ———
router.post('/api/v1/friends/requests', async (req, res) => {
  try {
    const { userId, friendId, message } = req.body;
    if (await isFriend(userId, friendId)) {
      return res.status(400).json({ code: 0, message: 'Already friends' });
    }
    const user   = await User.findOne({ userId });
    const target = await User.findOne({ userId: friendId });
    if (!user || !target) {
      return res.status(404).json({ code: 0, message: 'User not found' });
    }
    await new FriendRequest({
      userId:   friendId,
      friendId: userId,
      message,
      picUrl:   user.picUrl,
      nickname: user.nickname,
      sex:      user.sex,
      country:  user.country,
      language: user.language
    }).save();
    res.status(200).json({ code: 1, message: 'Friend request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 0, message: 'Server error' });
  }
});

// ——— v1: reject a pending request ———
// **static route** comes *before* the dynamic :friendId route
router.delete('/api/v1/friends/:friendId/rejection', async (req, res) => {
  try {
    const { userId } = req.body;
    const friendId   = Number(req.params.friendId);
    await rejectFriendRequest(userId, friendId);
    res.json({ code: 1, message: 'Friend request rejected' });
  } catch (err) {
    res.status(400).json({ code: 0, message: err.message });
  }
});

// ——— v1: get a single friend’s info ———
// **param constrained to digits only** so “requests” can’t match here
router.get(
  '/api/v1/friends/:friendId(\\d+)',
  async (req, res) => {
    try {
      const { userId }  = req.body;
      const friendId    = Number(req.params.friendId);
      const info        = await getFriendInfo(userId, friendId);
      res.json({ code: 1, data: info });
    } catch (err) {
      res.status(400).json({ code: 0, message: err.message });
    }
  }
);

// ——— v2: delete an existing friendship ———
router.delete('/api/v2/friends/:friendId(\\d+)', async (req, res) => {
  try {
    const { userId } = req.body;
    const friendId   = Number(req.params.friendId);
    await deleteFriend(userId, friendId);
    res.json({ code: 1, message: 'Friend deleted' });
  } catch (err) {
    res.status(400).json({ code: 0, message: err.message });
  }
});

module.exports = router;