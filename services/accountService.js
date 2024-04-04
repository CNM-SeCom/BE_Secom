const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const account = require('../models/accountModel');
const user = require('../models/userModel');
require('dotenv').config();
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const bucketName = process.env.BUCKET_NAME;
const accountTable = process.env.ACCOUNT_TABLE;
const userTable = process.env.USER_TABLE;
const accountModel = new account(accountTable, dynamodb);
const userModel = new user(userTable, dynamodb);

class accountService {
    constructor() {
        this.accountModel = new account(accountTable, dynamodb);
    }
    async createAccount(accountData) {
       return await this.accountModel.createAccount(accountData);
    }
    async findAccountByEmail(email) {
        return await this.accountModel.findAccountByEmail(email);
    }
    async findAccountByPhone(phone) {
        return await this.accountModel.findAccountByPhone(phone);
    }
    async hashPassword(password) {
        return await this.accountModel.hashPassword(password);
    }
}
module.exports = new accountService();