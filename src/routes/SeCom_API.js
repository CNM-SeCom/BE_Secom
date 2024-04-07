const { login, createAccount, updateAccessToken, logout, changePassword, findEmailByPhone,
checkLoginWithToken, forgotPassword, checkPhoneExist, checkEmailExist
} = require('../controllers/authControllers');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const cors = require('cors')
const corsOptions = require('../config/cors.config')
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const verifyToken = require('../middleware/auth');
const {createChat, getChatByUserId} = require('../controllers/chatController')
const {OTP, verify} = require('../controllers/otpController')
const {sendRequestAddFriend, getListUserByName, getRequestAddFriendByUserId,
acceptRequestAddFriend, changeProfile, checkExistRequestAddFriend, reloadUser, getSentRequestAddFriendByUserId,
getListFriendByUserId
} = require('../controllers/userController')
const {loadMessageByChatId, getUserOnline} = require('../controllers/webSocketController')
const {uploadAvatar, uploadCoverImage, uploadImageMessage} = require('../controllers/s3Controller');
const { get } = require('http');



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
// router quên mật khẩu
router.post("/forgotPassword", forgotPassword);
// Route POST để đăng xuất
router.post("/logout",verifyToken, logout);
// // Route POST để gửi tin nhắn
// router.post("/sendSMS", sendSMS);
//
router.post("/checkLoginWithToken", checkLoginWithToken);
//gửi otp
router.post("/sendOTP", OTP);
//verify otp
router.post("/verifyOTP", verify);
// router để tạo chat
router.post("/createChat", createChat);
//tìm email từ sđt
router.post("/findEmailByPhone", findEmailByPhone);
// router gửi lời mời kết bạn
router.post("/sendRequestAddFriend", sendRequestAddFriend);
// router lấy danh sách người dùng theo tên
router.post("/getListUserByName", getListUserByName);
// lấy danh sách đoạn chat
router.post("/getChatByUserId", getChatByUserId);
// lấy danh sách tin nhắn theo chat id
router.post("/getMessageByChatId", loadMessageByChatId);
//lấy danh sách lời mời kết bạn
router.post("/getRequestAddFriendByUserId", getRequestAddFriendByUserId);
router.post("/getSentRequestAddFriendByUserId", getSentRequestAddFriendByUserId);
//chấp nhận kết bạn
router.post("/acceptRequestAddFriend", acceptRequestAddFriend);
//
router.post('/uploadAvatar', upload.single('image'), uploadAvatar);
// update cover image
router.post('/uploadCoverImage', upload.single('image'), uploadCoverImage);
// upload image message
router.post('/uploadImageMessage', upload.single('image'), uploadImageMessage);
//change profile
router.post('/changeProfile', changeProfile);
//checkPhoneExist
router.post('/checkPhoneExist', checkPhoneExist);
//check emaill tồn tại
router.post('/checkEmailExist', checkEmailExist);
//check lời mời kết bạn
router.post('/checkExistRequestAddFriend', checkExistRequestAddFriend);
//get online
router.post('/getOnline', getUserOnline);
//tải lại user
router.post('/reloadUser', reloadUser);
router.post('/getListFriendByUserId', getListFriendByUserId);

module.exports = router;
