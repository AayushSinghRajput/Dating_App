# Google Play Console: Data Safety Questionnaire Guide
**App Name:** Soulmate  
**Package Name:** `com.aayushsinghrajput.soulmate`  
**Target Audience:** 18+ (Mature Dating & Matchmaking)  
**Verification Status:** Verified for Play Store Policy & Compliance (2026)

---

## Quick Navigation in Google Play Console
1. Open [Google Play Console](https://play.google.com/console)
2. Select your app: **Soulmate**
3. In the left navigation menu, scroll down to **Policy and programs** ➔ **App content**
4. Under **Data safety**, click **Start** (or **Manage**)

---

## 1. Overview Questions

| Question | Your Answer | Details / Justification |
| :--- | :---: | :--- |
| **Does your app collect or share any of the required user data types?** | **Yes** | Soulmate collects account information, profile photos, location for matching, and messages. |
| **Is all of the user data collected by your app encrypted in transit?** | **Yes** | All data in transit uses modern cryptographic protocols: HTTPS / TLS 1.3 for API endpoints and WSS (secure WebSockets) for real-time messaging and WebRTC signaling. |
| **Do you provide a way for users to request that their data be deleted?** | **Yes** | Users can delete their data in-app (Settings ➔ Delete Account) or via web URL. |
| **Add a link that users can use to request that their account and associated data be deleted:** | `https://soulmate-backend-f1xn.onrender.com/delete-account` | Verified web form accessible to all users even without the app installed. |
| **Does your app allow users to delete their account from within the app?** | **Yes** | Accessible in: `Settings ➔ Delete Account`. Typing `DELETE` permanently wipes account and assets. |
| **Do you retain any data after account deletion?** | **No** | All user data, media, matches, and messages are permanently purged within 24–48 hours. |

---

## 2. Data Types Selection

Check the boxes for the following categories and data types:

- [x] **Location**
  - [x] Approximate location
  - [x] Precise location
- [x] **Personal info**
  - [x] Name
  - [x] Email address
  - [x] User IDs
  - [x] Date of birth
  - [x] Other info (Gender, dating preferences, relationship goals, lifestyle attributes)
- [x] **Messages**
  - [x] Other in-app messages (Private chat messages between matched users)
- [x] **Photos and videos**
  - [x] Photos (Profile gallery photos and selfie verification image)
- [x] **Audio files**
  - [x] Voice or sound recordings (Voice intro/notes and peer-to-peer voice calling)
- [x] **App info and performance**
  - [x] Crash logs
  - [x] Diagnostics
- [x] **Device or other IDs**
  - [x] Device or other IDs (Expo Push Notification token and persistent device identifier)

---

## 3. Data Usage and Handling (Detailed Per Category)

When Google Play Console asks detailed questions for each checked data type, use the exact answers below:

---

### A. Location

#### 1. Approximate location
- **Collected or Shared?** ➔ **Collected** (NOT shared with third parties)
- **Is this data processed ephemerally?** ➔ **No** (stored to compute distance radius with potential matches)
- **Is this data required or optional?** ➔ **Required** (core functionality to calculate match proximity)
- **Why is this data collected?**
  - [x] **App functionality** (Shows approximate distance in km to matches)
  - [x] **Personalization** (Filters match recommendations based on discovery distance settings)

#### 2. Precise location
- **Collected or Shared?** ➔ **Collected** (NOT shared with third parties)
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Optional / User can choose** (Users grant GPS permission; fallback to approximate/city location is supported)
- **Why is this data collected?**
  - [x] **App functionality** (Accurate nearby partner recommendations and 24/7 Safety SOS live location sharing with emergency contacts)
  - [x] **Fraud prevention, security, and compliance** (Detects suspicious login locations and multi-account bot spoofing)

---

### B. Personal Info

#### 1. Name
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Displayed on dating profile cards and chat screens)
  - [x] **Account management** (Identifies user account)

#### 2. Email address
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Account login, password reset, account recovery)
  - [x] **Account management** (User authentication and account verification)
  - [x] **Fraud prevention, security, and compliance** (Account integrity, preventing spam registrations)

#### 3. User IDs (Account Identifier)
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Maps likes, matches, and chats to database entities)
  - [x] **Account management** (Unique internal identifier)

#### 4. Date of birth
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Calculates and displays age on user profiles)
  - [x] **Fraud prevention, security, and compliance** (Mandatory 18+ strict age gating for dating compliance)

