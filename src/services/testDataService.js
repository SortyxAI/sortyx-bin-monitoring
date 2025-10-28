import { FirebaseService } from './firebaseService';

/**
 * Test Data Service
 * Generates realistic test data for SmartBins, SingleBins, Compartments, and Alerts
 * Enhanced with Demo Mode featuring timed data cycles
 */
export class TestDataService {
  static isTestDataEnabled = false;
  static isTestMode = false;
  static testDataInterval = null;
  static testBins = [];
  static demoPhase = 0; // 0: Empty/Low, 1: Mid-Level, 2: High/Alert, 3: Critical
  static demoPhaseTimer = null;
  static PHASE_DURATION = 8000; // 8 seconds per phase for demonstration

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
   * Clear test data from localStorage
   */
  static clearTestData() {
    console.log('🗑️ Clearing test data from localStorage...');
    
    localStorage.removeItem('testMode');
    localStorage.removeItem('demoMode');
    localStorage.removeItem('testBins');
    localStorage.removeItem('testAlerts');
    localStorage.removeItem('demoPhase');
    
    this.isTestMode = false;
    this.testBins = [];
    this.demoPhase = 0;
    
    if (this.demoPhaseTimer) {
      clearInterval(this.demoPhaseTimer);
      this.demoPhaseTimer = null;
    }
    
    if (this.testDataInterval) {
      clearInterval(this.testDataInterval);
      this.testDataInterval = null;
    }
    
    console.log('✅ Test data cleared from localStorage');
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

  /**
   * Demo Mode: Generate bins with specific fill levels based on current phase
   */
  static generateDemoPhaseBins(phase, count = 3) {
    const phases = [
      { name: 'Empty/Low Level', fillRange: [0, 25], status: 'active' },
      { name: 'Mid Level', fillRange: [40, 65], status: 'active' },
      { name: 'High Level', fillRange: [70, 85], status: 'warning' },
      { name: 'Critical/Alert', fillRange: [86, 100], status: 'critical' }
    ];

    const currentPhase = phases[phase % phases.length];
    const locations = ['Main Building - Floor 1', 'North Wing - Floor 2', 'South Wing - Lobby', 'East Campus - Cafeteria', 'West Campus - Lab'];
    const wasteTypes = [
      { name: 'General Waste', color: '#6B7280', icon: '🗑️' },
      { name: 'Recyclables', color: '#10B981', icon: '♻️' },
      { name: 'Organic Waste', color: '#F59E0B', icon: '🌱' },
      { name: 'Paper', color: '#3B82F6', icon: '📄' }
    ];

    const bins = [];
    
    // Generate SmartBins
    for (let i = 0; i < count; i++) {
      const binId = `demo-smartbin-${i + 1}`;
      const compartmentCount = 2 + (i % 2); // 2-3 compartments
      
      const smartBin = {
        id: binId,
        name: `Demo SmartBin ${i + 1}`,
        location: locations[i % locations.length],
        status: currentPhase.status,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        installation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_maintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        last_emptied: phase === 0 ? new Date().toISOString() : new Date(Date.now() - phase * 2 * 60 * 60 * 1000).toISOString(),
        isTestData: true,
        demoPhase: currentPhase.name,
        compartments: []
      };

      // Generate compartments with phase-appropriate fill levels
      for (let j = 0; j < compartmentCount; j++) {
        const wasteType = wasteTypes[j % wasteTypes.length];
        const [minFill, maxFill] = currentPhase.fillRange;
        const fillLevel = Math.floor(Math.random() * (maxFill - minFill + 1)) + minFill;
        const temperature = 20 + Math.random() * 8; // 20-28°C
        const humidity = 40 + Math.random() * 30; // 40-70%
        
        smartBin.compartments.push({
          id: `${binId}-comp-${j + 1}`,
          smartbin_id: binId,
          label: `${wasteType.name} - Comp ${j + 1}`,
          waste_type: wasteType.name,
          current_fill: fillLevel,
          capacity: 100,
          threshold: 80,
          status: fillLevel >= 85 ? 'critical' : fillLevel >= 70 ? 'warning' : 'active',
          sensor_id: `demo-sensor-${binId}-${j + 1}`,
          last_updated: new Date().toISOString(),
          color: wasteType.color,
          icon: wasteType.icon,
          temperature: parseFloat(temperature.toFixed(1)),
          humidity: parseFloat(humidity.toFixed(1)),
          battery_level: 100 - (phase * 10) + Math.floor(Math.random() * 10), // Gradual battery drain
          distance: parseFloat(((100 - fillLevel) * 0.3).toFixed(2)) // Simulate ultrasonic sensor
        });
      }

      bins.push(smartBin);
    }

    // Generate SingleBins
    const singleBinCount = 2;
    for (let i = 0; i < singleBinCount; i++) {
      const [minFill, maxFill] = currentPhase.fillRange;
      const fillLevel = Math.floor(Math.random() * (maxFill - minFill + 1)) + minFill;
      const wasteType = wasteTypes[i % wasteTypes.length];
      
      bins.push({
        id: `demo-singlebin-${i + 1}`,
        name: `Demo SingleBin ${i + 1}`,
        location: locations[(i + count) % locations.length],
        waste_type: wasteType.name,
        current_fill: fillLevel,
        fill_level: fillLevel,
        capacity: 100,
        threshold: 80,
        status: fillLevel >= 80 ? 'critical' : fillLevel >= 65 ? 'warning' : 'active',
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        sensor_id: `demo-single-sensor-${i + 1}`,
        last_updated: new Date().toISOString(),
        last_emptied: phase === 0 ? new Date().toISOString() : new Date(Date.now() - phase * 2 * 60 * 60 * 1000).toISOString(),
        installation_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        color: wasteType.color,
        icon: wasteType.icon,
        temperature: parseFloat((20 + Math.random() * 8).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 30).toFixed(1)),
        battery_level: 100 - (phase * 8) + Math.floor(Math.random() * 8),
        distance: parseFloat(((100 - fillLevel) * 0.3).toFixed(2)),
        isTestData: true,
        demoPhase: currentPhase.name
      });
    }

    return bins;
  }

