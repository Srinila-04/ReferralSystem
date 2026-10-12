import React, { useState, useEffect, useRef, useMemo } from 'react';
import { adminService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { LoadingState, EmptyState } from '../../components/States';
import {
  UserPlus,
  Search,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
} from 'lucide-react';

const CandidateDirectory = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');

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
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCandidates = async (targetPage = page) => {
    const requestId = ++activeRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        verified: verificationFilter === 'verified' ? 'true' : verificationFilter === 'unverified' ? 'false' : undefined,
      };

      const res = await adminService.getCandidates(params);

      if (requestId === activeRequestId.current) {
        const list = res.data?.data?.candidates || [];
        const pag = res.data?.data?.pagination || {
          total: list.length,
          page: targetPage,
          limit,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        };

        setCandidates(list);
        setPagination(pag);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        console.error('Fetch candidate directory error:', err);
        setError(err.response?.data?.message || 'Failed to load candidate talent pool.');
        setCandidates([]);
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCandidates(page);
  }, [debouncedSearch, verificationFilter, page, limit]);

  const getInitials = (name) => {
    if (!name) return 'C';
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
    setVerificationFilter('all');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || verificationFilter !== 'all';

  // Metrics from current list
  const metrics = useMemo(() => {
    const verified = candidates.filter((c) => c.emailVerified).length;
    const withResume = candidates.filter((c) => c.hasResume).length;
    return {
      verified,
      unverified: candidates.length - verified,
      withResume,
    };
  }, [candidates]);

  const columns = [
    {
      header: 'Candidate ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {`CAN-${String(row.id).padStart(3, '0')}`}
        </span>
      ),
    },
    {
      header: 'Candidate Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-bold text-navy text-sm leading-tight">{row.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {row.userId ? (
                <span className="text-emerald-600 font-medium">Registered User</span>
              ) : (
                <span>Referred Candidate</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs sm:text-sm">{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Email Verification',
      accessor: 'emailVerified',
      render: (row) => (
        row.emailVerified ? (
          <Badge variant="success" className="flex items-center w-fit text-[11px]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="warning" className="flex items-center w-fit text-[11px]">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        )
      ),
    },
    {
      header: 'Referrals',
      accessor: 'totalReferrals',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <Badge variant="primary" className="text-xs font-semibold">
            {row.totalReferrals || 0} Submission{row.totalReferrals !== 1 ? 's' : ''}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Resume',
      accessor: 'hasResume',
      render: (row) => (
        row.hasResume ? (
          <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <FileText className="w-3 h-3 mr-1" />
            Available
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">None</span>
        )
      ),
    },
    {
      header: 'Date Added',
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
            setSelectedCandidate(row);
            setIsDetailsModalOpen(true);
          }}
          className="text-xs flex items-center ml-auto border-slate-200 hover:border-purple-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-navy">Candidate Directory</h1>
            <Badge variant="primary" className="text-xs px-2.5 py-0.5">
              {pagination.total} Candidates
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            System administration view of all candidate records and referred talent profiles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchCandidates(page)}
            disabled={loading}
            className="flex items-center text-slate-700 bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-purple-50 text-purple-600">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Talent Pool</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{pagination.total}</h3>
            <span className="text-xs text-slate-400">In MySQL database</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Verified</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{metrics.verified}</h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-amber-50 text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Verify</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-0.5">{metrics.unverified}</h3>
            <span className="text-xs text-slate-400">Awaiting confirmation</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 border border-slate-100">
          <div className="p-3 rounded-xl mr-4 bg-blue-50 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">With Resumes</p>
            <h3 className="text-2xl font-bold text-navy mt-0.5">{metrics.withResume}</h3>
            <span className="text-xs text-slate-400">On current page</span>
          </div>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="p-5 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white"
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

          {/* Verification Filter */}
          <div className="lg:col-span-3">
            <Select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 text-sm"
            >
              <option value="all">All Verification States</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
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
              Matching candidates: <strong className="text-navy">{pagination.total}</strong> records
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

      {/* Candidates Table */}
      <Card className="p-0 overflow-hidden border border-slate-100">
        {loading ? (
          <LoadingState message="Retrieving candidate directory records..." />
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy">Unable to Load Candidates</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <Button variant="primary" size="md" onClick={() => fetchCandidates(page)} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Request
            </Button>
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No candidates found"
            description={hasActiveFilters ? 'No candidates match your search filters.' : 'There are currently no candidates in the database.'}
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
            <Table columns={columns} data={candidates} keyField="id" />

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
                of <strong className="text-navy">{pagination.total}</strong> candidates
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

      {/* Details Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Candidate Record — ${selectedCandidate.name}`}
          footer={
            <Button variant="outline" size="md" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {getInitials(selectedCandidate.name)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy">{selectedCandidate.name}</h4>
                <p className="text-sm text-slate-500">{selectedCandidate.email}</p>
                <div className="flex items-center space-x-2 mt-1.5">
                  <Badge variant={selectedCandidate.emailVerified ? 'success' : 'warning'}>
                    {selectedCandidate.emailVerified ? 'EMAIL VERIFIED' : 'UNVERIFIED EMAIL'}
                  </Badge>
                  {selectedCandidate.userId && (
                    <Badge variant="primary">REGISTERED ACCOUNT</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Candidate ID</span>
                <span className="text-sm font-bold text-navy font-mono">
                  {`CAN-${String(selectedCandidate.id).padStart(3, '0')}`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedCandidate.phone || 'Not provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Referral Applications</span>
                <span className="text-sm font-bold text-navy">
                  {selectedCandidate.totalReferrals || 0} Submissions
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Attached Resume</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center">
                  {selectedCandidate.hasResume ? (
                    <>
                      <FileText className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      {selectedCandidate.resumeName || 'resume.pdf'}
                    </>
                  ) : (
                    'No resume uploaded'
                  )}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Profile Created</span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatDate(selectedCandidate.createdAt)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Linked User Account</span>
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {selectedCandidate.userId ? `User #${selectedCandidate.userId}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CandidateDirectory;

