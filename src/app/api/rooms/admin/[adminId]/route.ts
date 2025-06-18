import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { adminId: string } }) {
    try {
        const adminId = params.adminId;

        if (!adminId) {
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), {
                status: 400,
            });
        }

        // Verify the user exists and is an admin
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
        });

        if (!admin) {
            return new Response(JSON.stringify({ error: 'Admin not found' }), {
                status: 404,
            });
        }

        if (admin.role !== 'ADMIN') {
            return new Response(JSON.stringify({ error: 'Access denied. Admin role required.' }), {
                status: 403,
            });
        }

        // Fetch all quiz rooms created by this admin with related data
        const rooms = await prisma.quizRoom.findMany({
            where: {
                quiz: {
                    creatorId: adminId,
                },
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true,
                        _count: {
                            select: {
                                questions: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        participations: true,
                    },
                },
                participations: {
                    select: {
                        id: true,
                        joinedAt: true,
                        completed: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform the data to include computed fields
        const roomsWithStatus = rooms.map(room => {
            const participantCount = room._count.participations;
            const questionCount = room.quiz._count.questions;
            const completedParticipants = room.participations.filter(p => p.completed).length;
            const now = new Date();

            // Determine room status based on time and other factors
            let status: 'active' | 'inactive' | 'no_questions' | 'not_started' | 'closed' = 'inactive';

            if (questionCount === 0) {
                status = 'no_questions';
            } else if (room.startTime && room.endTime) {
                // Time-based status logic
                if (now < room.startTime) {
                    status = 'not_started';
                } else if (now > room.endTime) {
                    status = 'closed';
                } else if (participantCount > 0) {
                    status = 'active';
                } else {
                    status = 'inactive';
                }
            } else if (participantCount > 0) {
                // Legacy rooms without time constraints
                status = 'active';
            }

            return {
                id: room.id,
                inviteCode: room.inviteCode,
                createdAt: room.createdAt,
                startTime: room.startTime,
                endTime: room.endTime,
                quiz: {
                    id: room.quiz.id,
                    title: room.quiz.title,
                    description: room.quiz.description,
                    duration: room.quiz.duration,
                    createdAt: room.quiz.createdAt,
                    questionCount: questionCount,
                },
                participantCount: participantCount,
                completedParticipants: completedParticipants,
                status: status,
                participants: room.participations.map(p => ({
                    id: p.id,
                    joinedAt: p.joinedAt,
                    completed: p.completed,
                    user: p.user,
                })),
            };
        });

        return new Response(JSON.stringify({ 
            rooms: roomsWithStatus,
            totalRooms: roomsWithStatus.length,
            activeRooms: roomsWithStatus.filter(r => r.status === 'active').length,
            totalParticipants: roomsWithStatus.reduce((sum, r) => sum + r.participantCount, 0),
        }), {
            status: 200,
        });
    } catch (error) {
        console.error('Error fetching admin rooms:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch rooms' }), {
            status: 500,
        });
    }
}
