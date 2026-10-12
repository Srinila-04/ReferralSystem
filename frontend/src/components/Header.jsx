import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleMenu }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || 'User'
  )}&background=08245F&color=fff`;

  const avatarSrc = !imgError && user?.avatar ? user.avatar : defaultAvatar;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 z-30 sticky top-0">
      <div className="flex items-center min-w-0">
        <button
          type="button"
          onClick={onToggleMenu}
          className="md:hidden text-slate-500 hover:text-navy mr-2 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand title on mobile */}
        <span className="md:hidden font-bold text-navy text-base tracking-tight truncate mr-2">
          ReferralSystem
        </span>

        {/* Search Bar - hidden on small screens */}
        <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-secondary/50 focus-within:border-secondary transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-44 lg:w-64 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Profile Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-expanded={showDropdown}
            aria-haspopup="true"
            className="flex items-center space-x-2 focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-secondary/40 transition-all cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
            title="User Profile Menu"
          >
            <img
              src={avatarSrc}
              alt={user?.name || 'Profile'}
              onError={() => setImgError(true)}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide rounded bg-secondary/10 text-secondary">
                  {user?.role || 'User'}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to={`/${user?.role || 'employee'}/profile`}
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
                >
                  <UserIcon className="w-4 h-4 mr-2.5 text-slate-500" />
                  Edit Profile
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

