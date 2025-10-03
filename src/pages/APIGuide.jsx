import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Copy, 
  Check, 
  Book,
  Zap,
  Globe,
  Hash,
  FileText,
  Terminal,
  Smartphone,
  Cpu
} from "lucide-react";

export default function APIGuide() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }) => (
    <div className="relative">
      <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );

  const pythonCode = `import requests
import json
from datetime import datetime

class SortyxSensorClient:
    def __init__(self, api_token, base_url):
        self.api_token = api_token
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
    
    def find_compartment_by_unique_id(self, unique_id):
        """Find compartment database ID by unique_id"""
        url = f"{self.base_url}/api/entities/Compartment"
        params = {"filter": json.dumps({"unique_id": unique_id})}
        
        response = requests.get(url, headers=self.headers, params=params)
        if response.status_code == 200:
            compartments = response.json()
            if compartments:
                return compartments[0]['id']
        return None
    
    def update_sensor_data(self, unique_id, sensor_data):
        """Update sensor data using unique ID"""
        db_id = self.find_compartment_by_unique_id(unique_id)
        if not db_id:
            raise Exception(f"Compartment not found: {unique_id}")
        
        sensor_data['last_sensor_update'] = datetime.utcnow().isoformat() + 'Z'
        
        url = f"{self.base_url}/api/entities/Compartment/{db_id}"
        response = requests.put(url, headers=self.headers, json=sensor_data)
        
        return response.status_code == 200

# Usage
client = SortyxSensorClient("your_api_token", "https://your-app.base44.com")

sensor_data = {
    "current_fill": 82.5,
    "temperature": 24.3,
    "humidity": 48.2,
    "weight": 11.2
}

success = client.update_sensor_data("MainOffice-Recyclable-001", sensor_data)`;

  const arduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class SortyxSensorClient {
private:
    String apiToken;
    String baseUrl;
    String compartmentDbId;
    
public:
    SortyxSensorClient(String token, String url) {
        apiToken = token;
        baseUrl = url;
    }
    
    bool findCompartmentId(String uniqueId) {
        HTTPClient http;
        String url = baseUrl + "/api/entities/Compartment?filter={\\"unique_id\\":\\"" + uniqueId + "\\"}";
        
        http.begin(url);
        http.addHeader("Authorization", "Bearer " + apiToken);
        
        int httpCode = http.GET();
        
        if (httpCode == 200) {
            String payload = http.getString();
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, payload);
            
            if (doc.size() > 0) {
                compartmentDbId = doc[0]["id"].as<String>();
                http.end();
                return true;
            }
        }
        
        http.end();
        return false;
    }
    
    bool sendSensorData(String uniqueId, float fillLevel, float temp, float humidity) {
        if (compartmentDbId.isEmpty()) {
            if (!findCompartmentId(uniqueId)) {
                return false;
            }
        }
        
        HTTPClient http;
        String url = baseUrl + "/api/entities/Compartment/" + compartmentDbId;
        
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer " + apiToken);
        
        DynamicJsonDocument doc(1024);
        doc["current_fill"] = fillLevel;
        doc["temperature"] = temp;
        doc["humidity"] = humidity;
        doc["last_sensor_update"] = "2025-01-02T10:30:00Z";
        
        String jsonString;
        serializeJson(doc, jsonString);
        
        int httpResponseCode = http.PUT(jsonString);
        http.end();
        
        return httpResponseCode == 200;
    }
};

// Usage
SortyxSensorClient sensor("your_api_token", "https://your-app.base44.com");

void setup() {
    if (sensor.findCompartmentId("MainOffice-Recyclable-001")) {
        Serial.println("Compartment found!");
    }
}`;

  const nodeCode = `const axios = require('axios');

