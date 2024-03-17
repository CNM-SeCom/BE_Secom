const AWS = require('aws-sdk');

class UserModel {
    constructor(tableName, dynamodb) {
        this.tableName = tableName;
        this.dynamodb = dynamodb;
    }

    async createUser(userData) {
        try {
            const params = {
                TableName: this.tableName,
                Item: userData,
            };
            await this.dynamodb.put(params).promise();
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    }

    async findUserById(userId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                }
            };
            const result = await this.dynamodb.get(params).promise();
            return result.Item;
        } catch (error) {
            console.error('Error finding user by id:', error);
            return null;
        }
    }
    //lấy danh sách chat
    async getChatByUserId(userId) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "idUser = :idUser",
                ExpressionAttributeValues: {
                    ":idUser": userId
                }
            };
            const result = await this.dynamodb.scan(params).promise();
            return result.Items;
        } catch (error) {
            console.error('Error retrieving chat:', error);
            return [];
        }
    }
    //update list chat
    async updateListChatByUserId(userId, listChat) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                },
                UpdateExpression: "set listChat = :listChat",
                ExpressionAttributeValues: {
                    ":listChat": listChat
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error updating chat:', error);
            return null;
        }
    }
    // add friend
    async addFriend(request) {
        try {
            
    
            // Cập nhật danh sách yêu cầu trong cơ sở dữ liệu
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: request.fromUser
                },
                UpdateExpression: "SET listRequest = :currentRequests",
                ExpressionAttributeValues: {
                    ":currentRequests": currentRequests
                },
                ReturnValues: "UPDATED_NEW"
            };
            
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error adding friend:', error);
            return null;
        }
    }
    //send request add friend
    async sendRequestAddFriend(request) {
        try {
            // Lấy danh sách yêu cầu hiện tại từ cơ sở dữ liệu
            const currentRequests = await this.getCurrentRequests(request.fromUser);
            
            // Thêm yêu cầu mới vào danh sách
            currentRequests.push(request);
    
            // Cập nhật danh sách yêu cầu trong cơ sở dữ liệu
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: request.fromUser
                },
                UpdateExpression: "SET listRequest = :currentRequests",
                ExpressionAttributeValues: {
                    ":currentRequests": currentRequests
                },
                ReturnValues: "UPDATED_NEW"
            };
            
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error adding friend:', error);
            return null;
        }
    }
    async receiveRequestAddFriend(request) {
        try {
            // Lấy danh sách yêu cầu hiện tại từ cơ sở dữ liệu
            const currentRequests = await this.getCurrentRequests(request.toUser);
    
            // Thêm yêu cầu mới vào danh sách
            currentRequests.push(request);
    
            // Cập nhật danh sách yêu cầu trong cơ sở dữ liệu
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: request.toUser
                },
                UpdateExpression: "SET listRequest = :currentRequests",
                ExpressionAttributeValues: {
                    ":currentRequests": currentRequests
                },
                ReturnValues: "UPDATED_NEW"
            };
            
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error adding friend:', error);
            return null;
        }
    }
    async getCurrentRequests(userId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                }
            };
            const data = await this.dynamodb.get(params).promise();
            
            // Trả về danh sách yêu cầu hiện tại, nếu không có trả về một mảng rỗng
            return data.Item && data.Item.listRequest ? data.Item.listRequest : [];
        } catch (error) {
            console.error('Error getting current requests:', error);
            return [];
        }
    }
    async getCurrentFriends(userId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                }
            };
            const data = await this.dynamodb.get(params).promise();
            
            // Trả về danh sách yêu cầu hiện tại, nếu không có trả về một mảng rỗng
            return data.Item && data.Item.listFriend ? data.Item.listFriend : [];
        } catch (error) {
            console.error('Error getting current requests:', error);
            return [];
        }
    }
    //get user by user name
    async findUserByUserName(username) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "contains(#name, :usernameValue)",
                ExpressionAttributeNames: {
                    "#name": "name"
                },
                ExpressionAttributeValues: {
                    ":usernameValue": username
                },
                Limit: 20 
            };
            const data = await this.dynamodb.scan(params).promise();
            return data.Items;
        } catch (error) {
            console.error('Error finding user by username:', error);
            return null;
        }
    }
    
    
}

module.exports = UserModel;
