'use client';

import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPages/LandingPage';

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <LandingPage />;
}
