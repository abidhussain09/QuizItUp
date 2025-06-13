'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';


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

        try {
            const { email, username, password, role } = userData;
            const res=await axios.post('/api/auth/signup', {
                email,
                username,
                password,
                role,
            });
            console.log(res);
            router.push('/signin');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md p-4">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                </CardHeader>

                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4 mb-2">
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="role">Role</Label>
                            <select
                                name="role"
                                id="role"
                                className="w-full py-1 border rounded-md"
                                value={userData.role}
                                onChange={changeHandler}
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="PARTICIPANT">PARTICIPANT</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={userData.email}
                                onChange={changeHandler}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={userData.username}
                                onChange={changeHandler}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={userData.password}
                                onChange={changeHandler}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={userData.confirmPassword}
                                onChange={changeHandler}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/signin" className="text-blue-600 hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
