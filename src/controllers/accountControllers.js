const bcrypt = require('bcrypt');
require('dotenv').config();
const AWS = require('aws-sdk');

process.env.AWS_SDk_JS_SUPPRESS_MAITENANCE_MODE_MESSAGE = '1';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const bucketName = process.env.BUCKET_NAME;
const tableName = process.env.TABLE_NAME;
const userTable = process.env.USER_TABLE;

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
        const params = {
          TableName: tableName,
          FilterExpression: "phone = :phone",
          ExpressionAttributeValues: {
            ":phone": phone
          }
        };

        const account = await dynamodb.scan(params).promise();
        if (account.Items.length > 0) {
          const result = await comparePassword(pass, account.Items[0].pass);
    
          if (result) {
            console.log("Login success");
            const userId = account.Items[0].idUser;
            
            // Truy vấn dữ liệu người dùng từ bảng user bằng ID người dùng
            const userParams = {
              TableName: userTable, // Tên của bảng user
              Key: {
                idUser: userId
              }
            };
    
            const userData = await dynamodb.get(userParams).promise();
            console.log(userData.Item);
            return res.status(200).json({ success: true, message: "Login success", account: account.Items[0], user: userData.Item});
          } else {
            console.log("Login failed: incorrect password");
            return res.status(401).json({ success: false, message: "Incorrect password" });
          }
        } else {
          console.log("Account not found");
          return res.status(404).json({ success: false, message: "Account not found" });
        }
      } catch (error) {
        console.log("Error", error);
        return res.status(500).json({ success: false, message: "Iteration failed", error: error });
      }
}

//get all accounts
const createAccount = async (req, res) => {
  try {
    const { phone, pass, gender } = req.body;
    const paramsAccount= {TableName:tableName,
        Item : {
            id: Date.now().toString(),
            phone: phone,
            pass: await hashPassword(pass),
            createdAt: new Date().toString(),
            status: 'active',
            idUser: Date.now().toString()+phone,
        }
    };

        const paramsUser = {
          TableName: userTable,
          Item: {
            idUser: paramsAccount.Item.idUser,
            phone: phone,
            email:'Chưa cập nhật',
            name: 'User'+ paramsAccount.Item.id,
            address: 'Chưa cập nhật',
            gender: gender,
            avatar : gender === 'Nam' ? 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/amafsgal21le2xhy4jgy.jpg' : 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/jfvpv2c7etp65u8ssaff.jpg'
          },
        };
       
        //kiểm tra số điện thoại đã tồn tại chưa
        const checkPhone = await dynamodb.scan({TableName:tableName, FilterExpression: "phone = :phone", ExpressionAttributeValues: {":phone": phone}}).promise();
        if(checkPhone.Items.length > 0) {
          return res.status(400).json({ success: false, message: "Phone number already exists" });
        }
        else {
          await dynamodb.put(paramsAccount).promise();
          await dynamodb.put(paramsUser).promise();
          return res.redirect("/");
        }
      }catch (error) {
        console.log("Error", error);
        return res.status(500).json({ "Iteration failed": error.message });
      }
}




//get all accounts
const getAllAccounts = async (req, res) => {
    try {
        const params = { TableName:tableName};
        const account = await dynamodb.scan(params).promise();
        // console.log(account.Items);
        // const result = await comparePassword('abc', '$2b$10$st3iDHhk5TUSsfKH2tGWy.hQ2tBlONOKrH.EXFq7bOcnjuuQvVhV2');
        // console.log(result);      
        return res.render('createAccount');
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({ "Iteration failed": error });
    }
}

module.exports = {
    login,
    createAccount,
    getAllAccounts
}