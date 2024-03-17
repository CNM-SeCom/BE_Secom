const { login, createAccount, updateAccessToken, logout } = require('../controllers/authControllers');
const multer = require('multer');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const path = require('path');
const { verify } = require('jsonwebtoken');
const verifyToken = require('../middleware/auth');
const {createChat, getChatByUserId} = require('../controllers/chatController')
// const {sendSMS} = require('../controllers/otpController')
const {sendRequestAddFriend, getListUserByName} = require('../controllers/userController')
const {loadMessageByChatId} = require('../controllers/webSocketController')


// Cấu hình lưu trữ tệp với multer
const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        // Thư mục lưu trữ tệp
        cb(null, './src/public/assets');
        // cb(null, '');
    },
});

// Khởi tạo upload với multer
const upload = multer({ 
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Giới hạn kích thước tệp (ở đây là 5MB)
    },
    fileFilter: function (req, file, callback) {
        // Kiểm tra loại tệp
        checkFileType(file, callback);
    }
});

// ...



// Hàm kiểm tra loại tệp
function checkFileType(file, callback) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback('Error: Images only');
    }
}

// // Route GET để hiển thị tất cả các tài khoản
// router.get("/", getAllAccounts);

// Route POST để tạo tài khoản mới
router.post("/create", upload.single('img'), createAccount);

// Route POST để đăng nhập
router.post("/login", login);
// update access token
router.post("/updateAccessToken", updateAccessToken);
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



module.exports = router;
