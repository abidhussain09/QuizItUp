import { Heart, ExternalLink } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 font-medium">
                        MADE WITH{" "}
                        <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />{" "}
                        BY{" "}
                        <a
                            href="https://www.linkedin.com/in/md-abid-hussain-a49b69270/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all duration-200 hover:underline inline-flex items-center gap-1 group"
                        >
                            ABID
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </a>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        © {new Date().getFullYear()} QuizItUp. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
