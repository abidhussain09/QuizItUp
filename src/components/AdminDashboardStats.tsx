'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import {
    Trophy,
    Users,
    BarChart3,
    TrendingUp,
    RefreshCw,
    AlertCircle,
    Calendar,
    Target,
    Clock,
    Award
} from "lucide-react";

// Types for admin dashboard stats
type AdminOverview = {
    totalQuizzes: number;
    totalRooms: number;
    totalParticipations: number;
    completedParticipations: number;
    completionRate: number;
    averageScore: number;
};

type TopPerformer = {
    rank: number;
    participant: {
        id: string;
        username: string;
    };
    quiz: {
        id: string;
        title: string;
    };
    score: number;
    accuracy: number;
    finishedAt: string;
};

type RecentActivity = {
    id: string;
    participant: {
        id: string;
        username: string;
    };
    quiz: {
        id: string;
        title: string;
    };
    completed: boolean;
    score: number;
    joinedAt: string;
    finishedAt: string | null;
};

type AdminDashboardData = {
    overview: AdminOverview;
    topPerformers: TopPerformer[];
    recentActivity: RecentActivity[];
};

interface AdminDashboardStatsProps {
    adminId: string;
}

export default function AdminDashboardStats({ adminId }: AdminDashboardStatsProps) {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.get(`/api/admin/dashboard-stats?adminId=${adminId}`);
            setData(response.data);
        } catch (error: any) {
            console.error('Error fetching admin dashboard stats:', error);
            setError(error.response?.data?.error || 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminId) {
            fetchDashboardStats();
        }
    }, [adminId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Card className="shadow-lg border-0">
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400">Fetching your quiz statistics...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-lg border-0 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchDashboardStats} variant="outline">
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
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Quizzes</p>
                                <p className="text-2xl font-bold">{data.overview.totalQuizzes}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Participants</p>
                                <p className="text-2xl font-bold">{data.overview.totalParticipations}</p>
                            </div>
                            <Users className="h-8 w-8 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Completion Rate</p>
                                <p className="text-2xl font-bold">{data.overview.completionRate}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Average Score</p>
                                <p className="text-2xl font-bold">{data.overview.averageScore}</p>
                            </div>
                            <Target className="h-8 w-8 text-orange-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span>Top Performers</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.topPerformers.length === 0 ? (
                            <div className="text-center py-8">
                                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No completed quizzes yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.topPerformers.map((performer) => (
                                    <div
                                        key={`${performer.participant.id}-${performer.quiz.id}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                                                <span className="text-yellow-800 dark:text-yellow-200 font-bold text-sm">
                                                    #{performer.rank}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {performer.participant.username}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {performer.quiz.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-gray-100">
                                                {performer.score} pts
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {performer.accuracy}% accuracy
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span>Recent Activity</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentActivity.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {data.recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {activity.participant.username}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {activity.completed ? 'Completed' : 'Joined'} {activity.quiz.title}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(activity.finishedAt || activity.joinedAt)}
                                            </p>
                                            {activity.completed && (
                                                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    {activity.score} pts
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
