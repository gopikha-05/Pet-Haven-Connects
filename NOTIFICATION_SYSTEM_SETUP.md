# Notification System - Complete Setup Guide

## Overview

This document provides complete instructions for setting up the notification system for PetHaven Connect. The notification system has been completely rebuilt with a real backend, Socket.io for real-time delivery, and role-based notification routing.

## What Was Fixed

### Before (Issues Found)
- **No Backend Server**: Project was frontend-only with mock data
- **No Real-time Communication**: No Socket.io or WebSocket implementation
- **No Database**: No notification storage schema
- **No API Endpoints**: Frontend called mock services only
- **No Role-based Routing**: No logic to deliver notifications to specific users
- **No Socket Client**: Frontend had no WebSocket connection

### After (Complete Solution)
- **Full Backend Server**: Express.js server with Socket.io
- **Real-time Notifications**: Socket.io for instant delivery
- **MongoDB Database**: Complete notification schema with indexes
- **REST API Endpoints**: Full CRUD operations for notifications
- **Role-based Delivery**: Service to route notifications by user role
- **Socket Client Integration**: Frontend connects to real-time socket server
- **Notification Badge**: Live unread count in navbar
- **Mark as Read/Delete**: Full notification management

## Architecture

### Backend Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User model with socketId
│   └── Notification.js      # Notification model with indexes
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   └── notificationRoutes.js # Notification endpoints
├── services/
│   └── notificationService.js # Core notification logic
├── controllers/
│   └── notificationController.js # HTTP request handlers
├── server.js                # Main server with Socket.io
├── package.json
├── .env
└── README.md
```

### Frontend Changes
```
src/
├── services/
│   ├── notificationService.js  # Real API calls
│   └── authService.js          # Updated to use real API
├── context/
│   └── SocketContext.jsx       # Socket.io client
├── components/layout/
│   └── Navbar.jsx              # Added notification badge
├── pages/shared/
│   └── NotificationsPage.jsx   # Real-time updates
└── main.jsx                    # Added SocketProvider
```

## Installation Steps

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB (must be running on localhost:27017)
- npm or yarn

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Backend Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pethaven
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

### Step 3: Start MongoDB

Make sure MongoDB is running:
```bash
# On Windows
net start MongoDB

# On Mac/Linux
sudo systemctl start mongod
# or
mongod
```

### Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:5000`

### Step 5: Install Frontend Dependencies

```bash
cd ..
npm install
```

This will install `socket.io-client` which was added to package.json

### Step 6: Configure Frontend Environment

The `.env` file has been created with:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 7: Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Notifications (All require JWT token)
- `GET /api/notifications` - Get all notifications for user
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/send` - Send notification (admin only)
- `POST /api/notifications/send-to-role` - Send to role (admin only)

## Socket.io Events

### Client → Server
- `register_user` - Register user's socket ID
  ```javascript
  socket.emit('register_user', userId);
  ```

### Server → Client
- `new_notification` - New notification received
  ```javascript
  socket.on('new_notification', (notification) => {
    // Handle new notification
  });
  ```

- `notification_count` - Unread count update
  ```javascript
  socket.on('notification_count', ({ count }) => {
    // Update badge
  });
  ```

## Notification Types

- `adoption` - Adoption application updates
- `vaccination` - Vaccination reminders
- `payment` - Payment confirmations
- `appointment` - Vet appointment updates
- `shelter` - Shelter-related notifications
- `complaint` - New complaint received
- `complaint_status` - Complaint status updates
- `system` - System-wide notifications

## Role-based Notification Flow

### Example: Adopter contacts Shelter
1. Adopter sends contact request via API
2. Backend creates notification for shelter:
   ```javascript
   await notificationService.createNotification({
     recipientId: shelterUserId,
     recipientRole: 'shelter',
     type: 'adoption',
     title: 'New Adoption Inquiry',
     message: 'An adopter is interested in your pet',
     data: { petId, adopterId }
   });
   ```
3. If shelter is online (has socketId), notification is sent instantly via Socket.io
4. Shelter's notification badge updates in real-time
5. Shelter can view, mark as read, or delete notifications

### Example: Shelter updates adoption status
1. Shelter updates status via API
2. Backend creates notification for adopter:
   ```javascript
   await notificationService.createNotification({
     recipientId: adopterUserId,
     recipientRole: 'adopter',
     type: 'adoption',
     title: 'Application Status Updated',
     message: 'Your application has been approved',
     data: { applicationId, status }
   });
   ```
3. Adopter receives instant notification
4. Adopter's notification badge updates

## Testing the Notification System

### 1. Test Backend Health
```bash
curl http://localhost:5000/api/health
```
Expected response: `{"status":"ok","message":"PetHaven Backend API is running"}`

### 2. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "adopter"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```
Save the `accessToken` from the response.

