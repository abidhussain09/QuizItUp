'use client';

import { useState } from "react";
import axios from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Users, Clock, Sparkles } from "lucide-react";

type CreateQuizProps = {
    userId: string;
};

type QuizState = 'idle' | 'creating' | 'created' | 'error';

export default function CreateQuiz({ userId }: CreateQuizProps) {
    const [quizId, setQuizId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [state, setState] = useState<QuizState>('idle');
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [quizData, setQuizData] = useState({
        title: "",
        description: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuizData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const createQuizWithRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setState('creating');
        setError('');

        try {
            // Step 1: Create the quiz first
            const quizResponse = await axios.post('/api/quizzes/create', {
                title: quizData.title,
                description: quizData.description,
                creatorId: userId
            });

            const { quizId } = quizResponse.data;
            setQuizId(quizId);

            // Step 2: Create a room for the quiz using the quiz ID
            const roomResponse = await axios.post('/api/rooms/create', {
                quizId: quizId
            });

            const { roomId, inviteCode } = roomResponse.data;
            setRoomId(roomId);
            setInviteCode(inviteCode);
            setState('created');
        } catch (error: any) {
            console.error('Error creating quiz or room:', error);
            setError(error.response?.data?.error || 'Failed to create quiz room');
            setState('error');
        }
    };

    const copyInviteCode = async () => {
        if (inviteCode) {
            try {
                await navigator.clipboard.writeText(inviteCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const resetForm = () => {
        setState('idle');
        setQuizData({ title: "", description: "" });
        setQuizId(null);
        setRoomId(null);
        setInviteCode(null);
        setError('');
        setCopied(false);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quiz Creation Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-indigo-600" />
                            <CardTitle className="text-2xl text-gray-800">Create New Quiz</CardTitle>
                        </div>
                        <CardDescription className="text-gray-600">
                            Set up your quiz details and generate an invite code for participants
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={createQuizWithRoom} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                                    Quiz Title
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    placeholder="Enter an engaging quiz title..."
                                    value={quizData.title}
                                    onChange={handleInputChange}
                                    required
                                    disabled={state === 'creating'}
                                    className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                    Description
                                </Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe what this quiz is about..."
                                    value={quizData.description}
                                    onChange={handleInputChange}
                                    required
                                    disabled={state === 'creating'}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={state === 'creating' || state === 'created'}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                            >
                                {state === 'creating' ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating Quiz Room...
                                    </>
                                ) : state === 'created' ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Quiz Created Successfully!
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-4 w-4 mr-2" />
                                        Create Quiz Room
                                    </>
                                )}
                            </Button>

                            {state === 'created' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    className="w-full h-10 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                    Create Another Quiz
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Invite Code Display */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6 text-emerald-600" />
                            <CardTitle className="text-2xl text-gray-800">Quiz Room</CardTitle>
                        </div>
                        <CardDescription className="text-gray-600">
                            Share the invite code with participants to join your quiz
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state === 'idle' && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-lg">Create a quiz to generate invite code</p>
                                <p className="text-gray-400 text-sm mt-2">Fill out the form and click "Create Quiz Room"</p>
                            </div>
                        )}

                        {state === 'creating' && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                                <p className="text-gray-600 text-lg">Setting up your quiz room...</p>
                                <p className="text-gray-400 text-sm mt-2">This will just take a moment</p>
                            </div>
                        )}

                        {state === 'created' && inviteCode && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Check className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Quiz Room Created!</h3>
                                    <p className="text-gray-600 text-sm">Share this code with your participants</p>
                                </div>

                                <div className="bg-white border-2 border-emerald-200 rounded-lg p-6">
                                    <div className="text-center">
                                        <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                            Invite Code
                                        </Label>
                                        <div className="mt-2 flex items-center justify-center gap-3">
                                            <span className="text-3xl font-bold text-emerald-600 tracking-wider font-mono">
                                                {inviteCode}
                                            </span>
                                            <Button
                                                onClick={copyInviteCode}
                                                variant="outline"
                                                size="sm"
                                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium text-gray-700">Quiz ID</span>
                                        </div>
                                        <p className="text-gray-600 font-mono text-xs break-all">{quizId}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium text-gray-700">Room ID</span>
                                        </div>
                                        <p className="text-gray-600 font-mono text-xs break-all">{roomId}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                                    <ul className="text-blue-700 text-sm space-y-1">
                                        <li>• Share the invite code with participants</li>
                                        <li>• Participants can join using the code</li>
                                        <li>• Monitor participation in the admin dashboard</li>
                                        <li>• Start the quiz when ready</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {state === 'error' && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 text-2xl">⚠</span>
                                </div>
                                <p className="text-red-600 text-lg">Failed to create quiz room</p>
                                <p className="text-gray-500 text-sm mt-2">Please try again or check your connection</p>
                                <Button
                                    onClick={resetForm}
                                    variant="outline"
                                    className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}