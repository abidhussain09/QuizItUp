'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, Shield, Users } from 'lucide-react';


export default function SignUpPage() {
    const router = useRouter();

    const [userData, setUserData] = useState({
        role: 'PARTICIPANT',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (userData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const { email, username, password, role } = userData;
            await axios.post('/api/auth/signup', {
                email,
                username,
                password,
                role,
            });
            router.push('/signin?message=Account created successfully');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Brain className="h-12 w-12 text-indigo-600" />
                            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Join QuizItUp
                    </h1>
                    <p className="text-gray-600 mt-2">Create your account and start your quiz adventure</p>
                </div>

                {/* Sign Up Card */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-semibold text-center text-gray-800">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600">
                            Fill in your details to get started
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSignUp}>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center space-x-2">
                                    <span className="text-red-500">⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                                    Account Type
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                            userData.role === 'ADMIN'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => setUserData({...userData, role: 'ADMIN'})}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Shield className="h-5 w-5 text-indigo-600" />
                                            <div>
                                                <p className="font-medium text-sm">Admin</p>
                                                <p className="text-xs text-gray-500">Create quizzes</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="ADMIN"
                                            checked={userData.role === 'ADMIN'}
                                            onChange={changeHandler}
                                            className="absolute top-2 right-2"
                                        />
                                    </div>
                                    <div
                                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                            userData.role === 'PARTICIPANT'
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => setUserData({...userData, role: 'PARTICIPANT'})}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Users className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium text-sm">Participant</p>
                                                <p className="text-xs text-gray-500">Take quizzes</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="PARTICIPANT"
                                            checked={userData.role === 'PARTICIPANT'}
                                            onChange={changeHandler}
                                            className="absolute top-2 right-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        value={userData.email}
                                        onChange={changeHandler}
                                        className="pl-10 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                                    Username
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Choose a username"
                                        required
                                        value={userData.username}
                                        onChange={changeHandler}
                                        className="pl-10 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        required
                                        value={userData.password}
                                        onChange={changeHandler}
                                        className="pl-10 pr-10 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        required
                                        value={userData.confirmPassword}
                                        onChange={changeHandler}
                                        className="pl-10 pr-10 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4 pt-6">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        href="/signin"
                                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
