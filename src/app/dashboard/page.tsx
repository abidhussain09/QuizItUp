'use client';

import { isTokenValid } from "@/lib/auth.client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateQuiz from "@/components/CreateQuiz";
import axios from '@/lib/axios';
import {
    Trophy,
    Clock,
    Calendar,
    ArrowRight,
    CheckCircle,
    XCircle,
    Play,
    History,
    Target,
    RefreshCw,
    AlertCircle,
    ExternalLink
} from "lucide-react";

// ✅ Define types
type User = {
    id: string;
    role: 'ADMIN' | 'PARTICIPANT';
    username?: string;
};



// Types for real quiz history data
type UserQuizHistory = {
    id: string;
    quiz: {
        id: string;
        title: string;
        description: string;
        duration: number;
        createdBy: string;
        createdAt: string;
    };
    roomId: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    answeredQuestions: number;
    accuracy: number;
    totalPossibleMarks: number;
    completionTime: number | null;
    completed: boolean;
    joinedAt: string;
    finishedAt: string | null;
    status: 'completed' | 'incomplete';
};

type UserStats = {
    totalQuizzes: number;
    completedQuizzes: number;
    incompleteQuizzes: number;
    totalScore: number;
    averageScore: number;
    overallAccuracy: number;
    totalCorrectAnswers: number;
    totalQuestionsAttempted: number;
};

type UserQuizHistoryData = {
    user: {
        id: string;
        username: string;
        email: string;
    };
    quizHistory: UserQuizHistory[];
    userStats: UserStats;
};

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<User | null>(null);

    // Room joining states
    const [inviteCode, setInviteCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [joinSuccess, setJoinSuccess] = useState('');

    // Quiz history states
    const [quizHistoryData, setQuizHistoryData] = useState<UserQuizHistoryData | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');

        if (!token || !isTokenValid(token) || !userString) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/signin');
        } else {
            const user: User = JSON.parse(userString);
            setUserData(user);
            setLoading(false);

            // Fetch quiz history for participants
            if (user.role === 'PARTICIPANT') {
                fetchQuizHistory(user.id);
            }
        }
    }, [router]);

    const fetchQuizHistory = async (userId: string) => {
        try {
            setHistoryLoading(true);
            setHistoryError('');

            const response = await axios.get(`/api/user/quiz-history/${userId}`);
            setQuizHistoryData(response.data);
        } catch (error: any) {
            console.error('Error fetching quiz history:', error);
            setHistoryError('Failed to load quiz history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim() || !userData) return;

        setJoinLoading(true);
        setJoinError('');
        setJoinSuccess('');

        try {
            await axios.post('/api/rooms/join', {
                inviteCode: inviteCode.trim().toUpperCase(),
                userId: userData.id
            });

            // Navigate to quiz page with invite code
            router.push(`/dashboard/quiz?inviteCode=${inviteCode.trim().toUpperCase()}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to join room';
            if (error.response?.status === 404) {
                setJoinError(`Invalid invite code "${inviteCode.trim().toUpperCase()}". Please check the code and try again.`);
            } else {
                setJoinError(errorMessage);
            }
            setJoinLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getScoreColor = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600">Error: user not found</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 p-6 min-h-full">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Welcome back, {userData.username || 'User'}!
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {userData.role === 'ADMIN'
                                    ? 'Create and manage your quizzes'
                                    : 'Join quizzes and track your progress'
                                }
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
                            <Target className="h-5 w-5 text-indigo-600" />
                            <span className="font-medium text-gray-700">{userData.role}</span>
                        </div>
                    </div>
                </div>

                {/* Admin Dashboard */}
                {userData.role === 'ADMIN' && (
                    <div>
                        <CreateQuiz userId={userData.id} />
                    </div>
                )}

                {/* Participant Dashboard */}
                {userData.role === 'PARTICIPANT' && (
                    <div className="space-y-8">
                        {/* Join Room Section */}
                        <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <div>
                                        <CardTitle className="text-2xl text-white">Join a Quiz Room</CardTitle>
                                        <CardDescription className="text-indigo-100">
                                            Enter the invite code to participate in a live quiz
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleJoinRoom} className="space-y-4">
                                    {joinError && (
                                        <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {joinError}
                                        </div>
                                    )}

                                    {joinSuccess && (
                                        <div className="p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm">
                                            {joinSuccess}
                                        </div>
                                    )}

                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <Label htmlFor="inviteCode" className="text-white font-medium text-2xl">
                                                Invite Code
                                            </Label>
                                            <Input
                                                id="inviteCode"
                                                type="text"
                                                placeholder="Enter 6-character code"
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                                maxLength={6}
                                                className="mt-1 bg-white/80 border-white/20 text-black placeholder-black focus:border-white focus:ring-white"
                                                disabled={joinLoading}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="submit"
                                                disabled={joinLoading || inviteCode.length !== 6}
                                                className="bg-white text-indigo-600 hover:bg-gray-100 font-medium px-6"
                                            >
                                                {joinLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                                                        Joining...
                                                    </>
                                                ) : (
                                                    <>
                                                        Join Room
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Past Quiz History */}
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <History className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl text-gray-800">Quiz History</CardTitle>
                                        <CardDescription>
                                            Track your performance and progress over time
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                                        <span className="text-gray-600">Loading quiz history...</span>
                                    </div>
                                ) : historyError ? (
                                    <div className="flex items-center justify-center py-8 text-red-600">
                                        <AlertCircle className="h-5 w-5 mr-2" />
                                        <span>{historyError}</span>
                                    </div>
                                ) : quizHistoryData?.quizHistory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                            <History className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg">No quiz history yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Join your first quiz to see your progress here</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quiz</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quizHistoryData?.quizHistory.map((quiz) => (
                                                    <tr key={quiz.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{quiz.quiz.title}</div>
                                                                <div className="text-sm text-gray-500">{quiz.quiz.description}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Trophy className={`h-4 w-4 ${getScoreColor(quiz.score, quiz.totalPossibleMarks)}`} />
                                                                <span className={`font-medium ${getScoreColor(quiz.score, quiz.totalPossibleMarks)}`}>
                                                                    {quiz.score}/{quiz.totalPossibleMarks}
                                                                </span>
                                                                <span className="text-gray-500 text-sm">
                                                                    ({quiz.accuracy}%)
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center space-x-2">
                                                                {quiz.status === 'completed' ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        <span className="text-green-600 font-medium">Completed</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                                        <span className="text-red-600 font-medium">Incomplete</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                                <span className="text-gray-600">
                                                                    {formatDate(quiz.finishedAt || quiz.joinedAt)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {quiz.completed && (
                                                                <button
                                                                    onClick={() => window.open(`/leaderboard?roomId=${quiz.roomId}`, '_blank')}
                                                                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    <span>View Leaderboard</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Quizzes Completed</p>
                                            <p className="text-3xl font-bold">
                                                {quizHistoryData?.userStats.completedQuizzes || 0}
                                            </p>
                                        </div>
                                        <CheckCircle className="h-12 w-12 text-green-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Average Accuracy</p>
                                            <p className="text-3xl font-bold">
                                                {quizHistoryData?.userStats.overallAccuracy || 0}%
                                            </p>
                                        </div>
                                        <Trophy className="h-12 w-12 text-blue-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-sm">Total Score</p>
                                            <p className="text-3xl font-bold">
                                                {quizHistoryData?.userStats.totalScore || 0}
                                            </p>
                                        </div>
                                        <Clock className="h-12 w-12 text-purple-200" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
