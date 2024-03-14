const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://secom-8cd0d-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

// Function to send OTP to phone number
function sendOTP(phoneNumber) {
  const auth = admin.auth();
  const phoneNumberWithCountryCode = '+84' + phoneNumber; // Example: '+84123456789'
  return auth
    .getUserByPhoneNumber(phoneNumberWithCountryCode)
    .then(userRecord => {
      console.log("User exists:", userRecord.toJSON());
      // Implement code to send OTP via SMS to phoneNumberWithCountryCode
    })
    .catch(error => {
      console.error('Error sending OTP:', error);
    });
}

const sendSMS = async (req, res) => {
  const { phone } = req.body.phone;
  sendOTP(phone);
  return res.status(200).json({ success: true, message: "OTP sent successfully" });
}
module.exports = { sendSMS };
