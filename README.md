# Soulmate Dating App

Soulmate is a full-stack mobile dating application built with React Native (Expo) on the frontend and Node.js/Express on the backend. It supports user authentication, profile creation, profile discovery, favorites, matching, and real-time chat.

The app is designed as a modern social/dating experience with a polished mobile UI and backend services for users, profiles, and messaging.

## Overview

This repository contains two main parts:

- Frontend: Expo + React Native app for mobile users
- Backend: Express + MongoDB API with JWT auth, Cloudinary image uploads, and Socket.IO chat support

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Token storage in the app and authorization on protected routes

### Profile Management
- Create and update profile details
- Upload profile images
- Store profile data such as:
  - name
  - age
  - gender
  - interested in
  - location
  - hobbies
  - education
  - profession
  - relationship goals
  - bio/about me

### Discovery and Interaction
- Browse other user profiles
- Like profiles
- Pass profiles
- View mutual matches
- Save favorites

### Messaging
- Create or join chat conversations
- Send and receive messages
- Real-time message updates through Socket.IO
- Chat history retrieval from the backend

### Settings and Account Screens
- Edit profile
- Privacy-related screens
- Notifications
- Payment/subscription screens
- Blocked users
- Help and support
- Logout flow

## Tech Stack

### Frontend
- React Native
- Expo
- Expo Router
- TypeScript
- Async Storage
- Socket.IO Client
- Expo Image Picker
- Expo Linear Gradient
- React Native Toast

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image uploads
- Multer and multer-storage-cloudinary
- Socket.IO

## Project Structure

```text
backend/
  config/           # Database and Cloudinary configuration
  controllers/      # Auth, profile, chat, and match logic
  middleware/       # Auth and upload middleware
  models/           # Mongoose schemas
  routes/           # API route definitions
  utils/            # Socket and token helpers
  server.js         # Main backend server entry point

frontend/
  app/              # Expo Router screens and tab layouts
  assets/           # Static assets and demo data
  src/components/    # Reusable UI components
  utils/            # API and socket client helpers
  app.json          # Expo config
  package.json      # Frontend dependencies and scripts
```

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm installed
- MongoDB running or a MongoDB Atlas URI
- A Cloudinary account for image uploads
- Expo CLI (or use the Expo app on your device)

## Environment Variables

### Backend
Create a `.env` file in the backend folder with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend
Create a `.env` file in the frontend folder with:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

If you are testing from a physical device or emulator, replace `localhost` with your machine’s local IP address.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/AayushSinghRajput/Dating_App.git
cd Dating_App
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the backend

```bash
cd backend
npm run dev
```

This will start the Express server on the port defined in your `.env` file (default: 5000).

### Start the frontend

```bash
cd frontend
npm start
```

Then launch the app using:
- an emulator/simulator
- Expo Go on your phone
- a web browser if supported

## API Overview

The backend exposes the following main API groups:

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

### Profiles
- `POST /api/profile/create`
- `GET /api/profile/me`
- `GET /api/profile/allprofiles`
- `GET /api/profile/favorites`
- `POST /api/profile/:targetUserId/favorite`

### Chats
- `GET /api/chats`
- `POST /api/chats`
- `POST /api/chats/message`
- `GET /api/chats/:chatId/messages`

### Matches
- `POST /api/match/like`
- `POST /api/match/pass`
- `GET /api/match/matches`

## App Flow

A typical user journey in the app:

1. Register or log in
2. Complete profile onboarding with personal details and profile photo
3. Browse suggested profiles
4. Like or pass profiles
5. View matches and start chatting
6. Manage account settings and preferences

## Notes

- The app uses Cloudinary for profile image uploads, so image hosting must be configured.
- The chat feature depends on a working Socket.IO connection and correct API URL configuration.
- For mobile testing, use the LAN IP instead of `localhost` if the frontend is running on a physical device.
- Some screens and UI components are still being expanded, but the main core functionality is implemented.

## License

This project currently declares the ISC license in the backend package metadata.
