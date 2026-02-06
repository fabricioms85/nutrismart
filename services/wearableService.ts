/**
 * Wearable Service
 * Integrates with Google Fit and Apple Health for activity data
 */

// Supported wearable platforms
export type WearablePlatform = 'google-fit' | 'apple-health' | 'fitbit' | 'samsung-health';

// Health data types we can retrieve
export interface HealthData {
    steps: number;
    caloriesBurned: number;
    activeMinutes: number;
    distance: number; // in meters
    heartRate?: {
        average: number;
        min: number;
        max: number;
    };
    sleep?: {
        duration: number; // in minutes
        quality: 'poor' | 'fair' | 'good' | 'excellent';
    };
    weight?: number;
    date: string;
}

// Connection status
export interface WearableConnection {
    platform: WearablePlatform;
    connected: boolean;
    lastSync?: Date;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
}

// Storage key for connections
const CONNECTIONS_KEY = 'nutrismart-wearable-connections';

// Google Fit OAuth configuration (requires setup in Google Cloud Console)
const GOOGLE_FIT_CONFIG = {
    clientId: import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID || '',
    scopes: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
    ],
    redirectUri: `${window.location.origin}/wearable-callback`,
};

// Check if wearable integration is available
export function isWearableSupported(platform: WearablePlatform): boolean {
    switch (platform) {
        case 'google-fit':
            // Google Fit requires OAuth setup
            return !!GOOGLE_FIT_CONFIG.clientId;
        case 'apple-health':
            // Apple Health only works on iOS Safari
            return /iPhone|iPad/.test(navigator.userAgent);
        case 'fitbit':
        case 'samsung-health':
            return false; // Not implemented yet
        default:
            return false;
    }
}

// Get stored connections
export function getConnections(): WearableConnection[] {
    const stored = localStorage.getItem(CONNECTIONS_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Save connection
export function saveConnection(connection: WearableConnection): void {
    const connections = getConnections();
    const existingIndex = connections.findIndex(c => c.platform === connection.platform);

    if (existingIndex >= 0) {
        connections[existingIndex] = connection;
    } else {
        connections.push(connection);
    }

    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

// Remove connection
export function removeConnection(platform: WearablePlatform): void {
    const connections = getConnections().filter(c => c.platform !== platform);
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

// Get connection status for a platform
export function getConnectionStatus(platform: WearablePlatform): WearableConnection | null {
    return getConnections().find(c => c.platform === platform) || null;
}

// Initiate Google Fit OAuth flow
export function connectGoogleFit(): void {
    if (!GOOGLE_FIT_CONFIG.clientId) {
        console.error('Google Fit client ID not configured');
        return;
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_FIT_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOOGLE_FIT_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_FIT_CONFIG.scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    window.location.href = authUrl.toString();
}

// Handle OAuth callback (to be called from callback page)
export async function handleOAuthCallback(code: string): Promise<boolean> {
    // In production, this should be handled by a backend server
    // For now, we'll just store a placeholder connection

    if (code) {
        saveConnection({
            platform: 'google-fit',
            connected: true,
            lastSync: new Date(),
            accessToken: code, // In production, exchange for proper tokens
        });
        return true;
    }

    return false;
}

// Fetch health data from Google Fit
export async function fetchGoogleFitData(date: Date = new Date()): Promise<HealthData | null> {
    const connection = getConnectionStatus('google-fit');

    if (!connection?.connected || !connection.accessToken) {
        console.error('Google Fit not connected');
        return null;
    }

    // In production, use the Google Fit REST API
    // https://developers.google.com/fit/rest/v1/get-started

    // For demo purposes, return mock data
    console.log('Fetching Google Fit data for:', date.toISOString());

    return {
        steps: Math.floor(Math.random() * 10000) + 2000,
        caloriesBurned: Math.floor(Math.random() * 500) + 1500,
        activeMinutes: Math.floor(Math.random() * 60) + 15,
        distance: Math.floor(Math.random() * 8000) + 1000,
        heartRate: {
            average: Math.floor(Math.random() * 20) + 65,
            min: Math.floor(Math.random() * 10) + 55,
            max: Math.floor(Math.random() * 30) + 100,
        },
        date: date.toISOString().split('T')[0],
    };
}

// Sync wearable data to the app
export async function syncWearableData(): Promise<HealthData | null> {
    const connections = getConnections().filter(c => c.connected);

    if (connections.length === 0) {
        return null;
    }

    // Try each connected platform
    for (const connection of connections) {
        let data: HealthData | null = null;

        switch (connection.platform) {
            case 'google-fit':
                data = await fetchGoogleFitData();
                break;
            case 'apple-health':
                // Apple Health would use the Web Health Kit API
                break;
        }

        if (data) {
            // Update last sync time
            saveConnection({
                ...connection,
                lastSync: new Date(),
            });

            return data;
        }
    }

    return null;
}

// Get available platforms for connection
export function getAvailablePlatforms(): { platform: WearablePlatform; name: string; icon: string }[] {
    const platforms: { platform: WearablePlatform; name: string; icon: string }[] = [
        { platform: 'google-fit', name: 'Google Fit', icon: '🏃' },
        { platform: 'apple-health', name: 'Apple Health', icon: '❤️' },
        { platform: 'fitbit', name: 'Fitbit', icon: '⌚' },
        { platform: 'samsung-health', name: 'Samsung Health', icon: '📱' },
    ];

    return platforms;
}

// Disconnect from a platform
export function disconnectWearable(platform: WearablePlatform): void {
    removeConnection(platform);
}

// Check if any wearable is connected
export function hasAnyWearableConnected(): boolean {
    return getConnections().some(c => c.connected);
}
