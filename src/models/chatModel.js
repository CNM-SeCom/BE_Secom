const AWS = require('aws-sdk');
const UserModel = require('./userModel');
require('dotenv').config();
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const user_table = process.env.USER_TABLE;
const userM = new UserModel(user_table, dynamodb);

class ChatModel {

    constructor(tableName, dynamodb) {
        this.tableName = tableName;
        this.dynamodb = dynamodb;
    }
    async getNextId(tableName) {
        try {
            const params = {
                TableName: tableName,

            };
            const result = await this.dynamodb.scan(params).promise();
            if(result.Items.length === 0) return 1;
            else{
            result.Items.sort((a, b) => a.id - b.id);
                return parseInt(result.Items[result.Items.length-1].id) + 1
        }
        } catch (error) {
            console.error('Error retrieving messages:', error);
            return 1;
        }
    }
    async saveChat(chatData) {
        try {
            const params = {
                TableName: this.tableName,
                Item: chatData,
            };
            await this.dynamodb.put(params).promise();
            console.log("chatData:", chatData.participants.length)
            for (let i = 0; i < chatData.participants.length; i++) {
                const user = await userM.findUserById(chatData.participants[i].idUser);
                if (user) {
                    
                    user.listChat.push(chatData.id);
                    await userM.updateListChatByUserId(user.idUser, user.listChat);
                }
            }
            return true;
        } catch (error) {
            console.error('Error saving message:', error);
            return false;
        }
    }
    async updateNameAndAvatarForParticipants(chatId) {
        var participants = await this.getParticipantByChatId(chatId);
        participants.forEach(async (participant) => {
            const user = await userM.findUserById(participant.idUser);
        
            participant.name = user.name;
            participant.avatar = user.avatar;
        })
        
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    id: chatId
                },
                UpdateExpression: "set participants = :participants",
                ExpressionAttributeValues: {
                    ":participants": participants
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result;
        } catch (error) {
            console.error('Error updating participants:', error);
            return null;
        }
    }

    async getChatByChatId(chatId) {
        // await this.updateNameAndAvatarForParticipants(chatId);
        try {
            const params = {
                TableName: this.tableName,
                KeyConditionExpression: "#id = :id",
                ExpressionAttributeNames: {
                    "#id": "id"
                },
                ExpressionAttributeValues: {
                    ":id": chatId
                }
            };
            const result = await this.dynamodb.query(params).promise();
            return result.Items;
        } catch (error) {
            console.error('Error retrieving messages:', error);
            return [];
        }
    }
    async getParticipantByChatId(chatId) {
        try {
            const params = {
                TableName: this.tableName,
                KeyConditionExpression: "#id = :id",
                ExpressionAttributeNames: {
                    "#id": "id"
                },
                ExpressionAttributeValues: {
                    ":id": chatId
                }
            };
            const result = await this.dynamodb.query(params).promise();
            return result.Items[0].participants;
        } catch (error) {
            console.error('Error retrieving messages:', error);
            return [];
        }

    }
    // update last message
    async updateLastMessage(chatId, lastMessage) {
        try {
            var lastMessageText = ""
            if (lastMessage.text === "") {
                lastMessageText = lastMessage.user.name + " đã gửi 1 hình ảnh"
            }
            else {
                lastMessageText = lastMessage.text
            }
            const params = {
                TableName: this.tableName,
                Key: {
                    id: chatId
                },
                UpdateExpression: "set lastMessage = :lastMessage, lastMessageTime = :lastMessageTime, lastSenderId = :lastSenderId, lastSenderName = :lastSenderName, lastMessageRead = :lastMessageRead",
                ExpressionAttributeValues: {

                    ":lastMessage": lastMessageText,
                    ":lastMessageTime": lastMessage.createdAt,
                    ":lastSenderId": lastMessage.user.idUser,
                    ":lastSenderName": lastMessage.user.name,
                    ":lastMessageRead": lastMessage.read
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result;
        } catch (error) {
            console.error('Error updating last message:', error);
            return null;
        }
    }

}

module.exports = ChatModel;