class SortyxSensorClient {
    constructor(apiToken, baseUrl) {
        this.apiToken = apiToken;
        this.baseUrl = baseUrl;
        this.compartmentCache = new Map();
        
        this.headers = {
            'Authorization': \`Bearer \${apiToken}\`,
            'Content-Type': 'application/json'
        };
    }
    
    async findCompartmentId(uniqueId) {
        if (this.compartmentCache.has(uniqueId)) {
            return this.compartmentCache.get(uniqueId);
        }
        
        try {
            const response = await axios.get(
                \`\${this.baseUrl}/api/entities/Compartment\`,
                {
                    headers: this.headers,
                    params: {
                        filter: JSON.stringify({ unique_id: uniqueId })
                    }
                }
            );
            
            if (response.data && response.data.length > 0) {
                const dbId = response.data[0].id;
                this.compartmentCache.set(uniqueId, dbId);
                return dbId;
            }
        } catch (error) {
            console.error('Error finding compartment:', error.message);
        }
        
        return null;
    }
    
    async updateSensorData(uniqueId, sensorData) {
        const dbId = await this.findCompartmentId(uniqueId);
        if (!dbId) {
            throw new Error(\`Compartment not found: \${uniqueId}\`);
        }
        
        const payload = {
            ...sensorData,
            last_sensor_update: new Date().toISOString()
        };
        
        try {
            const response = await axios.put(
                \`\${this.baseUrl}/api/entities/Compartment/\${dbId}\`,
                payload,
                { headers: this.headers }
            );
            
            return response.status === 200;
        } catch (error) {
            console.error('Error updating sensor data:', error.message);
            return false;
        }
    }
}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Sortyx SmartBin API Integration Guide
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Complete guide for integrating IoT sensors with your SmartBin application
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Hash className="w-5 h-5" />
                Unique ID System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Each compartment has a unique identifier for API integration
              </p>
              <Badge variant="outline" className="font-mono text-xs">
                SmartBinName-CompartmentName-XXX
              </Badge>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Zap className="w-5 h-5" />
                Real-time Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Send sensor data in real-time for immediate dashboard updates
              </p>
              <Badge variant="outline" className="text-green-600 dark:text-green-400">
                Live Monitoring
              </Badge>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#241B3A] dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Globe className="w-5 h-5" />
                Multi-Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Support for Python, Arduino/ESP32, Node.js and more
              </p>
              <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                Cross-Platform
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* API Format */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <FileText className="w-5 h-5" />
              API Endpoints & Data Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Primary Endpoint</h4>
              <CodeBlock 
                code="PUT /api/entities/Compartment/{compartment_database_id}
Authorization: Bearer {your_api_token}
Content-Type: application/json"
                language="http"
                id="endpoint"
              />
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sensor Data Payload</h4>
              <CodeBlock 
                code={`{
  "current_fill": 75.5,
  "temperature": 23.2,
  "humidity": 45.8,
  "air_quality": 85,
  "weight": 12.5,
  "lid_open": false,
  "last_sensor_update": "2025-01-02T10:30:00Z"
}`}
                language="json"
                id="payload"
              />
            </div>

            {/* Field Specifications Table */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Field Specifications</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-purple-700">
                      <th className="text-left p-2 font-medium dark:text-white">Field</th>
                      <th className="text-left p-2 font-medium dark:text-white">Type</th>
                      <th className="text-left p-2 font-medium dark:text-white">Required</th>
                      <th className="text-left p-2 font-medium dark:text-white">Range</th>
                      <th className="text-left p-2 font-medium dark:text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-purple-800">
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">current_fill</td>
                      <td className="p-2 dark:text-gray-300">number</td>
                      <td className="p-2"><Badge variant="destructive" className="text-xs">Yes</Badge></td>
                      <td className="p-2 dark:text-gray-300">0-100</td>
                      <td className="p-2 dark:text-gray-300">Fill level percentage</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-purple-800">
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">temperature</td>
                      <td className="p-2 dark:text-gray-300">number</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">No</Badge></td>
                      <td className="p-2 dark:text-gray-300">-50 to 200</td>
                      <td className="p-2 dark:text-gray-300">Temperature in Celsius</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-purple-800">
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">humidity</td>
                      <td className="p-2 dark:text-gray-300">number</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">No</Badge></td>
                      <td className="p-2 dark:text-gray-300">0-100</td>
                      <td className="p-2 dark:text-gray-300">Humidity percentage</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-purple-800">
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">air_quality</td>
                      <td className="p-2 dark:text-gray-300">number</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">No</Badge></td>
                      <td className="p-2 dark:text-gray-300">0-500</td>
                      <td className="p-2 dark:text-gray-300">Air Quality Index</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-purple-800">
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">weight</td>
                      <td className="p-2 dark:text-gray-300">number</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">No</Badge></td>
                      <td className="p-2 dark:text-gray-300">≥0</td>
                      <td className="p-2 dark:text-gray-300">Current weight in kg</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-blue-600 dark:text-blue-400">lid_open</td>
                      <td className="p-2 dark:text-gray-300">boolean</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">No</Badge></td>
                      <td className="p-2 dark:text-gray-300">true/false</td>
                      <td className="p-2 dark:text-gray-300">Lid open status</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Code className="w-5 h-5" />
              Integration Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="python" className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Python
                </TabsTrigger>
                <TabsTrigger value="arduino" className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Arduino/ESP32
                </TabsTrigger>
                <TabsTrigger value="nodejs" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Node.js
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="python" className="mt-4">
                <CodeBlock code={pythonCode} language="python" id="python" />
              </TabsContent>
              
              <TabsContent value="arduino" className="mt-4">
                <CodeBlock code={arduinoCode} language="cpp" id="arduino" />
              </TabsContent>
              
              <TabsContent value="nodejs" className="mt-4">
                <CodeBlock code={nodeCode} language="javascript" id="nodejs" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alert Triggers */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Automatic Alert Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Critical Alerts</h4>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                  <li>• Fill level &ge; 90% (configurable threshold)</li>
                  <li>• Temperature &ge; 50°C (fire safety)</li>
                  <li>• Air quality &gt; 150 (unhealthy AQI)</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">Warning Alerts</h4>
                <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
                  <li>• Lid open detected</li>
                  <li>• No sensor update for 2+ hours</li>
                  <li>• Unusual weight changes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Frequency */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recommended Update Frequencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-400">Fill Level</h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">15-30 min</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-medium text-red-700 dark:text-red-400">Temperature</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">5-10 min</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-400">Other Sensors</h4>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">30-60 min</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h4 className="font-medium text-orange-700 dark:text-orange-400">Emergencies</h4>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">Immediate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}