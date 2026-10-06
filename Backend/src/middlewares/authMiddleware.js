import jwt from "jsonwebtoken";
import httpStatus from "http-status";

export const authMiddleware = (req, res, next) => {
    try {
        let token = null;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        } else if (req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Access denied. No authentication token provided." });
        }

        const secret = process.env.JWT_SECRET || "nexameet_super_secret_jwt_key_2026";
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token." });
    }
};