  /**
   * Demo Mode: Generate alerts based on current phase
   */
  static generateDemoPhaseAlerts(bins, phase) {
    const alerts = [];
    const alertTemplates = [
      [], // Phase 0: No alerts (empty bins)
      [ // Phase 1: Info alerts
        { type: 'fill_update', severity: 'info', message: 'Fill level update' }
      ],
      [ // Phase 2: Warning alerts
        { type: 'fill_warning', severity: 'warning', message: 'Fill level above threshold' },
        { type: 'maintenance_due', severity: 'warning', message: 'Maintenance recommended' }
      ],
      [ // Phase 3: Critical alerts
        { type: 'bin_full', severity: 'critical', message: 'Bin is full - immediate action required' },
        { type: 'overflow_risk', severity: 'critical', message: 'Overflow risk detected' },
        { type: 'high_fill', severity: 'critical', message: 'Critical fill level reached' }
      ]
    ];

    const phaseAlerts = alertTemplates[phase % alertTemplates.length];
    
    bins.forEach(bin => {
      if (phaseAlerts.length === 0) return;

      if (bin.compartments) {
        // SmartBin alerts
        bin.compartments.forEach(comp => {
          if (comp.current_fill >= 70 || phase >= 2) {
            const template = phaseAlerts[Math.floor(Math.random() * phaseAlerts.length)];
            alerts.push({
              id: `demo-alert-${comp.id}-${Date.now()}-${Math.random()}`,
              compartment_id: comp.id,
              smartbin_id: bin.id,
              bin_name: bin.name,
              type: template.type,
              severity: template.severity,
              message: `${comp.waste_type}: ${template.message} (${comp.current_fill}%)`,
              recommended_action: phase >= 3 ? 'Empty immediately' : phase >= 2 ? 'Schedule collection' : 'Monitor',
              timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
              created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
              resolved: false,
              isTestData: true,
              demoPhase: phase
            });
          }
        });
      } else {
        // SingleBin alerts
        if (bin.current_fill >= 65 || phase >= 2) {
          const template = phaseAlerts[Math.floor(Math.random() * phaseAlerts.length)];
          alerts.push({
            id: `demo-alert-${bin.id}-${Date.now()}-${Math.random()}`,
            bin_id: bin.id,
            bin_name: bin.name,
            type: template.type,
            severity: template.severity,
            message: `${bin.waste_type}: ${template.message} (${bin.current_fill}%)`,
            recommended_action: phase >= 3 ? 'Empty immediately' : phase >= 2 ? 'Schedule collection' : 'Monitor',
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            resolved: false,
            isTestData: true,
            demoPhase: phase
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Start Demo Mode with timed phase progression
   */
  static startDemoMode() {
    console.log('🎬 Starting Demo Mode with timed phase cycles...');
    
    this.isTestMode = true;
    this.demoPhase = 0;
    
    // Generate initial phase data
    this.updateDemoPhase();
    
    // Set up phase progression timer
    this.demoPhaseTimer = setInterval(() => {
      this.demoPhase = (this.demoPhase + 1) % 4; // Cycle through 4 phases
      this.updateDemoPhase();
      
      const phaseNames = ['Empty/Low Level', 'Mid Level', 'High Level', 'Critical/Alert'];
      console.log(`🎬 Demo Phase ${this.demoPhase + 1}/4: ${phaseNames[this.demoPhase]}`);
    }, this.PHASE_DURATION);
    
    // Set up real-time updates within each phase (every 2 seconds)
    this.testDataInterval = setInterval(() => {
      this.updateDemoPhaseWithVariation();
    }, 2000);
    
    localStorage.setItem('testMode', 'true');
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoPhase', this.demoPhase.toString());
  }

  /**
   * Update demo phase data
   */
  static updateDemoPhase() {
    this.testBins = this.generateDemoPhaseBins(this.demoPhase, 3);
    const alerts = this.generateDemoPhaseAlerts(this.testBins, this.demoPhase);
    
    localStorage.setItem('testBins', JSON.stringify(this.testBins));
    localStorage.setItem('testAlerts', JSON.stringify(alerts));
    localStorage.setItem('demoPhase', this.demoPhase.toString());
    
    // Notify components of data update
    window.dispatchEvent(new CustomEvent('testDataUpdated', {
      detail: {
        phase: this.demoPhase,
        phaseNames: ['Empty/Low', 'Mid Level', 'High Level', 'Critical'],
        phaseName: ['Empty/Low', 'Mid Level', 'High Level', 'Critical'][this.demoPhase]
      }
    }));
  }

  /**
   * Add slight variations to current phase data for realism
   */
  static updateDemoPhaseWithVariation() {
    if (!this.testBins || this.testBins.length === 0) return;
    
    this.testBins = this.testBins.map(bin => {
      if (bin.compartments) {
        return {
          ...bin,
          compartments: bin.compartments.map(comp => ({
            ...comp,
            current_fill: Math.max(0, Math.min(100, comp.current_fill + (Math.random() - 0.3) * 2)),
            temperature: parseFloat((comp.temperature + (Math.random() - 0.5) * 0.5).toFixed(1)),
            humidity: parseFloat((comp.humidity + (Math.random() - 0.5) * 2).toFixed(1)),
            last_updated: new Date().toISOString()
          }))
        };
      } else {
        return {
          ...bin,
          current_fill: Math.max(0, Math.min(100, bin.current_fill + (Math.random() - 0.3) * 2)),
          fill_level: Math.max(0, Math.min(100, bin.fill_level + (Math.random() - 0.3) * 2)),
          temperature: parseFloat((bin.temperature + (Math.random() - 0.5) * 0.5).toFixed(1)),
          humidity: parseFloat((bin.humidity + (Math.random() - 0.5) * 2).toFixed(1)),
          last_updated: new Date().toISOString()
        };
      }
    });
    
    localStorage.setItem('testBins', JSON.stringify(this.testBins));
    
    // Only dispatch variation events, not full phase changes
    window.dispatchEvent(new CustomEvent('testDataVariation', { detail: { variation: true } }));
  }

  /**
   * Stop Demo Mode
   */
  static stopDemoMode() {
    console.log('🛑 Stopping Demo Mode...');
    
    if (this.demoPhaseTimer) {
      clearInterval(this.demoPhaseTimer);
      this.demoPhaseTimer = null;
    }
    
    if (this.testDataInterval) {
      clearInterval(this.testDataInterval);
      this.testDataInterval = null;
    }
    
    this.isTestMode = false;
    this.testBins = [];
    this.demoPhase = 0;
    
    localStorage.removeItem('testMode');
    localStorage.removeItem('demoMode');
    localStorage.removeItem('testBins');
    localStorage.removeItem('testAlerts');
    localStorage.removeItem('demoPhase');
    
    window.dispatchEvent(new CustomEvent('testDataUpdated', { detail: { stopped: true } }));
  }

  /**
   * Toggle test mode on/off
   */
  static toggleTestMode() {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      console.log('🧪 Test mode ENABLED - Starting demo with timed cycles...');
      this.startDemoMode();
    } else {
      console.log('🧪 Test mode DISABLED - Stopping demo...');
      this.stopDemoMode();
    }
    
    return this.isTestMode;
  }

  /**
   * Get current test mode status
   */
  static isTestModeEnabled() {
    return localStorage.getItem('testMode') === 'true';
  }

  /**
   * Get current demo phase info
   */
  static getDemoPhaseInfo() {
    const phase = parseInt(localStorage.getItem('demoPhase') || '0');
    const phaseNames = ['Empty/Low Level', 'Mid Level', 'High Level', 'Critical/Alert'];
    const phaseDescriptions = [
      '🟢 Bins recently emptied - Low fill levels (0-25%)',
      '🔵 Normal operation - Moderate fill levels (40-65%)',
      '🟡 Attention needed - High fill levels (70-85%)',
      '🔴 Urgent action required - Critical fill levels (86-100%)'
    ];
    
    return {
      phase,
      phaseName: phaseNames[phase],
      phaseDescription: phaseDescriptions[phase],
      totalPhases: 4,
      isActive: this.isTestModeEnabled()
    };
  }

  /**
   * Get test data (bins separated by type)
   */
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

  /**
   * Get compartments from test SmartBins
   */
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

  /**
   * Publish sensor data to Firebase for a SingleBin
   * This makes test data appear in dashboard cards that read from Firebase
   */
  static async publishSensorDataToFirebase(singleBin) {
    try {
      if (!singleBin.iot_device_id) {
        console.warn(`⚠️ SingleBin ${singleBin.id} has no IoT device ID, skipping sensor data publish`);
        return null;
      }

      const deviceId = singleBin.iot_device_id;
      const collectionName = `sensor-data-${deviceId}`;
      
      // Format sensor data in The Things Network (TTN) format that FirebaseService expects
      const sensorData = {
        // Device identification
        end_device_ids: {
          device_id: deviceId,
          application_ids: {
            application_id: 'sortyx-test-app'
          }
        },
        // Timestamp
        received_at: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        
        // Uplink message with decoded payload
        uplink_message: {
          decoded_payload: {
            // Core sensor readings
            distance: singleBin.distance || parseFloat(((100 - singleBin.current_fill) / 100 * 30).toFixed(2)),
            Distance: singleBin.distance || parseFloat(((100 - singleBin.current_fill) / 100 * 30).toFixed(2)),
            fillLevel: singleBin.fill_level || singleBin.current_fill,
            FillLevel: singleBin.fill_level || singleBin.current_fill,
            battery: singleBin.battery_level || 100,
            Battery: singleBin.battery_level || 100,
            
            // Environmental sensors
            temperature: singleBin.temperature,
            Temperature: singleBin.temperature,
            humidity: singleBin.humidity,
            Humidity: singleBin.humidity,
            
            // Status
            tilt: singleBin.tilt_status || 'normal',
            Tilt: singleBin.tilt_status || 'normal',
            
            // Additional data
            air_quality: singleBin.air_quality || null,
            odour_level: singleBin.odour_level || null
          },
          f_port: 1,
          f_cnt: Math.floor(Math.random() * 1000),
          frm_payload: 'base64encodeddata==',
          rx_metadata: [{
            gateway_ids: { gateway_id: 'test-gateway' },
            rssi: -60 - Math.random() * 20,
            snr: 8 + Math.random() * 4
          }]
        }
      };

      // Save to Firestore using FirebaseService
      const { db } = await import('../config/firebase');
      const { collection, addDoc, setDoc, doc } = await import('firebase/firestore');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return null;
      }
      
      // Add to device-specific collection
      const sensorCollectionRef = collection(db, collectionName);
      const docRef = await addDoc(sensorCollectionRef, sensorData);
      
      console.log(`✅ Published sensor data to ${collectionName} for ${deviceId}`, docRef.id);
      
      // Also add to all-sensor-data collection for discoverability
      try {
        const allDataRef = collection(db, 'all-sensor-data');
        await addDoc(allDataRef, { ...sensorData, deviceId });
      } catch (error) {
        // Ignore if all-sensor-data collection doesn't exist
        console.log('⚠️ Could not publish to all-sensor-data:', error.message);
      }
      
      return docRef.id;
      
    } catch (error) {
      console.error(`❌ Error publishing sensor data for ${singleBin.id}:`, error);
      return null;
    }
  }

  /**
   * Publish sensor data to Firebase for a SmartBin compartment
   */
  static async publishCompartmentSensorDataToFirebase(compartment, smartBin) {
    try {
      // Generate a device ID for this compartment
      const deviceId = `${compartment.sensor_id || compartment.id}`;
      const collectionName = `sensor-data-${deviceId}`;
      
      // Format sensor data in TTN format
      const sensorData = {
        end_device_ids: {
          device_id: deviceId,
          application_ids: {
            application_id: 'sortyx-test-app'
          }
        },
        received_at: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        
        uplink_message: {
          decoded_payload: {
            distance: compartment.distance,
            Distance: compartment.distance,
            fillLevel: compartment.current_fill,
            FillLevel: compartment.current_fill,
            battery: compartment.battery_level || 100,
            Battery: compartment.battery_level || 100,
            temperature: compartment.temperature,
            Temperature: compartment.temperature,
            humidity: compartment.humidity,
            Humidity: compartment.humidity,
            tilt: 'normal',
            Tilt: 'normal',
            // Compartment-specific info
            compartment_id: compartment.id,
            smartbin_id: smartBin.id,
            waste_type: compartment.waste_type
          },
          f_port: 1,
          f_cnt: Math.floor(Math.random() * 1000),
          frm_payload: 'base64encodeddata==',
          rx_metadata: [{
            gateway_ids: { gateway_id: 'test-gateway' },
            rssi: -60 - Math.random() * 20,
            snr: 8 + Math.random() * 4
          }]
        }
      };

      const { db } = await import('../config/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return null;
      }
      
      const sensorCollectionRef = collection(db, collectionName);
      const docRef = await addDoc(sensorCollectionRef, sensorData);
      
      console.log(`✅ Published compartment sensor data to ${collectionName}`);
      return docRef.id;
      
    } catch (error) {
      console.error(`❌ Error publishing compartment sensor data:`, error);
      return null;
    }
  }

  /**
   * Publish all test data to Firebase (bins, compartments, and sensor data)
   */
  static async publishTestDataToFirebase() {
    try {
      console.log('🚀 Publishing test data to Firebase...');
      
      const { smartBins, singleBins, alerts } = this.getTestData();
      
      if (smartBins.length === 0 && singleBins.length === 0) {
        console.warn('⚠️ No test data available to publish');
        return { success: false, message: 'No test data available' };
      }

      const results = {
        smartBins: [],
        singleBins: [],
        compartments: [],
        sensorData: [],
        alerts: [],
        errors: []
      };

      // Publish SmartBins and their compartments
      for (const smartBin of smartBins) {
        try {
          // Save SmartBin to Firebase
          const savedBin = await FirebaseService.saveSmartBin({
            ...smartBin,
            source: 'test-data',
            created_by: 'test-mode'
          });
          results.smartBins.push(savedBin);

          // Publish sensor data for each compartment
          if (smartBin.compartments) {
            for (const compartment of smartBin.compartments) {
              try {
                // Save compartment
                const savedComp = await FirebaseService.saveCompartment({
                  ...compartment,
                  source: 'test-data'
                });
                results.compartments.push(savedComp);

                // Publish sensor data
                const sensorDocId = await this.publishCompartmentSensorDataToFirebase(compartment, smartBin);
                if (sensorDocId) {
                  results.sensorData.push({ compartmentId: compartment.id, sensorDocId });
                }
              } catch (error) {
                console.error(`Error publishing compartment ${compartment.id}:`, error);
                results.errors.push({ type: 'compartment', id: compartment.id, error: error.message });
              }
            }
          }
        } catch (error) {
          console.error(`Error publishing SmartBin ${smartBin.id}:`, error);
          results.errors.push({ type: 'smartBin', id: smartBin.id, error: error.message });
        }
      }

      // Publish SingleBins with sensor data
      for (const singleBin of singleBins) {
        try {
          // Save SingleBin to Firebase
          const savedBin = await FirebaseService.saveSingleBin({
            ...singleBin,
            source: 'test-data',
            created_by: 'test-mode'
          });
          results.singleBins.push(savedBin);

          // Publish sensor data to sensor-data-* collection
          const sensorDocId = await this.publishSensorDataToFirebase(singleBin);
          if (sensorDocId) {
            results.sensorData.push({ binId: singleBin.id, deviceId: singleBin.iot_device_id, sensorDocId });
          }
        } catch (error) {
          console.error(`Error publishing SingleBin ${singleBin.id}:`, error);
          results.errors.push({ type: 'singleBin', id: singleBin.id, error: error.message });
        }
      }

      // Publish alerts
      for (const alert of alerts) {
        try {
          const savedAlert = await FirebaseService.saveAlert({
            ...alert,
            source: 'test-data'
          });
          results.alerts.push(savedAlert);
        } catch (error) {
          console.error(`Error publishing alert ${alert.id}:`, error);
          results.errors.push({ type: 'alert', id: alert.id, error: error.message });
        }
      }

      console.log('✅ Test data published to Firebase:', {
        smartBins: results.smartBins.length,
        singleBins: results.singleBins.length,
        compartments: results.compartments.length,
        sensorData: results.sensorData.length,
        alerts: results.alerts.length,
        errors: results.errors.length
      });

      return {
        success: true,
        results,
        message: `Published ${results.smartBins.length} SmartBins, ${results.singleBins.length} SingleBins, and ${results.sensorData.length} sensor data entries`
      };

    } catch (error) {
      console.error('❌ Error publishing test data to Firebase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update sensor data continuously while test mode is active
   */
  static async updateSensorDataContinuously() {
    if (!this.isTestModeEnabled()) {
      return;
    }

    const { singleBins, smartBins } = this.getTestData();

    // Update sensor data for SingleBins
    for (const singleBin of singleBins) {
      try {
        await this.publishSensorDataToFirebase(singleBin);
      } catch (error) {
        console.error(`Error updating sensor data for ${singleBin.id}:`, error);
      }
    }

    // Update sensor data for SmartBin compartments
    for (const smartBin of smartBins) {
      if (smartBin.compartments) {
        for (const compartment of smartBin.compartments) {
          try {
            await this.publishCompartmentSensorDataToFirebase(compartment, smartBin);
          } catch (error) {
            console.error(`Error updating compartment sensor data for ${compartment.id}:`, error);
          }
        }
      }
    }

    console.log('🔄 Sensor data updated in Firebase');
  }

  /**
   * Enhanced Start Demo Mode with Firebase publishing
   */
  static async startDemoModeWithFirebase() {
    console.log('🎬 Starting Demo Mode with Firebase publishing...');
    
    this.isTestMode = true;
    this.demoPhase = 0;
    
    // Generate initial phase data
    this.updateDemoPhase();
    
    // Publish initial data to Firebase
    await this.publishTestDataToFirebase();
    
    // Set up phase progression timer
    this.demoPhaseTimer = setInterval(async () => {
      this.demoPhase = (this.demoPhase + 1) % 4;
      this.updateDemoPhase();
      
      // Publish updated data to Firebase
      await this.publishTestDataToFirebase();
      
      const phaseNames = ['Empty/Low Level', 'Mid Level', 'High Level', 'Critical/Alert'];
      console.log(`🎬 Demo Phase ${this.demoPhase + 1}/4: ${phaseNames[this.demoPhase]}`);
    }, this.PHASE_DURATION);
    
    // Set up real-time sensor updates (every 2 seconds)
    this.testDataInterval = setInterval(async () => {
      this.updateDemoPhaseWithVariation();
      // Update sensor data in Firebase
      await this.updateSensorDataContinuously();
    }, 2000);
    
    localStorage.setItem('testMode', 'true');
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoPhase', this.demoPhase.toString());
    
    return {
      success: true,
      message: 'Demo mode started with Firebase publishing'
    };
  }

  /**
   * Enhanced Toggle with Firebase support
   */
  static async toggleTestModeWithFirebase() {
    this.isTestMode = !this.isTestMode;
    
    if (this.isTestMode) {
      console.log('🧪 Test mode ENABLED - Starting demo with Firebase publishing...');
      return await this.startDemoModeWithFirebase();
    } else {
      console.log('🧪 Test mode DISABLED - Stopping demo and clearing Firebase data...');
      this.stopDemoMode();
      // Optionally clear test data from Firebase
      // await this.clearTestDataFromFirebase();
      return {
        success: true,
        message: 'Test mode stopped'
      };
    }
  }

  /**
   * Generate test data and publish to Firebase in one operation
   */
  static async generateAndPublishTestData(options = {}) {
    try {
      console.log('🚀 Generating and publishing test data with Firebase support...');
      
      // Generate dataset
      const dataset = await this.generateCompleteDataset(options);
      
      // Store in localStorage for immediate UI updates
      const smartBins = dataset.smartBins;
      const singleBins = dataset.singleBins;
      const allBins = [...smartBins, ...singleBins];
      
      localStorage.setItem('testBins', JSON.stringify(allBins));
      localStorage.setItem('testAlerts', JSON.stringify(dataset.alerts));
      
      // Publish to Firebase
      const publishResults = {
        smartBins: [],
        singleBins: [],
        compartments: [],
        sensorData: [],
        alerts: [],
        errors: []
      };

      // Publish SmartBins
      for (const smartBin of smartBins) {
        try {
          const saved = await FirebaseService.saveSmartBin({
            ...smartBin,
            source: 'test-data'
          });
          publishResults.smartBins.push(saved);

          // Publish compartment sensor data
          if (smartBin.compartments) {
            for (const comp of smartBin.compartments) {
              const sensorDocId = await this.publishCompartmentSensorDataToFirebase(comp, smartBin);
              if (sensorDocId) {
                publishResults.sensorData.push({ compartmentId: comp.id, sensorDocId });
              }
            }
          }
        } catch (error) {
          console.error(`Error publishing SmartBin ${smartBin.id}:`, error);
          publishResults.errors.push({ type: 'smartBin', id: smartBin.id, error: error.message });
        }
      }

      // Publish SingleBins with sensor data
      for (const singleBin of singleBins) {
        try {
          const saved = await FirebaseService.saveSingleBin({
            ...singleBin,
            source: 'test-data'
          });
          publishResults.singleBins.push(saved);

          // Publish sensor data
          const sensorDocId = await this.publishSensorDataToFirebase(singleBin);
          if (sensorDocId) {
            publishResults.sensorData.push({ binId: singleBin.id, deviceId: singleBin.iot_device_id, sensorDocId });
          }
        } catch (error) {
          console.error(`Error publishing SingleBin ${singleBin.id}:`, error);
          publishResults.errors.push({ type: 'singleBin', id: singleBin.id, error: error.message });
        }
      }

      // Publish alerts
      for (const alert of dataset.alerts) {
        try {
          const saved = await FirebaseService.saveAlert({
            ...alert,
            source: 'test-data'
          });
          publishResults.alerts.push(saved);
        } catch (error) {
          console.error(`Error publishing alert ${alert.id}:`, error);
          publishResults.errors.push({ type: 'alert', id: alert.id, error: error.message });
        }
      }

      console.log('✅ Test data generated and published:', {
        smartBins: publishResults.smartBins.length,
        singleBins: publishResults.singleBins.length,
        sensorData: publishResults.sensorData.length,
        alerts: publishResults.alerts.length,
        errors: publishResults.errors.length
      });

      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('testDataPublished', {
        detail: {
          dataset,
          publishResults
        }
      }));

      return {
        success: true,
        dataset,
        publishResults
      };

    } catch (error) {
      console.error('❌ Error generating and publishing test data:', error);
      throw error;
    }
  }
}
