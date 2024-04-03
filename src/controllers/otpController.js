const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');


// Khai báo thông tin của mail server để gửi email
const transporter = nodemailer.createTransport({
  service: 'gmail',
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
  auth: {
    user: 'secommunity.fit.iuh@gmail.com',
    pass: 'ozyx imoc xyto dkyv',
  },
});

// Tạo mã OTP
const generateOTP = () => {
    const secret = speakeasy.generateSecret();
    return {
      secret: secret.base32,
      otp: speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      }),
    };
  };
  const otpData = {};
// Gửi email chứa mã OTP
const sendOTP = (email, otp) => {
  const mailOptions = {
    from: 'SeCom.fit.iuh@gmail.com',
    to: email,
    subject: 'Xác thực OTP',
    html: `<p>Xin chào,<br/><br/>Mã OTP của bạn để xác thực từ ứng dụng SeCom là: <strong>${otp}</strong>.<br/><br/>Trân trọng,<br/>Đội ngũ hỗ trợ SeCom</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// Xác thực mã OTP
const verifyOTP = async (otp, secret) => {
  console.log("secret: "+ secret)
  console.log("otp: "+ otp)
 const verify = await speakeasy.totp.verify({
    secret: secret,
    token: otp,
    encoding: 'base32',
    window: 1,
  });
  console.log(verify)
  return verify;
};

// Endpoint để tạo và gửi OTP
const OTP = async (req, res) => {
    const email = req.body.email;
    const otpInfo = generateOTP();
    otpData[email] = {
      secret: otpInfo.secret,
      otp: otpInfo.otp,
    };
    sendOTP(email, otpInfo.otp);
  
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  };

// Endpoint để xác thực OTP
const verify = async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;
    // Lấy secret từ cơ sở dữ liệu
    // (Ở đây chỉ sử dụng biến đơn giản để lưu trữ, bạn có thể sử dụng cơ sở dữ liệu thực tế)
    const secret = otpData[email].secret; 
    console.log(otpData[email].otp)
    console.log(secret)
    console.log(otp)
    const isValid = await verifyOTP(otp, secret);
   
    if (isValid) {
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  };
module.exports = { OTP, verify };