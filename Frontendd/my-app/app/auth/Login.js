"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Lightbulb, Sparkles, TrendingUp, Target, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [touchedFields, setTouchedFields] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    setFocusedField('');
  };

  const handleSubmit = async () => {
    if (isFormValid) {
      setIsLoading(true);
      setError('');
      try {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isFormValid) {
      handleSubmit();
    }
  };

  const isFormValid = validateEmail(formData.email) && formData.password.length >= 6;

  const getFieldStatus = (field, isValid) => {
    if (!touchedFields[field] && !formData[field]) return null;
    if (focusedField === field) return null;
    return isValid;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 group mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Lightbulb className="relative text-white w-8 h-8" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                CareerForge<span className="text-blue-400">.ai</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to continue your career journey</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => handleBlur('email')}
                    onKeyPress={handleKeyPress}
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'email'
                        ? 'border-blue-500'
                        : getFieldStatus('email', validateEmail(formData.email)) === true
                          ? 'border-green-500'
                          : getFieldStatus('email', validateEmail(formData.email)) === false
                            ? 'border-red-300'
                            : 'border-gray-200'
                      }`}
                    placeholder="you@example.com"
                  />
                  {getFieldStatus('email', validateEmail(formData.email)) === true && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => handleBlur('password')}
                    onKeyPress={handleKeyPress}
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'password' ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center ${isFormValid && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-sm text-gray-500">Or continue with</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/auth/register')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign up for free
                </button>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Marketing */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Continue Your Journey</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Pick up right where you left off
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Your personalized roadmap, resume projects, and job applications are waiting for you.
            </p>
          </div>

          {/* Recent Activity Cards */}
          <div className="space-y-4 mb-12">
            <ActivityCard
              icon={<Target className="w-5 h-5" />}
              title="Frontend Developer Roadmap"
              subtitle="67% Complete • 3 skills to learn"
              color="blue"
            />
            <ActivityCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Resume: Software Engineer"
              subtitle="Last updated 2 days ago"
              color="purple"
            />
            <ActivityCard
              icon={<CheckCircle className="w-5 h-5" />}
              title="Applied to 5 companies"
              subtitle="Track your applications"
              color="green"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">94%</div>
              <div className="text-sm text-blue-100">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-blue-100">Companies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityCard = ({ icon, title, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-200',
    purple: 'bg-purple-500/20 text-purple-200',
    green: 'bg-green-500/20 text-green-200'
  };

  return (
    <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/15 transition-all cursor-pointer">
      <div className={`flex-shrink-0 w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1 truncate">{title}</h3>
        <p className="text-sm text-blue-100 truncate">{subtitle}</p>
      </div>
    </div>
  );
};

export default LoginForm;