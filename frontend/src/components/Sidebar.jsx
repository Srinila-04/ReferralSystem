import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Briefcase,
  GitPullRequest,
  Activity,
  Mail,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role, isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  // Navigation items based on role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { group: 'Overview' },
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { group: 'User Management' },
          { label: 'Employee Directory', path: '/admin/employees', icon: Users },
          { label: 'HR Directory', path: '/admin/hr', icon: UserCheck },
          { label: 'Candidate Directory', path: '/admin/candidates', icon: UserPlus },
          { group: 'Recruitment Oversight' },
          { label: 'Job Management', path: '/admin/jobs', icon: Briefcase },
          { label: 'Referral Management', path: '/admin/referrals', icon: GitPullRequest },
          { group: 'System Logs' },
          { label: 'Activity Logs', path: '/admin/activity-logs', icon: Activity },
          { label: 'Email History', path: '/admin/email-history', icon: Mail },
          { group: 'Account' },
          { label: 'My Profile', path: '/admin/profile', icon: User },
        ];
      case 'hr':
        return [
          { group: 'Menu' },
          { label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
          { label: 'Jobs', path: '/hr/jobs', icon: Briefcase },
          { label: 'Referrals', path: '/hr/referrals', icon: UserPlus },
          { label: 'My Profile', path: '/hr/profile', icon: User },
        ];
      case 'employee':
        return [
          { group: 'Menu' },
          { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
          { label: 'Find Jobs', path: '/employee/jobs', icon: Briefcase },
          { label: 'Refer a Candidate', path: '/employee/jobs?action=refer', icon: UserPlus },
          { label: 'My Referrals', path: '/employee/referrals', icon: Users },
          { label: 'My Profile', path: '/employee/profile', icon: User },
        ];
      case 'candidate':
        return [
          { group: 'Menu' },
          { label: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
          { label: 'My Profile', path: '/candidate/profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <h1 className="text-xl font-bold text-navy tracking-tight">ReferralSystem</h1>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
        {navItems.map((item, idx) => {
          if (item.group) {
            return (
              <p
                key={`group-${idx}`}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2.5 pb-0.5 first:pt-0.5"
              >
                {item.group}
              </p>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-secondary-50 text-secondary shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-2.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Authenticated User Footer */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <div className="flex items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
          {!imgError && user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || 'User'}
              onError={() => setImgError(true)}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm mr-2.5 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs mr-2.5 shrink-0">
              {(user?.name || role || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-navy truncate">
              {user?.name || `${role} User`}
            </span>
            <span className="text-[11px] text-slate-500 capitalize">{role} Account</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
