require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userModel = require('../models/userModel');
const user_table = process.env.USER_TABLE;
const userM = new userModel(user_table, dynamodb);

function generateUUID() {
    return uuidv4();
}

async function sendRequestAddFriend(req, res) {
    const request = req.body;

    const requestData = {
        id: generateUUID(),
        fromUser: request.fromUser,
        toUser: request.toUser,
        status: "pending",
        createdAt: new Date().toISOString()
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
    if (!result) {
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
            result[i].status = "received";
            data.push(result[i]);
        }
        else {
            result[i].status = "sent";
            data.push(result[i]);
        }
    };
    return res.status(200).json({ success: true, message: "Lấy danh sách yêu cầu kết bạn thành công", data: data });
}
async function changeProfile (req, res) {
    const {idUser, name} = req.body;
    const result = await userM.changeProfile(idUser, name);
    if (!result) {
        return res.status(500).json({ success: false, message: "Thay đổi thông tin thất bại" });
    }
    return res.status(200).json({ success: true, message: "Thay đổi thông tin thành công" });
}


module.exports = {
    sendRequestAddFriend,
    getListUserByName,
    acceptRequestAddFriend,
    getRequestAddFriendByUserId,
}