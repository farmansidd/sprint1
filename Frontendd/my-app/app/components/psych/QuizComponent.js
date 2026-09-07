"use client";

import React, { useState } from 'react';
import { careerApi } from '@/lib/careerApi';
import { motion } from 'framer-motion';

const questions = [
    { id: 1, text: "I like to work on cars", category: "R" },
    { id: 2, text: "I like to build things", category: "R" },
    { id: 3, text: "I like to solve puzzles", category: "I" },
    { id: 4, text: "I like to do experiments", category: "I" },
    { id: 5, text: "I like to draw or paint", category: "A" },
    { id: 6, text: "I like to play instruments", category: "A" },
    { id: 7, text: "I like to help people", category: "S" },
    { id: 8, text: "I like to teach others", category: "S" },
    { id: 9, text: "I like to lead a team", category: "E" },
    { id: 10, text: "I like to sell things", category: "E" },
    { id: 11, text: "I like to organize files", category: "C" },
    { id: 12, text: "I like to follow procedures", category: "C" },
    { id: 13, text: "I enjoy working with machines and tools", category: "R" },
    { id: 14, text: "I enjoy analyzing data and graphs", category: "I" },
    { id: 15, text: "I enjoy creative writing", category: "A" }
];

const QuizComponent = ({ onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: true/false }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswer = (isLike) => {
        setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: isLike }));
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz({ ...answers, [questions[currentQuestionIndex].id]: isLike });
        }
    };

    const finishQuiz = async (finalAnswers) => {
        setIsSubmitting(true);
        // Calculate Holland Code
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        questions.forEach(q => {
            if (finalAnswers[q.id]) {
                scores[q.category]++;
            }
        });

        // Sort to find top 3
        const sortedCategories = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .map(([cat]) => cat);

        const hollandCode = sortedCategories.slice(0, 3).join('');

        // Simple traits mapping (Mocking for now, could be more complex)
        const traits = {
            openness: (scores.A + scores.I) / 6, // Normalized roughly
            conscientiousness: (scores.C + scores.R) / 6,
            extraversion: (scores.E + scores.S) / 6,
            agreeableness: scores.S / 3,
            neuroticism: 0.2 // Low default
        };

        try {
            await careerApi.submitPsychProfile({
                holland_code: hollandCode,
                personality_traits: traits
            });
            if (onComplete) onComplete(hollandCode);
        } catch (error) {
            console.error("Failed to submit profile", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const progress = ((currentQuestionIndex) / questions.length) * 100;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-800 text-white">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Discover Your Career Personality</h2>
                <p className="text-gray-400">Answer honestly to find the best career fit for you.</p>
                <div className="w-full bg-gray-800 h-2 mt-4 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="min-h-[200px] flex flex-col justify-center items-center text-center">
                <h3 className="text-2xl font-medium mb-8">{questions[currentQuestionIndex].text}</h3>

                <div className="flex gap-4">
                    <button
                        onClick={() => handleAnswer(false)}
                        className="px-8 py-3 rounded-xl border border-gray-600 hover:bg-gray-800 transition-colors"
                        disabled={isSubmitting}
                    >
                        👎 Not me
                    </button>
                    <button
                        onClick={() => handleAnswer(true)}
                        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
                        disabled={isSubmitting}
                    >
                        👍 That's me!
                    </button>
                </div>
            </div>

            {isSubmitting && <p className="text-center mt-4 text-blue-400 animate-pulse">Analyzing your profile...</p>}
        </div>
    );
};

export default QuizComponent;
