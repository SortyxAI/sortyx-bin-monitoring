export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

/**
 * Calculate fill level percentage based on bin height and sensor value
 * Formula: Fill Level % = ((binHeight - sensorValue) / binHeight) × 100
 * 
 * @param sensorValue - Current sensor reading (distance from sensor to waste surface in cm)
 * @param binHeight - Total height of the bin in cm
 * @param maxFill - Maximum fill percentage (default 100)
 * @returns Fill level percentage (0-100)
 */
export function calculateFillLevel(
    sensorValue: number | undefined | null,
    binHeight: number | undefined | null,
    maxFill: number = 100
): number {
    // Validate inputs
    if (sensorValue === undefined || sensorValue === null || 
        binHeight === undefined || binHeight === null || 
        binHeight <= 0) {
        return 0;
    }

    // Ensure sensorValue is not negative
    const safeSensorValue = Math.max(0, sensorValue);
    
    // Calculate fill level using the formula
    const fillLevel = ((binHeight - safeSensorValue) / binHeight) * 100;
    
    // Clamp the result between 0 and maxFill
    return Math.max(0, Math.min(maxFill, Math.round(fillLevel)));
}