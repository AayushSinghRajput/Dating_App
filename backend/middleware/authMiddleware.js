import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { checkDeviceBlacklist } from "../utils/deviceCheck.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      if (req.user.banned) {
        return res.status(403).json({ message: "Your account has been suspended.", banned: true });
      }
      if (req.user.frozen) {
        return res.status(403).json({
          message: req.user.frozenReason || "Your account has been temporarily frozen by an administrator.",
          frozen: true,
        });
      }

      // Enforce device & network bans
      const blacklisted = await checkDeviceBlacklist(req);
      if (blacklisted) {
        return res.status(403).json({
          message: `Access denied. This device has been suspended (${blacklisted.reason || "Policy violation"}).`,
          banned: true,
        });
      }

      next();
    } catch (error) {
        console.log("Middleware Error:",error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
