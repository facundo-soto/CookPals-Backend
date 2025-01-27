import express from "express";
const router = express.Router();
import { upload } from "../config/multer.js";
import { updateUsername, uploadImage } from "../controllers/profileController.js";

router.post("/update-username", updateUsername);
router.post("/upload-image", upload.single("image"), uploadImage);

export default router;