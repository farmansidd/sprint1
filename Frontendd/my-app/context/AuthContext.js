'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load user from local storage or verify token on initial load
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('access_token');

            if (accessToken) {
                try {
                    // Verify token and get user details
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                        // 403: Forbidden (likely unverified email but valid token)
                        // 401: Unauthorized (token might be valid but user inactive?) - Actually 401 usually means invalid token. 
                        // But FastAPI depends(get_current_active_user) returns 403 if unverified.
                        if (error.response.status === 403) {
                            console.warn("User verified check failed (403), likely email not verified.");
                            // Keep token, but allow app to know user is unverified
                            // We don't have the user object since /me failed. 
                            // We can assume they are logged in but restricted.
                            setUser({ isUnverified: true });
                        } else {
                            console.error("Token invalid or expired (401)", error);
                            logout();
                        }
                    } else {
                        console.error("Auth check failed", error);
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            setUser(user);

            // Direct users to the landing page after login instead of forcing onboarding.
            router.push('/');
            return { success: true };
        } catch (error) {
            console.error('Login failed', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            // Backend register returns user, but we know they are likely unverified.
            // We can set the user state.
            setUser(user);

            return { success: true };
        } catch (error) {
            if (!error.response || error.response.status >= 500) {
                console.error('Registration failed', error);
            }
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            router.push('/auth/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
