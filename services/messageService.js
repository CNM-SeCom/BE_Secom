const AWS = require('aws-sdk');
require('dotenv').config();
const messageModel = require('../models/messageModel');
const chatModel = require('../models/chatModel');
const message_table = process.env.MESSAGE_TABLE;
const chat_table = process.env.CHAT_TABLE;
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const bucketName = process.env.BUCKET_NAME;
const messageM = new messageModel(message_table, dynamodb, s3);
const chatM = new chatModel(chat_table, dynamodb);

class messageService {
    constructor() {
        this.messageModel = new messageModel(message_table, dynamodb, s3);
    }
    async createMessage(messageData) {
        return await this.messageModel.createMessage(messageData);
    }
    async getMessageByChatId(chatId) {
        return await this.messageModel.getMessageByChatId(chatId);
    }
    async getNextId() {
        return await this.messageModel.getNextId();
    }
    async saveMessage(messageData) {
        return await this.messageModel.saveMessage(messageData);
    }
}
module.exports = new messageService();