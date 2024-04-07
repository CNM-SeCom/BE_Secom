const bcrypt = require('bcrypt');
require('dotenv').config();
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const account = require('../models/accountModel');
const user = require('../models/userModel');
// const e = require('express');


// process.env.AWS_SDk_JS_SUPPRESS_MAITENANCE_MODE_MESSAGE = '1';

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
    console.log(pass)
    console.log(await hashPassword(pass));
    const account = await accountModel.findAccountByPhone(phone);
    if (account) {
      const result = await comparePassword(pass, account.pass);
      if (result) {
        const userId = account.idUser;
        const userData = await userModel.findUserById(userId);
        // if(userData.refreshToken != ""){
        //   const checkRefreshToken = checkRefreshTokenExpiration(userData.refreshToken);
        //   if(!checkRefreshToken){
        //     return res.status(403).json({ success: false, message: "Refresh token is expired" });
        //   }
        //   else{

        //   }
        // }
        const tokens = generateTokens(userData)
        updateRefreshToken(userData.idUser, tokens.refreshToken)
        return res.status(200).json({ success: true, message: "Đăng nhập thành công", token: tokens, user: userData });
      } else {
        return res.status(401).json({ success: false, message: "Mật khẩu không đúng" });
      }
    } else {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "failed", error: error });
  }
}

const createAccount = async (req, res) => {
  try {
    const { phone, pass, name, gender, dob, email } = req.body;
    const accountData = {
      id: Date.now().toString(),
      phone: phone,
      email: email,
      pass: await hashPassword(pass),
      createdAt: new Date().toString(),
      status: 'active',
      idUser: Date.now().toString() + phone,
    }
    const userData = {
      idUser: accountData.idUser,
      phone: phone,
      email: email,
      dob: dob,
      name: name,
      gender: gender,
      avatar: gender == '0' ? 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/amafsgal21le2xhy4jgy.jpg' : 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/jfvpv2c7etp65u8ssaff.jpg',
      coverImage:"https://res.cloudinary.com/dekjrisqs/image/upload/v1712277485/SECOM/f3swqcbkfqzpwe5vqmw5.jpg",
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
      expiresIn: '1d'
    }

  )

  const refreshToken = jwt.sign(
    { idUser, name },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '30d'
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
  if (!user) return res.status(500).json({ "Failed": "User  not found" });

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const tokens = generateTokens(user)
    updateRefreshToken(user.Item.idUser, tokens.refreshToken)

    return res.status(200).json(tokens)
  } catch (error) {
    console.log(error)
    return res.sendStatus(403)
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
const changePassword = async (req, res) => {
  const { phone, newPass, oldPass } = req.body;
  const account = await accountModel.findAccountByPhone(phone);

  if (account) {
    const resultPass = await comparePassword(oldPass, account.pass);
    if (!resultPass) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }
    else{
    const result = await accountModel.changePassword(account.id, await hashPassword(newPass));
    if (result) {
      return res.status(200).json({ success: true, message: "Change password success" });
    } else {
      return res.status(500).json({ success: false, message: "Change password failed" });
    }
  }
  } else {
    return res.status(404).json({ success: false, message: "Account not found" });
  }
}
const forgotPassword = async (req, res) => {
  const { phone, newPass } = req.body;
  const account = await accountModel.findAccountByPhone(phone);
  if (account) {
    console.log(account.id)
    const result = await accountModel.changePassword(account.id, await hashPassword(newPass));
    if (result) {
      return res.status(200).json({ success: true, message: "Change password success" });
    } else {
      return res.status(500).json({ success: false, message: "Change password failed" });
    }
  } else {
    return res.status(404).json({ success: false, message: "Account not found" });
  }
}
const findEmailByPhone = async (req, res) => {
  const phone = req.body.phone;
  console.log(phone)
  const account = await accountModel.findAccountByPhone(phone);
  if (account) {
    return res.status(200).json({ success: true, message: "Find email success", data: account.email });
  } else {
    return res.status(404).json({ success: false, message: "Account not found" });
  }

}
const checkRefreshTokenExpiration = (refreshToken) => {
  try {
      // Decode the refresh token to access its payload
      const decoded = jwt.decode(refreshToken);

      // Check if the decoded token is expired
      if (decoded.exp <= Date.now() / 1000) {
          // Token is expired
          return false;
      }

      // Token is valid and not expired
      return true;
  } catch (error) {
      // An error occurred, likely due to invalid token format
      console.error("Error checking refresh token expiration:", error);
      return false;
  }
};
const checkLoginWithToken= async(req, res)=> {
  const refreshToken = req.body.refreshToken
  const idUser = req.body.idUser
  if (!refreshToken) return res.sendStatus(401)
  try{
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
  const getUserParams = {
    TableName: userTable,
    Key: {
      idUser: idUser
    }
  };
  const user = await dynamodb.get(getUserParams).promise();
  if (!user) return res.status(500).json({ "Failed": "User not found" });
  if(!checkRefreshTokenExpiration(refreshToken)) return res.status(403).json({ "Failed": "Refresh token is expired" });
    return res.status(200).json({ success: true, message: "Login success", data: user.Item });
  } catch (error) {
    console.log(error)
    return res.sendStatus(403)
  }
 
}
 const checkPhoneExist = async(req, res)=>{
  const phone = req.body.phone;
  console.log(phone)
  const checkPhone = await dynamodb.scan({ TableName: accountTable, FilterExpression: "phone = :phone", ExpressionAttributeValues: { ":phone": phone } }).promise();
  if (checkPhone.Items.length > 0) {
    return res.status(400).json({ success: false, message: "Phone number already exists" });
  }
  return res.status(200).json({ success: true, message: "success" });
}
const checkEmailExist = async(req, res)=>{
  const email = req.body.email;
 if(await userModel.checkExistEmail(email) === false){
      return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản khớp với email này' });
    }
  return res.status(200).json({ success: true, message: "success" });
}

module.exports = {
  login,
  createAccount,
  updateAccessToken,
  updateRefreshToken,
  changePassword,
  findEmailByPhone,
  checkLoginWithToken,
  forgotPassword,
  checkPhoneExist,
  checkEmailExist,
  logout
}