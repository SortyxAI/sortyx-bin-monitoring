# Two-Layer Structure Implementation

## Overview
The sortyx-bin-monitoring application has been enhanced with a clear two-layer architecture for both Single Bins and SmartBins.

## Layer Structure

### Layer 1: Bin Level (Parent)
Contains high-level bin information:
- **Name**: User-defined bin name
- **Location**: Physical location of the bin
- **Description**: Optional description of the bin

### Layer 2: Compartment Level (Child)
Contains operational and technical details:
- **Compartment Name**: Auto-generated unique identifier (e.g., COMP-ABC123)
- **Bin Type**: recyclable, general_waste, compost, organic, hazardous, mixed
- **IoT Device ID**: Connected sensor device identifier
- **Capacity**: Volume in liters
- **Bin Height**: Height in centimeters
- **Threshold %**: Fill level alert threshold
- **Status**: active or suspended

## Implementation Details

### Single Bins
For Single Bins, the compartment is implicit (one bin = one compartment):
- The bin itself serves as Layer 1
- Operational details are treated as Layer 2 (compartment data)
- Auto-generated compartment name stored in `compartment_name` field
- All sensor and operational data belong to Layer 2

### SmartBins
SmartBins can have multiple compartments:
- SmartBin serves as Layer 1 (name, location, description)
- Each compartment is a separate Layer 2 entity
- Multiple compartments can exist under one SmartBin
- Each compartment has its own auto-generated name, sensors, and settings

## Updated Components

### 1. SmartBinForm.jsx
- **Purpose**: Add/Edit SmartBin (Layer 1)
- **Fields**: Name, Location, Description only
- **Removed**: Sensor configurations (moved to compartment level)

### 2. CompartmentForm.jsx
- **Purpose**: Add/Edit Compartments (Layer 2)
- **Fields**: 
  - Label (user-friendly name)
  - Auto-generated compartment name
  - Bin Type
  - IoT Device ID
  - Capacity
  - Bin Height
  - Threshold %
  - Status
  - Sensor configurations

### 3. SingleBinForm.jsx
- **Purpose**: Add/Edit Single Bin with implicit compartment
- **Layer 1 Fields**: Name, Location, Description
- **Layer 2 Fields**: 
  - Auto-generated compartment name
  - Bin Type
  - IoT Device ID
  - Capacity
  - Bin Height
  - Threshold %
  - Status

### 4. SmartBinCard.jsx (Dashboard)
- Displays SmartBin information (Layer 1) in card header
- Shows all compartments (Layer 2) when expanded
- Each compartment displays:
  - Auto-generated compartment name
  - Bin type badge
  - IoT device ID
  - Height and capacity
  - Status badge
  - Fill level visualization
  - Individual sensor readings

### 5. SingleBinDashboardCard.jsx (Dashboard)
- Displays bin information (Layer 1) in card header
- Shows compartment information (Layer 2) in a dedicated section
- Displays:
  - Auto-generated compartment name
  - Bin type
  - IoT device ID
  - Height and capacity
  - Status
  - Fill level and sensor data

## Data Flow

### Creating a SmartBin
1. User creates SmartBin with name, location, description (Layer 1)
2. User adds compartments with full technical details (Layer 2)
3. Each compartment gets auto-generated unique name
4. System associates compartments with parent SmartBin

### Creating a Single Bin
1. User creates Single Bin with Layer 1 fields (name, location, description)
2. User fills Layer 2 fields (bin type, device ID, capacity, etc.)
3. System auto-generates compartment name
4. All data stored in one entity with clear layer separation

## Benefits

1. **Clear Separation of Concerns**: Business logic (Layer 1) vs Technical details (Layer 2)
2. **Scalability**: Easy to add multiple compartments to SmartBins
3. **Consistency**: Same structure for Single Bins and SmartBins
4. **Maintainability**: Each layer can be edited independently
5. **Unique Identification**: Auto-generated compartment names ensure traceability
6. **IoT Integration**: Device IDs clearly associated with specific compartments

## Auto-Generated Compartment Names

Format: `COMP-[RANDOM_STRING]`
- Example: `COMP-A1B2C3`, `COMP-X7Y8Z9`
- Ensures unique identification across the system
- Used for tracking, logging, and API integration
- Automatically generated on creation, cannot be manually edited

## UI/UX Enhancements

### Dashboard View
- **Layer 1**: Prominently displayed as card title with location
- **Layer 2**: Shown in dedicated compartment section with visual hierarchy
- **Visual Separation**: Clear borders and color coding distinguish layers
- **Status Indicators**: Real-time status badges for each compartment

### Form View
- **Separate Forms**: Clear distinction between bin and compartment creation
- **Sequential Workflow**: Create bin first, then add compartments
- **Auto-Population**: Compartment names generated automatically
- **Validation**: Layer-specific field validation

## Future Enhancements

1. **Bulk Compartment Creation**: Add multiple compartments at once
2. **Compartment Templates**: Pre-configured compartment types
3. **Advanced Analytics**: Layer-specific reporting and insights
4. **Compartment Groups**: Logical grouping of compartments
5. **Historical Tracking**: Per-compartment history and trends

## Migration Notes

Existing bins should be updated to include:
- `compartment_name` field for Single Bins
- `compartment_name` field for each Compartment
- Clear separation of Layer 1 and Layer 2 data

