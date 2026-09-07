"use client";
import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('../Login'), { ssr: false });

export default function LoginPage() {
  return <LoginForm />;
}
