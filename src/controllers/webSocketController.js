const WebSocket = require('ws');
const AWS = require('aws-sdk');
const messageModel = require('../models/messageModel');
const chatModel = require('../models/chatModel');
const message_table = process.env.MESSAGE_TABLE;
const chat_table = process.env.CHAT_TABLE;
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const bucketName = process.env.BUCKET_NAME;
const messageM = new messageModel(message_table, dynamodb, s3);
const chatM = new chatModel(chat_table, dynamodb);
const user_table = process.env.USER_TABLE;
const userModel = require('../models/userModel');
const { list } = require('firebase/storage');
const { name } = require('ejs');
const userM = new userModel(user_table, dynamodb);


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
//get user online
function getUserOnline(req, res) {
    return res.status(200).json({ success: true, message: "Lấy danh sách người dùng online thành công", data: Array.from(clients.keys()) });
}
function getUserIdFromUrl(url) {
    return url.split('/').pop();
}

function registerGroup(groupId, userId) {
    const groupMembers = groups.get(groupId) || new Set();
    groupMembers.add(userId);
    groups.set(groupId, groupMembers);
}

async function handleDisconnection(userId) {

    clients.delete(userId);
    console.log("delete user:::", userId)
    // await updateRefreshToken(userId, "")
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
    //kiểm tra messageData có trường groupName không
    let groupName=""
    if (messageData.groupName) {
        groupName = messageData.groupName
    }
    const messageId = await messageM.getNextId(message_table)
    const message = {
        _id: parseInt(messageId),
        chatId: messageData.chatId,
        text: messageData.text,
        createdAt: new Date().toISOString(),
        type: messageData.type,
        image: messageData.image? messageData.image : null,
        video: messageData.video? messageData.video : null,
        file: messageData.file? messageData.file : null,
        user: {
            idUser: messageData.user.idUser.toString(),
            name: messageData.user.name,
            avatar: messageData.user.avatar
        },
        receiverId: messageData.receiverId,
        readStatus: false,
        groupName: groupName
    }
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(message));
        const result = await saveMessage(message);
        await chatM.updateLastMessage(messageData.chatId, message);
        return { success: result, message: 'Message sent to user successfully', data: message };
    }
    else {
        const result = await saveMessage(message);
        await chatM.updateLastMessage(messageData.chatId, message);
        return { success: result, message: 'Message sent to user successfully', data: message };
    }
}
async function sendMessageCallToUser(listReceiver, messageData) {
    const messageId = await messageM.getNextId(message_table)
    const message = {
        _id: parseInt(messageId),
        chatId: messageData.chatId,
        text: messageData.text,
        createdAt: new Date().toISOString(),
        type: messageData.type,
        image: messageData.image? messageData.image : null,
        video: messageData.video? messageData.video : null,
        file: messageData.file? messageData.file : null,
        user: {
            idUser: messageData.user.idUser.toString(),
            name: messageData.user.name,
            avatar: messageData.user.avatar
        },
        receiverId: messageData.receiverId,
        readStatus: false,
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver)) {
            clients.get(receiver).send(JSON.stringify(message));
        }
    }
);
    const result = await saveMessage(message);
    await chatM.updateLastMessage(messageData.chatId, message);
return { success: true, message: 'Message sent to user successfully', data: message };
}
function sendNotifyAddFriendToUser(req,res) {
    const receiverId = req.body.receiverId;
    const from = req.body.name;
    const messageData = {
        type: "ADD_FRIEND",
        text: from + " đã gửi lời mời kết bạn", 
        user:{
            name: from
        }
    }

    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(messageData));
    }
    return res.status(200).json({ success: true, message: 'Message sent to user successfully', data: messageData });

}
 function sendNotifyAcceptFriendToUser (req,res) {
    const receiverId = req.body.receiverId;
    const from = req.body.name;
    const messageData = {
        type: "ACCEPT_FRIEND",
        text: from + " đã chấp nhận lời mời kết bạn", 
        user:{
            name: from
        }
    }
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(messageData));
        
        return res.status(200).json({ success: true, message: 'Message sent to user successfully'});
    }
    else {
        return res.status(200).json({ success: false, message: 'User not online' });
    }
}
function sendNotifyReloadMessageToUser (receiverId, chatId) {
    const messageData = {
        type: "RELOAD_MESSAGE",
        chatId: chatId,
    }
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(messageData));
        console.log("send notify reload message to user:", receiverId)
        return true
    }
