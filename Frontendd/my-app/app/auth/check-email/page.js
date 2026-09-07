'use client';
import { Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import api from '../../../lib/axios';

export default function CheckEmailPage() {
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');
        setStatus('');
        try {
            await api.post('/auth/request-verification-email');
            setMessage('Verification email sent successfully!');
            setStatus('success');
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Failed to resend email. You might need to login again.');
            setStatus('error');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-10 h-10 text-blue-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
                <p className="text-gray-600 mb-8">
                    We've sent a verification link to your email address. Please click the link to verify your account.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>

                    <Link
                        href="/auth/login"
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Back to Login
                    </Link>

                    {message && (
                        <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
