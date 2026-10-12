import crypto from "crypto";

const secret = crypto.randomBytes(64).toString("hex");

console.log("\n========================================================");
console.log(" Generated Cryptographically Secure JWT Secret (512-bit):");
console.log("========================================================");
console.log(`\nJWT_SECRET=${secret}\n`);
console.log("Copy and paste this into:");
console.log("1. Your production deployment environment (e.g. Render Dashboard -> Environment)");
console.log("2. Your local backend/.env (if updating local dev secret)\n");
