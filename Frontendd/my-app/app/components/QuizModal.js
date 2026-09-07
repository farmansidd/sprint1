"use client";
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getLevelQuiz, getTopicQuiz, submitQuizAttempt, getQuizAttempts } from '../../lib/quizApi';

const QuizModal = ({ isOpen, onClose, assessmentId, roadmapId, topicName, onQuizCompleted, isLevel }) => {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && assessmentId && roadmapId) {
            fetchQuiz();
        }
    }, [isOpen, assessmentId, roadmapId]);

    const fetchQuiz = async () => {
        setLoading(true);
        setError(null);
        try {
            const quizData = isLevel
                ? await getLevelQuiz(assessmentId, roadmapId)
                : await getTopicQuiz(assessmentId, roadmapId);
            setQuiz(quizData);

            // Check for previous attempts
            try {
                const attempts = await getQuizAttempts(quizData.id);
                if (attempts && attempts.length > 0) {
                    // Backend checks for latest first (order by attempted_at desc)
                    const latestAttempt = attempts[0];
                    setResult(latestAttempt);
                    // We don't restore answers for now to force clean retake or just show score
                } else {
                    setSelectedAnswers({});
                    setResult(null);
                }
            } catch (e) {
                console.error("Failed to check attempts", e);
                setSelectedAnswers({});
                setResult(null);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetake = () => {
        setResult(null);
        setSelectedAnswers({});
    };

    const handleAnswerSelect = (questionId, answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        // Validate all questions answered
        const allAnswered = quiz.questions.every(q => selectedAnswers[q.id]);
        if (!allAnswered) {
            alert('Please answer all questions before submitting');
            return;
        }

        setSubmitting(true);
        try {
            const attemptResult = await submitQuizAttempt(
                quiz.id,
                roadmapId,
                selectedAnswers,
                isLevel ? assessmentId : null,
                !isLevel ? assessmentId : null
            );
            setResult(attemptResult);
            if (onQuizCompleted) {
                onQuizCompleted(attemptResult);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setQuiz(null);
        setSelectedAnswers({});
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{isLevel ? 'Level' : 'Topic'} Quiz</h2>
                        <p className="text-sm opacity-90 mt-1">{topicName}</p>
                    </div>
                    <button onClick={handleClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-gray-600">Loading quiz...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-red-900">Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="space-y-4">
                            <div className={`rounded-lg p-6 border-2 ${result.score >= 4 ? 'bg-green-50 border-green-500' : result.score >= 3 ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {result.score >= 4 ? (
                                            <CheckCircle className="w-12 h-12 text-green-600 mr-4" />
                                        ) : (
                                            <XCircle className="w-12 h-12 text-red-600 mr-4" />
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                Quiz Complete!
                                            </h3>
                                            <p className="text-gray-700">
                                                You scored {result.score} out of {result.max_score}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-5xl font-bold text-gray-900">
                                        {Math.round((result.score / result.max_score) * 100)}%
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    {result.score >= 4
                                        ? "Excellent work! You've demonstrated strong understanding of this topic."
                                        : result.score >= 3
                                            ? "Good effort! Review the topic and try again to improve your score."
                                            : "Keep learning! Consider reviewing the topic material before retrying."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    Answer all 5 questions below. You'll receive immediate feedback on your performance.
                                </p>
                            </div>

                            {quiz?.questions.map((question, idx) => (
                                <div key={question.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                                    <p className="font-semibold text-gray-900 mb-4">
                                        {idx + 1}. {question.question}
                                    </p>
                                    <div className="space-y-2">
                                        {question.options.map((option, optIdx) => {
                                            const optionLetter = option.charAt(0);
                                            const isSelected = selectedAnswers[question.id] === optionLetter;

                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleAnswerSelect(question.id, optionLetter)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    <span className="text-gray-800">{option}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
                        {result ? (
                            <>
                                <span className="text-sm text-gray-600">
                                    {result.score >= 4 ? "You can proceed to the next topic!" : "You can retake this quiz anytime."}
                                </span>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleRetake}
                                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold ml-2"
                                >
                                    Retake Quiz
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-sm text-gray-600">
                                    {Object.keys(selectedAnswers).length} of {quiz?.questions.length || 0} answered
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || Object.keys(selectedAnswers).length !== quiz?.questions.length}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Quiz'
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default QuizModal;
