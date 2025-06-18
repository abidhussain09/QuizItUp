'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from '@/lib/axios';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Trophy,
    Target,
    BookOpen,
    Timer
} from "lucide-react";

// Types
type Question = {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    marks: number;
};

type Quiz = {
    id: string;
    title: string;
    description: string;
    duration: number;
};

type Answer = {
    questionId: string;
    selectedOption: string;
};

type QuizState = 'loading' | 'ready' | 'taking' | 'completed' | 'error';

function QuizPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get('inviteCode');

    // State management
    const [state, setState] = useState<QuizState>('loading');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [error, setError] = useState<string>('');
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

    // Initialize quiz data
    useEffect(() => {
        if (!inviteCode) {
            setError('No invite code provided');
            setState('error');
            return;
        }

        const initializeQuiz = async () => {
            try {
                setState('loading');

                // Step 1: Get room ID from invite code
                const roomResponse = await axios.post('/api/rooms/get-room-id', {
                    inviteCode: inviteCode
                });

                const fetchedRoomId = roomResponse.data.roomId;
                setRoomId(fetchedRoomId);

                // Step 2: Fetch questions for the room
                const questionsResponse = await axios.get(`/api/questions/get/${fetchedRoomId}`);
                const fetchedQuestions = questionsResponse.data.questions;
                const quizData = questionsResponse.data.quiz;

                if (!fetchedQuestions || fetchedQuestions.length === 0) {
                    setError('No questions found for this quiz');
                    setState('error');
                    return;
                }

                setQuestions(fetchedQuestions);
                setQuiz(quizData);

                // Initialize answers array
                const initialAnswers = fetchedQuestions.map((q: Question) => ({
                    questionId: q.id,
                    selectedOption: ''
                }));
                setAnswers(initialAnswers);

                // Check for existing quiz session
                checkExistingSession(fetchedRoomId, quizData);

                setState('ready');
            } catch (error: any) {
                console.error('Error initializing quiz:', error);
                const errorMessage = error.response?.data?.error || 'Failed to load quiz';

                if (error.response?.status === 404) {
                    setError(`Invalid invite code "${inviteCode}". Please check the code and try again.`);
                } else {
                    setError(errorMessage);
                }
                setState('error');
            }
        };

        initializeQuiz();
    }, [inviteCode]);

    // Timer effect
    useEffect(() => {
        if (quizStarted && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [quizStarted, timeRemaining]);

    const checkExistingSession = (roomId: string, quizData: Quiz) => {
        const sessionKey = `quiz_session_${roomId}`;
        const savedSession = localStorage.getItem(sessionKey);

        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const startTime = new Date(session.startTime);
                const now = new Date();
                const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                const totalDurationSeconds = quizData.duration * 60;

                if (elapsedSeconds < totalDurationSeconds) {
                    // Resume existing session
                    setQuizStartTime(startTime);
                    setQuizStarted(true);
                    setState('taking');
                    setTimeRemaining(totalDurationSeconds - elapsedSeconds);

                    // Restore saved answers if any
                    if (session.answers) {
                        setAnswers(session.answers);
                    }
                    if (session.currentQuestionIndex !== undefined) {
                        setCurrentQuestionIndex(session.currentQuestionIndex);
                    }
                } else {
                    // Session expired, clean up
                    localStorage.removeItem(sessionKey);
                }
            } catch (error) {
                console.error('Error parsing saved session:', error);
                localStorage.removeItem(sessionKey);
            }
        }
    };

    const startQuiz = () => {
        if (!quiz || !roomId) return;

        const startTime = new Date();
        setQuizStartTime(startTime);
        setQuizStarted(true);
        setState('taking');

        // Set timer based on quiz duration (convert minutes to seconds)
        const durationSeconds = quiz.duration * 60;
        setTimeRemaining(durationSeconds);

        // Save session to localStorage
        const sessionKey = `quiz_session_${roomId}`;
        const session = {
            startTime: startTime.toISOString(),
            duration: quiz.duration,
            answers: answers,
            currentQuestionIndex: currentQuestionIndex
        };
        localStorage.setItem(sessionKey, JSON.stringify(session));
    };

    const handleAnswerSelect = (questionId: string, selectedOption: string) => {
        const updatedAnswers = answers.map(answer =>
            answer.questionId === questionId
                ? { ...answer, selectedOption }
                : answer
        );
        setAnswers(updatedAnswers);

        // Save progress to localStorage
        if (roomId && quizStartTime) {
            const sessionKey = `quiz_session_${roomId}`;
            const session = {
                startTime: quizStartTime.toISOString(),
                duration: quiz?.duration || 30,
                answers: updatedAnswers,
                currentQuestionIndex: currentQuestionIndex
            };
            localStorage.setItem(sessionKey, JSON.stringify(session));
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        try {
            // Here you would typically submit answers to an API
            // For now, we'll just show completion
            setState('completed');

            // Clean up localStorage session
            if (roomId) {
                const sessionKey = `quiz_session_${roomId}`;
                localStorage.removeItem(sessionKey);
            }
        } catch (error: any) {
            setError('Failed to submit quiz');
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getAnsweredCount = () => {
        return answers.filter(answer => answer.selectedOption !== '').length;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

    // Loading state
    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Quiz</h2>
                        <p className="text-gray-600 dark:text-gray-400">Fetching questions and preparing your quiz...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (state === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quiz Error</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <Button 
                            onClick={() => router.push('/dashboard')}
                            variant="outline"
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz ready state
    if (state === 'ready') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <CardTitle className="text-3xl text-gray-900 dark:text-gray-100">
                            {quiz?.title || 'Quiz Ready!'}
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                            {quiz?.description || "You're about to start the quiz. Make sure you're ready!"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                <p className="font-semibold text-blue-900 dark:text-blue-100">{questions.length}</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Questions</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <Trophy className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <p className="font-semibold text-green-900 dark:text-green-100">
                                    {questions.reduce((sum, q) => sum + q.marks, 0)}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">Total Marks</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <Timer className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                                <p className="font-semibold text-purple-900 dark:text-purple-100">{quiz?.duration || 30}</p>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Minutes</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Instructions:</h4>
                            <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                                <li>• Read each question carefully before selecting an answer</li>
                                <li>• You can navigate between questions using the navigation buttons</li>
                                <li>• Make sure to answer all questions before submitting</li>
                                <li>• The quiz will auto-submit when time runs out</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <Button 
                                onClick={() => router.push('/dashboard')}
                                variant="outline"
                                className="flex-1"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <Button 
                                onClick={startQuiz}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                Start Quiz
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz taking state
    if (state === 'taking' && currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Quiz Header */}
                    <Card className="mb-6 bg-white dark:bg-gray-800 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            Question {currentQuestionIndex + 1} of {questions.length}
                                        </h1>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {getAnsweredCount()} of {questions.length} answered
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className={`px-3 py-2 rounded-lg ${
                                        timeRemaining <= 300 // 5 minutes warning
                                            ? 'bg-red-100 dark:bg-red-900'
                                            : timeRemaining <= 600 // 10 minutes warning
                                            ? 'bg-yellow-100 dark:bg-yellow-900'
                                            : 'bg-blue-100 dark:bg-blue-900'
                                    }`}>
                                        <div className="flex items-center space-x-2">
                                            <Clock className={`h-4 w-4 ${
                                                timeRemaining <= 300
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : timeRemaining <= 600
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-blue-600 dark:text-blue-400'
                                            }`} />
                                            <span className={`font-mono font-medium ${
                                                timeRemaining <= 300
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : timeRemaining <= 600
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-blue-600 dark:text-blue-400'
                                            }`}>
                                                {formatTime(timeRemaining)}
                                            </span>
                                        </div>
                                    </div>
                                    {timeRemaining <= 300 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-1 rounded-lg">
                                            <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                                                Time running out!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <Card className="mb-6 bg-white dark:bg-gray-800 shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-xl text-gray-900 dark:text-gray-100 leading-relaxed">
                                    {currentQuestion.text}
                                </CardTitle>
                                <div className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
                                    <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">
                                        {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Options */}
                            <div className="space-y-3">
                                {[
                                    { key: 'A', text: currentQuestion.optionA },
                                    { key: 'B', text: currentQuestion.optionB },
                                    { key: 'C', text: currentQuestion.optionC },
                                    { key: 'D', text: currentQuestion.optionD }
                                ].map((option) => (
                                    <div key={option.key} className="relative">
                                        <input
                                            type="radio"
                                            id={`option-${option.key}`}
                                            name={`question-${currentQuestion.id}`}
                                            value={option.key}
                                            checked={currentAnswer?.selectedOption === option.key}
                                            onChange={() => handleAnswerSelect(currentQuestion.id, option.key)}
                                            className="sr-only"
                                        />
                                        <Label
                                            htmlFor={`option-${option.key}`}
                                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                currentAnswer?.selectedOption === option.key
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                                                currentAnswer?.selectedOption === option.key
                                                    ? 'border-indigo-500 bg-indigo-500'
                                                    : 'border-gray-300 dark:border-gray-500'
                                            }`}>
                                                {currentAnswer?.selectedOption === option.key && (
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`font-medium ${
                                                        currentAnswer?.selectedOption === option.key
                                                            ? 'text-indigo-900 dark:text-indigo-100'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {option.key}.
                                                    </span>
                                                    <span className={`${
                                                        currentAnswer?.selectedOption === option.key
                                                            ? 'text-indigo-900 dark:text-indigo-100'
                                                            : 'text-gray-900 dark:text-gray-100'
                                                    }`}>
                                                        {option.text}
                                                    </span>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <Card className="bg-white dark:bg-gray-800 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <Button
                                    onClick={goToPreviousQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Previous</span>
                                </Button>

                                <div className="flex items-center space-x-2">
                                    {questions.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                                                index === currentQuestionIndex
                                                    ? 'bg-indigo-600 text-white'
                                                    : answers[index]?.selectedOption
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <Button
                                        onClick={handleSubmitQuiz}
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                                        disabled={getAnsweredCount() < questions.length}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Submit Quiz</span>
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={goToNextQuestion}
                                        disabled={currentQuestionIndex === questions.length - 1}
                                        className="flex items-center space-x-2"
                                    >
                                        <span>Next</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Quiz completed state
    if (state === 'completed') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-2xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quiz Completed!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Thank you for taking the quiz. Your answers have been submitted successfully.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{questions.length}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getAnsweredCount()}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Answered</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {questions.reduce((sum, q) => sum + q.marks, 0)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Marks</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}

export default function QuizPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Quiz</h2>
                        <p className="text-gray-600 dark:text-gray-400">Preparing your quiz experience...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <QuizPageContent />
        </Suspense>
    );
}
