import React, { useState, useEffect, useRef, useMemo } from 'react';
import { userService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { useToast } from '../../context/ToastContext';
import { LoadingState, EmptyState } from '../../components/States';
import {
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  AlertCircle,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  ShieldAlert,
} from 'lucide-react';

const EmployeeDirectory = () => {
  const toast = useToast();
  // Real data state from backend API
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('employee'); // default to 'employee' per specifications

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Track active request to prevent race conditions / stale results
  const activeRequestId = useRef(0);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
    designation: '',
  });
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccessMessage, setAddSuccessMessage] = useState(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search term
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch employees from real backend API
  const fetchEmployees = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;

    try {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      const params = {
        page: targetPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        role: roleFilter,
      };

      const res = await userService.getEmployees(params);

      // Only update if this is still the latest active request
      if (requestId === activeRequestId.current) {
        const data = res.data;
        const employeeList =
          data?.data?.employees || data?.employees || [];
        const paginationInfo = data?.data?.pagination || data?.pagination || {
          total: employeeList.length,
          page: targetPage,
          limit,
          totalPages: Math.max(1, Math.ceil(employeeList.length / limit)),
        };

        setEmployees(employeeList);
        setPagination(paginationInfo);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Failed to fetch employees from backend:', err);
        setEmployees([]);

        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError('Access Denied: Only administrators have permission to access the Employee Directory.');
        } else if (err.response?.status === 401) {
          setError('Authentication required: Your session has expired. Please log in again.');
        } else {
          setError(
            err.response?.data?.message ||
              'Unable to connect to the backend server. Please verify your connection and try again.'
          );
        }
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  // Trigger fetch when debounced search, department, role, or page changes
  useEffect(() => {
    fetchEmployees(page);
  }, [debouncedSearch, departmentFilter, roleFilter, page, limit]);

  // Safe field extractors
  const getDepartment = (emp) =>
    emp.department || emp.Profile?.department || null;
  const getDesignation = (emp) =>
    emp.designation || emp.Profile?.designation || null;
  const getPhone = (emp) =>
    emp.phone || emp.Profile?.phone || null;
  const getEmployeeId = (emp) => `EMP-${String(emp.id).padStart(3, '0')}`;

  const getInitials = (name) => {
    if (!name) return 'U';
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

  // Compute metrics from real data
  const metrics = useMemo(() => {
    const total = pagination.total || 0;
    const countOnPage = employees.length;

    // Distinct departments on the current page
    const depts = new Set();
    employees.forEach((emp) => {
      const dept = getDepartment(emp);
      if (dept) depts.add(dept);
    });

    // Newly added employees within the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newlyAdded = employees.filter((e) => {
      const created = new Date(e.createdAt).getTime();
      return !isNaN(created) && created >= thirtyDaysAgo;
    }).length;

    return {
      total,
      countOnPage,
      departmentsCount: depts.size,
      newlyAdded,
    };
  }, [employees, pagination]);

  const hasActiveFilters =
    searchTerm !== '' ||
    departmentFilter !== 'all' ||
    roleFilter !== 'employee';

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setRoleFilter('employee');
    setPage(1);
  };

  // Open Details Modal
  const openDetailsModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(true);
  };

  // Add Employee Form Submission (wired to existing POST /api/auth/register)
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccessMessage(null);

    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error('Name, email, and password are required.');
      setAddError('Name, email, and password are required.');
      return;
    }

    try {
      setAddingEmployee(true);
      await userService.createEmployee({
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
      });

      toast.success(`Employee ${addForm.name} registered successfully!`);
      setAddSuccessMessage(`Employee ${addForm.name} registered successfully!`);
      // Refresh directory from server
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccessMessage(null);
        setAddForm({
          name: '',
          email: '',
          password: '',
          role: 'employee',
          department: 'Engineering',
          designation: '',
        });
        fetchEmployees(1);
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to add employee. Please verify details and try again.';
      toast.error(errorMsg);
      setAddError(errorMsg);
    } finally {
      setAddingEmployee(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: 'Employee ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {getEmployeeId(row)}
        </span>
      ),
    },
    {
      header: 'Employee Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-bold text-navy text-sm leading-tight">{row.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {getDesignation(row) || (row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : 'Staff')}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email Address',
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
      render: (row) => {
        const dept = getDepartment(row);
        return dept ? (
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{dept}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Not assigned</span>
        );
      },
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => {
        const role = (row.role || 'employee').toLowerCase();
        const roleVariants = {
          admin: 'primary',
          hr: 'secondary',
          employee: 'default',
          candidate: 'warning',
        };
        return (
          <Badge variant={roleVariants[role] || 'default'}>
            {role.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      header: 'Joined Date',
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
          onClick={() => openDetailsModal(row)}
          className="text-xs flex items-center ml-auto border-slate-200 hover:border-primary hover:text-primary transition-colors"
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
            <h1 className="text-2xl font-bold text-navy">Employee Directory</h1>
            <Badge variant="primary" className="text-xs px-2.5 py-0.5">
              {pagination.total} Total
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            View and manage verified employee accounts from the organization database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchEmployees(page)}
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
            Add Employee
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards (Computed dynamically from real database totals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Database Employees */}
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-primary/10 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Employees</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{metrics.total}</h3>
            <span className="text-xs text-slate-400">In MySQL database</span>
          </div>
        </Card>

        {/* Current Page Count */}
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-secondary-50 text-secondary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Showing on Page</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{metrics.countOnPage}</h3>
            <span className="text-xs text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
          </div>
        </Card>

        {/* Departments Represented */}
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-amber-50 text-amber-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{metrics.departmentsCount}</h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>

        {/* Newly Added (Last 30 Days) */}
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-warning/15 text-yellow-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Newly Added</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{metrics.newlyAdded}</h3>
            <span className="text-xs text-yellow-700 font-medium">Last 30 days</span>
          </div>
        </Card>
      </div>

      {/* Search and Filters Section */}
      <Card className="p-5 border border-slate-100 space-y-4">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Category:</span>
          {[
            { id: 'employee', label: 'Employees' },
            { id: 'all', label: 'All Staff' },
            { id: 'hr', label: 'HR Team' },
            { id: 'admin', label: 'Administrators' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRoleFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Server-Side Search Box */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name or email (server-side query)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
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
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
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
              <option value={50}>50 per page</option>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div className="lg:col-span-1 flex items-center justify-end">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-slate-600 hover:text-red-600 w-full lg:w-auto flex items-center justify-center"
                title="Clear Filters"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Search / Filter Active Feedback */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Database matches: <strong className="text-navy">{pagination.total}</strong> records
          </span>
          {hasActiveFilters && (
            <span className="text-slate-400 italic">Filters active</span>
          )}
        </div>
      </Card>

      {/* Employee Table & State Rendering */}
      <Card className="p-0 overflow-hidden border border-slate-100">
        {loading ? (
          <LoadingState message="Connecting to server and retrieving employee records..." />
        ) : isForbidden ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Access Denied</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Failed to Load Employees</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => fetchEmployees(page)}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry API Request
            </Button>
          </div>
        ) : employees.length === 0 ? (
          debouncedSearch || departmentFilter !== 'all' || roleFilter !== 'employee' ? (
            <EmptyState
              icon={Search}
              title="No employees match your search criteria"
              description={`We couldn't find any employees matching "${debouncedSearch || 'current filters'}".`}
              action={
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                  Clear Search & Filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No employee accounts found"
              description="There are currently no employee accounts in the database."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Employee
                </Button>
              }
            />
          )
        ) : (
          <div>
            <Table columns={columns} data={employees} keyField="id" />

            {/* Server-Side Pagination Bar */}
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
                of <strong className="text-navy">{pagination.total}</strong> employees
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

      {/* View Details Modal (Real profile data only, no sensitive fields) */}
      {selectedEmployee && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Employee Profile — ${selectedEmployee.name}`}
          footer={
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-6">
            {/* Header Profile Card */}
            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {getInitials(selectedEmployee.name)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy">{selectedEmployee.name}</h4>
                <p className="text-sm text-slate-500">
                  {getDesignation(selectedEmployee) || 'Staff Member'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant={
                      selectedEmployee.role === 'admin'
                        ? 'primary'
                        : selectedEmployee.role === 'hr'
                        ? 'secondary'
                        : 'default'
                    }
                  >
                    {selectedEmployee.role?.toUpperCase()}
                  </Badge>
                  {selectedEmployee.status && (
                    <Badge variant="success">
                      {selectedEmployee.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contact & Account Information
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Employee ID</span>
                  <span className="text-sm font-bold text-navy font-mono">
                    {getEmployeeId(selectedEmployee)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Email Address</span>
                  <span className="text-sm font-medium text-slate-800 break-all">
                    {selectedEmployee.email}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Phone Number</span>
                  <span className="text-sm font-medium text-slate-800">
                    {getPhone(selectedEmployee) || 'Not provided'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Department</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {getDepartment(selectedEmployee) || 'Not specified'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Designation / Role Title</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {getDesignation(selectedEmployee) || 'Not specified'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">System Role</span>
                  <span className="text-sm font-semibold text-navy">
                    {selectedEmployee.role || 'employee'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Date Joined</span>
                  <span className="text-sm font-medium text-slate-800">
                    {formatDate(selectedEmployee.createdAt)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Last Profile Update</span>
                  <span className="text-sm font-medium text-slate-800">
                    {formatDate(selectedEmployee.updatedAt || selectedEmployee.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-center space-x-2 text-xs text-blue-900">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Passwords, password hashes, and access tokens are strictly encrypted and never exposed in this console.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
          setAddSuccessMessage(null);
        }}
        title="Add New Employee"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addingEmployee}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="add-employee-form"
              disabled={addingEmployee}
            >
              {addingEmployee ? 'Creating Account...' : 'Add Employee'}
            </Button>
          </div>
        }
      >
        <form id="add-employee-form" onSubmit={handleAddEmployeeSubmit} className="space-y-4">
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {addError}
            </div>
          )}

          {addSuccessMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
              {addSuccessMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alexander Wright"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alexander.wright@company.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              The employee can change this password after their initial login.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Select
                label="System Role"
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="py-2 text-sm"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Specialist</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>

            <div>
              <Select
                label="Department"
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="py-2 text-sm"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designation / Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={addForm.designation}
              onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDirectory;
