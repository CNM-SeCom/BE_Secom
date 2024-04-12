const AWS = require('aws-sdk');


// const {getChatByChatId} = require('./chatModel');

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
        const user = await this.findUserById(userId);
        let data = [];
    if (user) {
        const listChat = user.listChat;
        for (let i = 0; i < listChat.length; i++) {
            
            if (chat) {
                data.push(chat[0]);
            }
        }
    }
    return data
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
        //xóa yêu cầu kết bạn và thêm vào danh sách bạn bè
        try {
            const currentRequests = await this.getCurrentRequests(request.toUser);
            const currentFriends = await this.getCurrentFriends(request.toUser);
            const friend = await this.findUserById(request.fromUser);
            const friendData = {
                idUser: friend.idUser,
                name: friend.name,
                avatar: friend.avatar
            }
            const newFriends = currentFriends.concat(friendData);
            const newRequests = currentRequests.filter(req => req.id !== request.id);
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: request.toUser
                },
                UpdateExpression: "SET listFriend = :newFriends, listRequest = :newRequests",
                ExpressionAttributeValues: {
                    ":newFriends": newFriends,
                    ":newRequests": newRequests
                },
                ReturnValues: "UPDATED_NEW"
            };
            //update đối với user còn lại
            const currentRequests2 = await this.getCurrentRequests(request.fromUser);
            const currentFriends2 = await this.getCurrentFriends(request.fromUser);
            const friend2 = await this.findUserById(request.toUser);
            const friendData2 = {
                idUser: friend2.idUser,
                name: friend2.name,
                avatar: friend2.avatar
            }
            const newFriends2 = currentFriends2.concat(friendData2);
            const newRequests2 = currentRequests2.filter(req => req.id !== request.id);
            const params2 = {
                TableName: this.tableName,
                Key: {
                    idUser: request.fromUser
                },
                UpdateExpression: "SET listFriend = :newFriends, listRequest = :newRequests",
                ExpressionAttributeValues: {
                    ":newFriends": newFriends2,
                    ":newRequests": newRequests2
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            const result2 = await this.dynamodb.update(params2).promise();
            
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
            console.log(data)
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
    async findUserByUserName(username, idUser) {
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
            // bỏ đi user hiện tại
            data.Items = data.Items.filter(user => user.idUser !== idUser);
            return data.Items;
        } catch (error) {
            console.error('Error finding user by username:', error);
            return null;
        }
    }
    async getRequestAddFriendByUserId(userId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                }
            };
            const data = await this.dynamodb.get(params).promise();
            return data.Item && data.Item.listRequest ? data.Item.listRequest : [];
        } catch (error) {
            console.error('Error getting current requests:', error);
            return [];
        }
    }
    async changeAvatar(idUser, avatar) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: idUser
                },
                UpdateExpression: "set avatar = :avatar",
                ExpressionAttributeValues: {
                    ":avatar": avatar
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error changing avatar:', error);
            return null;
        }
    }
    async changeCoverImage(idUser, coverImage) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: idUser
                },
                UpdateExpression: "set coverImage = :coverImage",
                ExpressionAttributeValues: {
                    ":coverImage": coverImage
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error changing cover image:', error);
            return null;
        }
    }
    async changeProfile(idUser, name) {
        try {
            const user = await this.findUserById(idUser);
            console.log("user:", user)
            if (!user) return null;
            else {
                if (name === "") name = user.name;
                // if(dob === "") dob = user.dob;
            }
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: idUser
                },
                UpdateExpression: "set #n = :name",
                ExpressionAttributeNames: {
                    "#n": "name"
                },
                ExpressionAttributeValues: {
                    ":name": name
                }
            };
            const result = await this.dynamodb.update(params).promise();
            return result;
        } catch (error) {
            console.error('Error changing profile:', error);
            return null;
        }
    }
    async checkExistEmail(email) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": email
                }
            };
            const result = await this.dynamodb.scan(params).promise();
            return result.Items.length > 0;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    }
    async checkExistRequestAddFriend(request) {
        try {
            const currentRequests = await this.getCurrentRequests(request.toUser);
            console.log(currentRequests)
            const result = currentRequests.find(req => req.fromUser === request.fromUser);
            return result ? true : false;
        } catch (error) {
            console.error('Error checking request add friend:', error);
            return false;
        }
    }
    async getListFriendByUserId(userId) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: userId
                }
            };
            const data = await this.dynamodb.get(params).promise();
            return data.Item && data.Item.listFriend ? data.Item.listFriend : [];
        } catch (error) {
            console.error('Error getting list friend:', error);
            return [];
        }
    }
    async cancelRequestAddFriend(request) {
        try {
            const currentRequests = await this.getCurrentRequests(request.fromUser);
            const newRequests = currentRequests.filter(req => req.toUser !== request.toUser);
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: request.fromUser
                },
                UpdateExpression: "SET listRequest = :newRequests",
                ExpressionAttributeValues: {
                    ":newRequests": newRequests
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            const currentRequests2 = await this.getCurrentRequests(request.toUser);
            const newRequests2 = currentRequests2.filter(req => req.fromUser !== request.fromUser);
            const params2 = {
                TableName: this.tableName,
                Key: {
                    idUser: request.toUser
                },
                UpdateExpression: "SET listRequest = :newRequests",
                ExpressionAttributeValues: {
                    ":newRequests": newRequests2
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result2 = await this.dynamodb.update(params2).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error cancel request add friend:', error);
            return null;
        }
    }
    async unFriend(idUser, friendId) {
        try {
            const currentFriends = await this.getCurrentFriends(idUser);
            const newFriends = currentFriends.filter(req => req.idUser !== friendId);
            const params = {
                TableName: this.tableName,
                Key: {
                    idUser: idUser
                },
                UpdateExpression: "SET listFriend = :newFriends",
                ExpressionAttributeValues: {
                    ":newFriends": newFriends
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            const currentFriends2 = await this.getCurrentFriends(friendId);
            const newFriends2 = currentFriends2.filter(req => req.idUser !== idUser);
            const params2 = {
                TableName: this.tableName,
                Key: {
                    idUser: friendId
                },
                UpdateExpression: "SET listFriend = :newFriends",
                ExpressionAttributeValues: {
                    ":newFriends": newFriends2
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result2 = await this.dynamodb.update(params2).promise();
            return result.Attributes;
        } catch (error) {
            console.error('Error destroy friend:', error);
            return null;
        }
    }

}

module.exports = UserModel;