import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profileImages",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "voiceMessages",
    resource_type: "video", // Cloudinary stores audio under the "video" resource type
    allowed_formats: ["m4a", "mp3", "aac", "wav", "3gp", "caf"],
  },
});

export const uploadAudio = multer({ storage: audioStorage });

export default upload;
