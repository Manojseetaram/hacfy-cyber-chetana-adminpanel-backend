import express from "express";
import mongoose from "mongoose";
import authRoutes from './routes/auth';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

mongoose.connect("mongodb://localhost:27017/paytm")
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
