'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Clock, Target, Users, RefreshCw } from 'lucide-react';
import axios from 'axios';

// Types
type LeaderboardEntry = {
    rank: number;
    participant: {
        id: string;
        username: string;
    };
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    answeredQuestions: number;
    accuracy: number;
    completionTime: number | null;
    finishedAt: string;
    joinedAt: string;
};

type QuizInfo = {
    title: string;
    description: string;
    duration: number;
    totalQuestions: number;
    totalPossibleMarks: number;
};

type LeaderboardStats = {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
};

type LeaderboardData = {
    quiz: QuizInfo;
    statistics: LeaderboardStats;
    leaderboard: LeaderboardEntry[];
};

interface LeaderboardProps {
    roomId: string;
    onClose?: () => void;
}

export default function Leaderboard({ roomId, onClose }: LeaderboardProps) {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(`/api/leaderboard/${roomId}`);
            setData(response.data);
        } catch (error: unknown) {
            console.error('Error fetching leaderboard:', error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        if (roomId) {
            fetchLeaderboard();
        }
    }, [roomId, fetchLeaderboard]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 3:
                return <Award className="h-6 w-6 text-amber-600" />;
            default:
                return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
        }
    };

    const formatTime = (minutes: number | null) => {
        if (!minutes) return 'N/A';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Leaderboard</h2>
                    <p className="text-gray-600 dark:text-gray-400">Fetching quiz results...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="p-8 text-center">
                    <div className="text-red-500 mb-4">
                        <Target className="h-12 w-12 mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Leaderboard</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchLeaderboard} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Quiz Info Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                                {data.quiz.title} - Leaderboard
                            </CardTitle>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {data.quiz.description}
                            </p>
                        </div>
                        {onClose && (
                            <Button onClick={onClose} variant="outline">
                                Close
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.statistics.totalParticipants}</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Participants</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                            <Trophy className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{data.statistics.highestScore}</p>
                            <p className="text-sm text-green-700 dark:text-green-300">Highest Score</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.statistics.averageScore}</p>
                            <p className="text-sm text-purple-700 dark:text-purple-300">Average Score</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{data.quiz.duration}</p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">Minutes</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leaderboard Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span>Rankings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.leaderboard.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No completed participations yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.leaderboard.map((entry) => (
                                <div
                                    key={entry.participant.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                        entry.rank <= 3
                                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-12 h-12">
                                            {getRankIcon(entry.rank)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {entry.participant.username}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {entry.correctAnswers}/{entry.totalQuestions} correct • {entry.accuracy}% accuracy
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {entry.score}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatTime(entry.completionTime)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
