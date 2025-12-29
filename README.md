# Team Collaboration Platform

A production-ready full-stack team collaboration platform built with React, Node.js, MongoDB, and Firebase Authentication.

## 🚀 Features

- **Authentication**: Firebase Authentication with role-based access control
- **Team Management**: Create and manage teams with member invitations
- **Project Management**: Create, update, and delete projects (role-based permissions)
- **Task Management**: Kanban-style task board with drag-and-drop functionality
- **Real-time Chat**: Live messaging with Socket.io
- **Dashboard**: Comprehensive overview with statistics and activity logs
- **Role System**: Admin, Manager, and Member roles with different permissions

## 🛠 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Firebase project with Authentication enabled

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd team-collaboration-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Configure your `.env` file with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FRONTEND_URL=http://localhost:3000
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm start
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
4. Generate Service Account Key:
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Extract the required fields for your backend `.env` file
5. Get Web App Config:
   - Go to Project Settings > General
   - Add a web app if you haven't already
   - Copy the config values to your frontend `.env` file

## 🌐 Production Deployment

### Recommended Stack
- **Frontend**: Vercel or Netlify
- **Backend**: Render or Railway
- **Database**: MongoDB Atlas

### Environment Setup

**Backend Production Variables:**
```env
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend Production Variables:**
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
team-collaboration-platform/
├── backend/
│   ├── config/          # Database and Firebase configuration
│   ├── controllers/     # Business logic controllers
│   ├── middleware/      # Authentication and validation middleware
│   ├── models/          # MongoDB models (User, Project, Task, Message, etc.)
│   ├── routes/          # API routes
│   ├── services/        # Business services (activity logging, etc.)
│   ├── utils/           # Utility functions and validation schemas
│   ├── .env.example     # Environment variables template
│   ├── package.json     # Backend dependencies
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── context/     # React Context for state management
│   │   ├── pages/       # Main application pages
│   │   └── services/    # API and Firebase services
│   ├── public/          # Static assets
│   ├── .env.example     # Environment variables template
│   └── package.json     # Frontend dependencies
├── scripts/             # Deployment scripts
├── .gitignore          # Git ignore rules
├── DEPLOYMENT.md       # Deployment instructions
├── PRODUCTION_CHECKLIST.md # Production readiness checklist
└── README.md           # This file
```

## 🔐 Role-Based Access Control

### User Roles
- **Admin**: Full system access, can manage all projects and users
- **Manager**: Can create, update, and delete projects; assign tasks
- **Member**: Can view projects and update assigned tasks

### Permissions Matrix
| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| Create Project | ✅ | ✅ | ❌ |
| Update Project | ✅ | ✅ | ❌ |
| Delete Project | ✅ | ✅ | ❌ |
| Create Task | ✅ | ✅ | ✅ |
| Update Task | ✅ | ✅ | ✅* |
| Delete Task | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

*Members can only update tasks assigned to them

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/login user with role selection
- `GET /api/auth/user` - Get current authenticated user

### Projects (Role-protected)
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (Admin/Manager only)
- `PUT /api/projects/:id` - Update project (Admin/Manager only)
- `DELETE /api/projects/:id` - Delete project (Admin/Manager only)

### Tasks
- `GET /api/tasks` - Get tasks (filtered by project)
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Admin/Manager only)

### Messages (Real-time)
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send message
- Socket events: `message`, `user_joined`, `user_left`

### Users & Team
- `GET /api/users/team` - Get team members
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `POST /api/invitations` - Send team invitation
- `GET /api/invitations` - Get pending invitations

### Activity Logs
- `GET /api/activities` - Get activity logs
- Auto-generated for: project creation, task updates, user actions

## 🛡️ Security Features

- **Firebase Authentication**: Secure JWT token-based authentication
- **Role-based Authorization**: Middleware protection for sensitive endpoints
- **Input Validation**: Joi schema validation for all API inputs
- **CORS Protection**: Configured for production domains
- **Environment Variables**: All sensitive data in environment files
- **No Hardcoded Credentials**: All secrets externalized
- **MongoDB Security**: Connection string with authentication
- **Firebase Admin SDK**: Server-side token verification

## 🧪 Technologies Used

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.io
- **Validation**: Joi
- **Security**: CORS, Helmet

### Frontend Stack
- **Framework**: React with React Router
- **Styling**: Bootstrap 5
- **HTTP Client**: Axios
- **Authentication**: Firebase SDK
- **Real-time**: Socket.io Client
- **Drag & Drop**: React Beautiful DnD

## 🚀 Development Workflow

### Local Development
1. Start MongoDB (local or use Atlas connection)
2. Start backend: `cd backend && npm start`
3. Start frontend: `cd frontend && npm start`
4. Access application at `http://localhost:3000`

### Production Build
```bash
# Backend (no build step needed)
cd backend
npm install --production

# Frontend
cd frontend
npm run build
```

## 📋 Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Firebase project set up with authentication
- [ ] MongoDB Atlas cluster created and configured
- [ ] CORS settings updated for production domains
- [ ] SSL certificates configured
- [ ] Domain names configured
- [ ] Monitoring and logging set up

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for complete checklist.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [DEPLOYMENT.md](DEPLOYMENT.md) for deployment-specific issues
2. Verify all environment variables are correctly set
3. Check Firebase console for authentication issues
4. Ensure MongoDB connection is working
5. Check browser console for frontend errors
6. Check server logs for backend errors

## 🔄 Version History

- **v1.0.0**: Initial production release
  - Firebase authentication
  - Role-based access control
  - Project and task management
  - Real-time chat
  - Kanban board with drag-and-drop
  - Activity logging
  - Production-ready deployment configurations