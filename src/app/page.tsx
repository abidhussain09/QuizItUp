'use client';

import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, ArrowRight, Trophy, Users, Calendar, Crown, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isTokenValid } from "@/lib/auth.client";

// Enhanced dummy data for past quizzes
const pastQuizzes = [
  {
    id: '1',
    quizName: "JavaScript Fundamentals Challenge",
    createdBy: "Dr. Sarah Johnson",
    quizDate: "2024-01-15",
    winner: "Abid Hussain",
    participants: 156,
    category: "Programming",
    difficulty: "Intermediate"
  },
  {
    id: '2',
    quizName: "World Geography Masters",
    createdBy: "Prof. Michael Brown",
    quizDate: "2024-01-12",
    winner: "Abid Hussain",
    participants: 203,
    category: "Geography",
    difficulty: "Advanced"
  },
  {
    id: '3',
    quizName: "Science Trivia Showdown",
    createdBy: "Dr. Lisa Martinez",
    quizDate: "2024-01-10",
    winner: "David Kim",
    participants: 89,
    category: "Science",
    difficulty: "Beginner"
  },
  {
    id: '4',
    quizName: "History Through Ages",
    createdBy: "Prof. Robert Taylor",
    quizDate: "2024-01-08",
    winner: "Sophie Anderson",
    participants: 134,
    category: "History",
    difficulty: "Intermediate"
  },
  {
    id: '5',
    quizName: "Math Olympiad Prep",
    createdBy: "Dr. Jennifer Lee",
    quizDate: "2024-01-05",
    winner: "Ryan Patel",
    participants: 78,
    category: "Mathematics",
    difficulty: "Advanced"
  }
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && isTokenValid(token) && userString) {
      setIsLoggedIn(true);
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
                  <div className="text-3xl font-bold text-indigo-600">500+</div>
                  <div className="text-sm text-gray-600">Quizzes Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">10K+</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">50+</div>
                  <div className="text-sm text-gray-600">Categories</div>
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
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pastQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{quiz.quizName}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(quiz.quizDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{quiz.participants}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">{quiz.winner}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline" className="w-full">
                      View All Quiz Results
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
