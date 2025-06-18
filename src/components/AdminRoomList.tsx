'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge component will be defined inline
import axios from '@/lib/axios';
import {
    Copy,
    Check,
    Users,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    RefreshCw
} from "lucide-react";

// Types
type RoomStatus = 'active' | 'inactive' | 'no_questions' | 'not_started' | 'closed';

type AdminRoom = {
    id: string;
    inviteCode: string;
    createdAt: string;
    startTime: string | null;
    endTime: string | null;
    quiz: {
        id: string;
        title: string;
        description: string;
        duration: number;
        createdAt: string;
        questionCount: number;
    };
    participantCount: number;
    completedParticipants: number;
    status: RoomStatus;
    participants: Array<{
        id: string;
        joinedAt: string;
        completed: boolean;
        user: {
            id: string;
            username: string;
        };
    }>;
};

type AdminRoomData = {
    rooms: AdminRoom[];
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
};

type AdminRoomListProps = {
    adminId: string;
};

export default function AdminRoomList({ adminId }: AdminRoomListProps) {
    const [roomData, setRoomData] = useState<AdminRoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [copiedCode, setCopiedCode] = useState<string>('');


    const fetchRooms = async () => {
        try {
            setLoading(true);
            setError('');

            if (!adminId) {
                setError('Admin ID is required');
                return;
            }

            const response = await axios.get(`/api/rooms/admin/${adminId}`);

            if (response.data && typeof response.data === 'object') {
                setRoomData(response.data);
            } else {
                setError('Invalid response format');
            }
        } catch (error: any) {
            console.error('Error fetching admin rooms:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch rooms';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminId) {
            fetchRooms();
        }
    }, [adminId]); // fetchRooms is stable since it doesn't depend on any state

    const copyInviteCode = async (inviteCode: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(inviteCode);
                setCopiedCode(inviteCode);
                setTimeout(() => setCopiedCode(''), 2000);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = inviteCode;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopiedCode(inviteCode);
                setTimeout(() => setCopiedCode(''), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            // You could add a toast notification here
        }
    };

    const formatScheduleInfo = (room: AdminRoom) => {
        if (!room.startTime || !room.endTime) {
            return 'No schedule set';
        }

        const startDate = new Date(room.startTime);
        const endDate = new Date(room.endTime);
        const now = new Date();

        const formatDateTime = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        if (now < startDate) {
            return `Starts ${formatDateTime(startDate)}`;
        } else if (now > endDate) {
            return `Ended ${formatDateTime(endDate)}`;
        } else {
            return `Ends ${formatDateTime(endDate)}`;
        }
    };



    // Safety check for room data
    const safeRoomData = roomData && roomData.rooms ? roomData : null;

    const getStatusBadge = (room: AdminRoom) => {
        switch (room.status) {
            case 'active':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                    </span>
                );
            case 'not_started':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Not Started
                    </span>
                );
            case 'closed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Closed
                    </span>
                );
            case 'no_questions':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No Questions
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Inactive
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Rooms</h2>
                    <p className="text-gray-600 dark:text-gray-400">Fetching your quiz rooms...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Rooms</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchRooms} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Rooms</p>
                                <p className="text-2xl font-bold">{safeRoomData?.totalRooms || 0}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Active Rooms</p>
                                <p className="text-2xl font-bold">{safeRoomData?.activeRooms || 0}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Total Participants</p>
                                <p className="text-2xl font-bold">{safeRoomData?.totalParticipants || 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Completion Rate</p>
                                <p className="text-2xl font-bold">
                                    {safeRoomData?.totalParticipants ?
                                        Math.round((safeRoomData.rooms.reduce((sum, r) => sum + r.completedParticipants, 0) / safeRoomData.totalParticipants) * 100)
                                        : 0}%
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rooms Table */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">Room Management</CardTitle>
                        </div>
                        <Button onClick={fetchRooms} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        Manage and monitor all your quiz rooms and participants
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!safeRoomData?.rooms || safeRoomData.rooms.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <BarChart3 className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No quiz rooms created yet</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Create your first quiz to see rooms here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Quiz Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Invite Code</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Schedule</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Participants</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Questions</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeRoomData.rooms.map((room) => (
                                        <tr key={room.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{room.quiz.title}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                        {room.quiz.description}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                        {room.inviteCode}
                                                    </span>
                                                    <Button
                                                        onClick={() => copyInviteCode(room.inviteCode)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {copiedCode === room.inviteCode ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {room.quiz.duration} min
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {formatScheduleInfo(room)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {room.participantCount}
                                                    </span>
                                                    {room.completedParticipants > 0 && (
                                                        <span className="text-sm text-green-600 dark:text-green-400">
                                                            ({room.completedParticipants} completed)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`font-medium ${
                                                        room.quiz.questionCount > 0
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {room.quiz.questionCount}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">questions</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                {getStatusBadge(room)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
