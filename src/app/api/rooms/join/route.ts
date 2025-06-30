import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { inviteCode, userId }: { inviteCode: string; userId: string } = await req.json();

        if (!inviteCode || !userId) {
            return new Response(JSON.stringify({ error: 'Missing inviteCode or userId' }), {
                status: 400,
            });
        }

        const room = await prisma.quizRoom.findUnique({
            where: { inviteCode },
            include: {
                quiz: {
                    include: {
                        _count: {
                            select: { questions: true }
                        }
                    }
                }
            }
        });

        if (!room) {
            return new Response(JSON.stringify({ error: 'Invalid invite code' }), {
                status: 404,
            });
        }

        // Check if quiz has questions
        if (room.quiz._count.questions === 0) {
            return new Response(JSON.stringify({ error: 'This quiz has no questions yet. Please try again later.' }), {
                status: 400,
            });
        }

        // Check time-based availability
        const now = new Date();
        if (room.startTime && room.endTime) {
            if (now < room.startTime) {
                return new Response(JSON.stringify({
                    error: 'Quiz has not started yet',
                    startTime: room.startTime.toISOString()
                }), {
                    status: 400,
                });
            }

            if (now > room.endTime) {
                return new Response(JSON.stringify({
                    error: 'Quiz has ended and is no longer accepting participants',
                    endTime: room.endTime.toISOString()
                }), {
                    status: 400,
                });
            }
        }

        const existing = await prisma.participation.findFirst({
            where: { userId, quizRoomId: room.id },
        });

        if (existing) {
            return new Response(JSON.stringify({
                message: 'Already joined',
                roomId: room.id,
                participationId: existing.id,
            }), {
                status: 200,
            });
        }

        const participation = await prisma.participation.create({
            data: {
                userId,
                quizRoomId: room.id,
                joinedAt: new Date(),
                score: 0,
                completed: false,
            },
        });

        return new Response(
            JSON.stringify({ roomId: room.id, participationId: participation.id }),
            { status: 200 }
        );
    } catch (err) {
        console.error('Join Error:', err);
        return new Response(JSON.stringify({ error: 'Could not join room' }), {
            status: 500,
        });
    }
}
