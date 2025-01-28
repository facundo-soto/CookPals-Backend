import dotenv from 'dotenv';
dotenv.config();

export const {
    PORT = 0,
    IMGUR_CLIENT_ID = "",
    FIREBASE_CONFIG = "{}",
    FRONTEND_URL = ""
} = process.env;