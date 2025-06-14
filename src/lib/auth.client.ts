// lib/auth.client.ts
import { jwtDecode } from 'jwt-decode';

type JWTPayload = {
    exp: number;
    iat: number;
    [key: string]: any;
};

export const isTokenValid = (token: string): boolean => {
    try {
        const decoded: JWTPayload = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};
