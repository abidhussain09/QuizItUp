// lib/auth.client.ts
import { jwtDecode } from 'jwt-decode';

// Define a more specific type for your JWT payload
interface JWTPayload {
    exp: number;  // Expiration timestamp
    iat: number;  // Issued at timestamp
    userId?: string;
    username?: string;
    email?: string;
    role?: string;
    // Add any other specific claims you expect in your tokens
}

export const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;

    try {
        const decoded = jwtDecode<JWTPayload>(token); // Specify generic type
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

// Additional utility functions with proper typing
export const getTokenPayload = (token: string | null): JWTPayload | null => {
    if (!token) return null;
    try {
        return jwtDecode<JWTPayload>(token);
    } catch (error) {
        console.error('Token decoding error:', error);
        return null;
    }
};

// Type-safe storage functions
interface AuthData {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}

export const storeAuthData = (data: AuthData): void => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
};

export const clearAuthData = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};