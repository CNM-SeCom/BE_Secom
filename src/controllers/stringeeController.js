const apiKeySid = 'SK.0.udqlM9kUXlLioaJpdqQnm9yTuOuFYMy';
const apiKeySecret = 'TTAzeTBaYU9ZdEVMM1ZaR0hya0NKSjY1bEE4QlVkb0s=';




function getCallAccessToken(req, res) {
	var now = Math.floor(Date.now() / 1000);
	var exp = now + 3600*12*30;

	var header = {cty: "stringee-api;v=1"};
	var payload = {
		jti: apiKeySid + "-" + now,
		iss: apiKeySid,
		exp: exp,
		userId: "user"+req.body.userId	};

	var jwt = require('jsonwebtoken');
    console.log("ahihi:  "+payload.userId)
	var token = jwt.sign(payload, apiKeySecret, {algorithm: 'HS256', header: header})
	return res.status(200).json({ success: true, message: "Get call access token successfully", data: token });
}
module.exports = {
    getCallAccessToken
}