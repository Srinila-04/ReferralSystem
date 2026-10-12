import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employeeService, jobService, referralService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { LoadingState } from '../../components/States';
import {
  Briefcase,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  RefreshCw,
  MapPin,
  AlertCircle,
  ChevronRight,
  FileText,
  Calendar,
  XCircle,
  HelpCircle,
  Send,
  UploadCloud,
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Referral for Section 5: Referral Progress
  const [selectedReferralId, setSelectedReferralId] = useState(null);

  // Job Details Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [detailedJob, setDetailedJob] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Direct Referral Submission Modal from Dashboard
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const [referralFormData, setReferralFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await employeeService.getDashboard();
      if (res.data?.success && res.data?.data) {
        setDashboardData(res.data.data);
        // Automatically select the newest referral for Progress component if not chosen
        if (res.data.data.recentReferrals?.length > 0 && !selectedReferralId) {
          setSelectedReferralId(res.data.data.recentReferrals[0].id);
        }
      } else {
        throw new Error(res.data?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Employee Dashboard fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load live employee metrics from backend. Please verify your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Open Job Details Modal
  const handleOpenViewModal = async (jobId) => {
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await jobService.getJobById(jobId);
      setDetailedJob(res.data.job);
    } catch (err) {
      toast.error('Failed to load job details. Please try again.');
      setIsViewModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Direct Referral Modal for a selected job
  const handleOpenReferralModal = (job) => {
    setDetailedJob(job);
    setIsViewModalOpen(false);
    setReferralFormData({ candidateName: '', candidateEmail: '', candidatePhone: '' });
    setResumeFile(null);
    setResumeError(null);
    setSubmissionFeedback(null);
    setIsReferralModalOpen(true);
  };

  // Handle Resume File Selection
  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (!resumeFile) setResumeError('Candidate resume is required.');
      return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx'];
    if (!allowed.includes(ext)) {
      setResumeError('Invalid file type. Only PDF, DOC, and DOCX formats are accepted.');
      setResumeFile(null);
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setResumeError('File is too large. Maximum allowed file size is 5 MB.');
      setResumeFile(null);
      e.target.value = '';
      return;
    }

    setResumeFile(file);
    setResumeError(null);
  };

  // Submit Referral from Dashboard
  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    if (!detailedJob) return;

    if (!resumeFile) {
      setResumeError('Candidate resume is required (PDF, DOC, or DOCX, max 5 MB).');
      return;
    }

    setSubmittingReferral(true);
    setSubmissionFeedback(null);

    try {
      const formData = new FormData();
      formData.append('candidateName', referralFormData.candidateName.trim());
      formData.append('candidateEmail', referralFormData.candidateEmail.trim());
      formData.append('candidatePhone', referralFormData.candidatePhone || '');
      formData.append('jobId', detailedJob.id);
      formData.append('resume', resumeFile);

      await referralService.createReferral(formData);

      toast.success('Referral submitted successfully with candidate resume!');
      setSubmissionFeedback({
        type: 'success',
        message: 'Referral submitted successfully with candidate resume!',
      });

      // Refresh dashboard data so metrics and recent referrals update immediately
      setTimeout(() => {
        setIsReferralModalOpen(false);
        setReferralFormData({ candidateName: '', candidateEmail: '', candidatePhone: '' });
        setResumeFile(null);
        setResumeError(null);
        setSubmissionFeedback(null);
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit referral. Please try again.';
      toast.error(errorMsg);
      setSubmissionFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setSubmittingReferral(false);
    }
  };

  // Helper status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'referred':
        return 'primary';
      case 'under_review':
        return 'warning';
      case 'shortlisted':
        return 'secondary';
      case 'interview':
        return 'info';
      case 'selected':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return '—';
    if (status === 'selected') return 'Selected / Hired';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading && !dashboardData) {
    return (
      <div className="py-20">
        <LoadingState message="Loading your employee dashboard..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="py-12">
        <Card className="p-10 text-center max-w-lg mx-auto border border-rose-100 shadow-soft">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">Unable to Load Dashboard</h3>
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

  const { metrics, recentJobs, recentReferrals } = dashboardData || {
    metrics: {
      totalReferrals: 0,
      pendingReview: 0,
      shortlisted: 0,
      hired: 0,
    },
    recentJobs: [],
    recentReferrals: [],
  };

  // Find active referral for Section 5 Progress
  const activeReferral =
    recentReferrals.find((ref) => ref.id === selectedReferralId) ||
    recentReferrals[0] ||
    null;

  // Actual backend status workflow sequence:
  // referred -> under_review -> shortlisted -> interview -> selected
  const workflowStages = [
    { key: 'referred', label: 'Submitted', desc: 'Referral submitted' },
    { key: 'under_review', label: 'Under Review', desc: 'HR review' },
    { key: 'shortlisted', label: 'Shortlisted', desc: 'Screening passed' },
    { key: 'interview', label: 'Interview', desc: 'Hiring interviews' },
    { key: 'selected', label: 'Selected / Hired', desc: 'Offer & placement' },
  ];

  const getWorkflowStepIndex = (status) => {
    switch (status) {
      case 'referred':
        return 0;
      case 'under_review':
        return 1;
      case 'shortlisted':
        return 2;
      case 'interview':
        return 3;
      case 'selected':
        return 4;
      case 'rejected':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = activeReferral ? getWorkflowStepIndex(activeReferral.status) : 0;
  const isRejected = activeReferral?.status === 'rejected';

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
              Welcome back, {user?.name || 'Valued Employee'}!
            </h1>
            <p className="text-slate-200 text-sm mt-1 max-w-xl">
              Discover opportunities and track your referrals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/employee/jobs')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs text-xs font-medium cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Browse Jobs
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/employee/jobs?action=refer')}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy font-semibold text-xs shadow-xs cursor-pointer flex items-center"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Refer a Candidate
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* =========================================================================
          SECTION 2: Referral Summary Cards (Real Database Data)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
            Referral Summary
          </h2>
          <span className="text-xs text-slate-400">Derived from your referral submissions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Referrals */}
          <Card
            onClick={() => navigate('/employee/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-secondary transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Referrals
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-navy">{metrics.totalReferrals ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">All candidates you have submitted</p>
          </Card>

          {/* 2. Pending Review */}
          <Card
            onClick={() => navigate('/employee/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-amber-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Review
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {metrics.pendingReview ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting or undergoing HR evaluation</p>
          </Card>

          {/* 3. Shortlisted */}
          <Card
            onClick={() => navigate('/employee/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-purple-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Shortlisted
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.shortlisted ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cleared screening for next rounds</p>
          </Card>

          {/* 4. Hired / Selected */}
          <Card
            onClick={() => navigate('/employee/referrals')}
            className="p-5 border border-[#E7EAF0] hover:border-emerald-400 transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hired / Selected
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{metrics.hired ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Successfully placed in the organization</p>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: Open Job Opportunities (Recently Posted Jobs)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-secondary" />
              Recently Posted Jobs
            </h2>
            <p className="text-xs text-slate-500">
              Active open roles eligible for candidate referrals
            </p>
          </div>
          <Link
            to="/employee/jobs"
            className="text-xs font-semibold text-secondary hover:text-navy flex items-center transition-colors"
          >
            Browse All Jobs <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <Card className="p-8 text-center border border-[#E7EAF0] bg-slate-50/50">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No Open Job Openings Available</h4>
            <p className="text-xs text-slate-500 mt-1">
              Check back soon for new hiring opportunities.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentJobs.map((job) => (
              <Card
                key={job.id}
                className="p-4 border border-[#E7EAF0] hover:border-secondary transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-navy text-sm line-clamp-1" title={job.title}>
                      {job.title}
                    </h3>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                      Open
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary font-medium mb-3">{job.department}</p>
                  <div className="space-y-1 text-[11px] text-slate-500 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                      <span>{job.experience || 'Experience: Any'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenViewModal(job.id)}
                    className="flex-1 text-xs py-1.5 cursor-pointer"
                  >
                    Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenReferralModal(job)}
                    className="flex-1 text-xs py-1.5 flex items-center justify-center cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Refer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: My Recent Referrals & SECTION 5: Referral Progress
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 4: My Recent Referrals (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy flex items-center">
                <Users className="w-4 h-4 mr-2 text-secondary" />
                My Recent Referrals
              </h2>
              <p className="text-xs text-slate-500">
                Latest 5 submissions from your account
              </p>
            </div>
            <Link
              to="/employee/referrals"
              className="text-xs font-semibold text-secondary hover:text-navy flex items-center transition-colors"
            >
              View All Referrals <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <Card className="p-0 border border-[#E7EAF0] overflow-hidden shadow-xs">
            {recentReferrals.length === 0 ? (
              <div className="p-8 text-center">
                <UserPlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No Referrals Submitted Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Know someone talented? Browse open jobs above and submit your first candidate referral.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/employee/jobs?action=refer')}
                  className="mt-4 text-xs inline-flex items-center"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Refer Your First Candidate
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReferrals.map((ref) => {
                  const isSelected = activeReferral?.id === ref.id;
                  return (
                    <div
                      key={ref.id}
                      onClick={() => setSelectedReferralId(ref.id)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-secondary/5 border-l-4 border-secondary' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {ref.Candidate?.name || 'Unnamed Candidate'}
                          </p>
                          {isSelected && (
                            <span className="text-[10px] font-medium text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                              Tracking
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {ref.Candidate?.email || 'No email'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-600 truncate">
                            {ref.Job?.title || 'General Position'}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {ref.createdAt
                              ? new Date(ref.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2">
                        <Badge variant={getStatusColor(ref.status)} className="capitalize text-xs">
                          {getStatusLabel(ref.status)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* SECTION 5: Referral Progress (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-secondary" />
              Referral Progress
            </h2>
            <p className="text-xs text-slate-500">
              Live recruitment stage for selected candidate
            </p>
          </div>

          <Card className="p-5 border border-[#E7EAF0] shadow-xs">
            {!activeReferral ? (
              <div className="p-6 text-center text-slate-500">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No Active Referral</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Submit a candidate to track their progress through HR review, screening, and selection.
                </p>
                <Link
                  to="/employee/jobs"
                  className="mt-3 inline-block text-xs text-secondary font-medium hover:underline"
                >
                  Explore open jobs &rarr;
                </Link>
              </div>
            ) : (
              <div>
                {/* Header card for the selected referral */}
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Currently Viewing
                    </span>
                    <h4 className="font-bold text-navy text-sm truncate">
                      {activeReferral.Candidate?.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      Role: {activeReferral.Job?.title}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(activeReferral.status)}>
                    {getStatusLabel(activeReferral.status)}
                  </Badge>
                </div>

                {/* If Rejected: Show distinct alert with remarks */}
                {isRejected ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-3 text-rose-900">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Candidate Not Selected
                    </div>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {activeReferral.remarks
                        ? `HR Feedback: "${activeReferral.remarks}"`
                        : 'The hiring team evaluated this candidate and decided not to proceed further at this time.'}
                    </p>
                  </div>
                ) : null}

                {/* Workflow Stepper */}
                <div className="space-y-4 my-2">
                  {workflowStages.map((stage, idx) => {
                    const isCompleted = currentStepIndex > idx && !isRejected;
                    const isCurrent = currentStepIndex === idx && !isRejected;

                    return (
                      <div key={stage.key} className="flex items-start gap-3 relative">
                        {/* Connecting Line */}
                        {idx < workflowStages.length - 1 && (
                          <div
                            className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-2 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Step Marker */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all z-10 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-secondary text-white ring-4 ring-secondary/20 shadow-xs'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Step Info */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold ${
                                isCurrent
                                  ? 'text-navy font-bold'
                                  : isCompleted
                                  ? 'text-emerald-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-1.5 py-0.2 rounded">
                                Active Stage
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Submitted on: {new Date(activeReferral.createdAt).toLocaleDateString()}</span>
                  <Link
                    to="/employee/referrals"
                    className="text-secondary hover:underline font-medium"
                  >
                    View All &rarr;
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* =========================================================================
          VIEW JOB MODAL
          ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Job Details"
      >
        {detailsLoading ? (
          <LoadingState message="Loading details..." />
        ) : detailedJob ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-navy">{detailedJob.title}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="success">Open</Badge>
                <span className="text-slate-500 text-sm">
                  {detailedJob.department} &bull; {detailedJob.location}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                Experience Required
              </h4>
              <p className="text-slate-600 text-sm">{detailedJob.experience || 'Not specified'}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                Job Description
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {detailedJob.description}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenReferralModal(detailedJob)}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Refer Candidate for This Role
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* =========================================================================
          DIRECT REFERRAL SUBMISSION MODAL
          ========================================================================= */}
      <Modal
        isOpen={isReferralModalOpen}
        onClose={() => {
          if (!submittingReferral) setIsReferralModalOpen(false);
        }}
        title={`Refer Candidate for ${detailedJob?.title || 'Open Role'}`}
      >
        <form onSubmit={handleReferralSubmit} className="space-y-4">
          {submissionFeedback && (
            <div
              className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                submissionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {submissionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{submissionFeedback.message}</span>
            </div>
          )}

          <Input
            label="Candidate Full Name"
            required
            value={referralFormData.candidateName}
            onChange={(e) =>
              setReferralFormData({ ...referralFormData, candidateName: e.target.value })
            }
            placeholder="e.g. Jane Smith"
          />

          <Input
            label="Candidate Email"
            type="email"
            required
            value={referralFormData.candidateEmail}
            onChange={(e) =>
              setReferralFormData({ ...referralFormData, candidateEmail: e.target.value })
            }
            placeholder="e.g. jane.smith@example.com"
          />

          <Input
            label="Candidate Phone (Optional)"
            type="tel"
            value={referralFormData.candidatePhone}
            onChange={(e) =>
              setReferralFormData({ ...referralFormData, candidatePhone: e.target.value })
            }
            placeholder="e.g. +1 555-0199"
          />

          {/* Mandatory Resume Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Candidate Resume <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-secondary rounded-xl p-4 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-7 h-7 text-secondary mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-700">
                {resumeFile ? resumeFile.name : 'Click to select candidate resume'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, DOC, or DOCX format (Max 5 MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
            {resumeError && (
              <p className="text-xs text-rose-600 mt-1 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {resumeError}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submittingReferral}
              onClick={() => setIsReferralModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingReferral}
              className="flex items-center"
            >
              {submittingReferral ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Referral
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
