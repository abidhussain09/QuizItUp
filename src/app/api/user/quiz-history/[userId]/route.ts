import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
            });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
            });
        }

        // Get all participations for this user
        const participations = await prisma.participation.findMany({
            where: { 
                userId: userId 
            },
            include: {
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
                { joinedAt: 'desc' }
            ]
        });

        // Calculate detailed statistics for each participation
        const quizHistory = participations.map((participation) => {
            const correctAnswers = participation.participantAnswers.filter(answer => answer.isCorrect).length;
            const totalQuestions = participation.quizRoom.quiz.questions.length;
            const answeredQuestions = participation.participantAnswers.length;
            const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
            const totalPossibleMarks = participation.quizRoom.quiz.questions.reduce((sum, q) => sum + q.marks, 0);
            
            // Calculate completion time in minutes
            const completionTime = participation.finishedAt && participation.joinedAt 
                ? Math.round((participation.finishedAt.getTime() - participation.joinedAt.getTime()) / (1000 * 60))
                : null;

            return {
                id: participation.id,
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
                totalPossibleMarks: totalPossibleMarks,
                completionTime: completionTime,
                completed: participation.completed,
                joinedAt: participation.joinedAt,
                finishedAt: participation.finishedAt,
                status: participation.completed ? 'completed' : 'incomplete'
            };
        });

        // Calculate user statistics
        const completedQuizzes = quizHistory.filter(q => q.completed);
        const totalScore = completedQuizzes.reduce((sum, q) => sum + q.score, 0);
        const averageScore = completedQuizzes.length > 0 ? Math.round(totalScore / completedQuizzes.length) : 0;
        const totalCorrectAnswers = completedQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0);
        const totalQuestionsAttempted = completedQuizzes.reduce((sum, q) => sum + q.answeredQuestions, 0);
        const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100) : 0;

        const userStats = {
            totalQuizzes: participations.length,
            completedQuizzes: completedQuizzes.length,
            incompleteQuizzes: participations.length - completedQuizzes.length,
            totalScore: totalScore,
            averageScore: averageScore,
            overallAccuracy: overallAccuracy,
            totalCorrectAnswers: totalCorrectAnswers,
            totalQuestionsAttempted: totalQuestionsAttempted
        };

        return new Response(JSON.stringify({
            user,
            quizHistory,
            userStats
        }), {
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching user quiz history:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch quiz history' }), {
            status: 500,
        });
    }
}
