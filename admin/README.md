# Soulmate Admin Console

A production-grade, standalone administrative web application built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS** for managing the Soulmate Dating App.

---

## 🛠 Features & Capabilities

* **Dashboard (`/`)**: 30-day conversion funnel metrics (impressions, like rate, match rate, reply rate, sustained chats), DAU/WAU, total daters, and 7-day retention.
* **Users & Profiles (`/users`)**: Search dater accounts by username or email, view full profile information and photos, remove offending pictures, and ban/unban users with reason logging.
* **Photo Verification Desk (`/verifications`)**: Side-by-side comparison of user-submitted live pose selfies against profile pictures with 1-click **"Approve Blue Badge"** or **"Reject Selfie"**.
* **Reports & Moderation (`/reports`)**: Community safety desk to investigate user harassment, catfishing, or terms of service violations.
* **Finances & Plans (`/transactions`)**: Complete transaction ledger for Nepali payment gateways (**eSewa** and **Khalti**), tracking realized GMV in NPR and subscription states.
* **Push Broadcasts (`/broadcasts`)**: Segmented push notification campaigns (All users, Unverified, Inactive for 7+ days, or Premium) with a live mobile lock screen preview.
* **Algorithm & Weights (`/algorithm`)**: Transparency into candidate recommendation weights, exploration/diversity ratios, and a **Match Explainer Simulator** between any two user IDs.
* **System Health (`/health`)**: Real-time heartbeat monitoring for Node.js runtime, V8 heap usage, MongoDB cluster connectivity, and live Socket.IO connection counts.
* **Audit Trail (`/audit-logs`)**: Immutable administrative event log capturing every moderation action, target, IP address, and timestamp.

---

## 🚀 Getting Started

### 1. Setting Up an Admin Account

**Option A: Create a brand new admin account**
```bash
# If running via Docker:
docker exec -it datingapp-backend node scripts/createAdmin.js admin@soulmate.com yourPassword adminUser

# Or directly in backend/ directory:
cd backend
node scripts/createAdmin.js admin@soulmate.com yourPassword adminUser
```

**Option B: Grant admin access to an existing user**
```bash
# List all existing users and see current admins:
docker exec -it datingapp-backend node scripts/setAdmin.js

# Promote an existing account:
docker exec -it datingapp-backend node scripts/setAdmin.js your_email@example.com
```

### 2. Running Locally
Ensure the Soulmate backend is running on `http://localhost:5000`:

```bash
# In the admin/ directory
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in using your admin credentials.

---

## 🔒 Security
All API requests are protected by JWT Bearer tokens authenticated against `http://localhost:5000/api/admin/*` and guarded by `protect` and `protectAdmin` middleware.
