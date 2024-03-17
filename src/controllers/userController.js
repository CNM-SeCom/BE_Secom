require('dotenv').config();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userModel = require('../models/userModel');
const user_table = process.env.USER_TABLE;
const userM = new userModel(user_table, dynamodb);

async function sendRequestAddFriend(req, res) {
    const request = req.body;

    const requestData = {
        id: new Date().getTime().toString()+request.fromUser,
        fromUser: request.fromUser,
        toUser: request.toUser,
        status: "pending",
        createdAt: new Date().toISOString()
    }
    const result = await userM.sendRequestAddFriend(requestData);
    const result2 = await userM.receiveRequestAddFriend(requestData);
    if (!result&&!result2) {
        return res.status(500).json({ success: false, message: "Gửi lời mời kết bạn thất bại" });
    }
    return res.status(200).json({ success: true, message: "Gửi lời mời kết bạn thành công" });
}
async function getListUserByName (req, res) {
    const name = req.body.name;
    if(name){
    const result = await userM.findUserByUserName(name);
    if (!result) {
        return res.status(500).json({ success: false, message: "Lấy danh sách người dùng thất bại" });
    }
    return res.status(200).json({ success: true, message: "Lấy danh sách người dùng thành công", data: result });
    }
    else{
        return res.status(200).json({ success: false, data: [], message:"Danh sách rỗng" });
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
module.exports = {
    sendRequestAddFriend,
    getListUserByName
}