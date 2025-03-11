import express from "express";
import dotenv from "dotenv";
import admin from "./routes/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


app.use("/api/auth", admin);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
