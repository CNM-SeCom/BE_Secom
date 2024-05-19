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
router.post('/send-message-call-to-user', async (req, res) => {
    const listReceiver = req.body.listReceiver;
    console.log("listReceiver:", listReceiver)
    const message = req.body.message;
    const result = await webSocketController.sendMessageCallToUser(listReceiver, message);
    res.status(result.success ? 200 : 404).json(result);
});


// Endpoint API để gửi tin nhắn cho một nhóm người dùng
router.post('/send-message-to-group/:groupId',async (req, res) => {
    const { groupId } = req.params;
    const { listReceiver,message } = req.body;
    const result = await webSocketController.sendMessageToGroup(listReceiver, message, groupId);
    res.status(result.success ? 200 : 404).json(result);
});
router.post('/sendNotifyAddFriendToUser', (req, res) => {
    const result = webSocketController.sendNotifyAddFriendToUser(req, res);
    res.status(result.success ? 200 : 404).json(result);
});
router.post('/sendNotifyAcceptFriendToUser',async (req, res) => {
    const result =await webSocketController.sendNotifyAcceptFriendToUser(req, res);
    res.status(result.success ? 200 : 404).json(result);
});
router.post('/sendNotifyReloadMessageToUser', (req, res) => {})
//group
router.post('/sendNotifyAddMemberToGroup', (req, res) => {
    const result = webSocketController.sendNotifyAddMemberToGroup(req, res);
    res.status(result.success ? 200 : 404).json(result);
})

router.post('/sendNotifySetAdminForMembers', (req, res) => {
    const result = webSocketController.sendNotifySetAdminForMembers(req, res);
    res.status(result.success ? 200 : 404).json(result);
})
//update member
router.post('/sendNotifyUpdateMember', (req, res) => {
    const result = webSocketController.sendNotifyUpdateMember(req, res);
    res.status(result.success ? 200 : 404).json(result);
})



router.post('/sendTypingToUser', (req, res) => {
    const receiverId = req.body.receiverId;
    const typing = req.body.typing;
    const chatId = req.body.chatId;
    const userId = req.body.userId;
    console.log("receiverId:", receiverId)
    const result = webSocketController.sendTypingToUser(receiverId, chatId, typing);
    res.status(result.success ? 200 : 404).json(result);
});
//send typing to group
router.post('/sendTypingToGroup', (req, res) => {
    const { listReceiver, typing, chatId, userId } = req.body;
    const result = webSocketController.sendTypingToGroup(listReceiver, chatId, typing, userId);
    res.status(200).json(result);
})
router.post('/sendNotifyGroupMessage', (req, res) => {
    const result = webSocketController.sendNotifyGroupMessage(req, res);
    res.status(200)
})
router.post('/sendNotifyCallVideo', (req, res) => {
    const result = webSocketController.sendNotifyCallVideo(req, res);
    res.status(200)
})
module.exports = router;
