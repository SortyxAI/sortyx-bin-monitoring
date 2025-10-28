import { FirebaseService } from './firebaseService';

/**
 * Test Data Service
 * Generates realistic test data for SmartBins, SingleBins, Compartments, and Alerts
 */
export class TestDataService {
  static isTestDataEnabled = false;

  // Waste types with realistic properties
  static wasteTypes = [
    { id: 'general', name: 'General Waste', icon: '🗑️', color: '#6B7280' },
    { id: 'recyclable', name: 'Recyclable', icon: '♻️', color: '#10B981' },
    { id: 'organic', name: 'Organic', icon: '🌱', color: '#84CC16' },
    { id: 'paper', name: 'Paper', icon: '📄', color: '#3B82F6' },
    { id: 'plastic', name: 'Plastic', icon: '🧴', color: '#F59E0B' },
    { id: 'glass', name: 'Glass', icon: '🍾', color: '#8B5CF6' },
    { id: 'metal', name: 'Metal', icon: '🔩', color: '#EC4899' },
    { id: 'ewaste', name: 'E-Waste', icon: '💻', color: '#EF4444' }
  ];

  // Location templates
  static locations = [
    { building: 'Main Office', floor: 1, area: 'Lobby' },
    { building: 'Main Office', floor: 2, area: 'Conference Room A' },
    { building: 'Main Office', floor: 3, area: 'Open Workspace' },
    { building: 'Main Office', floor: 4, area: 'Cafeteria' },
    { building: 'Warehouse', floor: 1, area: 'Loading Dock' },
    { building: 'Warehouse', floor: 2, area: 'Storage Area' },
    { building: 'R&D Center', floor: 1, area: 'Lab 1' },
    { building: 'R&D Center', floor: 2, area: 'Lab 2' },
    { building: 'Factory', floor: 1, area: 'Production Line A' },
    { building: 'Factory', floor: 1, area: 'Production Line B' }
  ];

  /**
   * Toggle test data mode
   */
  static toggleTestData() {
    this.isTestDataEnabled = !this.isTestDataEnabled;
    console.log(`🧪 Test Data Mode: ${this.isTestDataEnabled ? 'ENABLED' : 'DISABLED'}`);
    return this.isTestDataEnabled;
  }

  /**
   * Check if test data is enabled
   */
  static isEnabled() {
    return this.isTestDataEnabled;
  }

  /**
   * Generate random number between min and max
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  static randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  /**
   * Pick random item from array
   */
  static randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate realistic fill level based on time patterns
   */
  static generateRealisticFillLevel(baseLevel = null) {
    if (baseLevel !== null) {
      // Simulate gradual filling with small variations
      const change = this.randomFloat(-5, 15);
      return Math.max(0, Math.min(100, baseLevel + change));
    }

    // Generate new fill level with realistic distribution
    const hour = new Date().getHours();
    
    // Higher fill levels during peak hours (9-17)
    if (hour >= 9 && hour <= 17) {
      return this.randomInt(40, 95);
    }
    
    // Lower fill levels during off-hours
    return this.randomInt(10, 60);
  }

