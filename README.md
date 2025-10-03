# Sortyx Smart Bin - Standalone Application

A complete waste management system with real-time monitoring, smart bins, and comprehensive analytics. This is a fully standalone application with its own backend - no external dependencies.

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

### 2. Start the Application

**Backend (Terminal 1):**
```bash
cd backend
npm start
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5174/ (or the port shown in terminal)
- **Backend API**: http://localhost:3001
- **Default Login**: admin@sortyx.com / admin123

## 📊 Features

- **Real-time Dashboard**: Monitor all smart bins and alerts
- **SmartBin Management**: Multi-compartment waste monitoring
- **SingleBin Monitoring**: Individual bin tracking
- **Alert System**: Critical notifications and warnings
- **User Management**: Authentication and user profiles
- **Responsive Design**: Works on all devices
- **Drag & Drop**: Reorder your smart bins on dashboard

## 🛠️ Technology Stack

- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express
- **Authentication**: JWT tokens
- **Database**: In-memory (easily replaceable with PostgreSQL, MySQL, etc.)

## 🔧 Configuration

Edit `.env` file to customize:
```env
VITE_API_URL=http://localhost:3001
VITE_AUTH_URL=http://localhost:3001/auth
DATABASE_URL=your_database_connection_here
JWT_SECRET=your-secret-key
```

## 📱 Usage

1. **Login** with admin@sortyx.com / admin123
2. **Add SmartBins** to monitor multi-compartment waste systems
3. **Add SingleBins** for individual bin monitoring
4. **View Alerts** for critical notifications
5. **Manage Users** and system settings

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- CORS enabled
- Input validation

For more detailed setup instructions, see `SETUP.md`