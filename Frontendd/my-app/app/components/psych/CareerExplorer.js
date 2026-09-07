"use client";

import React, { useEffect, useState } from 'react';
import { careerApi } from '@/lib/careerApi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const CareerExplorer = ({ initialData }) => {
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (!initialData) {
            const fetchData = async () => {
                try {
                    const result = await careerApi.exploreCareers();
                    setData(result);
                } catch (err) {
                    setError("Failed to generate career suggestions. Please try again.");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [initialData]);

    const handleSelectCareer = (role) => {
        // Redirect to roadmap generation with pre-filled goal
        // Assuming /roadmap/generate or similar exists, or query param handling on main dashboard
        // For now, let's redirect to dashboard with a query param
        router.push(`/dashboard?generate_goal=${encodeURIComponent(role)}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold animate-pulse">Consulting Career Architect AI...</h2>
                <p className="text-gray-400 mt-2">Analyzing your personality profile and industry trends.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-400 text-center p-8">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 rounded">Retry</button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 text-white">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    Your Personalized Career Matches
                </h1>
                <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                    {data?.analysis}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.suggested_careers.map((career, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10 group flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{career.role}</h3>
                            <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full font-mono">
                                {Math.round(career.match_score * 100)}% Match
                            </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{career.description}</p>

                        <div className="mb-6 flex-grow">
                            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Why it fits you</h4>
                            <p className="text-gray-300 text-sm italic border-l-2 border-purple-500/30 pl-3">
                                "{career.fit_reason}"
                            </p>
                        </div>

                        <button
                            onClick={() => handleSelectCareer(career.role)}
                            className="w-full py-3 bg-gray-800 hover:bg-blue-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600"
                        >
                            Generate Roadmap
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CareerExplorer;
