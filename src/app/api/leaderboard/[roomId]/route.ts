import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;

        if (!roomId) {
            return new Response(JSON.stringify({ error: 'Room ID is required' }), {
                status: 400,
            });
        }

        // Verify room exists
        const room = await prisma.quizRoom.findUnique({
            where: { id: roomId },
            include: {
                quiz: {
                    select: {
                        title: true,
                        description: true,
                        duration: true,
                        questions: {
                            select: {
                                marks: true
                            }
                        }
                    }
                }
            }
        });

        if (!room) {
            return new Response(JSON.stringify({ error: 'Room not found' }), {
                status: 404,
            });
        }

        // Get all completed participations for this room, ordered by score (descending)
        const participations = await prisma.participation.findMany({
            where: { 
                quizRoomId: roomId,
                completed: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
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
                { finishedAt: 'asc' } // Earlier completion time as tiebreaker
            ]
        });

        // Calculate additional statistics for each participant
        const leaderboard = participations.map((participation, index) => {
            const correctAnswers = participation.participantAnswers.filter(answer => answer.isCorrect).length;
            const totalQuestions = room.quiz.questions.length;
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

        // Calculate quiz statistics
        const totalPossibleMarks = room.quiz.questions.reduce((sum, question) => sum + question.marks, 0);
        const averageScore = participations.length > 0 
            ? Math.round(participations.reduce((sum, p) => sum + p.score, 0) / participations.length)
            : 0;
        
        const highestScore = participations.length > 0 ? participations[0].score : 0;

        return new Response(JSON.stringify({
            quiz: {
                title: room.quiz.title,
                description: room.quiz.description,
                duration: room.quiz.duration,
                totalQuestions: room.quiz.questions.length,
                totalPossibleMarks: totalPossibleMarks
            },
            statistics: {
                totalParticipants: participations.length,
                averageScore: averageScore,
                highestScore: highestScore
            },
            leaderboard: leaderboard
        }), {
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
            status: 500,
        });
    }
}
