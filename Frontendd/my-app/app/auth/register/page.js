"use client";
import dynamic from 'next/dynamic';

const RegisterForm = dynamic(() => import('../Register'), { ssr: false });

export default function RegisterPage() {
  return <RegisterForm />;
}
