const express = require('express');
const router = express.Router();
const webSocketController = require('../controllers/webSocketController');

// Endpoint API để gửi tin nhắn cho một người dùng cụ thể
router.post('/send-message-to-user', async (req, res) => {
    const receiverId = req.body.message.receiverId;
    console.log("receiverId:", receiverId)
    const message = req.body.message;
    const result = await webSocketController.sendMessageToUser(receiverId, message);
    res.status(result.success ? 200 : 404).json(result);
});

// Endpoint API để gửi tin nhắn cho một nhóm người dùng
router.post('/send-message-to-group/:groupId', (req, res) => {
    const { groupId } = req.params;
    const { message } = req.body.message;
    const result = webSocketController.sendMessageToGroup(groupId, message);
    res.status(result.success ? 200 : 404).json(result);
});
// Endpoint API để lấy tin nhắn theo chatId
router.get('/load-message-by-chatId', async (req, res) => {
    const chatId = req.body.chatId;

    const result = await webSocketController.loadMessageByChatId(chatId);
    res.status(200).json(result);
});

module.exports = router;
