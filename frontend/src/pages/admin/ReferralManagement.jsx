import React, { useState, useEffect, useRef } from 'react';
import { adminService, referralService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { LoadingState, EmptyState } from '../../components/States';
import {
  GitPullRequest,
  Search,
  Eye,
  RefreshCw,
  FileText,
  Clock,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
} from 'lucide-react';

const ReferralManagement = () => {
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const activeRequestId = useRef(0);

  // Details Modal
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Update Status Form inside modal
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Downloading resume state
  const [downloadingId, setDownloadingId] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchReferrals = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      const res = await adminService.getReferrals(params);

      if (requestId === activeRequestId.current) {
        const list = res.data?.data?.referrals || [];
        const pag = res.data?.data?.pagination || {
          total: list.length,
          page: targetPage,
          limit,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        };

        setReferrals(list);
        setPagination(pag);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Fetch admin referrals error:', err);
        setError(err.response?.data?.message || 'Failed to load referral records.');
        setReferrals([]);
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReferrals(page);
  }, [debouncedSearch, statusFilter, page, limit]);

  const handleOpenDetails = (ref) => {
    setSelectedReferral(ref);
    setNewStatus(ref.status);
    setStatusRemarks(ref.remarks || '');
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      setIsUpdatingStatus(true);
      await referralService.updateStatus(selectedReferral.id, newStatus, statusRemarks);
      toast.success('Referral status updated successfully!');
      setIsDetailsModalOpen(false);
      fetchReferrals(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update referral status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadResume = async (referralId, candidateName) => {
    try {
      setDownloadingId(referralId);
      const res = await referralService.getResume(referralId);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(candidateName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully.');
    } catch (err) {
      console.error('Download resume error:', err);
      toast.error('Resume could not be downloaded.');
    } finally {
      setDownloadingId(null);
    }
  };

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
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return '—';
    if (status === 'selected') return 'Selected / Hired';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  const columns = [
    {
      header: 'Candidate',
      accessor: 'Candidate.name',
      render: (row) => (
        <div>
          <div className="font-bold text-navy text-sm">{row.Candidate?.name || 'Unnamed Candidate'}</div>
          <div className="text-xs text-slate-500">{row.Candidate?.email}</div>
        </div>
      ),
    },
    {
      header: 'Target Job',
      accessor: 'Job.title',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm leading-tight">{row.Job?.title || 'Open Position'}</div>
          <div className="text-xs text-secondary">{row.Job?.department}</div>
        </div>
      ),
    },
    {
      header: 'Referring Employee',
      accessor: 'Employee.name',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{row.Employee?.name || 'Employee Staff'}</div>
          <div className="text-xs text-slate-400">{row.Employee?.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={getStatusColor(row.status)} className="capitalize text-xs">
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      header: 'Date Submitted',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {row.Candidate?.hasResume && (
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingId === row.id}
              onClick={() => handleDownloadResume(row.id, row.Candidate?.name)}
              className="text-xs px-2.5 py-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              title="Download Candidate Resume"
            >
              {downloadingId === row.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Resume
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDetails(row)}
            className="text-xs px-2.5 py-1"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-navy">Referral Management</h1>
            <Badge variant="primary" className="text-xs px-2.5 py-0.5">
              {pagination.total} Referrals
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            System administration oversight of all employee candidate referrals and hiring stages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchReferrals(page)}
            disabled={loading}
            className="flex items-center text-slate-700 bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-primary/10 text-primary">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{pagination.total}</h3>
            <span className="text-xs text-slate-400">Recorded across company</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
              {referrals.filter((r) => ['referred', 'under_review'].includes(r.status)).length}
            </h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-indigo-50 text-indigo-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortlisted</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-0.5">
              {referrals.filter((r) => ['shortlisted', 'interview'].includes(r.status)).length}
            </h3>
            <span className="text-xs text-slate-400">In interview pipeline</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placed / Hired</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
              {referrals.filter((r) => r.status === 'selected').length}
            </h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="p-5 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, job title, or referrer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value="all">All Referral Stages</option>
              <option value="referred">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="selected">Selected / Hired</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* Per page */}
          <div className="lg:col-span-2">
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Matching referrals: <strong className="text-navy">{pagination.total}</strong> records
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:bg-rose-50"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Referrals Table */}
      <Card className="p-0 overflow-hidden border border-slate-100">
        {loading ? (
          <LoadingState message="Retrieving referrals from organization database..." />
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Unable to Load Referrals</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <Button variant="primary" size="md" onClick={() => fetchReferrals(page)} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Request
            </Button>
          </div>
        ) : referrals.length === 0 ? (
          <EmptyState
            icon={GitPullRequest}
            title="No referrals found"
            description={hasActiveFilters ? 'No referrals match your search filters.' : 'There are currently no referrals in the database.'}
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                  Clear Filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div>
            <Table columns={columns} data={referrals} keyField="id" />

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{' '}
                <strong className="text-navy">
                  {(pagination.page - 1) * pagination.limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-navy">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                of <strong className="text-navy">{pagination.total}</strong> referrals
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="text-xs flex items-center px-2.5 py-1 bg-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>

                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="text-xs flex items-center px-2.5 py-1 bg-white"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Details & Status Modal */}
      {selectedReferral && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Referral Details — ${selectedReferral.Candidate?.name || 'Candidate'}`}
          footer={
            <Button variant="outline" size="md" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{selectedReferral.Candidate?.name}</h3>
                <p className="text-xs text-slate-500">{selectedReferral.Candidate?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getStatusColor(selectedReferral.status)}>
                    {getStatusLabel(selectedReferral.status)}
                  </Badge>
                  {selectedReferral.Candidate?.emailVerified && (
                    <Badge variant="success" className="text-[10px]">VERIFIED EMAIL</Badge>
                  )}
                </div>
              </div>

              {selectedReferral.Candidate?.hasResume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadResume(selectedReferral.id, selectedReferral.Candidate?.name)}
                  className="text-xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Download Resume
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block font-medium">Applied Position</span>
                <span className="text-sm font-semibold text-slate-800">{selectedReferral.Job?.title || 'Open Position'}</span>
                <span className="text-[11px] text-secondary block">{selectedReferral.Job?.department}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block font-medium">Referring Employee</span>
                <span className="text-sm font-semibold text-slate-800">{selectedReferral.Employee?.name || 'Employee Staff'}</span>
                <span className="text-[11px] text-slate-500 block">{selectedReferral.Employee?.email}</span>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                Update Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Recruitment Stage"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="py-2 text-sm"
                >
                  <option value="referred">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="selected">Selected / Hired</option>
                  <option value="rejected">Rejected</option>
                </Select>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    HR Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Notes on candidate progress..."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdatingStatus || newStatus === selectedReferral.status}
                >
                  {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReferralManagement;

