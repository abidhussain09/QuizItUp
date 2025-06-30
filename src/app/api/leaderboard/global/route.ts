import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get all completed participations across all quizzes, ordered by score
        const topParticipations = await prisma.participation.findMany({
            where: { 
                completed: true 
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
                                title: true,
                                description: true,
                                duration: true,
                                creatorId: true,
                                createdAt: true,
                                questions: {
                                    select: {
                                        marks: true
                                    }
                                }
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
            take: limit
        });

        // Calculate additional statistics for each participation
        const globalLeaderboard = topParticipations.map((participation, index) => {
            const correctAnswers = participation.participantAnswers.filter(answer => answer.isCorrect).length;
            const totalQuestions = participation.quizRoom.quiz.questions.length;
            const answeredQuestions = participation.participantAnswers.length;
            const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
            
            // Calculate completion time in minutes
            const completionTime = participation.finishedAt && participation.joinedAt 
                ? Math.round((participation.finishedAt.getTime() - participation.joinedAt.getTime()) / (1000 * 60))
                : null;

            return {
                rank: index + 1,
                participant: {
                    id: participation.user.id,
                    username: participation.user.username
                },
                quiz: {
                    id: participation.quizRoom.quiz.id,
                    title: participation.quizRoom.quiz.title,
                    description: participation.quizRoom.quiz.description,
                    duration: participation.quizRoom.quiz.duration,
                    createdBy: participation.quizRoom.quiz.creatorId,
                    createdAt: participation.quizRoom.quiz.createdAt
                },
                roomId: participation.quizRoomId,
                score: participation.score,
                correctAnswers: correctAnswers,
                totalQuestions: totalQuestions,
                answeredQuestions: answeredQuestions,
                accuracy: accuracy,
                completionTime: completionTime,
                finishedAt: participation.finishedAt,
                joinedAt: participation.joinedAt
            };
        });

        // Get overall platform statistics
        const totalQuizzes = await prisma.quiz.count();
        const totalParticipations = await prisma.participation.count({
            where: { completed: true }
        });
        const totalUsers = await prisma.user.count();
        
        // Get average score across all completed participations
        const avgScoreResult = await prisma.participation.aggregate({
            where: { completed: true },
            _avg: {
                score: true
            }
        });

        const platformStats = {
            totalQuizzes,
            totalParticipations,
            totalUsers,
            averageScore: Math.round(avgScoreResult._avg.score || 0)
        };

        return new Response(JSON.stringify({
            globalLeaderboard,
            platformStats
        }), {
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch global leaderboard' }), {
            status: 500,
        });
    }
}
