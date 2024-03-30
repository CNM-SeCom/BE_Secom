const AWS = require('aws-sdk');


class MessageModel {
    constructor(tableName, dynamodb, s3) {
        this.tableName = tableName;
        this.bucketName = process.env.BUCKET_NAME;
        this.dynamodb = dynamodb;
        this.s3 = s3
    }
    async getNextId(tableName) {
        try {
            const params = {
                TableName: tableName,
               
            };
            const result = await this.dynamodb.scan(params).promise();
            console.log("result.Items:", result)
            // sắp xếp result tăng dần theo _id
            result.Items.sort((a, b) => b._id - a._id);
            console.log("result.Items[result.Items.length]._id:", result.Items[0]._id)
            if(result.Items.length === 0) return 1;
            else{
                console.log("result.Items[result.Items.length]._id:", result.Items[0]._id)
                return parseInt(result.Items[0]._id) + 1;
            }
        } catch (error) {
            console.error('Error retrieving messages:', error);
            return 1;
        }
    }
    async saveMessage(messageData) {
        try {
            const params = {
                TableName: this.tableName,
                Item: messageData,
            };
        //     if(messageData.type === "img"){
        //         const image = Buffer.from(messageData.image, 'base64');
        //         console.log("image:", image)
        //         const imageParams = {
        //             Bucket: this.bucketName,
        //             Key: messageData._id.toString(),
        //             Body: image,
        //             ACL: 'public-read',
        //             ContentType: 'image/jpeg'
        //         };
        //         await this.s3.upload(imageParams).promise();

        // }
            await this.dynamodb.put(params).promise();
            return true;
        } catch (error) {

            console.error('Error saving message:', error);
            return false;
        }
    }

    async getMessagesByChatId(chatId) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "chatId = :chatId",
                ExpressionAttributeValues: {
                    ":chatId": chatId
                }
            };
            const result = await this.dynamodb.scan(params).promise();
            const sortedMessages = result.Items.sort((a, b) => a._id - b._id);
            return sortedMessages;
        } catch (error) {
            console.error('Error retrieving messages:', error);
            return [];
        }
    }
    
}

module.exports = MessageModel;
