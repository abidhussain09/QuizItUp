// app/api/questions/get/[roomId]/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

import QuizRoom from '@/models/QuizRoom';
import Question from '@/models/Question';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },   // ← params is a Promise
) {
    await connectDB();

    try {
        /* ────── await params FIRST ────── */
        const { roomId } = await params;                      // ✅ no warning

        if (!Types.ObjectId.isValid(roomId)) {
            return new Response(
                JSON.stringify({ error: 'Invalid room ID format' }),
                { status: 400 },
            );
        }

        /* ────── fetch room + quiz ────── */
        const room = await QuizRoom.findById(roomId)
            .populate({ path: 'quizId', model: 'Quiz' })
            .exec();

        if (!room) {
            return new Response(
                JSON.stringify({ error: 'Room not found' }),
                { status: 404 },
            );
        }

        const quizDoc = room.quizId as {
            _id: Types.ObjectId;
            title: string;
            description: string;
            duration: number;
        };

        /* ────── fetch questions ────── */
        const questions = await Question.find({ quizId: quizDoc._id })
            .select('text imageUrl optionA optionB optionC optionD marks') // _id comes by default
            .exec();

        return new Response(
            JSON.stringify({
                questions,
                quiz: {
                    id: quizDoc._id.toString(),
                    title: quizDoc.title,
                    description: quizDoc.description,
                    duration: quizDoc.duration,
                },
            }),
            { status: 200 },
        );
    } catch (err) {
        console.error('Fetch Questions Error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 },
        );
    }
}
