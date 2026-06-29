# PetHaven Connect - Backend API

Backend server for PetHaven Connect with real-time notifications using Socket.io.

## Features

- Express.js REST API
- MongoDB database with Mongoose
- Socket.io for real-time notifications
- JWT authentication
- Role-based access control
- Notification system with role-based delivery

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pethaven
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 5000 (or the port specified in .env)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Notifications

All notification endpoints require authentication (Bearer token in Authorization header)

- `GET /api/notifications` - Get all notifications for authenticated user
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/send` - Send notification (admin only)
- `POST /api/notifications/send-to-role` - Send to all users of a role (admin only)

### Socket.io Events

#### Client to Server

- `register_user` - Register user's socket ID for targeted notifications
  ```javascript
  socket.emit('register_user', userId);
  ```

#### Server to Client

- `new_notification` - New notification received
  ```javascript
  socket.on('new_notification', (notification) => {
    // Handle new notification
  });
  ```

- `notification_count` - Unread notification count update
  ```javascript
  socket.on('notification_count', ({ count }) => {
    // Update badge count
  });
  ```

## Database Models

### User
- name: String
- email: String (unique)
- password: String (hashed)
- role: Enum (adopter, shelter, veterinarian, admin)
- licenseNumber: String (for shelter/veterinarian)
- socketId: String (for real-time notifications)
- isActive: Boolean
- createdAt: Date

### Notification
- recipientId: ObjectId (ref: User)
- recipientRole: String (adopter, shelter, veterinarian, admin)
- type: Enum (adoption, vaccination, payment, appointment, shelter, complaint, complaint_status, system)
- title: String
- message: String
- isRead: Boolean
- data: Mixed (additional data)
- createdAt: Date
- readAt: Date

## Notification Types

- `adoption` - Adoption application updates
- `vaccination` - Vaccination reminders
- `payment` - Payment confirmations
- `appointment` - Vet appointment updates
- `shelter` - Shelter-related notifications
- `complaint` - New complaint received
- `complaint_status` - Complaint status updates
- `system` - System-wide notifications

## Frontend Integration

The frontend should:

1. Connect to Socket.io server:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
```

2. Register user on connection:
```javascript
socket.emit('register_user', userId);
```

3. Listen for notifications:
```javascript
socket.on('new_notification', (notification) => {
  // Update UI with new notification
});

socket.on('notification_count', ({ count }) => {
  // Update notification badge
});
```

4. Make API calls with JWT token:
```javascript
axios.get('http://localhost:5000/api/notifications', {
  headers: { Authorization: `Bearer ${token}` }
});
```
