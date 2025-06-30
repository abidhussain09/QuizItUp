import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { title, description, duration, creatorId } = await req.json();

        if (!title || !description || !creatorId) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
            });
        }

        // Validate duration
        if (duration !== undefined) {
            if (typeof duration !== 'number' || duration < 5 || duration > 180) {
                return new Response(JSON.stringify({ error: 'Duration must be between 5 and 180 minutes' }), {
                    status: 400,
                });
            }
        }

        const quiz = await prisma.quiz.create({
            data: {
                id: uuidv4(),
                title,
                description,
                duration: duration || 30, // Default to 30 minutes if not provided
                creatorId,
            },
        });

        return new Response(JSON.stringify({
            quizId: quiz.id,
            duration: quiz.duration
        }), { status: 201 });
    } catch (error) {
        console.error('Error creating quiz:', error);
        return new Response(JSON.stringify({ error: 'Failed to create quiz' }), {
            status: 500,
        });
    }
}
