require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userModel = require('../models/userModel');
const user_table = process.env.USER_TABLE;
const userM = new userModel(user_table, dynamodb);

class userService {
    constructor() {
        this.userModel = new userModel(user_table, dynamodb);
    }
    async sendRequestAddFriend(requestData) {
        return await this.userModel.sendRequestAddFriend(requestData);
    }
    async receiveRequestAddFriend(requestData) {
        return await this.userModel.receiveRequestAddFriend(requestData);
    }
    async findUserByUserName(name) {
        return await this.userModel.findUserByUserName(name);
    }
    async addFriend(request) {
        return await this.userModel.addFriend(request);
    }
    async getRequestAddFriendByUserId(userId) {
        return await this.userModel.getRequestAddFriendByUserId(userId);
    }
}
module.exports = new userService(); 