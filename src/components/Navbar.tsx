'use client';

import Link from 'next/link';

const Navbar = () => {
    return (
        <nav className="flex items-center justify-between px-6 py-4 shadow-md border-neutral-400 border-b-2">
            <div className="text-2xl font-bold text-gray-800">
                <Link className='' href="/">QuizItUp</Link>
            </div>
            {/* Right side - Buttons */}
            <div className="space-x-4">
                <Link href="/signin">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-gray-200">
                        Sign In
                    </button>
                </Link>
                <Link href="/signup">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                        Sign Up
                    </button>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
