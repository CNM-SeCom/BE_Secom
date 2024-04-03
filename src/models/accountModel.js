const bcrypt = require('bcrypt');
const AWS = require('aws-sdk');

class AccountModel {
    constructor(tableName, dynamodb) {
        this.tableName = tableName;
        this.dynamodb = dynamodb;
    }

    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    async createAccount(accountData) {
        console.log('accountData:', accountData)
        console.log(this.tableName)
        try {
            const params = {
                TableName: this.tableName,
                Item: accountData,
            };
            await this.dynamodb.put(params).promise();
            return true;
        } catch (error) {
            console.error('Error creating account:', error);
            return false;
        }
    }

    async findAccountByEmail(email) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": email
                }
            };
            const result = await this.dynamodb.scan(params).promise();
            return result.Items[0];
        } catch (error) {
            console.error('Error finding account by email:', error);
            return null;
        }
    }
    async findAccountByPhone(phone) {
        try {
            const params = {
                TableName: this.tableName,
                FilterExpression: "phone = :phone",
                ExpressionAttributeValues: {
                    ":phone": phone
                }
            };
            const result = await this.dynamodb.scan(params).promise();
            return result.Items[0];
        } catch (error) {
            console.error('Error finding account by phone:', error);
            return null;
        }
    }
    async changePassword(id, password) {
        try {
            const params = {
                TableName: this.tableName,
                Key: {
                    id: id
                },
                UpdateExpression: "set pass = :pass",
                ExpressionAttributeValues: {
                    ":pass": password
                },
                ReturnValues: "UPDATED_NEW"
            };
            const result = await this.dynamodb.update(params).promise();
            return result;
        } catch (error) {
            console.error('Error changing password:', error);
            return null;
        }
    }
}

module.exports = AccountModel;