return false
}
function sendNotifyReloadMessageToGroup (listReceiver, chatId) {
    const messageData = {
        type: "RELOAD_MESSAGE",
        chatId: chatId,
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}
function sendTypingToUser(receiverId, chatId, typing, userId) {
    const messageData = {
        type: "TYPING",
        typing: typing,
        chatId: chatId,
        userId: userId
    }
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(messageData));
        return { success: true, message: 'Message sent to user successfully' };
    }
    else {
        return { success: true, message: 'User not online' };
    }
}
function sendTypingToGroup(listReceiver, chatId, typing, userId) {
    const messageData = {
        type: "TYPING",
        typing: typing,
        chatId: chatId,
        userId: userId
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
    
}
function sendReloadConversationToUser(listReceiver) {
    const messageData = {
        type: "RELOAD_CONVERSATION",
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}

async function sendMessageToGroup(listReceiver, messageData, groupId,participants) {
    const messageId = await messageM.getNextId(message_table)
    const message = {
        _id: parseInt(messageId),
        chatId: messageData.chatId,
        text: messageData.text,
        createdAt: new Date().toISOString(),
        type: messageData.type,
        image: messageData.image? messageData.image : null,
        video: messageData.video? messageData.video : null,
        file: messageData.file? messageData.file : null,
        user: {
            idUser: messageData.user.idUser.toString(),
            name: messageData.user.name,
            avatar: messageData.user.avatar
        },
        receiverId: messageData.receiverId,
        readStatus: false,
        groupId: groupId,
        participants: messageData.participants? messageData.participants : null,
        idKickOut: messageData.idKickOut? messageData.idKickOut : null,
        groupName: messageData.groupName? messageData.groupName : null
    }
    const result = await saveMessage(message);
    await chatM.updateLastMessage(messageData.chatId, message);
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(message));
        }
    });
        return { success: result, message: 'Message sent to user successfully', data: message };
    
}
//save message to dynamodb
function saveMessage(messageData) {
    const result = messageM.saveMessage(messageData);
    return result;
}
//load message by chatId
async function loadMessageByChatId(req, res) {
    const chatId = req.body.chatId;
    const result = await messageM.getMessagesByChatId(chatId);
    return res.status(200).json({ success: true, message: "Lấy danh sách tin nhắn thành công", data: result });
}
async function deleteMessageById(req, res) {
    const messageId = req.body.messageId;
    const listReceiver = req.body.listReceiver;
    const result = await messageM.deleteMessageById(messageId);
    if (!result) {
        return res.status(500).json({ success: false, message: "Xóa tin nhắn thất bại" });
    }
    else{
    if(listReceiver) {
        sendNotifyReloadMessageToGroup(listReceiver, req.body.chatId)
    }
    else{
        sendNotifyReloadMessageToUser(req.body.receiverId, req.body.chatId, res);
    }
}
    
    
    return res.status(200).json({ success: true, message: "Xóa tin nhắn thành công" });
}
async function sendNotifyGroupMessage(req,res) {
    const groupName = req.body.groupName;
    const listReceiver = req.body.listReceiver;
    console.log("listReceiver:", listReceiver)
    const messageData = {
        type: "GROUP_MESSAGE",
        groupName: groupName
    }
    listReceiver.forEach(receiver => {
        console.log("receiver:", receiver.idUser)
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}
async function sendNotifyUpdateGroup(req,res) {
    const chatId = req.body.chatId;
    const listReceiver = req.body.listReceiver;
    const messageData = {
        type: "UPDATE_GROUP",
        chatId: chatId
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}
async function sendNotifyKickOutGroup(req,res) {
    const chatId = req.body.chatId;
    const receiverId = req.body.receiverId;
    const messageData = {
        type: "KICKOUTED",
        chatId: chatId,
        text:'Bạn đã bị đuổi khỏi nhóm'
    }
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(messageData));
        return res.status(200).json({ success: true, message: 'Message sent to user successfully' });
    }
}
async function sendNotifyDeleteGroup(req,res) {
    const chatId = req.body.chatId;
    const listReceiver = req.body.listReceiver;
    const messageData = {
        type: "DELETE_GROUP",
        chatId: chatId
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}
async function sendNotifyUpdateMember(req,res) {
    const chatId = req.body.chatId;
    const listReceiver = req.body.listReceiver;
    const status = req.body.status;
    const messageData = {
        type: "UPDATE_MEMBER",
        chatId: chatId,
        status: status
    }
    listReceiver.forEach(receiver => {
        if (clients.has(receiver.idUser)) {
            clients.get(receiver.idUser).send(JSON.stringify(messageData));
        }
    });
}
async function sendNotifyCallVideo(req,res) {
    const receiverId = req.body.receiverId;
    const callerId = req.body.callerId;
  
    const messageData = {
        type: "CALL_VIDEO",
        data: callerId,
        name: req.body.name
    }

        if (clients.has(receiverId)) {
            clients.get(receiverId).send(JSON.stringify(messageData));
        }
}
module.exports = {
    handleConnection,
    sendMessageToUser,
    sendMessageToGroup,
    loadMessageByChatId,
    getUserOnline,
    sendNotifyAddFriendToUser,
    sendNotifyAcceptFriendToUser,
    deleteMessageById,
    sendTypingToUser,
    sendNotifyReloadMessageToUser,
    sendReloadConversationToUser,
    sendNotifyGroupMessage,
    sendTypingToGroup,
    sendNotifyReloadMessageToGroup,
    sendNotifyUpdateGroup,
    sendNotifyKickOutGroup,
    sendNotifyDeleteGroup,
    sendNotifyUpdateMember,
    sendNotifyCallVideo,
    sendMessageCallToUser
    

    
};
