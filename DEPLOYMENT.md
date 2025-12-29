# Deployment Guide

This guide covers deploying the Team Collaboration Platform using modern cloud services.

## Architecture Overview

- **Frontend**: Vercel or Netlify (Static hosting)
- **Backend**: Render or Railway (Node.js hosting)
- **Database**: MongoDB Atlas (Cloud database)

## Prerequisites

1. Firebase project with Authentication enabled
2. MongoDB Atlas account
3. Accounts on your chosen platforms (Vercel/Netlify, Render/Railway)

## 1. Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new project: "Team Collaboration"
3. Create a free cluster (M0 Sandbox)
4. Choose your preferred cloud provider and region
5. Create a database user with read/write permissions
6. Add your IP address to the IP Access List (or use 0.0.0.0/0 for all IPs)
7. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/teamcollab`

## 2. Backend Deployment

### Option A: Deploy to Render

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as root directory

2. **Configure Service**
   - Name: `team-collaboration-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL: `https://your-app.onrender.com`

### Option B: Deploy to Railway

1. **Connect Repository**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose the backend service

2. **Configure Service**
   - Railway will auto-detect Node.js
   - Set root directory to `backend` if needed

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**
   - Railway will automatically deploy
   - Note your backend URL: `https://your-app.railway.app`

## 3. Frontend Deployment

### Option A: Deploy to Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Configure Build Settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables**
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be available at: `https://your-app.vercel.app`

### Option B: Deploy to Netlify

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect to GitHub and select your repository
   - Set base directory to `frontend`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the same variables as listed in Vercel section above

4. **Deploy**
   - Click "Deploy site"
   - Your app will be available at: `https://your-app.netlify.app`

## 4. Post-Deployment Configuration

### Update CORS Settings

Update your backend's CORS configuration to include your frontend domain:

```javascript
// In backend/server.js
const corsOptions = {
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://your-frontend-domain.netlify.app'
  ],
  credentials: true
};
```

### Firebase Configuration

1. Go to Firebase Console → Authentication → Settings
2. Add your frontend domain to "Authorized domains"
3. Example: `your-app.vercel.app` or `your-app.netlify.app`

### Test Your Deployment

1. Visit your frontend URL
2. Try registering a new account
3. Test login functionality
4. Create a project and task
5. Send a message in chat

## 5. Environment Variables Summary

### Backend Environment Variables
```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/teamcollab
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend Environment Variables
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

## 6. Monitoring and Maintenance

### Health Checks
- Backend health: `https://your-backend.onrender.com/health`
- Monitor logs in your hosting platform dashboard

### Database Monitoring
- Monitor MongoDB Atlas metrics in the Atlas dashboard
- Set up alerts for connection issues

### Automatic Deployments
- Both platforms support automatic deployments from GitHub
- Push to main branch to trigger new deployments

## 7. Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is added to backend CORS configuration
   - Check Firebase authorized domains

2. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

3. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings

4. **Firebase Authentication**
   - Ensure Firebase project is configured correctly
   - Check service account permissions

### Getting Help

- Check platform-specific documentation
- Review application logs in hosting dashboards
- Test API endpoints directly using tools like Postman

## 8. Cost Optimization

### Free Tier Limits
- **Vercel**: 100GB bandwidth, 6000 build minutes
- **Netlify**: 100GB bandwidth, 300 build minutes
- **Render**: 750 hours/month, sleeps after 15min inactivity
- **Railway**: $5 credit/month, then usage-based
- **MongoDB Atlas**: 512MB storage, shared cluster

### Scaling Considerations
- Monitor usage and upgrade plans as needed
- Consider CDN for static assets
- Implement caching strategies
- Optimize database queries