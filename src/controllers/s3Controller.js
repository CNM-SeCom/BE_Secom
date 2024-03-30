const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const s3 = new AWS.S3(
    {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
        region: process.env.REGION
    }
);
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userModel = require('../models/userModel');
const user_table = process.env.USER_TABLE;
const userM = new userModel(user_table, dynamodb);
const bucketName = process.env.BUCKET_NAME;
const { v4: uuidv4 } = require('uuid');

const uploadAvatar = (req, res) => {
    const file = req.file;
    const params = {
        Bucket: bucketName,
        Key: `${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    s3.upload(params, (s3Err, data) => {
        if (s3Err) {
            console.error("S3 Error:", s3Err);
            return res.status(500).json({ success: false, message: "An error occurred while uploading the file to S3" });
        }
        const result = userM.changeAvatar(req.body.idUser, data.Location);
        if (!result) {
            return res.status(500).json({ success: false, message: "An error occurred while updating the avatar" });
        }
        return res.status(200).json({ success: true, message: "Avatar updated successfully", data: data.Location });
    });
};
const uploadCoverImage = (req, res) => {
    const file = req.file;
    const params = {
        Bucket: bucketName,
        Key: `${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    s3.upload(params, (s3Err, data) => {
        if (s3Err) {
            console.error("S3 Error:", s3Err);
            return res.status(500).json({ success: false, message: "An error occurred while uploading the file to S3" });
        }
        const result = userM.changeCoverImage(req.body.idUser, data.Location);
        if (!result) {
            return res.status(500).json({ success: false, message: "An error occurred while updating the avatar" });
        }
        return res.status(200).json({ success: true, message: "Cover image updated successfully", data: data.Location });
    });
};
const uploadImageMessage = (req, res) => {
    const file = req.file;
    const params = {
        Bucket: bucketName,
        Key: `${uuidv4()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };
    s3.upload(params, (s3Err, data) => {
        if (s3Err) {
            return res.status(500).json({ success: false, message: "An error occurred while uploading the file to S3" });
        }
        return res.status(200).json({ uri: data.Location });
    });

}

module.exports = {
    uploadAvatar,
    uploadCoverImage,
    uploadImageMessage
};
