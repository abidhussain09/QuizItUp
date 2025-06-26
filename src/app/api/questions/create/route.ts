// POST /api/questions/create
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            quizId,
            text,
            imageUrl,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            marks
        } = body;

        const question = await prisma.question.create({
            data: {
                quizId,
                text,
                imageUrl: imageUrl || null,
                optionA,
                optionB,
                optionC,
                optionD,
                correctOption,
                marks,
            },
        });

        return new Response(JSON.stringify({ success: true, question }), {
            status: 201,
        });
    } catch (error) {
        console.error('Error creating question:', error);
        return new Response(JSON.stringify({ error: 'Failed to create question' }), {
            status: 500,
        });
    }
}
