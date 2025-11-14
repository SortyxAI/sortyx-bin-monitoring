const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./services/emailService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://sortyx-bin-monitoring-frontend.onrender.com',
        'https://sortyx-frontend.onrender.com',
        'https://sortyx-smart-bin.onrender.com',
        'https://your-custom-domain.com'
      ]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// In-memory data store (replace with your database)
let users = [
  {
    id: uuidv4(),
    email: 'admin@sortyx.com',
    password: bcrypt.hashSync('admin123', 10),
    full_name: 'Admin User',
    plan: 'premium',
    smartbin_order: []
  }
];

let smartBins = [];
let compartments = [];
let singleBins = [];
let alerts = [];
let subscriptionPlans = [
  {
    id: uuidv4(),
    name: 'Free',
    price: 0,
    features: ['Up to 2 SmartBins', 'Basic monitoring', 'Email alerts']
  },
  {
    id: uuidv4(),
    name: 'Premium',
    price: 29.99,
    features: ['Unlimited SmartBins', 'Real-time monitoring', 'SMS & Email alerts', 'Advanced analytics']
  }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      email: email,
      password: bcrypt.hashSync(password, 10),
      full_name: fullName || email.split('@')[0],
      plan: 'free',
      subscription_plan: 'free',
      role: 'user',
      smartbin_order: [],
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    
    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, newUser.full_name)
      .then(() => console.log('✅ Welcome email sent to:', email))
      .catch(err => console.error('❌ Failed to send welcome email:', err.message));

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      token, 
      user: userWithoutPassword,
      message: 'Registration successful! Welcome email sent.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/auth/me', authenticateToken, (req, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SmartBin routes
app.get('/api/smartbins', authenticateToken, (req, res) => {
  try {
    const userSmartBins = smartBins.filter(bin => bin.created_by === req.user.email);
    res.json(userSmartBins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/smartbins', authenticateToken, (req, res) => {
  try {
    const newSmartBin = {
      id: uuidv4(),
      ...req.body,
      created_by: req.user.email,
      created_date: new Date().toISOString(),
      status: 'active'
    };
    smartBins.push(newSmartBin);
    res.status(201).json(newSmartBin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compartment routes
app.get('/api/compartments', authenticateToken, (req, res) => {
  try {
    res.json(compartments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compartments', authenticateToken, (req, res) => {
  try {
    const newCompartment = {
      id: uuidv4(),
      ...req.body,
      created_date: new Date().toISOString()
    };
    compartments.push(newCompartment);
    res.status(201).json(newCompartment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SingleBin routes
app.get('/api/singlebins', authenticateToken, (req, res) => {
  try {
    const userSingleBins = singleBins.filter(bin => bin.created_by === req.user.email);
    res.json(userSingleBins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/singlebins', authenticateToken, (req, res) => {
  try {
    const newSingleBin = {
      id: uuidv4(),
      ...req.body,
      created_by: req.user.email,
      created_date: new Date().toISOString(),
      status: 'active'
    };
    singleBins.push(newSingleBin);
    res.status(201).json(newSingleBin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alert routes
app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscription Plan routes
app.get('/api/subscription-plans', authenticateToken, (req, res) => {
  try {
    res.json(subscriptionPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email notification routes (no auth required for welcome email on registration)
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`📧 Sending welcome email to: ${email} (${userName})`);
    await emailService.sendWelcomeEmail(email, userName || 'User');
    console.log(`✅ Welcome email sent successfully to: ${email}`);
    res.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

app.post('/api/send-alert-email', async (req, res) => {
  try {
    const { email, userName, alertDetails } = req.body;
    
    if (!email || !alertDetails) {
      return res.status(400).json({ error: 'Email and alert details are required' });
    }

    console.log(`🚨 Sending alert email to: ${email} for ${alertDetails.binName}`);
    await emailService.sendAlertEmail(email, userName || 'User', alertDetails);
    console.log(`✅ Alert email sent successfully to: ${email}`);
    res.json({ success: true, message: 'Alert email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending alert email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Sortyx Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/auth/login`);
});

module.exports = app;