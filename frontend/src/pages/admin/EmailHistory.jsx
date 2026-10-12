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
  Mail,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Hash,
  ChevronLeft,
  ChevronRight,
  Send,
  FileText,
} from 'lucide-react';

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'All Templates' },
  { value: 'shortlisted', label: 'Candidate Shortlisted' },
  { value: 'rejected', label: 'Candidate Rejected' },
  { value: 'referral_received', label: 'Referral Received' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Delivered (Success)' },
  { value: 'failed', label: 'Failed' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '15', label: '15 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
];

const EmailHistory = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Modal inspection
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchEmailHistory = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        templateType: templateFilter !== 'all' ? templateFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      };

      const res = await adminService.getEmailHistory(params);

      if (requestId === activeRequestId.current) {
        if (res.data?.success) {
          setEmails(res.data.data.emails || []);
          setPagination(
            res.data.data.pagination || {
              total: 0,
              page: targetPage,
              limit,
              totalPages: 1,
            }
          );
        } else {
          setError(res.data?.message || 'Failed to retrieve email logs');
        }
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Error fetching email history:', err);
        setError(
          err.response?.data?.message ||
            'Failed to connect to email history service. Ensure MongoDB is running.'
        );
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEmailHistory(page);
  }, [page, limit, debouncedSearch, templateFilter, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusBadge = (status = '') => {
    if (status.toLowerCase() === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3 text-red-600" />
        Failed
      </span>
    );
  };

  const getTemplateBadge = (tpl = '') => {
    const formatted = tpl
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (tpl.toLowerCase().includes('shortlist')) {
      return <Badge variant="success">{formatted}</Badge>;
    }
    if (tpl.toLowerCase().includes('reject')) {
      return <Badge variant="neutral">{formatted}</Badge>;
    }
    return <Badge variant="periwinkle">{formatted}</Badge>;
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
            <Mail className="w-7 h-7 text-navy" />
            Email Dispatch History
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            System notification log for automated recruitment candidate and HR email delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmailHistory(page)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient email or error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Template Filter */}
          <div>
            <Select
              options={TEMPLATE_OPTIONS}
              value={templateFilter}
              onChange={(val) => {
                setTemplateFilter(val);
                setPage(1);
              }}
              placeholder="Filter Template"
            />
          </div>

          {/* Delivery Status Filter */}
          <div>
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="Delivery Status"
            />
          </div>
        </div>
      </Card>

      {/* Content Section */}
      {loading && emails.length === 0 ? (
        <LoadingState message="Loading email dispatch logs..." />
      ) : error ? (
        <Card className="p-8 text-center border-red-200 bg-red-50/50">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Unable to Retrieve Email Logs
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={() => fetchEmailHistory(1)}>
            Try Again
          </Button>
        </Card>
      ) : emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No email logs found"
          description={
            searchTerm || templateFilter !== 'all' || statusFilter !== 'all'
              ? 'No email records match your specified search filters.'
              : 'No candidate or referral emails have been dispatched yet.'
          }
          action={
            (searchTerm || templateFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTemplateFilter('all');
                  setStatusFilter('all');
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
                <Table.Head>Dispatched At</Table.Head>
                <Table.Head>Recipient Email</Table.Head>
                <Table.Head>Notification Template</Table.Head>
                <Table.Head>Delivery Status</Table.Head>
                <Table.Head>Initiator / Sender</Table.Head>
                <Table.Head>Referral ID</Table.Head>
                <Table.Head className="text-right">Inspection</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {emails.map((email) => {
                const ts = formatTimestamp(email.createdAt);
                return (
                  <Table.Row key={email._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Dispatched At */}
                    <Table.Cell className="whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-800">{ts.date}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {ts.time}
                      </div>
                    </Table.Cell>

                    {/* Recipient */}
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-800">
                          {email.recipient}
                        </span>
                      </div>
                    </Table.Cell>

                    {/* Notification Template */}
                    <Table.Cell>{getTemplateBadge(email.templateType)}</Table.Cell>

                    {/* Status */}
                    <Table.Cell>
                      <div className="space-y-1">
                        {getStatusBadge(email.status)}
                        {email.errorMessage && (
                          <p
                            className="text-[11px] text-red-600 truncate max-w-xs font-mono"
                            title={email.errorMessage}
                          >
                            {email.errorMessage}
                          </p>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Initiator */}
                    <Table.Cell>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {email.sender?.name || `User #${email.userId}`}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {email.sender?.role ? (
                            <span className="capitalize">{email.sender.role}</span>
                          ) : (
                            'System Automated'
                          )}
                        </p>
                      </div>
                    </Table.Cell>

                    {/* Referral ID */}
                    <Table.Cell className="whitespace-nowrap">
                      {email.referralId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded">
                          <Hash className="w-3 h-3" />
                          Ref #{email.referralId}
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
                          setSelectedEmail(email);
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-slate-600 hover:text-navy flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(pagination.page - 1) * pagination.limit + (emails.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{pagination.total}</span> dispatches
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
          setSelectedEmail(null);
        }}
        title="Email Dispatch Record"
        size="lg"
      >
        {selectedEmail && (
          <div className="space-y-6">
            {/* Delivery Overview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 font-medium">Delivery Status</p>
                <div className="mt-1">{getStatusBadge(selectedEmail.status)}</div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500 font-medium">Timestamp</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {formatTimestamp(selectedEmail.createdAt).date}{' '}
                  {formatTimestamp(selectedEmail.createdAt).time}
                </p>
              </div>
            </div>

            {/* Recipients & Template info */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Recipient</span>
                  <span className="text-sm font-semibold font-mono text-slate-800 break-all">
                    {selectedEmail.recipient}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Template Type</span>
                  <div className="mt-0.5">{getTemplateBadge(selectedEmail.templateType)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Dispatched By (User)</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedEmail.sender?.name || `User #${selectedEmail.userId}`}
                  </span>
                  <span className="text-[11px] text-slate-500 block break-all">
                    {selectedEmail.sender?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Referral Reference</span>
                  {selectedEmail.referralId ? (
                    <span className="text-xs font-mono font-medium text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded inline-block mt-0.5">
                      Referral #{selectedEmail.referralId}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message if Failed */}
            {selectedEmail.errorMessage && (
              <div>
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Delivery Failure Details
                </h4>
                <div className="p-4 bg-red-50 text-red-800 rounded-xl font-mono text-xs border border-red-200 whitespace-pre-wrap">
                  {selectedEmail.errorMessage}
                </div>
              </div>
            )}

            {/* Raw MongoDB Document ID */}
            <div className="p-3 bg-slate-100/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-mono break-all">Mongo Record ID: {selectedEmail._id}</span>
              <span className="font-mono">Collection: emailhistories</span>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEmail(null);
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

export default EmailHistory;

