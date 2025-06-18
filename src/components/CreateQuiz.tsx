'use client';

import { useState } from "react";
import axios from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Users, Clock, Sparkles, Plus, Trash2, Save, HelpCircle } from "lucide-react";
import AdminRoomList from "./AdminRoomList";

type CreateQuizProps = {
    userId: string;
};

type QuizState = 'idle' | 'creating' | 'created' | 'error';

type Question = {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
};

type QuestionForm = {
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
};

export default function CreateQuiz({ userId }: CreateQuizProps) {
    const [quizId, setQuizId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [state, setState] = useState<QuizState>('idle');
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    // Helper function to get default datetime values
    const getDefaultStartTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // 30 minutes from now
        return now.toISOString().slice(0, 16); // Format for datetime-local input
    };

    const getDefaultEndTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 2); // 2 hours from now
        return now.toISOString().slice(0, 16); // Format for datetime-local input
    };

    const [quizData, setQuizData] = useState({
        title: "",
        description: "",
        duration: 30, // Default 30 minutes
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime()
    });

    // Question management state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [questionForm, setQuestionForm] = useState<QuestionForm>({
        text: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        marks: 1
    });
    const [questionLoading, setQuestionLoading] = useState(false);
    const [questionError, setQuestionError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuizData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateDateTime = () => {
        if (!quizData.startTime || !quizData.endTime) {
            setError('Please select both start and end times');
            return false;
        }

        const startDate = new Date(quizData.startTime);
        const endDate = new Date(quizData.endTime);
        const now = new Date();

        if (startDate < now) {
            setError('Start time cannot be in the past');
            return false;
        }

        if (endDate <= startDate) {
            setError('End time must be after start time');
            return false;
        }

        return true;
    };

    const validateDuration = () => {
        if (!quizData.duration || quizData.duration < 5 || quizData.duration > 180) {
            setError('Quiz duration must be between 5 and 180 minutes');
            return false;
        }
        return true;
    };

    const createQuizWithRoom = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!quizData.title.trim() || !quizData.description.trim()) {
            setError('Please fill in all required fields');
            setState('error');
            return;
        }

        if (!validateDuration()) {
            setState('error');
            return;
        }

        if (!validateDateTime()) {
            setState('error');
            return;
        }

        setState('creating');
        setError('');

        try {
            // Step 1: Create the quiz first
            const quizResponse = await axios.post('/api/quizzes/create', {
                title: quizData.title,
                description: quizData.description,
                duration: quizData.duration,
                creatorId: userId
            });

            const { quizId } = quizResponse.data;
            setQuizId(quizId);

            // Step 2: Create a room for the quiz with scheduling
            const roomResponse = await axios.post('/api/rooms/create', {
                quizId: quizId,
                startTime: new Date(quizData.startTime).toISOString(),
                endTime: new Date(quizData.endTime).toISOString()
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
        setQuizData({
            title: "",
            description: "",
            duration: 30,
            startTime: getDefaultStartTime(),
            endTime: getDefaultEndTime()
        });
        setQuizId(null);
        setRoomId(null);
        setInviteCode(null);
        setError('');
        setCopied(false);
        setQuestions([]);
        setShowQuestionForm(false);
        resetQuestionForm();
    };

    const resetQuestionForm = () => {
        setQuestionForm({
            text: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctOption: "A",
            marks: 1
        });
        setQuestionError("");
    };

    const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuestionForm(prev => ({
            ...prev,
            [name]: name === 'marks' ? parseInt(value) || 1 : value
        }));
    };

    const addQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quizId) {
            setQuestionError("Please create a quiz first before adding questions");
            return;
        }

        setQuestionLoading(true);
        setQuestionError("");

        try {
            const response = await axios.post('/api/questions/create', {
                quizId,
                text: questionForm.text,
                optionA: questionForm.optionA,
                optionB: questionForm.optionB,
                optionC: questionForm.optionC,
                optionD: questionForm.optionD,
                correctOption: questionForm.correctOption,
                marks: questionForm.marks
            });

            const newQuestion = response.data.question;
            setQuestions(prev => [...prev, newQuestion]);
            setShowQuestionForm(false);
            resetQuestionForm();
        } catch (error: any) {
            setQuestionError(error.response?.data?.error || 'Failed to create question');
        } finally {
            setQuestionLoading(false);
        }
    };

    const removeQuestion = (questionId: string) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
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

                            {/* Quiz Duration */}
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                                    Quiz Duration (minutes)
                                </Label>
                                <Input
                                    id="duration"
                                    name="duration"
                                    type="number"
                                    min="5"
                                    max="180"
                                    placeholder="30"
                                    value={quizData.duration}
                                    onChange={handleInputChange}
                                    required
                                    disabled={state === 'creating'}
                                    className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-gray-500">
                                    Time limit for each participant to complete the quiz (5-180 minutes)
                                </p>
                            </div>

                            {/* Quiz Scheduling */}
                            <div className="space-y-4">
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Quiz Schedule</h4>
                                    <p className="text-xs text-gray-500 mb-4">
                                        Set when participants can access this quiz. Times are in your local timezone.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="startTime"
                                            name="startTime"
                                            type="datetime-local"
                                            value={quizData.startTime}
                                            onChange={handleInputChange}
                                            required
                                            disabled={state === 'creating'}
                                            className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500">When the quiz becomes available</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                                            End Time
                                        </Label>
                                        <Input
                                            id="endTime"
                                            name="endTime"
                                            type="datetime-local"
                                            value={quizData.endTime}
                                            onChange={handleInputChange}
                                            required
                                            disabled={state === 'creating'}
                                            className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500">When the quiz closes to new participants</p>
                                    </div>
                                </div>
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

                                {/* Schedule Information */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                                    <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2 flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Quiz Schedule & Duration:
                                    </h4>
                                    <div className="text-indigo-700 dark:text-indigo-300 text-sm space-y-1">
                                        <div>• <strong>Duration:</strong> {quizData.duration} minutes per participant</div>
                                        <div>• <strong>Starts:</strong> {new Date(quizData.startTime).toLocaleString()}</div>
                                        <div>• <strong>Ends:</strong> {new Date(quizData.endTime).toLocaleString()}</div>
                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                                            Participants can join during the time window and have {quizData.duration} minutes to complete the quiz
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Next Steps:</h4>
                                    <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                                        <li>• Add questions to your quiz below</li>
                                        <li>• Share the invite code with participants</li>
                                        <li>• Participants can join during the scheduled time</li>
                                        <li>• Monitor participation in the admin dashboard</li>
                                        <li>• Quiz will automatically open and close as scheduled</li>
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

            {/* Question Management Section - Only show when quiz is created */}
            {state === 'created' && quizId && (
                <div className="mt-8">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <CardHeader className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">Manage Questions</CardTitle>
                                </div>
                                <Button
                                    onClick={() => setShowQuestionForm(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={showQuestionForm}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                Add questions to your quiz. Each question should have 4 options with one correct answer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Question Form */}
                            {showQuestionForm && (
                                <Card className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-gray-800 dark:text-gray-100">Add New Question</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={addQuestion} className="space-y-4">
                                            {questionError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                                    {questionError}
                                                </div>
                                            )}

                                            {/* Question Text */}
                                            <div className="space-y-2">
                                                <Label htmlFor="text" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Question Text
                                                </Label>
                                                <textarea
                                                    id="text"
                                                    name="text"
                                                    placeholder="Enter your question here..."
                                                    value={questionForm.text}
                                                    onChange={handleQuestionInputChange}
                                                    required
                                                    disabled={questionLoading}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>

                                            {/* Options */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="optionA" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Option A
                                                    </Label>
                                                    <Input
                                                        id="optionA"
                                                        name="optionA"
                                                        placeholder="Enter option A"
                                                        value={questionForm.optionA}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="optionB" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Option B
                                                    </Label>
                                                    <Input
                                                        id="optionB"
                                                        name="optionB"
                                                        placeholder="Enter option B"
                                                        value={questionForm.optionB}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="optionC" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Option C
                                                    </Label>
                                                    <Input
                                                        id="optionC"
                                                        name="optionC"
                                                        placeholder="Enter option C"
                                                        value={questionForm.optionC}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="optionD" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Option D
                                                    </Label>
                                                    <Input
                                                        id="optionD"
                                                        name="optionD"
                                                        placeholder="Enter option D"
                                                        value={questionForm.optionD}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                            </div>

                                            {/* Correct Option and Marks */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="correctOption" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Correct Option
                                                    </Label>
                                                    <select
                                                        id="correctOption"
                                                        name="correctOption"
                                                        value={questionForm.correctOption}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="A">Option A</option>
                                                        <option value="B">Option B</option>
                                                        <option value="C">Option C</option>
                                                        <option value="D">Option D</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="marks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Marks
                                                    </Label>
                                                    <Input
                                                        id="marks"
                                                        name="marks"
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        placeholder="Enter marks"
                                                        value={questionForm.marks}
                                                        onChange={handleQuestionInputChange}
                                                        required
                                                        disabled={questionLoading}
                                                        className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                            </div>

                                            {/* Form Actions */}
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={questionLoading}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                >
                                                    {questionLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Add Question
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowQuestionForm(false);
                                                        resetQuestionForm();
                                                    }}
                                                    disabled={questionLoading}
                                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Questions List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                        Questions ({questions.length})
                                    </h3>
                                    {questions.length > 0 && (
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
                                        </span>
                                    )}
                                </div>

                                {questions.length === 0 ? (
                                    <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">No questions added yet</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Click "Add Question" to create your first question</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {questions.map((question, index) => (
                                            <Card key={question.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm font-medium">
                                                                    Q{index + 1}
                                                                </span>
                                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                                                                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-900 dark:text-gray-100 font-medium mb-3">{question.text}</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                                <div className={`p-2 rounded ${question.correctOption === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                                    <span className="font-medium">A:</span> {question.optionA}
                                                                </div>
                                                                <div className={`p-2 rounded ${question.correctOption === 'B' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                                    <span className="font-medium">B:</span> {question.optionB}
                                                                </div>
                                                                <div className={`p-2 rounded ${question.correctOption === 'C' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                                    <span className="font-medium">C:</span> {question.optionC}
                                                                </div>
                                                                <div className={`p-2 rounded ${question.correctOption === 'D' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                                    <span className="font-medium">D:</span> {question.optionD}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => removeQuestion(question.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="ml-4 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Room Management Section */}
            <div className="mt-8">
                <AdminRoomList adminId={userId} />
            </div>
        </div>
    );
}