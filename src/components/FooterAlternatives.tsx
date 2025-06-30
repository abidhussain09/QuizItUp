import { Heart, ExternalLink, Code, Coffee } from "lucide-react";

// Alternative Footer Style 1: Minimal
export function FooterMinimal() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-800 py-4 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Made with <Heart className="h-3 w-3 text-red-500 fill-current inline mx-1" /> by{" "}
                    <a
                        href="https://www.linkedin.com/in/md-abid-hussain-a49b69270/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Abid
                    </a>
                </p>
            </div>
        </footer>
    );
}

// Alternative Footer Style 2: Developer Style
export function FooterDeveloper() {
    return (
        <footer className="bg-gray-900 text-white py-4 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm flex items-center justify-center gap-2 font-mono">
                    <Code className="h-4 w-4 text-green-400" />
                    Crafted with <Coffee className="h-4 w-4 text-yellow-500" /> and{" "}
                    <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" /> by{" "}
                    <a
                        href="https://www.linkedin.com/in/md-abid-hussain-a49b69270/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-bold"
                    >
                        ABID
                    </a>
                </p>
            </div>
        </footer>
    );
}

// Alternative Footer Style 3: Gradient Style
export function FooterGradient() {
    return (
        <footer className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-6 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm flex items-center justify-center gap-1 font-medium">
                        BUILT WITH{" "}
                        <Heart className="h-4 w-4 text-pink-200 fill-current animate-pulse" />{" "}
                        BY{" "}
                        <a
                            href="https://www.linkedin.com/in/md-abid-hussain-a49b69270/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-white hover:text-pink-200 transition-all duration-200 hover:underline inline-flex items-center gap-1 group"
                        >
                            ABID HUSSAIN
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </a>
                    </p>
                    <p className="text-xs text-indigo-100">
                        Full Stack Developer | React & Next.js Enthusiast
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Alternative Footer Style 4: Simple with Social
export function FooterWithSocial() {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        MADE WITH{" "}
                        <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />{" "}
                        FROM{" "}
                        <a
                            href="https://www.linkedin.com/in/md-abid-hussain-a49b69270/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200 hover:underline"
                        >
                            ABID
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

/*
To use any of these alternative styles, replace the import in layout.tsx:

// Current:
import Footer from "@/components/Footer";

// Alternative options:
import { FooterMinimal as Footer } from "@/components/FooterAlternatives";
import { FooterDeveloper as Footer } from "@/components/FooterAlternatives";
import { FooterGradient as Footer } from "@/components/FooterAlternatives";
import { FooterWithSocial as Footer } from "@/components/FooterAlternatives";
*/
