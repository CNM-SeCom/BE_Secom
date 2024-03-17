const WebSocket = require('ws');
const AWS = require('aws-sdk');
const messageModel = require('../models/messageModel');
const chatModel = require('../models/chatModel');
const message_table = process.env.MESSAGE_TABLE;
const chat_table = process.env.CHAT_TABLE;
const dynamodb = new AWS.DynamoDB.DocumentClient();
const messageM = new messageModel(message_table, dynamodb);
const chatM = new chatModel(chat_table, dynamodb);


const clients = new Map();
const groups = new Map();

function handleConnection(ws, req) {
    const userId = getUserIdFromUrl(req.url).split('=')[1];
    clients.set(userId, ws);
    // clients.get(userId).send('Connected to server:'+userId);
    console.log("connected user:", userId)

    ws.on('message', function incoming(message) {
    });

    ws.on('close', function close() {
        handleDisconnection(userId);
    });
}

function getUserIdFromUrl(url) {
    return url.split('/').pop();
}

function registerGroup(groupId, userId) {
    const groupMembers = groups.get(groupId) || new Set();
    groupMembers.add(userId);
    groups.set(groupId, groupMembers);
}

function handleDisconnection(userId) {
    
    clients.delete(userId);
    console.log("delete user:::", userId)
    groups.forEach((groupMembers, groupId) => {
        if (groupMembers.has(userId)) {
            groupMembers.delete(userId);
            if (groupMembers.size === 0) {
                groups.delete(groupId);
            }
        }
    });
}

async function sendMessageToUser(receiverId, messageData) {
    if (clients.has(receiverId))
     {
     const messageId = await messageM.getNextId(message_table)
     console.log("messageId:", messageId)
        const message={
            _id: parseInt(messageId), 
            chatId: messageData.chatId,
            text: messageData.text,
            createdAt: new Date().toISOString(),
            type: messageData.type,
            user:{
                _id: messageData.user.idUser.toString(),
                name: messageData.user.name,
                avatar: messageData.user.avatar
            },
            receiverId: messageData.receiverId,
            read: false
        }
        clients.get(receiverId).send(JSON.stringify(message));
        console.log("result:", message)
        const result = await saveMessage(message);
        
        await chatM.updateLastMessage(messageData.chatId, message);
        return {success: result, message: 'Message sent to user successfully' };
    } 
}

function sendMessageToGroup(groupId, message) {
    const groupMembers = groups.get(groupId);
    if (groupMembers) {
        groupMembers.forEach(memberId => {
            if (clients.has(memberId)) {
                clients.get(memberId).send(message);
            }
        });
        return { success: true, message: 'Message sent to group successfully' };
    } else {
        return { success: false, message: 'Group not found' };
    }
}
//save message to dynamodb
function saveMessage(messageData) {
    const result = messageM.saveMessage(messageData);
    return result;
}
//load message by chatId
async function loadMessageByChatId(req, res) {
    const chatId = req.body.chatId;
    console.log("________________________")
    console.log(chatId)
    const result = await messageM.getMessagesByChatId(chatId);
    console.log("result:", result)
    return res.status(200).json({ success: true, message: "Lấy danh sách tin nhắn thành công", data: result });
}

module.exports = {
    handleConnection,
    sendMessageToUser,
    sendMessageToGroup,
    loadMessageByChatId
};
