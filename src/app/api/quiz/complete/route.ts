import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { participationId } = await req.json();

        // Validate required fields
        if (!participationId) {
            return new Response(JSON.stringify({ 
                error: 'Missing required field: participationId' 
            }), {
                status: 400,
            });
        }

        // Check if participation exists
        const participation = await prisma.participation.findUnique({
            where: { id: participationId },
            include: {
                quizRoom: {
                    include: {
                        quiz: {
                            include: {
                                questions: true
                            }
                        }
                    }
                },
                participantAnswers: true
            }
        });

        if (!participation) {
            return new Response(JSON.stringify({ error: 'Participation not found' }), {
                status: 404,
            });
        }

        if (participation.completed) {
            return new Response(JSON.stringify({ 
                error: 'Quiz already completed',
                participation: participation
            }), {
                status: 400,
            });
        }

        // Calculate final score
        const totalScore = participation.participantAnswers.reduce((sum, answer) => sum + answer.marks, 0);
        const totalQuestions = participation.quizRoom.quiz.questions.length;
        const answeredQuestions = participation.participantAnswers.length;
        const correctAnswers = participation.participantAnswers.filter(answer => answer.isCorrect).length;

        // Mark participation as completed
        const completedParticipation = await prisma.participation.update({
            where: { id: participationId },
            data: { 
                completed: true,
                finishedAt: new Date(),
                score: totalScore
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
                                title: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            participation: completedParticipation,
            results: {
                totalScore: totalScore,
                totalQuestions: totalQuestions,
                answeredQuestions: answeredQuestions,
                correctAnswers: correctAnswers,
                percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
            }
        }), {
            status: 200,
        });

    } catch (error) {
        console.error('Error completing quiz:', error);
        return new Response(JSON.stringify({ error: 'Failed to complete quiz' }), {
            status: 500,
        });
    }
}
