import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { LoadingState, EmptyState } from '../../components/States';
import {
  Activity,
  Search,
  RefreshCw,
  Eye,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  AlertCircle,
  Hash,
  Filter,
} from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'REFERRAL_SUBMITTED', label: 'Referral Submitted' },
  { value: 'REFERRAL_STATUS_UPDATED', label: 'Referral Status Updated' },
  { value: 'JOB_CREATED', label: 'Job Created' },
  { value: 'JOB_STATUS_CHANGED', label: 'Job Status Changed' },
  { value: 'JOB_UPDATED', label: 'Job Updated' },
  { value: 'USER_REGISTERED', label: 'User Registered' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'PROFILE_UPDATED', label: 'Profile Updated' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '15', label: '15 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
];

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const activeRequestId = useRef(0);

  // Modal details
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      };

      const res = await adminService.getActivityLogs(params);

      if (requestId === activeRequestId.current) {
        if (res.data?.success) {
          setLogs(res.data.data.logs || []);
          setPagination(
            res.data.data.pagination || {
              total: 0,
              page: targetPage,
              limit,
              totalPages: 1,
            }
          );
        } else {
          setError(res.data?.message || 'Failed to load activity logs');
        }
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Error fetching activity logs:', err);
        setError(
          err.response?.data?.message ||
            'Failed to connect to activity logs service. Ensure MongoDB is running.'
        );
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, limit, debouncedSearch, actionFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getActionBadge = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('REFERRAL')) {
      return (
        <Badge variant="periwinkle" className="font-mono text-xs">
          {action}
        </Badge>
      );
    }
    if (act.includes('JOB')) {
      return (
        <Badge variant="success" className="font-mono text-xs">
          {action}
        </Badge>
      );
    }
    if (act.includes('STATUS')) {
      return (
        <Badge variant="warning" className="font-mono text-xs">
          {action}
        </Badge>
      );
    }
    if (act.includes('USER') || act.includes('PROFILE')) {
      return (
        <Badge variant="navy" className="font-mono text-xs">
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" className="font-mono text-xs">
        {action}
      </Badge>
    );
  };

  const getRoleBadge = (role = '') => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Badge variant="navy">Admin</Badge>;
      case 'hr':
        return <Badge variant="periwinkle">HR</Badge>;
      case 'employee':
        return <Badge variant="success">Employee</Badge>;
      case 'candidate':
        return <Badge variant="gold">Candidate</Badge>;
      default:
        return <Badge variant="neutral">{role || 'System'}</Badge>;
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Activity className="w-7 h-7 text-navy" />
            Audit & Activity Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time audit trail and system-wide activity records stored in MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, keyword, or log details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Action Filter */}
          <div className="w-full md:w-64">
            <Select
              options={ACTION_OPTIONS}
              value={actionFilter}
              onChange={(val) => {
                setActionFilter(val);
                setPage(1);
              }}
              placeholder="Filter by Action"
            />
          </div>

          {/* Page Limit */}
          <div className="w-full md:w-44">
            <Select
              options={LIMIT_OPTIONS}
              value={String(limit)}
              onChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
              placeholder="Per Page"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {loading && logs.length === 0 ? (
        <LoadingState message="Loading system audit logs..." />
      ) : error ? (
        <Card className="p-8 text-center border-red-200 bg-red-50/50">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Unable to Retrieve Logs
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={() => fetchLogs(1)}>
            Try Again
          </Button>
        </Card>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity logs found"
          description={
            searchTerm || actionFilter !== 'all'
              ? 'No system events match your specified filters. Try adjusting your search query.'
              : 'No activity logs have been recorded in MongoDB yet.'
          }
          action={
            (searchTerm || actionFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('all');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden border border-slate-200">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Timestamp</Table.Head>
                <Table.Head>Action</Table.Head>
                <Table.Head>Actor</Table.Head>
                <Table.Head>Event Details</Table.Head>
                <Table.Head>Entity ID</Table.Head>
                <Table.Head className="text-right">Inspection</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.map((log) => {
                const ts = formatTimestamp(log.createdAt);
                return (
                  <Table.Row key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <Table.Cell className="whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-800">{ts.date}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {ts.time}
                      </div>
                    </Table.Cell>

                    {/* Action */}
                    <Table.Cell>{getActionBadge(log.action)}</Table.Cell>

                    {/* Actor */}
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center text-xs shrink-0">
                          {log.actor?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {log.actor?.name || `User #${log.userId}`}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {getRoleBadge(log.actor?.role)}
                          </div>
                        </div>
                      </div>
                    </Table.Cell>

                    {/* Event Details */}
                    <Table.Cell className="max-w-xs">
                      <p
                        className="text-xs text-slate-600 truncate font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100"
                        title={log.details}
                      >
                        {log.details || 'No additional details'}
                      </p>
                    </Table.Cell>

                    {/* Referral / Entity ID */}
                    <Table.Cell className="whitespace-nowrap">
                      {log.referralId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded">
                          <Hash className="w-3 h-3" />
                          Ref #{log.referralId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">—</span>
                      )}
                    </Table.Cell>

                    {/* Inspection */}
                    <Table.Cell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-slate-600 hover:text-navy flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(pagination.page - 1) * pagination.limit + (logs.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{pagination.total}</span> logs
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="h-8 px-2.5 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <span className="text-xs font-medium text-slate-700 px-2">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="h-8 px-2.5 text-xs flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Audit Log Inspection"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-medium">Action Performed</p>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500 font-medium">Logged Timestamp</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {formatTimestamp(selectedLog.createdAt).date}{' '}
                  {formatTimestamp(selectedLog.createdAt).time}
                </p>
              </div>
            </div>

            {/* Actor Card */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-navy" />
                Actor Identity
              </h4>
              <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Full Name</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedLog.actor?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">System Role</span>
                    <div className="mt-0.5">{getRoleBadge(selectedLog.actor?.role)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Email Address</span>
                    <span className="text-xs font-mono text-slate-700 break-all">
                      {selectedLog.actor?.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">MySQL User ID</span>
                    <span className="text-xs font-mono font-medium text-slate-700">
                      #{selectedLog.userId || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Payload & Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-navy" />
                Event Description & Payload
              </h4>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800">
                {selectedLog.details || 'No event details recorded.'}
              </div>
            </div>

            {/* Entity Associations */}
            {selectedLog.referralId && (
              <div className="p-3 bg-periwinkle/10 border border-periwinkle/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-periwinkle" />
                  <span className="text-xs font-semibold text-navy">
                    Associated Referral Record: #{selectedLog.referralId}
                  </span>
                </div>
                <Badge variant="periwinkle">Referral Linked</Badge>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivityLogs;

