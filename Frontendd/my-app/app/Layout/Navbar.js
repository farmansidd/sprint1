'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Lightbulb, Menu, X, User, LogOut, ChevronDown,
  BarChart3, Briefcase, GraduationCap, FileText,
  HelpCircle, Book, HeartHandshake, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const helpRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setHelpDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setHelpDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
  };

  const hideNavbar = pathname?.startsWith('/auth');

  if (loading || hideNavbar) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-[0_8px_30px_rgba(59,130,246,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-35 transition-opacity duration-300"></div>
              <Lightbulb className="relative text-blue-600 w-7 h-7" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
              CareerForge<span className="text-purple-600">.ai</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink href="/dashboard" icon={<BarChart3 className="w-4 h-4" />} active={isActive('/dashboard')}>
              Dashboard
            </NavLink>
            <NavLink href="/job-search" icon={<Briefcase className="w-4 h-4" />} active={isActive('/job-search')}>
              Job Search
            </NavLink>
            <NavLink href="/roadmaps" icon={<GraduationCap className="w-4 h-4" />} active={isActive('/roadmaps')}>
              Roadmaps
            </NavLink>
            <NavLink href="/resume" icon={<FileText className="w-4 h-4" />} active={isActive('/resume')}>
              Resume
            </NavLink>

            {/* Help Dropdown */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => {
                  setHelpDropdownOpen(!helpDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors font-medium ${
                  helpDropdownOpen || isActive('/faq') || isActive('/guides') || isActive('/support') || isActive('/feedback')
                    ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-purple-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/70'
                }`}
                aria-expanded={helpDropdownOpen}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${helpDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {helpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <DropdownLink
                    href="/faq"
                    icon={<HelpCircle className="w-4 h-4 text-blue-600" />}
                    active={isActive('/faq')}
                    onClick={() => setHelpDropdownOpen(false)}
                  >
                    FAQ
                  </DropdownLink>
                  <DropdownLink
                    href="/guides"
                    icon={<Book className="w-4 h-4 text-blue-600" />}
                    active={isActive('/guides')}
                    onClick={() => setHelpDropdownOpen(false)}
                  >
                    Guides & Tutorials
                  </DropdownLink>
                  <DropdownLink
                    href="/support"
                    icon={<HeartHandshake className="w-4 h-4 text-blue-600" />}
                    active={isActive('/support')}
                    onClick={() => setHelpDropdownOpen(false)}
                  >
                    Contact Support
                  </DropdownLink>
                  <DropdownLink
                    href="/feedback"
                    icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
                    active={isActive('/feedback')}
                    onClick={() => setHelpDropdownOpen(false)}
                  >
                    Send Feedback
                  </DropdownLink>
                </div>
              )}
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setHelpDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                    profileDropdownOpen || isActive('/profile')
                      ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-purple-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/70'
                  }`}
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.email || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[140px] truncate text-sm">{user.email || user.username}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email || user.username}</p>
                    </div>
                    <DropdownLink
                      href="/profile"
                      icon={<User className="w-4 h-4 text-blue-600" />}
                      active={isActive('/profile')}
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Profile
                    </DropdownLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-3 ml-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-1">
              <MobileNavLink href="/dashboard" icon={<BarChart3 className="w-5 h-5" />} active={isActive('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/job-search" icon={<Briefcase className="w-5 h-5" />} active={isActive('/job-search')} onClick={() => setMobileMenuOpen(false)}>
                Job Search
              </MobileNavLink>
              <MobileNavLink href="/roadmaps" icon={<GraduationCap className="w-5 h-5" />} active={isActive('/roadmaps')} onClick={() => setMobileMenuOpen(false)}>
                Roadmaps
              </MobileNavLink>
              <MobileNavLink href="/resume" icon={<FileText className="w-5 h-5" />} active={isActive('/resume')} onClick={() => setMobileMenuOpen(false)}>
                Resume
              </MobileNavLink>

              <div className="border-t border-gray-200 pt-3 mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Help & Resources</p>
                <MobileNavLink href="/faq" icon={<HelpCircle className="w-5 h-5" />} active={isActive('/faq')} onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </MobileNavLink>
                <MobileNavLink href="/guides" icon={<Book className="w-5 h-5" />} active={isActive('/guides')} onClick={() => setMobileMenuOpen(false)}>
                  Guides & Tutorials
                </MobileNavLink>
                <MobileNavLink href="/support" icon={<HeartHandshake className="w-5 h-5" />} active={isActive('/support')} onClick={() => setMobileMenuOpen(false)}>
                  Contact Support
                </MobileNavLink>
                <MobileNavLink href="/feedback" icon={<MessageSquare className="w-5 h-5" />} active={isActive('/feedback')} onClick={() => setMobileMenuOpen(false)}>
                  Send Feedback
                </MobileNavLink>
              </div>

              {user ? (
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="px-3 py-2 mb-2">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.email || user.username}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Account</p>
                  <MobileNavLink href="/profile" icon={<User className="w-5 h-5" />} active={isActive('/profile')} onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-2 flex flex-col space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ href, icon, children, active }) => (
  <Link
    href={href}
    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
      active
        ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-purple-50'
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/70'
    }`}
  >
    <span className={active ? 'text-blue-700' : 'text-gray-500 group-hover:text-blue-600'}>{icon}</span>
    <span>{children}</span>
  </Link>
);

const DropdownLink = ({ href, icon, children, onClick, active }) => (
  <Link
    href={href}
    className={`flex items-center space-x-3 px-4 py-2 transition-colors ${
      active ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
    }`}
    onClick={onClick}
  >
    {icon}
    <span>{children}</span>
  </Link>
);

const MobileNavLink = ({ href, icon, children, onClick, active }) => (
  <Link
    href={href}
    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
      active ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
    }`}
    onClick={onClick}
  >
    <span className={active ? 'text-blue-700' : 'text-blue-600'}>{icon}</span>
    <span className="font-medium">{children}</span>
  </Link>
);

export default Navbar;
