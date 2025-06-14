'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isTokenValid } from '@/lib/auth.client';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // Detect route changes

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && isTokenValid(token)) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [pathname]); // Run effect on initial render + every route change

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        router.push('/signin');
    };

    return (
        <nav className="flex items-center justify-between px-12 py-4 shadow-md border-b">
            <div className="text-2xl font-bold">
                <Link href="/">QuizItUp</Link>
            </div>
            <div className="space-x-4">
                {isLoggedIn ? (
                    <>
                        <Link href="/dashboard">
                            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                Dashboard
                            </button>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/signin">
                            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                Sign In
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                Sign Up
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
