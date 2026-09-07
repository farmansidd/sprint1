"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QuizComponent from '@/app/components/psych/QuizComponent';
import CareerExplorer from '@/app/components/psych/CareerExplorer';
import { useAuth } from '@/context/AuthContext'; // Corrected import path

const OnboardingPage = () => {
    const [step, setStep] = useState('selection'); // selection, quiz, explorer
    const [hollandCode, setHollandCode] = useState(null);
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    const handleQuizComplete = (code) => {
        setHollandCode(code);
        setStep('explorer');
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <AnimatePresence mode="wait">
                {step === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Welcome, {user?.username || 'Future Architect'}
                        </h1>
                        <p className="text-xl text-gray-400 mb-12">Let's define your path. Where do you stand?</p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="group relative p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-blue-500 transition-all text-left hover:shadow-2xl hover:shadow-blue-500/10"
                            >
                                <div className="absolute top-6 right-6 text-3xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">🎯</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400">I have an Aim</h3>
                                <p className="text-gray-400">I know exactly what I want to learn. Let me create my roadmap.</p>
                            </button>

                            <button
                                onClick={() => setStep('quiz')}
                                className="group relative p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-purple-500 transition-all text-left hover:shadow-2xl hover:shadow-purple-500/10"
                            >
                                <div className="absolute top-6 right-6 text-3xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">🤔</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400">I'm Exploring</h3>
                                <p className="text-gray-400">I'm not sure yet. Help me discover the best career for my personality.</p>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'quiz' && (
                    <motion.div
                        key="quiz"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <QuizComponent onComplete={handleQuizComplete} />
                    </motion.div>
                )}

                {step === 'explorer' && (
                    <motion.div
                        key="explorer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <CareerExplorer />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnboardingPage;
