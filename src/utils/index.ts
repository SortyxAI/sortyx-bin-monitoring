export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

// ✅ NEW: Debug Logging System
// Control logging levels via DevTools console
// Usage: window.SORTYX_DEBUG = true; // Enable debug logging
// Usage: window.SORTYX_DEBUG = false; // Disable debug logging (default)

declare global {
    interface Window {
        SORTYX_DEBUG?: boolean;
        enableDebugLogging?: () => void;
        disableDebugLogging?: () => void;
    }
}

export enum LogLevel {
    ERROR = 0,    // Always shown - critical errors
    WARN = 1,     // Always shown - warnings
    INFO = 2,     // Always shown - important info for users
    DEBUG = 3,    // Only shown when DEBUG enabled - detailed debugging
    TRACE = 4     // Only shown when DEBUG enabled - very detailed traces
}

class Logger {
    private static instance: Logger;
    private debugEnabled: boolean = false;

    private constructor() {
        // Initialize from localStorage or default to false
        const stored = localStorage.getItem('sortyx_debug_mode');
        this.debugEnabled = stored === 'true';
        
        // Set up global debug controls
        window.SORTYX_DEBUG = this.debugEnabled;
        window.enableDebugLogging = () => this.enableDebug();
        window.disableDebugLogging = () => this.disableDebug();

        // Show info on how to enable debug mode
        if (!this.debugEnabled) {
            console.info(
                '%c🔧 Sortyx Debug Mode',
                'color: #9333ea; font-weight: bold; font-size: 14px;',
                '\n' +
                'Debug logging is currently OFF (optimized for performance).\n' +
                'To enable detailed logging, run in DevTools console:\n' +
                '  → window.enableDebugLogging()\n' +
                'To disable:\n' +
                '  → window.disableDebugLogging()'
            );
        }
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    enableDebug(): void {
        this.debugEnabled = true;
        window.SORTYX_DEBUG = true;
        localStorage.setItem('sortyx_debug_mode', 'true');
        console.info(
            '%c✅ Debug Logging Enabled',
            'color: #10b981; font-weight: bold; font-size: 14px;',
            '\nDetailed logging is now active. Refresh page to see all logs.'
        );
    }

    disableDebug(): void {
        this.debugEnabled = false;
        window.SORTYX_DEBUG = false;
        localStorage.setItem('sortyx_debug_mode', 'false');
        console.info(
            '%c🔇 Debug Logging Disabled',
            'color: #f59e0b; font-weight: bold; font-size: 14px;',
            '\nLogging optimized for performance.'
        );
    }

    isDebugEnabled(): boolean {
        return this.debugEnabled || window.SORTYX_DEBUG === true;
    }

    private getTimestamp(): string {
        return new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
        });
    }

    error(module: string, message: string, ...args: any[]): void {
        console.error(`[${this.getTimestamp()}] ❌ ${module}:`, message, ...args);
    }

    warn(module: string, message: string, ...args: any[]): void {
        console.warn(`[${this.getTimestamp()}] ⚠️ ${module}:`, message, ...args);
    }

    info(module: string, message: string, ...args: any[]): void {
        console.info(`[${this.getTimestamp()}] ℹ️ ${module}:`, message, ...args);
    }

    debug(module: string, message: string, ...args: any[]): void {
        if (this.isDebugEnabled()) {
            console.log(`[${this.getTimestamp()}] 🔍 ${module}:`, message, ...args);
        }
    }

    trace(module: string, message: string, ...args: any[]): void {
        if (this.isDebugEnabled()) {
            console.log(`[${this.getTimestamp()}] 📋 ${module}:`, message, ...args);
        }
    }

    success(module: string, message: string, ...args: any[]): void {
        if (this.isDebugEnabled()) {
            console.log(`[${this.getTimestamp()}] ✅ ${module}:`, message, ...args);
        }
    }

    // Group logging for complex operations
    group(module: string, title: string): void {
        if (this.isDebugEnabled()) {
            console.group(`[${this.getTimestamp()}] 📦 ${module}: ${title}`);
        }
    }

    groupEnd(): void {
        if (this.isDebugEnabled()) {
            console.groupEnd();
        }
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

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