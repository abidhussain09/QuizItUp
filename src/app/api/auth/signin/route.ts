import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await comparePassword(password, user.password))) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
        }

        const token = generateToken(user.id)

        return new Response(
            JSON.stringify({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            }),
            { status: 200 }
        )
    } catch (err) {
        console.error('Signin Error:', err)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }
}
