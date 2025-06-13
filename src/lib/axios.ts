import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '', // fallback to same origin
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false, // set true if you use cookies for auth
});

export default axiosInstance;