  /**
   * Generate a test SmartBin
   */
  static generateSmartBin(index = 1, options = {}) {
    const location = options.location || this.randomItem(this.locations);
    const numCompartments = options.numCompartments || this.randomInt(2, 4);
    const compartments = [];

    // Generate compartments for this SmartBin
    for (let i = 0; i < numCompartments; i++) {
      const wasteType = this.wasteTypes[i % this.wasteTypes.length];
      compartments.push(this.generateCompartment(i + 1, wasteType, `smartbin-test-${index}`));
    }

    const avgFillLevel = compartments.reduce((sum, c) => sum + c.current_fill, 0) / compartments.length;
    const status = avgFillLevel > 85 ? 'critical' : avgFillLevel > 70 ? 'warning' : 'active';

    return {
      id: `smartbin-test-${index}`,
      name: `Smart Bin ${index}`,
      location: `${location.building} - ${location.area}`,
      building: location.building,
      floor: location.floor,
      area: location.area,
      status: status,
      compartment_count: numCompartments,
      compartments: compartments,
      last_emptied: new Date(Date.now() - this.randomInt(1, 10) * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - this.randomInt(30, 180) * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'admin@sortyx.com',
      avg_fill_level: parseFloat(avgFillLevel.toFixed(2)),
      source: 'test-data'
    };
  }

  /**
   * Generate a test Compartment
   */
  static generateCompartment(index, wasteType, smartBinId) {
    const fillLevel = this.generateRealisticFillLevel();
    const capacity = this.randomInt(50, 150); // Liters
    const currentVolume = (fillLevel / 100) * capacity;

    return {
      id: `compartment-test-${smartBinId}-${index}`,
      smartbin_id: smartBinId,
      name: wasteType.name,
      waste_type: wasteType.id,
      icon: wasteType.icon,
      color: wasteType.color,
      capacity: capacity,
      current_fill: parseFloat(fillLevel.toFixed(2)),
      current_volume: parseFloat(currentVolume.toFixed(2)),
      distance: parseFloat(((100 - fillLevel) / 100 * 30).toFixed(2)), // Simulate distance sensor
      status: fillLevel > 85 ? 'critical' : fillLevel > 70 ? 'warning' : 'active',
      last_emptied: new Date(Date.now() - this.randomInt(1, 7) * 24 * 60 * 60 * 1000).toISOString(),
      temperature: this.randomFloat(18, 28, 1),
      humidity: this.randomFloat(40, 70, 1),
      created_at: new Date().toISOString(),
      source: 'test-data'
    };
  }

  /**
   * Generate a test SingleBin
   */
  static generateSingleBin(index = 1, options = {}) {
    const location = options.location || this.randomItem(this.locations);
    const wasteType = options.wasteType || this.randomItem(this.wasteTypes);
    const fillLevel = this.generateRealisticFillLevel();
    const capacity = this.randomInt(80, 200);
    const currentVolume = (fillLevel / 100) * capacity;
    const batteryLevel = this.randomInt(20, 100);

    const status = fillLevel > 85 ? 'critical' : fillLevel > 70 ? 'warning' : 'active';

    return {
      id: `singlebin-test-${index}`,
      name: `Single Bin ${index}`,
      location: `${location.building} - ${location.area}`,
      building: location.building,
      floor: location.floor,
      area: location.area,
      waste_type: wasteType.id,
      waste_type_name: wasteType.name,
      icon: wasteType.icon,
      color: wasteType.color,
      capacity: capacity,
      current_fill: parseFloat(fillLevel.toFixed(2)),
      fill_level: parseFloat(fillLevel.toFixed(2)),
      current_volume: parseFloat(currentVolume.toFixed(2)),
      distance: parseFloat(((100 - fillLevel) / 100 * 30).toFixed(2)),
      status: status,
      battery_level: batteryLevel,
      temperature: this.randomFloat(18, 28, 1),
      humidity: this.randomFloat(40, 70, 1),
      last_emptied: new Date(Date.now() - this.randomInt(1, 10) * 24 * 60 * 60 * 1000).toISOString(),
      last_sensor_update: new Date(Date.now() - this.randomInt(1, 60) * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - this.randomInt(30, 180) * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'admin@sortyx.com',
      iot_device_id: `test-sensor-${index}`,
      sensor_data_available: true,
      source: 'test-data'
    };
  }

  /**
   * Generate a test Alert
   */
  static generateAlert(binId, binType, binName, severity = null) {
    const severities = ['low', 'medium', 'high', 'critical'];
    const selectedSeverity = severity || this.randomItem(severities);

    const alertTypes = {
      critical: [
        { type: 'bin_full', message: 'Bin is full and needs immediate attention', action: 'Empty bin urgently' },
        { type: 'overflow_risk', message: 'Overflow risk detected', action: 'Schedule immediate collection' },
        { type: 'high_temperature', message: 'Abnormally high temperature detected', action: 'Inspect for fire hazard' }
      ],
      high: [
        { type: 'near_full', message: 'Bin is nearly full (>80%)', action: 'Schedule collection soon' },
        { type: 'low_battery', message: 'Sensor battery is low', action: 'Replace battery' },
        { type: 'sensor_offline', message: 'Sensor has not reported in 24 hours', action: 'Check sensor connection' }
      ],
      medium: [
        { type: 'fill_warning', message: 'Bin fill level is above threshold', action: 'Monitor and schedule collection' },
        { type: 'maintenance_due', message: 'Regular maintenance is due', action: 'Schedule maintenance' }
      ],
      low: [
        { type: 'fill_notification', message: 'Bin fill level update', action: 'Continue monitoring' }
      ]
    };

    const alertOptions = alertTypes[selectedSeverity] || alertTypes.medium;
    const alert = this.randomItem(alertOptions);

    return {
      id: `alert-test-${binId}-${Date.now()}-${this.randomInt(1000, 9999)}`,
      bin_id: binId,
      bin_type: binType,
      bin_name: binName,
      type: alert.type,
      severity: selectedSeverity,
      title: `${selectedSeverity.toUpperCase()}: ${alert.message}`,
      message: alert.message,
      recommended_action: alert.action,
      status: this.randomItem(['active', 'active', 'active', 'resolved']), // 75% active
      created_at: new Date(Date.now() - this.randomInt(0, 48) * 60 * 60 * 1000).toISOString(),
      resolved_at: null,
      resolved_by: null,
      source: 'test-data'
    };
  }

  /**
   * Generate a complete dataset
   */
  static async generateCompleteDataset(options = {}) {
    const numSmartBins = options.numSmartBins || this.randomInt(3, 8);
    const numSingleBins = options.numSingleBins || this.randomInt(4, 12);
    const generateAlerts = options.generateAlerts !== false;

    console.log(`🧪 Generating test dataset: ${numSmartBins} SmartBins, ${numSingleBins} SingleBins`);

    const smartBins = [];
    const singleBins = [];
    const compartments = [];
    const alerts = [];

    // Generate SmartBins
    for (let i = 1; i <= numSmartBins; i++) {
      const smartBin = this.generateSmartBin(i);
      smartBins.push(smartBin);
      
      // Add compartments from SmartBin
      compartments.push(...smartBin.compartments);

      // Generate alerts for critical/warning SmartBins
      if (generateAlerts && (smartBin.status === 'critical' || smartBin.status === 'warning')) {
        const severity = smartBin.status === 'critical' ? 'critical' : 'high';
        alerts.push(this.generateAlert(smartBin.id, 'smartbin', smartBin.name, severity));
      }
    }

    // Generate SingleBins
    for (let i = 1; i <= numSingleBins; i++) {
      const singleBin = this.generateSingleBin(i);
      singleBins.push(singleBin);

      // Generate alerts for critical/warning SingleBins
      if (generateAlerts && (singleBin.status === 'critical' || singleBin.status === 'warning')) {
        const severity = singleBin.status === 'critical' ? 'critical' : 'high';
        alerts.push(this.generateAlert(singleBin.id, 'singlebin', singleBin.name, severity));
      }
    }

    // Generate some random alerts
    if (generateAlerts) {
      const randomAlertCount = this.randomInt(2, 5);
      for (let i = 0; i < randomAlertCount; i++) {
        const bin = this.randomItem([...smartBins, ...singleBins]);
        const binType = bin.compartments ? 'smartbin' : 'singlebin';
        alerts.push(this.generateAlert(bin.id, binType, bin.name));
      }
    }

    const dataset = {
      smartBins,
      singleBins,
      compartments,
      alerts,
      metadata: {
        generated_at: new Date().toISOString(),
        total_bins: smartBins.length + singleBins.length,
        total_compartments: compartments.length,
        total_alerts: alerts.length
      }
    };

    console.log('✅ Test dataset generated:', dataset.metadata);
    return dataset;
  }

  /**
   * Save test data to Firebase
   */
  static async saveTestDataToFirebase(dataset) {
    try {
      console.log('💾 Saving test data to Firebase...');

      const results = {
        smartBins: [],
        singleBins: [],
        compartments: [],
        alerts: [],
        errors: []
      };

      // Save SmartBins
      for (const smartBin of dataset.smartBins) {
        try {
          const saved = await FirebaseService.saveSmartBin(smartBin);
          results.smartBins.push(saved);
        } catch (error) {
          console.error(`Error saving SmartBin ${smartBin.id}:`, error);
          results.errors.push({ type: 'smartbin', id: smartBin.id, error: error.message });
        }
      }

      // Save SingleBins
      for (const singleBin of dataset.singleBins) {
        try {
          const saved = await FirebaseService.saveSingleBin(singleBin);
          results.singleBins.push(saved);
        } catch (error) {
          console.error(`Error saving SingleBin ${singleBin.id}:`, error);
          results.errors.push({ type: 'singlebin', id: singleBin.id, error: error.message });
        }
      }

      // Save Compartments (if not already saved with SmartBins)
      for (const compartment of dataset.compartments) {
        try {
          const saved = await FirebaseService.saveCompartment(compartment);
          results.compartments.push(saved);
        } catch (error) {
          console.error(`Error saving Compartment ${compartment.id}:`, error);
          results.errors.push({ type: 'compartment', id: compartment.id, error: error.message });
        }
      }

      // Save Alerts
      for (const alert of dataset.alerts) {
        try {
          const saved = await FirebaseService.saveAlert(alert);
          results.alerts.push(saved);
        } catch (error) {
          console.error(`Error saving Alert ${alert.id}:`, error);
          results.errors.push({ type: 'alert', id: alert.id, error: error.message });
        }
      }

      console.log('✅ Test data saved to Firebase:', {
        smartBins: results.smartBins.length,
        singleBins: results.singleBins.length,
        compartments: results.compartments.length,
        alerts: results.alerts.length,
        errors: results.errors.length
      });

      return results;

    } catch (error) {
      console.error('❌ Error saving test data to Firebase:', error);
      throw error;
    }
  }

  /**
   * Clear all test data from Firebase
   */
  static async clearTestDataFromFirebase() {
    try {
      console.log('🗑️ Clearing test data from Firebase...');

      // Get all data
      const [smartBins, singleBins, compartments, alerts] = await Promise.all([
        FirebaseService.getSmartBins(),
        FirebaseService.getSingleBins(),
        FirebaseService.getCompartments(),
        FirebaseService.getAlerts()
      ]);

      // Filter test data (has source: 'test-data' or id contains 'test')
      const testSmartBins = smartBins.filter(b => b.source === 'test-data' || b.id?.includes('test'));
      const testSingleBins = singleBins.filter(b => b.source === 'test-data' || b.id?.includes('test'));
      const testCompartments = compartments.filter(c => c.source === 'test-data' || c.id?.includes('test'));
      const testAlerts = alerts.filter(a => a.source === 'test-data' || a.id?.includes('test'));

      console.log(`Found test data to delete:`, {
        smartBins: testSmartBins.length,
        singleBins: testSingleBins.length,
        compartments: testCompartments.length,
        alerts: testAlerts.length
      });

      // Delete test data
      const deletePromises = [
        ...testSmartBins.map(b => FirebaseService.deleteSmartBin(b.id)),
        ...testSingleBins.map(b => FirebaseService.deleteSingleBin(b.id)),
        ...testCompartments.map(c => FirebaseService.deleteCompartment(c.id)),
        ...testAlerts.map(a => FirebaseService.deleteAlert(a.id))
      ];

      await Promise.all(deletePromises);

      console.log('✅ Test data cleared from Firebase');
      return {
        deleted: {
          smartBins: testSmartBins.length,
          singleBins: testSingleBins.length,
          compartments: testCompartments.length,
          alerts: testAlerts.length
        }
      };

    } catch (error) {
      console.error('❌ Error clearing test data:', error);
      throw error;
    }
  }

  /**
   * Generate and save test data in one operation
   */
  static async generateAndSaveTestData(options = {}) {
    try {
      console.log('🚀 Generating and saving test data...');
      
      const dataset = await this.generateCompleteDataset(options);
      const results = await this.saveTestDataToFirebase(dataset);
      
      return {
        dataset,
        results
      };
    } catch (error) {
      console.error('❌ Error generating and saving test data:', error);
      throw error;
    }
  }

  static isTestMode = false;
  static testDataInterval = null;
  static testBins = [];

  // Toggle test mode on/off
  static toggleTestMode() {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      console.log('🧪 Test mode ENABLED - Generating test data...');
      this.startTestDataGeneration();
    } else {
      console.log('🧪 Test mode DISABLED - Stopping test data...');
      this.stopTestDataGeneration();
    }
    
    return this.isTestMode;
  }

  // Generate realistic test SmartBins
  static generateTestSmartBins(count = 3) {
    const locations = ['Main Building', 'North Wing', 'South Wing', 'East Campus', 'West Campus'];
    const wasteTypes = [
      { name: 'General Waste', color: '#6B7280' },
      { name: 'Recyclables', color: '#10B981' },
      { name: 'Organic Waste', color: '#F59E0B' },
      { name: 'Hazardous', color: '#EF4444' }
    ];

    const bins = [];
    for (let i = 0; i < count; i++) {
      const binId = `test-smartbin-${i + 1}`;
      const compartmentCount = Math.floor(Math.random() * 2) + 2; // 2-3 compartments
      
      const smartBin = {
        id: binId,
        name: `Test SmartBin ${i + 1}`,
        location: locations[i % locations.length],
        status: 'active',
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        installation_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        isTestData: true,
        compartments: []
      };

      // Generate compartments for this SmartBin
      for (let j = 0; j < compartmentCount; j++) {
        const wasteType = wasteTypes[j % wasteTypes.length];
        const fillLevel = Math.floor(Math.random() * 100);
        
        smartBin.compartments.push({
          id: `${binId}-comp-${j + 1}`,
          smartbin_id: binId,
          waste_type: wasteType.name,
          current_fill: fillLevel,
          capacity: 100,
          threshold: 85,
          status: fillLevel >= 85 ? 'critical' : fillLevel >= 70 ? 'warning' : 'normal',
          sensor_id: `sensor-${binId}-${j + 1}`,
          last_updated: new Date().toISOString(),
          color: wasteType.color
        });
      }

      bins.push(smartBin);
    }

    return bins;
  }

  // Generate realistic test SingleBins
  static generateTestSingleBins(count = 2) {
    const locations = ['Entrance Hall', 'Cafeteria', 'Library', 'Parking Lot', 'Reception'];
    const wasteTypes = ['General Waste', 'Recyclables', 'Organic Waste', 'Paper Only'];

    const bins = [];
    for (let i = 0; i < count; i++) {
      const fillLevel = Math.floor(Math.random() * 100);
      
      bins.push({
        id: `test-singlebin-${i + 1}`,
        name: `Test SingleBin ${i + 1}`,
        location: locations[i % locations.length],
        waste_type: wasteTypes[i % wasteTypes.length],
        current_fill: fillLevel,
        capacity: 100,
        threshold: 80,
        status: fillLevel >= 80 ? 'critical' : fillLevel >= 65 ? 'warning' : 'active',
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        sensor_id: `single-sensor-${i + 1}`,
        last_updated: new Date().toISOString(),
        installation_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        isTestData: true
      });
    }

    return bins;
  }

  // Generate realistic alerts
  static generateTestAlerts(bins) {
    const alerts = [];
    const alertTypes = ['high_fill', 'maintenance_required', 'sensor_error', 'temperature_alert'];
    const severities = ['critical', 'warning', 'info'];

    bins.forEach(bin => {
      if (bin.compartments) {
        // SmartBin alerts
        bin.compartments.forEach(comp => {
          if (comp.current_fill >= 85 || Math.random() > 0.7) {
            alerts.push({
              id: `alert-${comp.id}-${Date.now()}`,
              compartment_id: comp.id,
              smartbin_id: bin.id,
              type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
              severity: comp.current_fill >= 85 ? 'critical' : severities[Math.floor(Math.random() * severities.length)],
              message: `${comp.waste_type} compartment at ${comp.current_fill}% capacity`,
              timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              resolved: false,
              isTestData: true
            });
          }
        });
      } else {
        // SingleBin alerts
        if (bin.current_fill >= 80 || Math.random() > 0.7) {
          alerts.push({
            id: `alert-${bin.id}-${Date.now()}`,
            bin_id: bin.id,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            severity: bin.current_fill >= 80 ? 'critical' : severities[Math.floor(Math.random() * severities.length)],
            message: `${bin.waste_type} bin at ${bin.current_fill}% capacity`,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            resolved: false,
            isTestData: true
          });
        }
      }
    });

    return alerts;
  }

  // Simulate realistic fill level changes over time
  static updateFillLevels(bins) {
    return bins.map(bin => {
      if (bin.compartments) {
        // SmartBin - update each compartment
        return {
          ...bin,
          compartments: bin.compartments.map(comp => {
            // Simulate gradual fill increase (0-3% per update)
            const change = Math.random() * 3;
            let newFill = Math.min(100, comp.current_fill + change);
            
            // Occasionally simulate emptying when above 90%
            if (comp.current_fill > 90 && Math.random() > 0.7) {
              newFill = Math.floor(Math.random() * 20); // Empty to 0-20%
            }

            return {
              ...comp,
              current_fill: Math.round(newFill),
              status: newFill >= 85 ? 'critical' : newFill >= 70 ? 'warning' : 'normal',
              last_updated: new Date().toISOString()
            };
          })
        };
      } else {
        // SingleBin
        const change = Math.random() * 3;
        let newFill = Math.min(100, bin.current_fill + change);
        
        // Occasionally simulate emptying when above 90%
        if (bin.current_fill > 90 && Math.random() > 0.7) {
          newFill = Math.floor(Math.random() * 20);
        }

        return {
          ...bin,
          current_fill: Math.round(newFill),
          status: newFill >= 80 ? 'critical' : newFill >= 65 ? 'warning' : 'active',
          last_updated: new Date().toISOString()
        };
      }
    });
  }

  // Start generating test data with realistic updates
  static startTestDataGeneration() {
    // Generate initial test bins
    const smartBins = this.generateTestSmartBins(3);
    const singleBins = this.generateTestSingleBins(2);
    this.testBins = [...smartBins, ...singleBins];

    // Store test data
    localStorage.setItem('testMode', 'true');
    localStorage.setItem('testBins', JSON.stringify(this.testBins));
    localStorage.setItem('testAlerts', JSON.stringify(this.generateTestAlerts(this.testBins)));

    // Update test data every 5 seconds to simulate real-time changes
    this.testDataInterval = setInterval(() => {
      this.testBins = this.updateFillLevels(this.testBins);
      localStorage.setItem('testBins', JSON.stringify(this.testBins));
      localStorage.setItem('testAlerts', JSON.stringify(this.generateTestAlerts(this.testBins)));
      
      // Trigger a custom event to notify components of data update
      window.dispatchEvent(new CustomEvent('testDataUpdated'));
    }, 5000);
  }

  // Stop generating test data
  static stopTestDataGeneration() {
    if (this.testDataInterval) {
      clearInterval(this.testDataInterval);
      this.testDataInterval = null;
    }

    // Clear test data from localStorage
    localStorage.removeItem('testMode');
    localStorage.removeItem('testBins');
    localStorage.removeItem('testAlerts');
    this.testBins = [];

    // Trigger event to notify components
    window.dispatchEvent(new CustomEvent('testDataUpdated'));
  }

  // Get current test mode status
  static isTestModeEnabled() {
    return localStorage.getItem('testMode') === 'true';
  }

  // Get test data (bins separated by type)
  static getTestData() {
    const testBinsStr = localStorage.getItem('testBins');
    const testAlertsStr = localStorage.getItem('testAlerts');

    if (!testBinsStr) {
      return { smartBins: [], singleBins: [], alerts: [] };
    }

    const allBins = JSON.parse(testBinsStr);
    const smartBins = allBins.filter(bin => bin.compartments);
    const singleBins = allBins.filter(bin => !bin.compartments);
    const alerts = testAlertsStr ? JSON.parse(testAlertsStr) : [];

    return { smartBins, singleBins, alerts };
  }

  // Get compartments from test SmartBins
  static getTestCompartments() {
    const { smartBins } = this.getTestData();
    const compartments = [];
    
    smartBins.forEach(bin => {
      if (bin.compartments) {
        compartments.push(...bin.compartments);
      }
    });

    return compartments;
  }
}