### 4. Test Get Notifications
```bash
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Test Send Notification (Admin)
```bash
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "USER_ID",
    "recipientRole": "adopter",
    "type": "system",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'
```

## Frontend Testing

1. Open `http://localhost:5173` in browser
2. Login with any account (or register new one)
3. Check navbar for notification badge
4. Navigate to `/notifications` page
5. Notifications should load from backend
6. Try marking as read, deleting
7. Open browser dev tools → Console to see socket connection logs
8. Send a test notification from backend API
9. Watch for real-time notification appearing

## Integration with Existing Features

To send notifications from other parts of your application:

### In any backend route/controller:
```javascript
import { getNotificationService } from './controllers/notificationController.js';

// Get the service
const notificationService = getNotificationService();

// Send notification
await notificationService.createNotification({
  recipientId: userId,
  recipientRole: userRole,
  type: 'adoption',
  title: 'Notification Title',
  message: 'Notification message',
  data: { additionalData }
});
```

### Example: When adopter applies for pet
```javascript
// In your pet adoption route
const application = await Application.create(applicationData);

// Notify shelter
await notificationService.createNotification({
  recipientId: shelterUserId,
  recipientRole: 'shelter',
  type: 'adoption',
  title: 'New Adoption Application',
  message: `${adopterName} applied for ${petName}`,
  data: { applicationId: application._id, petId }
});
```

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod`
- Check port 5000 is not in use
- Check .env file exists and has correct values

### Frontend can't connect to backend
- Check backend is running on port 5000
- Check .env has `VITE_API_URL=http://localhost:5000/api`
- Check browser console for CORS errors
- Restart frontend after changing .env

### Socket connection fails
- Check Socket.io is running on backend
- Check firewall isn't blocking WebSocket
- Check browser console for socket errors
- Verify user is authenticated before socket connects

### Notifications not appearing
- Check user has socketId in database
- Check recipientId matches actual user ID
- Check notification type is valid
- Check browser console for socket events
- Try sending notification via API endpoint directly

### MongoDB connection fails
- Check MongoDB is running
- Check MONGODB_URI in .env is correct
- Check MongoDB is on localhost:27017
- Check MongoDB authentication if enabled

## Files Changed

### Backend (New)
- `backend/package.json` - Backend dependencies
- `backend/.env` - Backend environment variables
- `backend/.gitignore` - Git ignore for backend
- `backend/server.js` - Main server with Socket.io
- `backend/config/database.js` - MongoDB connection
- `backend/middleware/auth.js` - JWT authentication
- `backend/models/User.js` - User model
- `backend/models/Notification.js` - Notification model
- `backend/routes/authRoutes.js` - Auth endpoints
- `backend/routes/notificationRoutes.js` - Notification endpoints
- `backend/services/notificationService.js` - Notification logic
- `backend/controllers/notificationController.js` - HTTP handlers
- `backend/README.md` - Backend documentation

### Frontend (Modified)
- `package.json` - Added socket.io-client
- `.env` - Added API URL
- `src/main.jsx` - Added SocketProvider
- `src/services/notificationService.js` - New real API service
- `src/services/authService.js` - Updated to use real API
- `src/services/dataService.js` - Updated to use real notification service
- `src/context/SocketContext.jsx` - New Socket.io client context
- `src/components/layout/Navbar.jsx` - Added notification badge
- `src/pages/shared/NotificationsPage.jsx` - Real-time updates

## Next Steps

1. **Install MongoDB** if not already installed
2. **Start MongoDB** service
3. **Install backend dependencies**: `cd backend && npm install`
4. **Start backend server**: `cd backend && npm run dev`
5. **Install frontend dependencies**: `npm install`
6. **Start frontend server**: `npm run dev`
7. **Test notification flow** by creating users and sending notifications

## Support

If you encounter issues:
1. Check MongoDB is running
2. Check both servers are running (backend on 5000, frontend on 5173)
3. Check browser console for errors
4. Check backend terminal for errors
5. Verify .env files are correct
6. Ensure JWT_SECRET is set in backend .env

## Security Notes

- Change `JWT_SECRET` in backend/.env to a secure random string
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation for all endpoints
- Use MongoDB authentication in production
- Implement proper error handling
- Add logging for debugging
