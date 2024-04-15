require('dotenv').config();
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const chatModel = require('../models/chatModel');
const chat_table = process.env.CHAT_TABLE;
const user_table = process.env.USER_TABLE;
const chatM = new chatModel(chat_table, dynamodb);
const userModel = require('../models/userModel');
const userM = new userModel(user_table, dynamodb);
const webSocketController = require('./webSocketController');

async function createChat(req, res) {
    const { listParticipant, type, lastMessage } = req.body;
    const id = await chatM.getNextId(chat_table);
     const chatData ={
        id: id.toString(),
        type: type,
        participants: listParticipant,
        lastMessage: lastMessage.text,
        lastMessageTime: lastMessage.createdAt,
        lastSenderId: lastMessage.user._id,
        lastSenderName: lastMessage.user.name,
        lastMessageRead: lastMessage.read,
        createdAt: new Date().toISOString()
    }
    const chat = await chatM.saveChat(chatData);
    if (chat) {
        return res.status(200).json({ success: true, message: "Tạo chat thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Tạo chat thất bại" });
    } 
}
async function createGroupChat(req, res) {
    const { listParticipant, type, name, idAdmin } = req.body;
    const id = await chatM.getNextId(chat_table);
     const chatData ={
        id: id.toString(),
        type: type,
        groupName: name,
        avatar: "https://res.cloudinary.com/dekjrisqs/image/upload/v1712977627/vljmvybzv0orkqwej1tf.png",
        participants: listParticipant,
        lastMessage: "Nhóm chat mới",
        lastMessageTime: new Date().toISOString(),
        lastMessageId: "",
        lastSenderId: idAdmin,
        lastSenderName: name,
        lastMessageRead: false,
        createdAt: new Date().toISOString()
    }
    const chat = await chatM.saveChat(chatData);
    const listReceiver = listParticipant.filter(item => item.idUser !== idAdmin);
    if (chat) {
        await webSocketController.sendReloadConversationToUser(listReceiver);
        return res.status(200).json({ success: true, message: "Tạo chat thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Tạo chat thất bại" });
    } 
}

//get chat by user id
async function getChatByUserId(req, res) {
    const userId = req.body.idUser;
    const user = await userM.findUserById(userId);

    if (user) {
        const listChat = user.listChat;
        let data = [];
        for (let i = 0; i < listChat.length; i++) {
            const chat = await chatM.getChatByChatId(listChat[i]);
            if (chat) {
                data.push(chat[0]);
            }
        }

        return res.status(200).json({ success: true, message: "Lấy danh sách chat thành công", data: data });
    } else {
        return res.status(500).json({ success: false, message: "Lấy danh sách chat thất bại" });
    }
}
async function addMemberToGroupChat(req, res) {
    const { chatId, listMember } = req.body;
    const result = await chatM.addMemberToGroupChat(chatId, listMember);
    await listMember.forEach((item) => {
        userM.addChat(item.idUser, chatId);
    })
    if (result) {
        return res.status(200).json({ success: true, message: "Thêm thành viên vào nhóm thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Thêm thành viên vào nhóm thất bại" });
    }
}
async function leaveOrKickoutGroupChat(req, res) {
    const { chatId, idUser } = req.body;
    const result = await chatM.leaveOrKickoutGroupChat(chatId, idUser);
    await userM.removeChat(idUser, chatId);
    if (result) {
        return res.status(200).json({ success: true, message: "Rời nhóm thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Rời nhóm thất bại" });
    }
}
async function deleteChat(req, res) {
    const { chatId } = req.body;
    const chat = await chatM.getChatByChatId(chatId);
    chat[0].participants.forEach(async (item)=>{
        await userM.removeChat(item.idUser, chatId)
})
    const result = await chatM.deleteChat(chatId);
    if (result) {
        return res.status(200).json({ success: true, message: "Xóa chat thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Xóa chat thất bại" });
    }
}
async function setAdminForMembers(req, res) {
    const { chatId,  listParticipant } = req.body;
    const result = await chatM.setAdminForMembers(chatId, listParticipant);
    if (result) {
        return res.status(200).json({ success: true, message: "Đặt quyền admin thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Đặt quyền admin thất bại" });
    }
}
async function changeGroupName(req, res) {
    const { chatId, groupName } = req.body;
    const result = await chatM.changeGroupName(chatId, groupName);
    if (result) {
        return res.status(200).json({ success: true, message: "Đổi tên nhóm thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Đổi tên nhóm thất bại" });
    }
}
async function changeAvatarGroup(req, res) {
    const { chatId, avatar } = req.body;
    const result = await chatM.changeAvatarGroup(chatId, avatar);
    if (result) {
        return res.status(200).json({ success: true, message: "Đổi ảnh nhóm thành công" });
    } else {
        return res.status(500).json({ success: false, message: "Đổi ảnh nhóm thất bại" });
    }
}
module.exports = {
    createChat,
    getChatByUserId,
    createGroupChat,
    addMemberToGroupChat,
    leaveOrKickoutGroupChat,
    deleteChat,
    setAdminForMembers,
    changeGroupName,
    changeAvatarGroup
}