const jwt = require("jsonwebtoken");
function authMiddleware(req, res, next) {
    try {
        console.log("INside auth")
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        console.log("auth success")
        next();
    } catch (err) {
        next(err);
    }
};

exports.authMiddleware = authMiddleware;