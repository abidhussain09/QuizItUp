import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json()

        if (!username || !email || !password) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 })
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        })

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 })
        }

        const hashed = await hashPassword(password)

        const user = await prisma.user.create({
            data: { username, email, password: hashed },
        })

        return new Response(
            JSON.stringify({ id: user.id, email: user.email, role: user.role }),
            { status: 201 }
        )
    } catch (err) {
        console.error('Signup Error:', err)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }
}
