const express = require('express');
const router = express.Router();
const webSocketController = require('../controllers/webSocketController');

// Endpoint API để gửi tin nhắn cho một người dùng cụ thể
router.post('/send-message-to-user', (req, res) => {
    const receiverId = req.body.receiverId;
    console.log("receiverId:", receiverId)
    const message = req.body.message;
    const result = webSocketController.sendMessageToUser(receiverId, message);
    res.status(result.success ? 200 : 404).json(result);
});

// Endpoint API để gửi tin nhắn cho một nhóm người dùng
router.post('/send-message-to-group/:groupId', (req, res) => {
    const { groupId } = req.params;
    const { message } = req.body.message;
    const result = webSocketController.sendMessageToGroup(groupId, message);
    res.status(result.success ? 200 : 404).json(result);
});

module.exports = router;
