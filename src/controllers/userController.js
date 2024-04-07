require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userModel = require('../models/userModel');
const user_table = process.env.USER_TABLE;
const userM = new userModel(user_table, dynamodb);
const chat_table = process.env.CHAT_TABLE;
const chatModel = require('../models/chatModel');
const { name } = require('ejs');
const chatM = new chatModel(chat_table, dynamodb);


function generateUUID() {
    return uuidv4();
}

async function sendRequestAddFriend(req, res) {
    const request = req.body;

    const requestData = {
        id: generateUUID(),
        fromUser: request.fromUser,
        nameFromUser: request.nameFromUser,
        avatarFromUser: request.avatarFromUser,
        toUser: request.toUser,
        nameToUser: request.nameToUser,
        avatarToUser: request.avatarToUser,
        status: "pending",
        createdAt: new Date().toISOString(),
        type:""
    }
    const result = await userM.sendRequestAddFriend(requestData);
    const result2 = await userM.receiveRequestAddFriend(requestData);
    if (!result && !result2) {
        return res.status(500).json({ success: false, message: "Gửi lời mời kết bạn thất bại" });
    }
    return res.status(200).json({ success: true, message: "Gửi lời mời kết bạn thành công" });
}
async function getListUserByName(req, res) {
    const name = req.body.name;
    if (name) {
        const result = await userM.findUserByUserName(name);
        if (!result) {
            return res.status(500).json({ success: false, message: "Lấy danh sách người dùng thất bại" });
        }
        return res.status(200).json({ success: true, message: "Lấy danh sách người dùng thành công", data: result });
    }
    else {
        return res.status(200).json({ success: false, data: [], message: "Danh sách rỗng" });
    }
}
async function acceptRequestAddFriend(req, res) {
    const request = req.body;
    const result = await userM.addFriend(request);
    const id = await chatM.getNextId(chat_table);
    const data1 = {
        idUser: request.fromUser,
        name: request.nameFromUser,
        avatar: request.avatarFromUser
    }
    const data2 = {
        idUser: request.toUser,
        name:   request.nameToUser,
        avatar: request.avatarToUser
    }
        const chatData = {
        id: id.toString(),
        type: "single",
        participants: [data1, data2],
        lastMessage: "Đoạn chat mới",
        lastMessageTime: new Date().toISOString(),
        lastSenderId: data1.idUser,
        lastSenderName: data1.name,
        lastMessageRead: false,
        createdAt: new Date().toISOString()
    }
    const result2 = await chatM.saveChat(chatData);
    if (!result&&!result2) {
        return res.status(500).json({ success: false, message: "Chấp nhận lời mời kết bạn thất bại" });
    }
    return res.status(200).json({ success: true, message: "Chấp nhận lời mời kết bạn thành công" });
}
async function getRequestAddFriendByUserId(req, res) {
    const userId = req.body.idUser;
    const result = await userM.getRequestAddFriendByUserId(userId);
    const data = []
    if (!result) {
        return res.status(500).json({ success: false, message: "Lấy danh sách yêu cầu kết bạn thất bại" });
    }
    //duyệt từng phần tử trong result
    for (let i = 0; i < result.length; i++) {

        if (result[i].toUser === userId) {
            result[i].type = "received";
            data.push(result[i]);
        }
    };
    return res.status(200).json({ success: true, message: "Lấy danh sách yêu cầu kết bạn thành công", data: data });
}
async function getSentRequestAddFriendByUserId(req, res) {
    const userId = req.body.idUser;
    const result = await userM.getRequestAddFriendByUserId(userId);
    const data = []
    if (!result) {
        return res.status(500).json({ success: false, message: "Lấy danh sách yêu cầu kết bạn thất bại" });
    }
    //duyệt từng phần tử trong result
    for (let i = 0; i < result.length; i++) {

        if (result[i].fromUser === userId) {
            result[i].type = "sent";
            data.push(result[i]);
        }
    };
    return res.status(200).json({ success: true, message: "Lấy danh sách yêu cầu kết bạn thành công", data: data });
}
async function changeProfile (req, res) {
    const {idUser, name, } = req.body;
    console.log(name)
    const result = await userM.changeProfile(idUser, name);
    console.log("result:", result)
    if (!result) {
        return res.status(500).json({ success: false, message: "Thay đổi thông tin thất bại" });
    }
    return res.status(200).json({ success: true, message: "Thay đổi thông tin thành công" });
}
async function checkExistRequestAddFriend(req, res) {
    const request = req.body;
    const result = await userM.checkExistRequestAddFriend(request);
    if (result) {
        return res.status(500).json({ success: false, message: "Bạn đã gửi lời mời kết bạn cho người này rồi" });
    }
    return res.status(200).json({ success: true, message: "true", data: result });
}
async function reloadUser(req, res) {
    const userId = req.body.idUser;
    const result = await userM.findUserById(userId);
    if (!result) {
        return res.status(500).json({ success: false, message: "Tải lại thông tin người dùng thất bại" });
    }
    return res.status(200).json({ success: true, message: "Tải lại thông tin người dùng thành công", data: result });
}
async function getListFriendByUserId(req, res) {
    const userId = req.body.idUser;
    const result = await userM.getListFriendByUserId(userId);
    if (!result) {
        return res.status(500).json({ success: false, message: "Lấy danh sách bạn bè thất bại" });
    }
    return res.status(200).json({ success: true, message: "Lấy danh sách bạn bè thành công", data: result });

}


module.exports = {
    sendRequestAddFriend,
    getListUserByName,
    acceptRequestAddFriend,
    getRequestAddFriendByUserId,
    changeProfile,
    checkExistRequestAddFriend,
    reloadUser,
    getSentRequestAddFriendByUserId,
    getListFriendByUserId

}