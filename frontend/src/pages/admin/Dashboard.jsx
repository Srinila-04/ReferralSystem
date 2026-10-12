import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { LoadingState } from '../../components/States';
import {
  Users,
  UserCheck,
  UserPlus,
  Briefcase,
  GitPullRequest,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Activity,
  Mail,
  Shield,
  Layers,
  Calendar,
  ExternalLink,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDashboard();
      if (res.data?.success && res.data?.data) {
        setDashboardData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Fetch admin dashboard error:', err);
      const msg =
        err.response?.data?.message ||
        'Unable to load system overview metrics from the database.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="py-24">
        <LoadingState message="Connecting to database and aggregating system overview..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="py-12">
        <Card className="p-8 text-center max-w-lg mx-auto border border-rose-100 shadow-soft">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">Unable to Load Admin Dashboard</h3>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button
            variant="primary"
            size="md"
            onClick={fetchDashboard}
            className="mt-5 inline-flex items-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Request
          </Button>
        </Card>
      </div>
    );
  }

  const {
    metrics = {},
    userDistribution = [],
    recruitmentOverview = { jobs: {}, referrals: [] },
    recentJobs = [],
    recentReferrals = [],
    recentActivity = [],
  } = dashboardData || {};

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          SECTION 1: Welcome Header
          ========================================================================= */}
      <div className="bg-gradient-to-r from-navy via-[#0C2F7A] to-[#113A8C] rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2 text-primary-100 text-xs font-semibold tracking-wider uppercase mb-1.5 opacity-85">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Administrator'}!
            </h1>
            <p className="text-slate-200 text-sm mt-1 max-w-2xl">
              System administration and operational health console. Monitor users, jobs, referrals, and audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/employees')}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy font-semibold text-xs shadow-xs cursor-pointer flex items-center"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Manage Users
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* =========================================================================
          SECTION 2: System Overview Metrics (Supported by real database counts)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
            System Overview Metrics
          </h2>
          <span className="text-xs text-slate-400">Aggregated real-time from database</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Registered Users */}
          <Card
            onClick={() => navigate('/admin/employees')}
            className="p-5 border border-[#E7EAF0] hover:border-secondary transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Users
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-navy">{metrics.totalUsers ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">All accounts across roles</p>
          </Card>

          {/* 2. Total Employees */}
          <Card
            onClick={() => navigate('/admin/employees')}
            className="p-5 border border-[#E7EAF0] hover:border-blue-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Employees
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{metrics.totalEmployees ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Verified employee staff</p>
          </Card>

          {/* 3. Total HR Users */}
          <Card
            onClick={() => navigate('/admin/hr')}
            className="p-5 border border-[#E7EAF0] hover:border-indigo-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total HR Users
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-indigo-600">{metrics.totalHR ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Hiring managers & recruiters</p>
          </Card>

          {/* 4. Total Candidates */}
          <Card
            onClick={() => navigate('/admin/candidates')}
            className="p-5 border border-[#E7EAF0] hover:border-purple-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Candidates
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{metrics.totalCandidates ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">In organization talent pool</p>
          </Card>

          {/* 5. Total Jobs */}
          <Card
            onClick={() => navigate('/admin/jobs')}
            className="p-5 border border-[#E7EAF0] hover:border-secondary transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Jobs
              </span>
              <div className="p-2 rounded-lg bg-secondary-50 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-navy">{metrics.totalJobs ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Open & closed positions</p>
          </Card>

          {/* 6. Active Open Jobs */}
          <Card
            onClick={() => navigate('/admin/jobs')}
            className="p-5 border border-[#E7EAF0] hover:border-emerald-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Open Jobs
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{metrics.openJobs ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Actively accepting candidate referrals</p>
          </Card>

          {/* 7. Total Referrals */}
          <Card
            onClick={() => navigate('/admin/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-amber-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Referrals
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <GitPullRequest className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600">{metrics.totalReferrals ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">All employee submissions</p>
          </Card>

          {/* 8. Pending Referrals */}
          <Card
            onClick={() => navigate('/admin/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-rose-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Review
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-rose-600">{metrics.pendingReferrals ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting or undergoing review</p>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: User Distribution & SECTION 4: Recruitment Overview
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 3: User Distribution (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy flex items-center">
              <Shield className="w-4 h-4 mr-2 text-secondary" />
              User Distribution
            </h2>
            <span className="text-xs text-slate-400">By security role</span>
          </div>

          <Card className="p-5 border border-[#E7EAF0] shadow-xs space-y-4">
            <p className="text-xs text-slate-500">
              Breakdown of registered organization accounts by permission level.
            </p>

            <div className="space-y-3">
              {userDistribution.map((item) => (
                <div key={item.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="text-slate-500 font-medium">
                      <strong className="text-navy">{item.count}</strong> ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Managed Accounts:</span>
              <strong className="text-navy font-bold">{metrics.totalUsers} accounts</strong>
            </div>
          </Card>
        </div>

        {/* Section 4: Recruitment Overview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy flex items-center">
              <Layers className="w-4 h-4 mr-2 text-secondary" />
              Recruitment Pipeline Overview
            </h2>
            <Link
              to="/admin/referrals"
              className="text-xs font-semibold text-secondary hover:text-navy flex items-center"
            >
              All Referrals <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <Card className="p-5 border border-[#E7EAF0] shadow-xs space-y-4">
            {/* Job Openings ratio */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-navy block text-sm">
                  {recruitmentOverview.jobs?.open || 0} Open Positions
                </span>
                <span className="text-slate-500 text-[11px]">
                  Out of {recruitmentOverview.jobs?.total || 0} total created jobs ({recruitmentOverview.jobs?.openPercentage || 0}% active)
                </span>
              </div>
              <Badge variant="success" className="text-xs">
                {recruitmentOverview.jobs?.open || 0} Active
              </Badge>
            </div>

            {/* Referrals by status cards */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Referral Candidates by Stage
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {recruitmentOverview.referrals?.map((stage) => (
                  <div
                    key={stage.status}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between"
                  >
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {stage.label}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-lg font-bold text-navy">{stage.count}</span>
                      <span className="text-[10px] text-slate-400">
                        {metrics.totalReferrals > 0
                          ? Math.round((stage.count / metrics.totalReferrals) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: Recent System Activity (MongoDB ActivityLog)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center">
              <Activity className="w-4 h-4 mr-2 text-secondary" />
              Recent System Activity
            </h2>
            <p className="text-xs text-slate-500">Live recruitment events recorded in MongoDB</p>
          </div>
          <Link
            to="/admin/activity-logs"
            className="text-xs font-semibold text-secondary hover:text-navy flex items-center"
          >
            View Full Audit Log <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <Card className="p-0 border border-[#E7EAF0] shadow-xs overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Activity Logs Found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Events will automatically record here when referrals, emails, or status changes occur.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                      {log.actor && (
                        <span className="text-xs text-slate-500">
                          by <strong className="text-navy font-semibold">{log.actor.name}</strong> ({log.actor.role || 'user'})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">{log.details || 'No details'}</p>
                  </div>
                  <div className="shrink-0 text-[11px] text-slate-400 font-medium">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* =========================================================================
          SECTION 6: Quick Actions
          ========================================================================= */}
      <div>
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
          Administrative Workflows
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <Link
            to="/admin/employees"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Employees</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Directory</span>
          </Link>

          <Link
            to="/admin/hr"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-2">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">HR Team</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Directory</span>
          </Link>

          <Link
            to="/admin/candidates"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors mb-2">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Candidates</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Talent Pool</span>
          </Link>

          <Link
            to="/admin/jobs"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Jobs</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Management</span>
          </Link>

          <Link
            to="/admin/referrals"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors mb-2">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Referrals</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Oversight</span>
          </Link>

          <Link
            to="/admin/activity-logs"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Activity Logs</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Audit Trail</span>
          </Link>

          <Link
            to="/admin/email-history"
            className="p-4 bg-white border border-[#E7EAF0] hover:border-secondary hover:shadow-xs rounded-xl transition-all text-center group flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors mb-2">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-navy">Email History</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Dispatches</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
