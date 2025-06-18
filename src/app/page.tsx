'use client';

import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, ArrowRight, Trophy, Users, Calendar, Crown, Target, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isTokenValid } from "@/lib/auth.client";
import axios from 'axios';

// Types for real leaderboard data
type GlobalLeaderboardEntry = {
  rank: number;
  participant: {
    id: string;
    username: string;
  };
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
  accuracy: number;
  completionTime: number | null;
  finishedAt: string;
};

type PlatformStats = {
  totalQuizzes: number;
  totalParticipations: number;
  totalUsers: number;
  averageScore: number;
};

type GlobalLeaderboardData = {
  globalLeaderboard: GlobalLeaderboardEntry[];
  platformStats: PlatformStats;
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<GlobalLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && isTokenValid(token) && userString) {
      setIsLoggedIn(true);
    }

    // Fetch global leaderboard data
    fetchGlobalLeaderboard();
  }, []);

  const fetchGlobalLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/api/leaderboard/global?limit=5');
      setLeaderboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching global leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Beams */}
      <BackgroundBeamsWithCollision className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full items-center">
            {/* Left Side - Hero Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                  <Brain className="h-12 w-12 text-indigo-600" />
                  <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  Welcome to QuizItUp
                </h1>

                <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl">
                  Create engaging quizzes, challenge your knowledge, and compete with others in our interactive quiz platform
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  {isLoggedIn ? (
                    <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                      <Link href="/dashboard" className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Go to Dashboard</span>
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                        <Link href="/signup" className="flex items-center space-x-2">
                          <span>Get Started</span>
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>

                      <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        <Link href="/signin">
                          Sign In
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {leaderboardData?.platformStats.totalQuizzes || '...'}
                  </div>
                  <div className="text-sm text-gray-600">Quizzes Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {leaderboardData?.platformStats.totalParticipations || '...'}
                  </div>
                  <div className="text-sm text-gray-600">Quiz Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">
                    {leaderboardData?.platformStats.totalUsers || '...'}
                  </div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
            </div>

            {/* Right Side - Past Quiz Table */}
            <div className="w-full">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Trophy className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-800">Recent Quiz Champions</CardTitle>
                      <CardDescription>
                        See who's been dominating our latest quizzes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                      <span className="text-gray-600">Loading champions...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-8 text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>{error}</span>
                    </div>
                  ) : leaderboardData?.globalLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No quiz champions yet. Be the first!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {leaderboardData?.globalLeaderboard.map((entry) => (
                        <div key={`${entry.participant.id}-${entry.quiz.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{entry.quiz.title}</h3>
                              <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600">
                                {entry.score} pts
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(entry.finishedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{entry.accuracy}% accuracy</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <div className="flex items-center space-x-1">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium text-gray-900">{entry.participant.username}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchGlobalLeaderboard}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        'Refresh Results'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </div>
  );
}
