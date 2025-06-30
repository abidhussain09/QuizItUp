import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const adminId = searchParams.get('adminId');

        if (!adminId) {
            return new Response(JSON.stringify({ error: 'Admin ID is required' }), {
                status: 400,
            });
        }

        // Verify admin user exists
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                username: true,
                role: true
            }
        });

        if (!admin || admin.role !== 'ADMIN') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
            });
        }

        // Get comprehensive quiz statistics
        const totalQuizzes = await prisma.quiz.count({
            where: { creatorId: adminId }
        });

        const totalRooms = await prisma.quizRoom.count({
            where: {
                quiz: {
                    creatorId: adminId
                }
            }
        });

        const totalParticipations = await prisma.participation.count({
            where: {
                quizRoom: {
                    quiz: {
                        creatorId: adminId
                    }
                }
            }
        });

        const completedParticipations = await prisma.participation.count({
            where: {
                completed: true,
                quizRoom: {
                    quiz: {
                        creatorId: adminId
                    }
                }
            }
        });

        // Get average score for admin's quizzes
        const avgScoreResult = await prisma.participation.aggregate({
            where: {
                completed: true,
                quizRoom: {
                    quiz: {
                        creatorId: adminId
                    }
                }
            },
            _avg: {
                score: true
            }
        });

        // Get top performers across admin's quizzes
        const topPerformers = await prisma.participation.findMany({
            where: {
                completed: true,
                quizRoom: {
                    quiz: {
                        creatorId: adminId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                quizRoom: {
                    include: {
                        quiz: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                },
                participantAnswers: {
                    select: {
                        isCorrect: true,
                        marks: true
                    }
                }
            },
            orderBy: [
                { score: 'desc' },
                { finishedAt: 'asc' }
            ],
            take: 10
        });

        // Get recent quiz activity
        const recentActivity = await prisma.participation.findMany({
            where: {
                quizRoom: {
                    quiz: {
                        creatorId: adminId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                quizRoom: {
                    include: {
                        quiz: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { joinedAt: 'desc' }
            ],
            take: 20
        });

        // Calculate completion rate
        const completionRate = totalParticipations > 0 
            ? Math.round((completedParticipations / totalParticipations) * 100)
            : 0;

        // Format top performers data
        const formattedTopPerformers = topPerformers.map((participation, index) => {
            const correctAnswers = participation.participantAnswers.filter(answer => answer.isCorrect).length;
            const totalQuestions = participation.participantAnswers.length;
            const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

            return {
                rank: index + 1,
                participant: {
                    id: participation.user.id,
                    username: participation.user.username
                },
                quiz: {
                    id: participation.quizRoom.quiz.id,
                    title: participation.quizRoom.quiz.title
                },
                score: participation.score,
                accuracy: accuracy,
                finishedAt: participation.finishedAt
            };
        });

        // Format recent activity
        const formattedRecentActivity = recentActivity.map((participation) => ({
            id: participation.id,
            participant: {
                id: participation.user.id,
                username: participation.user.username
            },
            quiz: {
                id: participation.quizRoom.quiz.id,
                title: participation.quizRoom.quiz.title
            },
            completed: participation.completed,
            score: participation.score,
            joinedAt: participation.joinedAt,
            finishedAt: participation.finishedAt
        }));

        const dashboardStats = {
            overview: {
                totalQuizzes,
                totalRooms,
                totalParticipations,
                completedParticipations,
                completionRate,
                averageScore: Math.round(avgScoreResult._avg.score || 0)
            },
            topPerformers: formattedTopPerformers,
            recentActivity: formattedRecentActivity
        };

        return new Response(JSON.stringify(dashboardStats), {
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch dashboard statistics' }), {
            status: 500,
        });
    }
}
