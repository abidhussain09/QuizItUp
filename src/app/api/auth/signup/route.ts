import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth.server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();

        const { username, email, password, role } = await req.json();

        if (!username || !email || !password || !role) {
            return new Response(
                JSON.stringify({ error: 'All fields are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const allowedRoles = ['ADMIN', 'PARTICIPANT'];
        if (!allowedRoles.includes(role)) {
            return new Response(
                JSON.stringify({ error: 'Invalid role' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return new Response(
                JSON.stringify({ error: 'User already exists' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const hashed = await hashPassword(password);

        // 📝 Create user
        const newUser = await User.create({
            username,
            email,
            password: hashed,
            role,
        });

        return new Response(
            JSON.stringify({
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('Signup Error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