#### 5. Other info (Gender, Sexual Orientation, Lifestyle/Dating Intent)
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Matching preferences, recommendation feed generation)
  - [x] **Personalization** (Filters discovery by interested gender and dating intentions)

---

### C. Messages

#### 1. Other in-app messages
- **Collected or Shared?** ➔ **Collected** (Never shared with third parties or data brokers)
- **Is this data processed ephemerally?** ➔ **No** (Stored in database so matched users can read chat history)
- **Is this data required or optional?** ➔ **Optional / User can choose** (Users send messages voluntarily once matched)
- **Why is this data collected?**
  - [x] **App functionality** (Direct messaging between matched users)
  - [x] **Fraud prevention, security, and compliance** (User safety reporting and harassment prevention)

---

### D. Photos and Videos

#### 1. Photos
- **Collected or Shared?** ➔ **Collected** (Stored securely in Cloudinary CDN; NOT shared with 3rd party advertisers)
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required** (At least one profile photo required to create an active profile)
- **Why is this data collected?**
  - [x] **App functionality** (Profile presentation to other users)
  - [x] **Fraud prevention, security, and compliance** (Selfie verification for Blue Trust Badges to detect catfishing and bots)

---

### E. Audio Files

#### 1. Voice or sound recordings
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **Yes for real-time VoIP audio calls; Stored for user-recorded voice notes**
- **Is this data required or optional?** ➔ **Optional / User can choose** (Microphone permission requested only when recording voice notes or initiating/accepting calls)
- **Why is this data collected?**
  - [x] **App functionality** (Real-time WebRTC audio calling and recorded voice note messages in chat)

---

### F. App Info and Performance

#### 1. Crash logs & Diagnostics
- **Collected or Shared?** ➔ **Collected**
- **Is this data processed ephemerally?** ➔ **No** (Stored in error logs for diagnostic triage)
- **Is this data required or optional?** ➔ **Required** (Built-in stability monitoring)
- **Why is this data collected?**
  - [x] **Analytics** (Tracking crash rates, app performance across Android devices)
  - [x] **App functionality** (Bug fixing and reliability enhancements)

---

### G. Device or Other IDs

#### 1. Device or other IDs
- **Collected or Shared?** ➔ **Collected** (Expo Push Notification Token & Device Hardware Identifier)
- **Is this data processed ephemerally?** ➔ **No**
- **Is this data required or optional?** ➔ **Required**
- **Why is this data collected?**
  - [x] **App functionality** (Delivering push notifications for new matches, incoming messages, and VoIP call alerts)
  - [x] **Fraud prevention, security, and compliance** (Device fingerprinting to block banned devices and repeat offenders)

---

## 4. Summary Table for Review

| Category | Data Item | Collected? | Shared? | Ephemeral? | Purpose |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Location** | Approximate Location | Yes | No | No | App Functionality, Personalization |
| **Location** | Precise Location | Yes | No | No | App Functionality, Safety SOS, Fraud Prevention |
| **Personal Info** | Name | Yes | No | No | App Functionality, Account Management |
| **Personal Info** | Email Address | Yes | No | No | App Functionality, Account Management, Security |
| **Personal Info** | User IDs | Yes | No | No | App Functionality, Account Management |
| **Personal Info** | Date of Birth | Yes | No | No | App Functionality, 18+ Age Verification |
| **Personal Info** | Gender & Preferences | Yes | No | No | App Functionality, Personalization |
| **Messages** | In-app Messages | Yes | No | No | App Functionality, Safety & Moderation |
| **Photos/Videos**| Photos | Yes | No | No | App Functionality, Photo Verification Badge |
| **Audio** | Voice recordings / Calls | Yes | No | Mixed | App Functionality (Voice Notes & VoIP Calls) |
| **App Info** | Crash logs & Diagnostics | Yes | No | No | Analytics, App Functionality |
| **Device IDs** | Push token / Device ID | Yes | No | No | Push Notifications, VoIP Alerts, Fraud Prevention |

---

## 5. Security & Deletion Declaration Summary
- **Data Encryption**: All data is encrypted in transit over HTTPS/TLS and secure WebSockets (WSS).
- **Data Sharing**: Zero user data is sold to data brokers or shared with third-party advertising networks.
- **Account Deletion Link**: `https://soulmate-backend-f1xn.onrender.com/delete-account`
- **In-App Deletion**: Built-in at `Settings ➔ Delete Account`.
