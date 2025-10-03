# Sortyx Smart Bin - Standalone Setup Guide

This guide will help you set up the Sortyx Smart Bin application with your own backend and database.

## 🚀 Quick Start

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Base44 Configuration (for standalone use, keep these as localhost)
VITE_BASE44_APP_ID=your_app_id_here
VITE_BASE44_API_URL=http://localhost:3001/api
VITE_BASE44_AUTH_URL=http://localhost:3001/auth

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/sortyx_db
# or for SQLite: sqlite:./database.sqlite
# or for MySQL: mysql://username:password@localhost:3306/sortyx_db

JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### 3. Run the Application

**Start Backend (in one terminal):**
```bash
cd backend
npm run dev
```

**Start Frontend (in another terminal):**
```bash
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 5. Default Login Credentials

```
Email: admin@sortyx.com
Password: admin123
```

## 🔧 Configuration Options

### Switching Between Base44 and Custom Backend

In `src/api/entities.js`, you can switch between:

```javascript
// For standalone use with your own backend
import { customBase44 } from './customClient';
const client = customBase44;

// For Base44 service (comment out the above and uncomment below)
// import { base44 } from './base44Client';
// const client = base44;
```

### Database Setup

The current setup uses in-memory storage. To connect to a real database:

1. **Install database drivers** (choose one):
   ```bash
   cd backend
   npm install pg          # PostgreSQL
   npm install mysql2      # MySQL
   npm install sqlite3     # SQLite
   ```

2. **Update `backend/server.js`** to use your database instead of in-memory arrays.

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update user data

### SmartBins
- `GET /api/smartbins` - List user's SmartBins
- `POST /api/smartbins` - Create new SmartBin

### Compartments
- `GET /api/compartments` - List compartments
- `POST /api/compartments` - Create new compartment

### SingleBins
- `GET /api/singlebins` - List user's SingleBins
- `POST /api/singlebins` - Create new SingleBin

### Alerts
- `GET /api/alerts` - List alerts

### Subscription Plans
- `GET /api/subscription-plans` - List available plans

## 🛠️ Development

### Adding New Features

1. **Backend**: Add routes in `backend/server.js`
2. **Frontend**: Update API client in `src/api/customClient.js`
3. **UI**: Create/update components in `src/components/` or `src/pages/`

### Database Integration

To integrate with your own database, replace the in-memory arrays in `backend/server.js` with database queries using your preferred ORM (Sequelize, TypeORM, Prisma, etc.).

## 🔐 Security

- Change the default JWT_SECRET in production
- Implement proper password hashing
- Add input validation
- Set up HTTPS
- Configure CORS properly

## 📱 Features

- **Dashboard**: Real-time monitoring of smart bins
- **SmartBins**: Multi-compartment waste management
- **SingleBins**: Individual bin monitoring  
- **Alerts**: Critical notifications system
- **User Management**: Authentication and profiles
- **Responsive Design**: Works on all devices

## 🆘 Troubleshooting

### Common Issues

1. **500 Server Error**: Make sure the backend is running on port 3001
2. **Authentication Failed**: Check if JWT_SECRET matches between frontend and backend
3. **CORS Issues**: Ensure CORS is properly configured in backend
4. **Port Conflicts**: Change ports in `.env` if needed

### Logs

- **Backend logs**: Check the terminal running the backend server
- **Frontend logs**: Open browser DevTools → Console
- **Network issues**: Check browser DevTools → Network tab

## 🤝 Support

For help with setup or development:
- Check the browser console for errors
- Verify backend is running and accessible
- Ensure environment variables are set correctly

---

**Happy coding! 🚀**