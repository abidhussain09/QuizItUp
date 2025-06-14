'use client';

import { isTokenValid } from "@/lib/auth.client";  
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Label } from "@radix-ui/react-label";

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [role, setRole]=useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString=localStorage.getItem('user');
        if (!token || !isTokenValid(token) || !userString) {
            localStorage.removeItem('token');
            router.push('/signin');
        } else {
            const user = JSON.parse(userString); 
            setRole(user.role); 
            setLoading(false);
        }
    }, []);

    if (loading) return <div>Loading...</div>;
    return (
        <div className="flex flex-col items-center w-full h-screen p-12">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {role === 'ADMIN' 
                && 
                <div>Admin</div>
            }
            {role === 'PARTICIPANT' 
                &&
                <div className="flex w-full">
                    <div className="flex flex-col basis-1/2 p-6 gap-2 border-3 border-dashed border-black m-4 rounded-2xl">
                        <h2 className="text-4xl">Attend a Quiz Now!!!</h2>
                        <p className="text-2xl">Enter the quiz link and join now</p>
                        <form className="flex flex-col items-start gap-1">
                        <Label htmlFor="link" className="text-lg">Quiz Link</Label>
                        <input 
                        className="border-1 border-neutral-400 w-1/2 h-8 text-lg rounded-lg p-2"
                        type="text" id="link"/>
                        <button type="submit" className="bg-green-400 rounded-2xl h-10 w-1/2 text-2xl">Join Now</button>
                        </form>
                    </div>
                    <div className="basis-1/2">

                    </div>
                </div>
            }
        </div>
    );
}
