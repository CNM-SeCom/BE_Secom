const bcrypt = require('bcrypt');
require('dotenv').config();
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

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
            
            const userId = account.Items[0].idUser;
            
            // Truy vấn dữ liệu người dùng từ bảng user bằng ID người dùng
            const userParams = {
              TableName: userTable, // Tên của bảng user
              Key: {
                idUser: userId
              }
            };
    
            const userData = await dynamodb.get(userParams).promise();
            console.log(userData.Item.refreshToken)
            // if(userData.Item.refreshToken) {
            //   return res.status(401).json({ success: false, message: "Tài khoản đang đăng nhập ở nơi khác" });
            // }
            const tokens = generateTokens(userData.Item)
            updateRefreshToken(userData.Item.idUser, tokens.refreshToken)
            console.log(tokens.accessToken, tokens.refreshToken)
                       
            return res.status(200).json({ success: true, message: "Đăng nhập thành công", token: tokens, user: userData.Item});
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
    const { phone, pass, name,gender } = req.body;
    console.log(phone, pass, name, gender)
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
            name: name,
            address: 'Chưa cập nhật',
            gender: gender,
            avatar : gender == '0' ? 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/amafsgal21le2xhy4jgy.jpg' : 'https://res.cloudinary.com/dkwb3ddwa/image/upload/v1710070408/avataDefaultSeCom/jfvpv2c7etp65u8ssaff.jpg',
            refreshToken: ''
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
          return res.status(200).json({ success: true, message: "Create account success" });
        }
      }catch (error) {
        console.log("Error", error);
        return res.status(500).json({ "Iteration failed": error.message });
      }
}

// //get all accounts
// const getAllAccounts = async (req, res) => {
//     try {
//         const params = { TableName:tableName};
//         const account = await dynamodb.scan(params).promise();
//         // console.log(account.Items);
//         // const result = await comparePassword('abc', '$2b$10$st3iDHhk5TUSsfKH2tGWy.hQ2tBlONOKrH.EXFq7bOcnjuuQvVhV2');
//         // console.log(result);      
//         return res.render('createAccount');
//     } catch (error) {
//         console.log("Error", error);
//         return res.status(500).json({ "Iteration failed": error });
//     }
// }
const generateTokens = payload => {
	const { idUser, name } = payload
  console.log(idUser);
  console.log(name);

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

    // Kiểm tra xem mục có tồn tại không
    if (!user.Item) {
      console.error('User not found');
      return null; // Hoặc thực hiện xử lý lỗi khác tùy vào yêu cầu của bạn
    }

    // Cập nhật refreshToken trong dữ liệu của mục
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
	if (!user||user.Item.refreshToken!=refreshToken) return res.status(500).json({ "Failed": "Refresh token not found"});

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