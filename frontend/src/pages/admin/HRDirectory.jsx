import React, { useState, useEffect, useRef } from 'react';
import { adminService, userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { LoadingState, EmptyState } from '../../components/States';
import {
  UserCheck,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const HRDirectory = () => {
  const toast = useToast();

  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Track active request
  const activeRequestId = useRef(0);

  // Modals state
  const [selectedHR, setSelectedHR] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingHR, setAddingHR] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Human Resources',
    designation: 'HR Specialist',
  });

  // Debounce search (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchHRUsers = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
      };

      const res = await adminService.getHR(params);

      if (requestId === activeRequestId.current) {
        const list = res.data?.data?.hrUsers || [];
        const pag = res.data?.data?.pagination || {
          total: list.length,
          page: targetPage,
          limit,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        };

        setHrUsers(list);
        setPagination(pag);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Fetch HR directory error:', err);
        const msg = err.response?.data?.message || 'Failed to load HR team records.';
        setError(msg);
        setHrUsers([]);
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchHRUsers(page);
  }, [debouncedSearch, departmentFilter, page, limit]);

  const handleAddHRSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    try {
      setAddingHR(true);
      await userService.createEmployee({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: 'hr',
      });

      toast.success(`HR Specialist ${addForm.name} registered successfully!`);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        department: 'Human Resources',
        designation: 'HR Specialist',
      });
      fetchHRUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add HR account.');
    } finally {
      setAddingHR(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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
    setDepartmentFilter('all');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || departmentFilter !== 'all';

  const columns = [
    {
      header: 'HR ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {`HR-${String(row.id).padStart(3, '0')}`}
        </span>
      ),
    },
    {
      header: 'HR Member',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-bold text-navy text-sm leading-tight">{row.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{row.designation || 'HR Specialist'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Work Email',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{row.department || 'Human Resources'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
          {(row.status || 'active').toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Date Joined',
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedHR(row);
            setIsDetailsModalOpen(true);
          }}
          className="text-xs flex items-center ml-auto border-slate-200 hover:border-secondary hover:text-secondary transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-navy">HR Directory</h1>
            <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
              {pagination.total} HR Staff
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            System administration view for authorized Human Resources accounts and talent partners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchHRUsers(page)}
            disabled={loading}
            className="flex items-center text-slate-700 bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add HR Member
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-indigo-50 text-indigo-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total HR Team</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{pagination.total}</h3>
            <span className="text-xs text-slate-400">Authorized recruiters</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-blue-50 text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Showing on Page</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{hrUsers.length}</h3>
            <span className="text-xs text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-emerald-50 text-emerald-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Department</p>
            <h3 className="text-xl font-bold text-navy mt-0.5">Human Resources</h3>
            <span className="text-xs text-slate-400">Talent Acquisition</span>
          </div>
        </Card>
      </div>

      {/* Search and Filters Card */}
      <Card className="p-5 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search HR member by name or email..."
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

          {/* Department Filter */}
          <div className="lg:col-span-3">
            <Select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="Human Resources">Human Resources</option>
              <option value="People & Culture">People & Culture</option>
              <option value="Recruitment">Recruitment</option>
            </Select>
          </div>

          {/* Per Page */}
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
              Matching HR records: <strong className="text-navy">{pagination.total}</strong>
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

      {/* HR Table */}
      <Card className="p-0 overflow-hidden border border-slate-100">
        {loading ? (
          <LoadingState message="Retrieving HR team directory from database..." />
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Unable to Load HR Directory</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <Button variant="primary" size="md" onClick={() => fetchHRUsers(page)} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : hrUsers.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No HR team accounts found"
            description={hasActiveFilters ? 'No HR staff match your search criteria.' : 'No HR users found in the database.'}
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
            <Table columns={columns} data={hrUsers} keyField="id" />

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
                of <strong className="text-navy">{pagination.total}</strong> HR members
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

      {/* View Details Modal */}
      {selectedHR && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`HR Profile — ${selectedHR.name}`}
          footer={
            <Button variant="outline" size="md" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {getInitials(selectedHR.name)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy">{selectedHR.name}</h4>
                <p className="text-sm text-slate-500">{selectedHR.designation || 'HR Specialist'}</p>
                <div className="flex items-center space-x-2 mt-1.5">
                  <Badge variant="secondary">HR SPECIALIST</Badge>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">HR Account ID</span>
                <span className="text-sm font-bold text-navy font-mono">
                  {`HR-${String(selectedHR.id).padStart(3, '0')}`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 break-all">{selectedHR.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Department</span>
                <span className="text-sm font-semibold text-slate-800">{selectedHR.department || 'Human Resources'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="text-sm font-semibold text-slate-800">{selectedHR.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Date Registered</span>
                <span className="text-sm font-semibold text-slate-800">{formatDate(selectedHR.createdAt)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Last Profile Update</span>
                <span className="text-sm font-semibold text-slate-800">{formatDate(selectedHR.updatedAt)}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center space-x-2 text-xs text-blue-900">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                System security guarantee: Password credentials are encrypted and never exposed in the directory.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Add HR Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New HR Specialist"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addingHR}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="add-hr-form"
              disabled={addingHR}
            >
              {addingHR ? 'Creating HR Account...' : 'Register HR Specialist'}
            </Button>
          </div>
        }
      >
        <form id="add-hr-form" onSubmit={handleAddHRSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sarah.jenkins@company.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Temporary Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Select
                label="Department"
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="py-2 text-sm"
              >
                <option value="Human Resources">Human Resources</option>
                <option value="People & Culture">People & Culture</option>
                <option value="Recruitment">Recruitment</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Talent Lead"
                value={addForm.designation}
                onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRDirectory;

