import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Database, Code, Zap, CheckCircle, Copy, Terminal } from "lucide-react";

export default function FirebaseSetup() {
  const [copied, setCopied] = useState(null);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const firebaseStructure = `{
  "sensors": {
    "SB-Reception-001": {
      "current_fill": 45.5,
      "temperature": 24.3,
      "humidity": 52.1,
      "air_quality": 85,
      "battery_level": 92,
      "odour_level": 15,
      "timestamp": 1704196800000
    },
    "SB-Cafeteria-002": {
      "current_fill": 78.2,
      "temperature": 26.8,
      "humidity": 58.3,
      "air_quality": 72,
      "battery_level": 85,
      "odour_level": 45,
      "timestamp": 1704196800000
    }
  }
}`;

  const espCode = `#include <Firebase_ESP_Client.h>
#include <WiFi.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define DATABASE_URL "YOUR_FIREBASE_URL"
#define API_KEY "YOUR_FIREBASE_API_KEY"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String singleBinId = "SB-Reception-001";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
}

void loop() {
  // Read sensor values
  float fillLevel = readUltrasonicSensor();
  float temperature = readTempSensor();
  float humidity = readHumiditySensor();
  int airQuality = readAirQualitySensor();
  int battery = readBatteryLevel();
  int odour = readOdourSensor();
  
  // Prepare Firebase path
  String path = "sensors/" + singleBinId;
  
  // Create JSON object
  FirebaseJson json;
  json.set("current_fill", fillLevel);
  json.set("temperature", temperature);
  json.set("humidity", humidity);
  json.set("air_quality", airQuality);
  json.set("battery_level", battery);
  json.set("odour_level", odour);
  json.set("timestamp", millis());
  
  // Send to Firebase
  if (Firebase.RTDB.setJSON(&fbdo, path, &json)) {
    Serial.println("✅ Data sent successfully");
  } else {
    Serial.println("❌ Error: " + fbdo.errorReason());
  }
  
  delay(30000); // Update every 30 seconds
}`;

  const pythonCode = `import firebase_admin
from firebase_admin import credentials, db
import time
import random

# Initialize Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'YOUR_FIREBASE_URL'
})

def send_sensor_data(unique_id, sensor_data):
    """Send sensor data to Firebase"""
    ref = db.reference(f'sensors/{unique_id}')
    sensor_data['timestamp'] = int(time.time() * 1000)
    ref.set(sensor_data)
    print(f"✅ Sent data for {unique_id}")

# Example: Simulate sensor readings
while True:
    sensor_data = {
        'current_fill': random.uniform(40, 95),
        'temperature': random.uniform(20, 30),
        'humidity': random.uniform(40, 70),
        'air_quality': random.randint(60, 100),
        'battery_level': random.randint(70, 100),
        'odour_level': random.randint(10, 50)
    }
    
    send_sensor_data('SB-Reception-001', sensor_data)
    time.sleep(30)  # Update every 30 seconds`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Firebase Integration Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect your IoT sensors to Firebase for real-time data synchronization
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
                Step 1: Firebase Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Create Firebase project</li>
                <li>• Enable Realtime Database</li>
                <li>• Copy configuration</li>
                <li>• Set database rules</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Terminal className="w-5 h-5" />
                Step 2: IoT Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Install Firebase library</li>
                <li>• Configure WiFi</li>
                <li>• Send sensor data</li>
                <li>• Test connection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Zap className="w-5 h-5" />
                Step 3: Sortyx Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Configure Firebase credentials</li>
                <li>• Enable real-time sync</li>
                <li>• Monitor dashboard</li>
                <li>• View live updates</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Firebase Structure */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Firebase Database Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{firebaseStructure}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyCode(firebaseStructure, 'structure')}
              >
                {copied === 'structure' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ESP32 Code */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">ESP32/Arduino Code Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{espCode}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyCode(espCode, 'esp')}
              >
                {copied === 'esp' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Python Code */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Python Simulator Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{pythonCode}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyCode(pythonCode, 'python')}
              >
                {copied === 'python' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Steps */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Configuration Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium dark:text-white">1. Update Firebase Config</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Edit <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">components/singlebins/FirebaseConfig.jsx</code> with your Firebase credentials
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium dark:text-white">2. Install Firebase Package</h4>
              <div className="bg-gray-900 dark:bg-black p-3 rounded">
                <code className="text-green-400">npm install firebase</code>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium dark:text-white">3. Use Firebase Sync Component</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Add <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">&lt;FirebaseSyncButton /&gt;</code> to your SingleBin cards for manual or live sync
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium dark:text-white">4. Test Integration</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Send test data from your IoT device and verify it appears in the Sortyx dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}