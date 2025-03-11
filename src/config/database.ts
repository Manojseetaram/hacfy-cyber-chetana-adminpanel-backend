import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },

  
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
});

export const UserModel = mongoose.model("User", UserSchema);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/paytm";

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    } as any) 
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error(" MongoDB connection error:", err);
        process.exit(1);
    });

export default mongoose; 
