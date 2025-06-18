import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { participationId, questionId, selectedOption } = await req.json();

        // Validate required fields
        if (!participationId || !questionId || !selectedOption) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: participationId, questionId, selectedOption'
            }), {
                status: 400,
            });
        }

        // Validate selectedOption format
        if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
            return new Response(JSON.stringify({
                error: 'Invalid selectedOption. Must be A, B, C, or D'
            }), {
                status: 400,
            });
        }

        // Check if participation exists and is not completed
        const participation = await prisma.participation.findUnique({
            where: { id: participationId },
            include: {
                quizRoom: {
                    include: {
                        quiz: true
                    }
                }
            }
        });

        if (!participation) {
            return new Response(JSON.stringify({ error: 'Participation not found' }), {
                status: 404,
            });
        }

        if (participation.completed) {
            return new Response(JSON.stringify({ error: 'Quiz already completed' }), {
                status: 400,
            });
        }

        // Get question details
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return new Response(JSON.stringify({ error: 'Question not found' }), {
                status: 404,
            });
        }

        // Verify question belongs to the quiz
        if (question.quizId !== participation.quizRoom.quizId) {
            return new Response(JSON.stringify({ error: 'Question does not belong to this quiz' }), {
                status: 400,
            });
        }

        // Check if answer already exists
        const existingAnswer = await prisma.participantAnswer.findUnique({
            where: {
                participationId_questionId: {
                    participationId,
                    questionId
                }
            }
        });

        if (existingAnswer) {
            return new Response(JSON.stringify({
                error: 'Answer already submitted for this question',
                currentAnswer: existingAnswer
            }), {
                status: 400,
            });
        }

        // Calculate if answer is correct
        const isCorrect = question.correctOption === selectedOption;
        const marksEarned = isCorrect ? question.marks : 0;

        // Create participant answer
        const participantAnswer = await prisma.participantAnswer.create({
            data: {
                participationId,
                questionId,
                selectedOption,
                isCorrect,
                marks: marksEarned,
                answeredAt: new Date(),
            },
        });

        // Calculate new total score
        const allAnswers = await prisma.participantAnswer.findMany({
            where: { participationId },
        });

        const totalScore = allAnswers.reduce((sum, answer) => sum + answer.marks, 0);

        // Update participation score
        await prisma.participation.update({
            where: { id: participationId },
            data: { score: totalScore },
        });

        return new Response(JSON.stringify({
            success: true,
            answer: participantAnswer,
            totalScore: totalScore,
            isCorrect: isCorrect,
            marksEarned: marksEarned,
            answeredQuestions: allAnswers.length
        }), {
            status: 200,
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        return new Response(JSON.stringify({ error: 'Failed to submit answer' }), {
            status: 500,
        });
    }
}