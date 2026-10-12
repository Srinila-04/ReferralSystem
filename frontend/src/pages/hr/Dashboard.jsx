import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hrService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { LoadingState } from '../../components/States';
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  Activity,
  Mail,
  AlertCircle,
  Building2,
  MapPin,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const HRDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrService.getDashboard();
      if (res.data?.success && res.data?.data) {
        setDashboardData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('HR Dashboard fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load live recruitment metrics from backend. Please verify server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Formatter helpers
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'referred':
        return 'primary';
      case 'under_review':
        return 'warning';
      case 'shortlisted':
        return 'secondary';
      case 'interview':
        return 'primary';
      case 'selected':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'referred':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'shortlisted':
        return 'Shortlisted';
      case 'interview':
        return 'Interview';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading && !dashboardData) {
    return (
      <div className="py-16">
        <LoadingState message="Loading live HR recruitment dashboard..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="py-12">
        <Card className="p-12 text-center max-w-lg mx-auto border border-red-100 shadow-soft">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">Unable to Load HR Dashboard</h3>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button
            variant="primary"
            size="md"
            onClick={fetchDashboardData}
            className="mt-6 inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry API Request
          </Button>
        </Card>
      </div>
    );
  }

  const { metrics, pipeline, recentReferrals, recentJobs, recentActivity } = dashboardData || {
    metrics: {},
    pipeline: [],
    recentReferrals: [],
    recentJobs: [],
    recentActivity: [],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Welcome Header */}
      <div className="bg-gradient-to-r from-navy to-[#113A8C] rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-primary-100 text-xs font-semibold tracking-wider uppercase mb-1 opacity-80">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayDateString}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'HR Specialist'}!
            </h1>
            <p className="text-slate-200 text-sm mt-1 max-w-xl">
              Here is the real-time recruitment overview and referral pipeline for your organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/hr/jobs')}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy font-semibold text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* SECTION 2: Recruitment Overview Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-primary" />
            Recruitment Overview
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-time database metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Jobs */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Jobs</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{metrics.totalJobs ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span className="font-semibold text-emerald-600">{metrics.openJobs ?? 0}</span> Open Positions
            </div>
          </Card>

          {/* Open Jobs */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Open Jobs</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{metrics.openJobs ?? 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Accepting referrals
            </div>
          </Card>

          {/* Total Referrals */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Referrals</span>
              <div className="p-1.5 rounded-lg bg-secondary-50 text-secondary">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{metrics.totalReferrals ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              All submitted candidates
            </div>
          </Card>

          {/* Pending Review */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600">{metrics.pendingReview ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Awaiting HR evaluation
            </div>
          </Card>

          {/* Shortlisted */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Shortlisted</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{metrics.shortlisted ?? 0}</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">
              Ready for interview
            </div>
          </Card>

          {/* Hired / Selected */}
          <Card className="p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Hired / Selected</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{metrics.selected ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Successful hires
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: Referral Pipeline Breakdown */}
      <Card className="p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-navy">Referral Pipeline Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of {metrics.totalReferrals ?? 0} candidate referrals across active stages
            </p>
          </div>
          <Link
            to="/hr/referrals"
            className="text-xs font-semibold text-primary hover:text-navy inline-flex items-center"
          >
            Manage Referrals <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Visual Segmented Progress Bar */}
        {metrics.totalReferrals > 0 ? (
          <div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner mb-4">
              {pipeline.map((stage) => {
                if (stage.count === 0) return null;
                return (
                  <div
                    key={stage.status}
                    style={{ width: `${(stage.count / metrics.totalReferrals) * 100}%` }}
                    className={`${stage.color} h-full transition-all duration-300 relative group`}
                    title={`${stage.label}: ${stage.count} (${stage.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pipeline.map((stage) => (
                <div
                  key={stage.status}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-medium text-slate-600 truncate">{stage.label}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-navy">{stage.count}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No referral records found in the database.
          </div>
        )}
      </Card>

      {/* 2-COLUMN SECTION: Recent Referrals & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 4: Recent Referrals (7 cols) */}
        <Card className="lg:col-span-7 p-6 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy">Recent Candidate Referrals</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest 5 submissions awaiting or in review</p>
            </div>
            <Link
              to="/hr/referrals"
              className="text-xs font-semibold text-primary hover:text-navy inline-flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentReferrals && recentReferrals.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="pb-2.5">Candidate</th>
                    <th className="pb-2.5">Job Title</th>
                    <th className="pb-2.5">Referred By</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pr-3 font-semibold text-navy">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center text-[10px] shrink-0">
                            {getInitials(ref.Candidate?.name)}
                          </div>
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {ref.Candidate?.name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-700 font-medium truncate max-w-[140px]">
                        {ref.Job?.title || '—'}
                      </td>
                      <td className="py-3 px-2 text-slate-500 truncate max-w-[110px]">
                        {ref.Employee?.name || 'Employee'}
                      </td>
                      <td className="py-3 px-2 text-slate-400 whitespace-nowrap">
                        {formatDate(ref.createdAt)}
                      </td>
                      <td className="py-3 pl-2 text-right whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(ref.status)} className="text-[11px] py-0.5">
                          {getStatusLabel(ref.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent referrals recorded.
              </div>
            )}
          </div>
        </Card>

        {/* SECTION 5: Jobs Overview (5 cols) */}
        <Card className="lg:col-span-5 p-6 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy">Active Job Openings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Positions open for employee referrals</p>
            </div>
            <Link
              to="/hr/jobs"
              className="text-xs font-semibold text-primary hover:text-navy inline-flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {recentJobs && recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-navy truncate">{job.title}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center truncate">
                        <Building2 className="w-3 h-3 mr-1 shrink-0" />
                        {job.department}
                      </span>
                      <span>•</span>
                      <span className="flex items-center truncate">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        {job.location}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge variant={job.status === 'open' ? 'success' : 'default'} className="text-[10px]">
                      {job.status === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      {job.referralCount ?? 0} referrals
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active jobs created yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 2-COLUMN SECTION: Recent Activity (MongoDB) & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 6: Recent Activity (8 cols) */}
        <Card className="lg:col-span-8 p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-navy">Recruitment Activity Log</h3>
            </div>
            <span className="text-xs text-slate-400">Live events from MongoDB</span>
          </div>

          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((act) => {
                const isEmail = act.action?.includes('EMAIL');
                const isStatus = act.action?.includes('STATUS');
                return (
                  <div
                    key={act._id}
                    className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 flex items-start space-x-3 text-xs"
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isEmail
                          ? 'bg-blue-100 text-blue-700'
                          : isStatus
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isEmail ? <Mail className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          {isEmail ? 'Decision Email Sent' : isStatus ? 'Referral Status Updated' : act.action}
                        </span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px] break-words leading-relaxed">
                        {act.details || 'No additional details recorded'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              No recent recruitment activities recorded.
            </div>
          )}
        </Card>

        {/* SECTION 7: Quick Actions (4 cols) */}
        <Card className="lg:col-span-4 p-6 border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy mb-1">Quick Recruitment Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to HR operational workflows</p>

            <div className="space-y-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/hr/jobs')}
                className="w-full justify-between text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700 py-2.5"
              >
                <span className="flex items-center font-semibold">
                  <Briefcase className="w-4 h-4 mr-2 text-primary" />
                  Manage Job Openings
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/hr/referrals')}
                className="w-full justify-between text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700 py-2.5"
              >
                <span className="flex items-center font-semibold">
                  <Users className="w-4 h-4 mr-2 text-secondary" />
                  Review All Referrals
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/hr/referrals')}
                className="w-full justify-between text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700 py-2.5"
              >
                <span className="flex items-center font-semibold">
                  <Clock className="w-4 h-4 mr-2 text-amber-500" />
                  Pending Reviews ({metrics.pendingReview ?? 0})
                </span>
                <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                  Action
                </Badge>
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Referral Management System v2.0 • HR Portal
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HRDashboard;
