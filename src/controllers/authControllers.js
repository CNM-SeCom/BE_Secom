const bcrypt = require('bcrypt');
require('dotenv').config();
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const account = require('../models/accountModel');
const user = require('../models/userModel');


process.env.AWS_SDk_JS_SUPPRESS_MAITENANCE_MODE_MESSAGE = '1';

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

//hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword; // Trả về giá trị hash dưới dạng chuỗi
}

async function comparePassword(plaintextPassword, hash) {
  const result = await bcrypt.compare(plaintextPassword, hash);
  return result;
}
//login
const login = async (req, res) => {
  try {
    const { phone, pass } = req.body;

    const account = await accountModel.findAccountByPhone(phone);
    if (account) {
      console.log(account[0].pass)
      const result = await comparePassword(pass, account[0].pass);
      if (result) {
        const userId = account[0].idUser;
        const userData = await userModel.findUserById(userId);
        // if(userData.Item.refreshToken) {
        //   return res.status(401).json({ success: false, message: "Tài khoản đang đăng nhập ở nơi khác" });
        // }
        console.log(userData)
        const tokens = generateTokens(userData)
        updateRefreshToken(userData.idUser, tokens.refreshToken)
        console.log(tokens.accessToken, tokens.refreshToken)
        return res.status(200).json({ success: true, message: "Đăng nhập thành công", token: tokens, user: userData });
      } else {
        console.log("Login failed: incorrect password");
        return res.status(401).json({ success: false, message: "Mật khẩu không đúng" });
      }
    } else {
      console.log("Account not found");
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ success: false, message: "Iteration failed", error: error });
  }
}

const createAccount = async (req, res) => {
  try {
    const { phone, pass, name, gender } = req.body;
    console.log(phone, pass, name, gender)
    const accountData = {
      id: Date.now().toString(),
      phone: phone,
      pass: await hashPassword(pass),
      createdAt: new Date().toString(),
      status: 'active',
      idUser: Date.now().toString() + phone,
    }
    const userData = {
      idUser: accountData.idUser,
      phone: phone,
      email: 'Chưa cập nhật',
      name: name,
      address: 'Chưa cập nhật',
      gender: gender,
      avatar: gender == '0' ? 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/amafsgal21le2xhy4jgy.jpg' : 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/jfvpv2c7etp65u8ssaff.jpg',
      refreshToken: '',
      listChat: [],
      listFriend: [],
      listRequest: [],
      listBlock: [],
      listGroup: [],
    }
    //kiểm tra số điện thoại đã tồn tại chưa
    const checkPhone = await dynamodb.scan({ TableName: accountTable, FilterExpression: "phone = :phone", ExpressionAttributeValues: { ":phone": phone } }).promise();
    if (checkPhone.Items.length > 0) {
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }
    else {
      await accountModel.createAccount(accountData);
      await userModel.createUser(userData);
      return res.status(200).json({ success: true, message: "Create account success" });
    }
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ "Iteration failed": error.message });
  }
}
const generateTokens = payload => {
  const { idUser, name } = payload
  // Create JWT
  const accessToken = jwt.sign(
    { idUser, name },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '10m'
    }

  )

  const refreshToken = jwt.sign(
    { idUser, name },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '1d'
    }
  )

  return { accessToken, refreshToken }
}
const updateRefreshToken = async (idUser, refreshToken) => {
  try {
    // Sử dụng phương thức get để lấy dữ liệu của mục cần cập nhật
    const getUserParams = {
      TableName: userTable,
      Key: {
        idUser: idUser
      }
    };

    const user = await dynamodb.get(getUserParams).promise();
    console.log("User:", user)

    if (!user.Item) {
      console.error('User not found');
      return null; 
    }
    user.Item.refreshToken = refreshToken;

    // Sử dụng phương thức update để cập nhật mục
    const updateParams = {
      TableName: userTable,
      Key: {
        idUser: idUser
      },
      UpdateExpression: 'SET refreshToken = :refreshToken',
      ExpressionAttributeValues: {
        ':refreshToken': refreshToken
      },
      ReturnValues: 'ALL_NEW'
    };

    const updatedUser = await dynamodb.update(updateParams).promise();
    console.log('Refresh token updated:', updatedUser);

    return updatedUser;
  } catch (error) {
    console.error('Error updating refresh token:', error);
    throw error;
  }
};
const updateAccessToken = async (req, res) => {
  const refreshToken = req.body.refreshToken
  const idUser = req.body.idUser
  if (!refreshToken) return res.sendStatus(401)
  const getUserParams = {
    TableName: userTable,
    Key: {
      idUser: idUser
    }
  };

  const user = await dynamodb.get(getUserParams).promise();
  if (!user || user.Item.refreshToken != refreshToken) return res.status(500).json({ "Failed": "Refresh token not found" });

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

    const tokens = generateTokens(user)
    updateRefreshToken(user.Item.idUser, tokens.refreshToken)

    res.json(tokens)
  } catch (error) {
    console.log(error)
    res.sendStatus(403)
  }
}
const logout = async (req, res) => {
  const idUser = req.body.idUser
  console.log("user:"+idUser+" is logout")
  const getUserParams = {
    TableName: userTable,
    Key: {
      idUser: idUser
    }
  };
  const user = await dynamodb.get(getUserParams).promise();
  await updateRefreshToken(user.Item.idUser, "")

  res.status(200).json({ success: true, message: "logout success" });
}

module.exports = {
  login,
  createAccount,
  updateAccessToken,
  logout
}