'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isTokenValid } from '@/lib/auth.client';
import { Button } from '@/components/ui/button';
import { Brain, LayoutDashboard, LogOut, User, Sparkles } from 'lucide-react';

interface User{
    id: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'PARTICIPANT';
};
export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');

        if (token && isTokenValid(token) && userString) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userString));
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        router.push('/signin');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="relative">
                            <Brain className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            QuizItUp
                        </span>
                    </Link>

                    {/* Navigation Items */}
                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                {/* User Info */}
                                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">{user?.username}</p>
                                        <p className="text-gray-500 text-xs">{user?.role}</p>
                                    </div>
                                </div>

                                {/* Dashboard Button */}
                                <Button
                                    asChild
                                    variant={pathname === '/dashboard' ? "default" : "ghost"}
                                    size="sm"
                                    className={pathname === '/dashboard'
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }
                                >
                                    <Link href="/dashboard" className="flex items-center space-x-2">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Link>
                                </Button>

                                {/* Logout Button */}
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Logout</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* Sign In Button */}
                                <Button
                                    asChild
                                    variant={pathname === '/signin' ? "default" : "ghost"}
                                    size="sm"
                                    className={pathname === '/signin'
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }
                                >
                                    <Link href="/signin">
                                        Sign In
                                    </Link>
                                </Button>

                                {/* Sign Up Button */}
                                <Button
                                    asChild
                                    variant={pathname === '/signup' ? "default" : "outline"}
                                    size="sm"
                                    className={pathname === '/signup'
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                    }
                                >
                                    <Link href="/signup">
                                        Sign Up
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
