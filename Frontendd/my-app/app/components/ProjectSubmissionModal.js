"use client";
import React, { useState, useEffect } from 'react';
import { X, Upload, Github, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { submitProject, getSubmissionStatus, getGradingResults, getLatestSubmission } from '../../lib/projectApi';

const ProjectSubmissionModal = ({ isOpen, onClose, assessmentId, roadmapId, topicName, onSubmissionCompleted, isLevel, projectDetails }) => {
    const [submissionType, setSubmissionType] = useState('github_url');
    const [githubUrl, setGithubUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // null | 'submitting' | 'grading' | 'completed'
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    useEffect(() => {
        if (isOpen && assessmentId) {
            checkPreviousSubmission();
        }
    }, [isOpen, assessmentId, isLevel]);

    const checkPreviousSubmission = async () => {
        try {
            const submission = await getLatestSubmission(
                !isLevel ? assessmentId : null,
                isLevel ? assessmentId : null
            );

            if (submission) {
                if (submission.status === 'grading' || submission.status === 'pending') {
                    setStatus('grading');
                    pollForResults(submission.id);
                } else if (submission.status === 'completed' || submission.status === 'failed') {
                    // Fetch full results
                    try {
                        const gradingResult = await getGradingResults(submission.id);
                        setResult({
                            score: gradingResult.score,
                            status: gradingResult.status,
                            message: gradingResult.logs ? 'Execution Logs Available' : 'No logs available',
                            ai_feedback: gradingResult.ai_feedback
                        });
                        setStatus('completed');
                    } catch (e) {
                        console.error("Failed to load details", e);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check history", error);
        }
    };

    const pollForResults = (submissionId) => {
        const pollInterval = setInterval(async () => {
            try {
                const statusResponse = await getSubmissionStatus(submissionId);

                if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
                    clearInterval(pollInterval);

                    try {
                        const gradingResult = await getGradingResults(submissionId);
                        setResult({
                            score: gradingResult.score,
                            status: gradingResult.status,
                            message: gradingResult.logs ? 'Execution Logs Available' : 'No logs available',
                            ai_feedback: gradingResult.ai_feedback
                        });
                        setStatus('completed');

                        if (onSubmissionCompleted) {
                            onSubmissionCompleted(statusResponse);
                        }
                    } catch (e) {
                        console.error("Error fetching results", e);
                        setResult({
                            score: 0,
                            status: statusResponse.status,
                            message: "Failed to load detailed logs.",
                            ai_feedback: null
                        });
                        setStatus('completed');
                    }
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 2000);
    };

    const handleTryAgain = () => {
        setStatus(null);
        setResult(null);
        setError(null);
        setGithubUrl('');
        setSelectedFile(null);
        setSubmissionType('github_url');
    };

    const handleSubmit = async () => {
        setError(null);

        // Validation
        if (submissionType === 'github_url' && !githubUrl.trim()) {
            setError('Please enter a GitHub repository URL');
            return;
        }

        if (submissionType === 'file_upload' && !selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        setSubmitting(true);
        setStatus('submitting');

        try {
            const submissionData = {
                roadmapId,
                submissionType,
                githubUrl: submissionType === 'github_url' ? githubUrl : null,
                file: submissionType === 'file_upload' ? selectedFile : null
            };

            if (isLevel) {
                submissionData.levelId = assessmentId;
            } else {
                submissionData.topicId = assessmentId;
            }

            const response = await submitProject(submissionData);
            setStatus('grading');
            const submissionId = response.id;

            // Poll for grading results (Real Logic)
            pollForResults(submissionId);

        } catch (err) {
            setError(err.message);
            setStatus(null);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setGithubUrl('');
        setSelectedFile(null);
        setStatus(null);
        setResult(null);
        setError(null);
        setSubmissionType('github_url');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Submit Project</h2>
                        <p className="text-sm opacity-90 mt-1">{topicName}</p>
                    </div>
                    <button onClick={handleClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {status === 'completed' && result ? (
                        <div className="space-y-4">
                            <div className={`rounded-lg p-6 border-2 ${result.status === 'passed' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                <div className="flex items-center">
                                    {result.status === 'passed' ? (
                                        <CheckCircle className="w-12 h-12 text-green-600 mr-4" />
                                    ) : (
                                        <XCircle className="w-12 h-12 text-red-600 mr-4" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {result.status === 'passed' ? 'Tests Passed!' : 'Some Tests Failed'}
                                        </h3>
                                        <p className="text-gray-700 mt-1">{result.message}</p>
                                        <div className="mt-2">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {Math.round(result.score * 100)}%
                                            </span>
                                            <span className="text-sm text-gray-600 ml-2">Score</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Coach Feedback */}
                            {result.status === 'failed' && result.ai_feedback && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                    <div className="flex items-start">
                                        <div className="bg-purple-100 p-2 rounded-full mr-4 shrink-0">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-purple-900 mb-2">AI Coach Feedback</h3>
                                            <div className="prose prose-sm prose-purple max-w-none text-gray-800 whitespace-pre-wrap">
                                                {result.ai_feedback}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logs (Optional - can be expanded) */}
                            {result.message && (
                                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                    <p className="text-xs text-gray-400 font-mono mb-2">Execution Logs:</p>
                                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{result.message}</pre>
                                </div>
                            )}

                        </div>
                    ) : status === 'grading' ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Grading Your Project...</h3>
                            <p className="text-gray-600 text-center">
                                Running automated tests in a secure environment.<br />
                                This may take a minute.
                            </p>
                        </div>
                    ) : status === 'submitting' ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading Project...</h3>
                            <p className="text-gray-600">Please wait while we process your submission.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Project Details */}
                            {projectDetails ? (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                                    <h3 className="font-bold text-lg text-purple-900 mb-2">{projectDetails.title}</h3>
                                    <p className="text-gray-700 mb-4 text-sm">{projectDetails.description}</p>

                                    {projectDetails.requirements && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-purple-800 text-sm mb-1">Requirements:</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {projectDetails.requirements.map((req, idx) => (
                                                    <li key={idx}>{req}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {projectDetails.starter_code && (
                                        <div className="mt-3">
                                            <h4 className="font-semibold text-purple-800 text-sm mb-1">Starter Code:</h4>
                                            <pre className="bg-gray-800 text-gray-100 p-3 rounded-md text-xs overflow-x-auto font-mono">
                                                {projectDetails.starter_code}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                                    <h3 className="font-bold text-lg text-yellow-800 mb-2">Project Details Unavailable</h3>
                                    <p className="text-gray-700 text-sm">
                                        This roadmap was generated before the detailed project feature was added.
                                        Please <strong>generate a new roadmap</strong> to receive specific micro-project tasks for each topic.
                                    </p>
                                </div>
                            )}

                            {/* Submission Type Selection */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSubmissionType('github_url')}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${submissionType === 'github_url'
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-white hover:border-purple-300'
                                        }`}
                                >
                                    <Github className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-sm font-semibold">GitHub URL</span>
                                </button>
                                <button
                                    onClick={() => setSubmissionType('file_upload')}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${submissionType === 'file_upload'
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-white hover:border-purple-300'
                                        }`}
                                >
                                    <Upload className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-sm font-semibold">Upload File</span>
                                </button>
                            </div>

                            {/* GitHub URL Input */}
                            {submissionType === 'github_url' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        GitHub Repository URL
                                    </label>
                                    <input
                                        type="url"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/username/repo"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-gray-800"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Make sure your repository is public or we have access to it.
                                    </p>
                                </div>
                            )}

                            {/* File Upload */}
                            {submissionType === 'file_upload' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Upload Project File
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".py,.zip,.tar.gz,.js,.java,.cpp,.c"
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            {selectedFile ? (
                                                <div>
                                                    <p className="text-purple-600 font-semibold">{selectedFile.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-gray-600 font-semibold">Click to upload</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Supported: .py, .zip, .js, .java, .cpp, .c
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-900">Error</p>
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                {projectDetails?.execution_profile === 'conceptual' ? (
                                    <p className="text-sm text-blue-900">
                                        <strong>Conceptual Task:</strong> Your submission will be analyzed by the AI Coach. No automated tests will be run.
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm text-blue-900">
                                            Your project will be automatically graded using test cases in a secure, sandboxed environment.
                                        </p>
                                        <div className="mt-2 flex items-center">
                                            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide mr-2">Environment:</span>
                                            <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {projectDetails?.execution_profile || 'python_basic'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {status !== 'grading' && status !== 'submitting' && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between shrink-0">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                        >
                            {status === 'completed' ? 'Close' : 'Cancel'}
                        </button>
                        {status === 'completed' && (
                            <button
                                onClick={handleTryAgain}
                                className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold mr-2"
                            >
                                Try Again
                            </button>
                        )}
                        {status !== 'completed' && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Project
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSubmissionModal;
