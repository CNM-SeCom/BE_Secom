const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
	const authHeader = req.header('Authorization')
	
	const token = authHeader && authHeader.split(' ')[1]
	console.log("auth:"+token)


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

module.exports = verifyToken