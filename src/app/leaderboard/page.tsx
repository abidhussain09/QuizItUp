'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Leaderboard from '@/components/Leaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function LeaderboardPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');

    if (!roomId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Room ID Required
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Please provide a room ID to view the leaderboard.
                        </p>
                        <Button 
                            onClick={() => router.push('/dashboard')}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Button 
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
                
                <Leaderboard roomId={roomId} />
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Leaderboard</h2>
                        <p className="text-gray-600 dark:text-gray-400">Preparing leaderboard data...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <LeaderboardPageContent />
        </Suspense>
    );
}
