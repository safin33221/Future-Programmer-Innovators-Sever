import multer from "multer";
import fs from "fs/promises";
import path from "path";
import cloudinary from "../config/cloudinary.js";


const uploadDir = path.join(process.cwd(), "uploads");

/* ensure upload dir exists */
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

/* file validation */
const fileFilter: multer.Options["fileFilter"] = (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Only image files are allowed"));
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
});

export const uploadToCloudinary = async (
    file: Express.Multer.File,
    folder = "profiles"
) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder,
            resource_type: "image",
        });

        await fs.unlink(file.path); // delete AFTER upload

        return result;
    } catch (error) {
        await fs.unlink(file.path).catch(() => { });
        throw error;
    }
};


export const fileUploader = {
    upload,
    uploadToCloudinary,
};
