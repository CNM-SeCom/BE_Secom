require('dotenv').config();
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const chatModel = require('../models/chatModel');
const chat_table = process.env.CHAT_TABLE;
const user_table = process.env.USER_TABLE;
const chatM = new chatModel(chat_table, dynamodb);
const userModel = require('../models/userModel');
const userM = new userModel(user_table, dynamodb);

class chatService{
    constructor(){
        this.chatModel = new chatModel(chat_table, dynamodb);
    }
    async createChat(chatData){
        return await this.chatModel.createChat(chatData);
    }
    async getChatByChatId(chatId){
        return await this.chatModel.getChatByChatId(chatId);
    }
    async getNextId(){
        return await this.chatModel.getNextId();
    }
    async saveChat(chatData){
        return await this.chatModel.saveChat(chatData);
    }
}
module.exports = new chatService();