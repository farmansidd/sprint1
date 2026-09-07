"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, CheckCircle, XCircle, Eye, EyeOff, Lightbulb, Sparkles, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validations, setValidations] = useState({
    minLength: false,
    hasSpecial: false,
    hasNumber: false,
    hasUpperLower: false,
    passwordsMatch: false,
    emailValid: false,
    usernameValid: false
  });

  const [focusedField, setFocusedField] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const validatePassword = (password, confirmPass) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    setValidations(prev => ({
      ...prev,
      minLength: password.length >= 8,
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /\d/.test(password),
      hasUpperLower: hasUpper && hasLower,
      passwordsMatch: password === confirmPass && password.length > 0 && confirmPass.length > 0
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setValidations(prev => ({
      ...prev,
      emailValid: emailRegex.test(email)
    }));
  };

  const validateUsername = (username) => {
    setValidations(prev => ({
      ...prev,
      usernameValid: username.length >= 3
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update formData immediately
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Use value for current field, but formData (previous state) for others? 
    // Wait, typical React pattern:
    // If we validate 'password' against 'confirmPassword', we need the latest values.
    // 'value' is the latest for 'name'. 'formData.confirmPassword' is the LATEST for confirmPassword if we are editing password? 
    // Yes.

    if (name === 'password') {
      validatePassword(value, formData.confirmPassword);
    } else if (name === 'confirmPassword') {
      validatePassword(formData.password, value);
    }

    if (name === 'email') {
      validateEmail(value);
    }

    if (name === 'username') {
      validateUsername(value);
    }
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
        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        if (!result.success) {
          setError(result.error);
        } else {
          router.push('/auth/check-email');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormValid =
    validations.usernameValid &&
    validations.emailValid &&
    validations.minLength &&
    validations.hasSpecial &&
    validations.hasNumber &&
    validations.hasUpperLower &&
    validations.passwordsMatch;

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">Start building your career roadmap today</p>
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
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 transition-colors ${focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => handleBlur('username')}
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'username'
                      ? 'border-blue-500'
                      : getFieldStatus('username', validations.usernameValid) === true
                        ? 'border-green-500'
                        : getFieldStatus('username', validations.usernameValid) === false
                          ? 'border-red-300'
                          : 'border-gray-200'
                      }`}
                    placeholder="Choose a username"
                  />
                  {getFieldStatus('username', validations.usernameValid) !== null && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      {validations.usernameValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

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
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'email'
                      ? 'border-blue-500'
                      : getFieldStatus('email', validations.emailValid) === true
                        ? 'border-green-500'
                        : getFieldStatus('email', validations.emailValid) === false
                          ? 'border-red-300'
                          : 'border-gray-200'
                      }`}
                    placeholder="you@example.com"
                  />
                  {getFieldStatus('email', validations.emailValid) !== null && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      {validations.emailValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
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
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'password' ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    placeholder="Create a strong password"
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

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'confirmPassword' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`block w-full pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 bg-white border-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${focusedField === 'confirmPassword'
                      ? 'border-blue-500'
                      : getFieldStatus('confirmPassword', validations.passwordsMatch) === true
                        ? 'border-green-500'
                        : getFieldStatus('confirmPassword', validations.passwordsMatch) === false && formData.confirmPassword
                          ? 'border-red-300'
                          : 'border-gray-200'
                      }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {(formData.password || formData.confirmPassword) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Password requirements:</p>
                  <ValidationItem
                    isValid={validations.minLength}
                    text="At least 8 characters"
                  />
                  <ValidationItem
                    isValid={validations.hasSpecial}
                    text="One special character (!@#$%^&*)"
                  />
                  <ValidationItem
                    isValid={validations.hasNumber}
                    text="One number"
                  />
                  <ValidationItem
                    isValid={validations.hasUpperLower}
                    text="Uppercase and lowercase letters"
                  />
                  <ValidationItem
                    isValid={validations.passwordsMatch}
                    text="Passwords match"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${isFormValid
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed opacity-60'
                  }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
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

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>
          </p>
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
              <span className="text-sm font-medium">AI-Powered Career Growth</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Your personalized roadmap to career success
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Join thousands of professionals building their dream careers with AI-powered learning paths, resume optimization, and direct job access.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Smart Roadmaps"
              description="Get personalized learning paths that adapt to your goals"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Skill Gap Analysis"
              description="Identify and close skill gaps faster with AI insights"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Resume Builder"
              description="Create ATS-optimized resumes in minutes"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/20">
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

const ValidationItem = ({ isValid, text }) => (
  <div className="flex items-center space-x-2.5">
    {isValid ? (
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
    )}
    <span className={`text-sm transition-colors ${isValid ? 'text-green-700 font-medium' : 'text-gray-600'
      }`}>
      {text}
    </span>
  </div>
);

const FeatureCard = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/15 transition-all">
    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-blue-100">{description}</p>
    </div>
  </div>
);

export default RegisterForm;