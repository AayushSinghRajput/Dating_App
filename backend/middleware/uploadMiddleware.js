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
    // Cloudinary matches this against the format it detects from the file's
    // actual content, not the client's filename extension — .m4a recordings
    // are MP4 containers under the hood, so Cloudinary reports them as "mp4".
    allowed_formats: ["m4a", "mp4", "mp3", "aac", "wav", "3gp", "caf"],
  },
});

export const uploadAudio = multer({ storage: audioStorage });

export default upload;
