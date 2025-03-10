"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
mongoose_1.default.connect("mongodb://localhost:27017/paytm")
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
