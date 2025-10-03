// Import from custom client for standalone use
import { customBase44 } from './customClient';

// Using custom backend only - Base44 dependency removed
const client = customBase44;

export const SmartBin = client.entities.SmartBin;

export const Compartment = client.entities.Compartment;

export const Alert = client.entities.Alert;

export const SubscriptionPlan = client.entities.SubscriptionPlan;

export const SingleBin = client.entities.SingleBin;

// auth sdk:
export const User = client.auth;