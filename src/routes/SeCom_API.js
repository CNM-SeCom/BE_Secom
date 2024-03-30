const { login, createAccount, updateAccessToken, logout, changePassword } = require('../controllers/authControllers');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const cors = require('cors')
const corsOptions = require('../config/cors.config')
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { verify } = require('jsonwebtoken');
const verifyToken = require('../middleware/auth');
const {createChat, getChatByUserId} = require('../controllers/chatController')
// const {sendSMS} = require('../controllers/otpController')
const {sendRequestAddFriend, getListUserByName, getRequestAddFriendByUserId,
acceptRequestAddFriend, changeAvatar
} = require('../controllers/userController')
const {loadMessageByChatId} = require('../controllers/webSocketController')
const {uploadAvatar, uploadCoverImage, uploadImageMessage} = require('../controllers/s3Controller')



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file 5MB
});

// Route POST để tạo tài khoản mới
router.post("/create", createAccount);

// Route POST để đăng nhập
router.post("/login", cors(corsOptions), login);
// update access token
router.post("/updateAccessToken", updateAccessToken);
// route đổi mật khẩu
router.post("/changePassword", changePassword);
// Route POST để đăng xuất
router.post("/logout",verifyToken, logout);
// // Route POST để gửi tin nhắn
// router.post("/sendSMS", sendSMS);
// router để tạo chat
router.post("/createChat", createChat);
// router gửi lời mời kết bạn
router.post("/sendRequestAddFriend",verifyToken, sendRequestAddFriend);
// router lấy danh sách người dùng theo tên
router.post("/getListUserByName", getListUserByName);
// lấy danh sách đoạn chat
router.post("/getChatByUserId",verifyToken, getChatByUserId);
// lấy danh sách tin nhắn theo chat id
router.post("/getMessageByChatId", loadMessageByChatId);
//lấy danh sách lời mời kết bạn
router.post("/getRequestAddFriendByUserId", getRequestAddFriendByUserId);
//chấp nhận kết bạn
router.post("/acceptRequestAddFriend", acceptRequestAddFriend);
//
router.post('/uploadAvatar', upload.single('image'), uploadAvatar);
// update cover image
router.post('/uploadCoverImage', upload.single('image'), uploadCoverImage);
// upload image message
router.post('/uploadImageMessage', upload.single('image'), uploadImageMessage);

module.exports = router;
