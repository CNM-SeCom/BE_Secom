const AWS = require('aws-sdk');

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
            result.Items.sort((a, b) => b.id - a.id);
            if(result.Items.length === 0) return 1;
            else{
                return parseInt(result.Items[result.Items.length].id) + 1;
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
            return true;
        } catch (error) {
            console.error('Error saving message:', error);
            return false;
        }
    }

    async getChatByChatId(chatId) {
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
// update last message
async updateLastMessage(chatId, lastMessage) {
    try {
        const params = {
            TableName: this.tableName,
            Key: {
                id: chatId
            },
            UpdateExpression: "set lastMessage = :lastMessage, lastMessageTime = :lastMessageTime, lastSenderId = :lastSenderId, lastSenderName = :lastSenderName, lastMessageRead = :lastMessageRead",
            ExpressionAttributeValues: {
                ":lastMessage": lastMessage.text,
                ":lastMessageTime": lastMessage.createdAt,
                ":lastSenderId": lastMessage.user._id,
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
