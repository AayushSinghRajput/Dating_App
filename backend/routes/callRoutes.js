import express from "express";
import {
  getIceServers,
  getCallOfferHttp,
  answerCallHttp,
  rejectCallHttp,
  endCallHttp,
} from "../controllers/callController.js";

const router = express.Router();

router.get("/ice-servers", getIceServers);
router.get("/:callId/offer", getCallOfferHttp);
router.post("/answer", answerCallHttp);
router.post("/reject", rejectCallHttp);
router.post("/end", endCallHttp);

export default router;
