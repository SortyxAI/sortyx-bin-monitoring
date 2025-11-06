// Firebase-based API client for Sortyx Smart Bin application
// Now uses Firebase Realtime Database with IoT sensor data

import { FirebaseService } from '../services/firebaseService';
import { firebaseAuth } from '@/services/firebaseAuth';

class FirebaseAPIClient {
  constructor() {
    this.user = {
      id: 'admin',
      email: 'admin@sortyx.com',
      full_name: 'Admin User',
      plan: 'premium',
      applicationId:"sortyx-iot",
      smartbin_order: []
    };
  }
  
  async login(email, password) {
    try {
      const result = await firebaseAuth.login(email, password);
      this.user = result.user;
      localStorage.setItem('auth_token', result.token);
      return { token: result.token, user: this.user };
    } catch (error) {
      console.error('Login error: ', error);
      throw error;
    }
  }

  async register(email, password) {
    try {
      const result = await firebaseAuth.register(email, password);
      this.user = result.user;
      localStorage.setItem('auth_token', result.token);
      return { token: result.token, user: this.user };
    } catch (error) {
      console.error('Register error: ', error);
      throw error
    }
  }

  async logout(){
    this.logout();
    localStorage.removeItem('auth_token');
  }

  // Authentication methods using mock data
  // async login(email, password) {
  //   // Simple mock authentication
  //   if (email === 'admin@sortyx.com' && password === 'admin123') {
  //     const token = 'mock-firebase-token';
  //     localStorage.setItem('auth_token', token);
  //     return { token, user: this.user };
  //   }
  //   throw new Error('Invalid credentials');
  // }

  async me() {
    return this.user;
  }

  async updateMyUserData(data) {
    this.user = { ...this.user, ...data };
    return this.user;
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  // Firebase-based CRUD operations
  async getSmartBins() {
    try {
      return await FirebaseService.getSmartBins();
    } catch (error) {
      console.error('Error fetching smart bins:', error);
      return [];
    }
  }

  async getCompartments() {
    try {
      return await FirebaseService.getCompartments();
    } catch (error) {
      console.error('Error fetching compartments:', error);
      return [];
    }
  }

  async getAlerts() {
    try {
      return await FirebaseService.getAlerts();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async getSensorData(deviceId) {
    try {
      return await FirebaseService.getHistoricalData(deviceId);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  subscribeToSensorData(deviceId, callback) {
    return FirebaseService.subscribeToSensorData(deviceId, callback);
  }
}

// Create Firebase-based entity classes
class FirebaseEntityBase {
  constructor(client, entityName) {
    this.client = client;
    this.entityName = entityName;
  }

  async list(orderBy = null, limit = null) {
    switch(this.entityName) {
      case 'smartbins':
        return await this.client.getSmartBins();
      case 'compartments':
        return await this.client.getCompartments();
      case 'alerts':
        return await this.client.getAlerts();
      case 'singlebins':
        return []; // Not implemented for IoT setup
      case 'subscription-plans':
        return [
          { id: 1, name: 'Free', price: 0, features: ['Up to 2 SmartBins', 'Basic monitoring'] },
          { id: 2, name: 'Premium', price: 29.99, features: ['Unlimited SmartBins', 'Real-time monitoring', 'Advanced analytics'] }
        ];
      default:
        return [];
    }
  }

  async filter(filters = {}, orderBy = null, limit = null) {
    const data = await this.list(orderBy, limit);
    
    // Apply filters
    if (Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'created_by') {
          return true; // Skip filtering by user for IoT data
        }
        if (key === 'resolved' && this.entityName === 'alerts') {
          return item.resolved === value;
        }
        return item[key] === value;
      });
    });
  }

  async create(data) {
    console.log(`Would create ${this.entityName}:`, data);
    return { id: Date.now(), ...data };
  }

  async update(id, data) {
    console.log(`Would update ${this.entityName} ${id}:`, data);
    return { id, ...data };
  }

  async delete(id) {
    console.log(`Would delete ${this.entityName} ${id}`);
    return { success: true };
  }

  async get(id) {
    const data = await this.list();
    return data.find(item => item.id === id);
  }
}

// Initialize Firebase client
const firebaseClient = new FirebaseAPIClient();

// Create entity instances
export const SmartBin = new FirebaseEntityBase(firebaseClient, 'smartbins');
export const Compartment = new FirebaseEntityBase(firebaseClient, 'compartments');
export const SingleBin = new FirebaseEntityBase(firebaseClient, 'singlebins');
export const Alert = new FirebaseEntityBase(firebaseClient, 'alerts');
export const SubscriptionPlan = new FirebaseEntityBase(firebaseClient, 'subscription-plans');

// Auth object that uses Firebase
export const User = {
  async login(email, password) {
    return await firebaseClient.login(email, password);
  },

  async register(email, password) { // 👈 ADD THIS FUNCTION**
    return await firebaseClient.register(email, password);
  },
  
  async me() {
    return await firebaseClient.me();
  },
  
  async updateMyUserData(data) {
    return await firebaseClient.updateMyUserData(data);
  },
  
  logout() {
    firebaseClient.logout();
  }
};

// Default export that mimics base44 structure but uses Firebase
export const customBase44 = {
  entities: {
    SmartBin,
    Compartment,
    SingleBin,
    Alert,
    SubscriptionPlan,
  },
  auth: User,
  client: firebaseClient
};