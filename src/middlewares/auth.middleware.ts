import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const userJwtVerify = (req:any, res:any, next:any) => {
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token,JWT_SECRET);
        if(decoded){
            req.userId = decoded.indexOf;
            next()
        }else{
            res.status(403).json({
                message:"You are not signed in"
            })
        }
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};



exports={userJwtVerify}
