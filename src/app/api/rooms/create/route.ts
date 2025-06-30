import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { quizId, startTime, endTime } = await req.json();

        // Validate required fields
        if (!quizId) {
            return new Response(JSON.stringify({ error: 'Quiz ID is required' }), {
                status: 400,
            });
        }

        // Validate datetime fields if provided
        if (startTime && endTime) {
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);

            // Check if dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return new Response(JSON.stringify({ error: 'Invalid datetime format' }), {
                    status: 400,
                });
            }

            // Check if end time is after start time
            if (endDate <= startDate) {
                return new Response(JSON.stringify({ error: 'End time must be after start time' }), {
                    status: 400,
                });
            }

            // Check if start time is not in the past
            const now = new Date();
            if (startDate < now) {
                return new Response(JSON.stringify({ error: 'Start time cannot be in the past' }), {
                    status: 400,
                });
            }
        }

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newRoom = await prisma.quizRoom.create({
            data: {
                id: uuidv4(),
                quizId,
                inviteCode,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
            },
        });

        return new Response(JSON.stringify({
            roomId: newRoom.id,
            inviteCode,
            startTime: newRoom.startTime,
            endTime: newRoom.endTime
        }), {
            status: 201,
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return new Response(JSON.stringify({ error: 'Room creation failed' }), {
            status: 500,
        });
    }
}
