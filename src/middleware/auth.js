const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
	const authHeader = req.header('Authorization')
	
	const token = authHeader && authHeader.split(' ')[1]

	if (!token) return res.sendStatus(401).json({ "Failed": "Token not found" });

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
		req.idUser = decoded.idUser
		next()
	} catch (error) {
		console.log(error)
		return res.sendStatus(403).json({ "Failed": "Token not valid" });
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

module.exports = verifyToken