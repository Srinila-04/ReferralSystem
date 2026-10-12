import React, { useState, useEffect, useRef } from 'react';
import { adminService, jobService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { LoadingState, EmptyState } from '../../components/States';
import {
  Briefcase,
  Search,
  Plus,
  Eye,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Users,
} from 'lucide-react';

const JobManagement = () => {
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

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

  // Modals state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    department: 'Engineering',
    location: '',
    experience: '1-3 Years',
    description: '',
  });

  // Toggling status state
  const [togglingJobId, setTogglingJobId] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchJobs = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
      };

      const res = await adminService.getJobs(params);

      if (requestId === activeRequestId.current) {
        const list = res.data?.data?.jobs || [];
        const pag = res.data?.data?.pagination || {
          total: list.length,
          page: targetPage,
          limit,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        };

        setJobs(list);
        setPagination(pag);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Fetch admin jobs error:', err);
        setError(err.response?.data?.message || 'Failed to load organization jobs.');
        setJobs([]);
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchJobs(page);
  }, [debouncedSearch, statusFilter, departmentFilter, page, limit]);

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      setTogglingJobId(job.id);
      await adminService.toggleJobStatus(job.id, newStatus);
      toast.success(`Job "${job.title}" marked as ${newStatus}!`);
      fetchJobs(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status.');
    } finally {
      setTogglingJobId(null);
    }
  };

  const handleCreateJobSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.location.trim() || !createForm.description.trim()) {
      toast.error('Title, location, and description are required.');
      return;
    }

    try {
      setCreatingJob(true);
      await jobService.createJob({
        title: createForm.title.trim(),
        department: createForm.department.trim(),
        location: createForm.location.trim(),
        experience: createForm.experience.trim(),
        description: createForm.description.trim(),
      });

      toast.success('New job posted successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        department: 'Engineering',
        location: '',
        experience: '1-3 Years',
        description: '',
      });
      fetchJobs(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setCreatingJob(false);
    }
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
    setDepartmentFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'all' || departmentFilter !== 'all';

  const columns = [
    {
      header: 'Job Title & Location',
      accessor: 'title',
      render: (row) => (
        <div>
          <div className="font-bold text-navy text-sm leading-tight">{row.title}</div>
          <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
              {row.location}
            </span>
            <span>&bull;</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-0.5 text-slate-400" />
              {row.experience || 'Any experience'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{row.department}</span>
        </div>
      ),
    },
    {
      header: 'Referrals',
      accessor: 'referralCount',
      render: (row) => (
        <Badge variant={row.referralCount > 0 ? 'primary' : 'default'} className="font-semibold text-xs">
          {row.referralCount || 0} Candidate{row.referralCount !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'open' ? 'success' : 'default'} className="capitalize">
          {row.status === 'open' ? 'Active Open' : 'Closed'}
        </Badge>
      ),
    },
    {
      header: 'Date Posted',
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedJob(row);
              setIsDetailsModalOpen(true);
            }}
            className="text-xs px-2.5 py-1"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Details
          </Button>

          <Button
            variant={row.status === 'open' ? 'ghost' : 'outline'}
            size="sm"
            disabled={togglingJobId === row.id}
            onClick={() => handleToggleStatus(row)}
            className={`text-xs px-2.5 py-1 ${
              row.status === 'open'
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
            }`}
            title={row.status === 'open' ? 'Close this job opening' : 'Reopen this job opening'}
          >
            {togglingJobId === row.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : row.status === 'open' ? (
              'Close'
            ) : (
              'Reopen'
            )}
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
            <h1 className="text-2xl font-bold text-navy">Job Management</h1>
            <Badge variant="primary" className="text-xs px-2.5 py-0.5">
              {pagination.total} Total Positions
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            System administration oversight of all open and closed job requisitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchJobs(page)}
            disabled={loading}
            className="flex items-center text-slate-700 bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-primary/10 text-primary">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Positions</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{pagination.total}</h3>
            <span className="text-xs text-slate-400">Created in system</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Open Roles</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
              {jobs.filter((j) => j.status === 'open').length}
            </h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-slate-100 text-slate-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Closed Roles</p>
            <h3 className="text-2xl font-bold text-slate-600 mt-0.5">
              {jobs.filter((j) => j.status === 'closed').length}
            </h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">
              {jobs.reduce((acc, curr) => acc + (curr.referralCount || 0), 0)}
            </h3>
            <span className="text-xs text-slate-400">Across current jobs</span>
          </div>
        </Card>
      </div>

      {/* Search and Filters Card */}
      <Card className="p-5 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, location, or keyword..."
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
          <div className="lg:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value="all">All Job Statuses</option>
              <option value="open">Active Open Positions</option>
              <option value="closed">Closed Positions</option>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="lg:col-span-2">
            <Select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
            </Select>
          </div>

          {/* Records per page */}
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
              Matching positions: <strong className="text-navy">{pagination.total}</strong>
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

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden border border-slate-100">
        {loading ? (
          <LoadingState message="Retrieving jobs from organization database..." />
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Unable to Load Jobs</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <Button variant="primary" size="md" onClick={() => fetchJobs(page)} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={hasActiveFilters ? 'No jobs match your search filters.' : 'There are currently no job requisitions in the system.'}
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
            <Table columns={columns} data={jobs} keyField="id" />

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
                of <strong className="text-navy">{pagination.total}</strong> positions
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

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Job Details — ${selectedJob.title}`}
          footer={
            <Button variant="outline" size="md" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-navy">{selectedJob.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-secondary">{selectedJob.department}</span>
                  <span>&bull;</span>
                  <span>{selectedJob.location}</span>
                </div>
              </div>
              <Badge variant={selectedJob.status === 'open' ? 'success' : 'default'}>
                {selectedJob.status === 'open' ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block font-medium">Experience Required</span>
                <span className="text-sm font-semibold text-slate-800">{selectedJob.experience || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block font-medium">Referral Applications</span>
                <span className="text-sm font-bold text-navy">{selectedJob.referralCount || 0} Submitted</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Job Description
              </h4>
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {selectedJob.description}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post New Job Opening"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={creatingJob}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="create-job-form"
              disabled={creatingJob}
              className="w-full sm:w-auto"
            >
              {creatingJob ? 'Publishing Job...' : 'Publish Job'}
            </Button>
          </div>
        }
      >
        <form id="create-job-form" onSubmit={handleCreateJobSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Cloud Architect"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Select
                label="Department"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="py-2 text-sm"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Austin, TX (Hybrid)"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Experience Requirement
            </label>
            <input
              type="text"
              placeholder="e.g. 3-5 Years"
              value={createForm.experience}
              onChange={(e) => setCreateForm({ ...createForm, experience: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide a comprehensive role description and qualifications..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-sans leading-relaxed"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobManagement;

