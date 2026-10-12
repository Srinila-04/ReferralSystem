import React, { useState, useEffect } from 'react';
import { referralService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import { LoadingState, EmptyState } from '../../components/States';
import { Users, Search } from 'lucide-react';

const EmployeeReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        const res = await referralService.getMySubmissions();
        setReferrals(res.data.referrals || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch referrals');
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'referred': return 'primary';
      case 'under_review': return 'warning';
      case 'shortlisted': return 'success';
      case 'interview': return 'success';
      case 'selected': return 'success';
      case 'rejected': return 'danger';
      default: return 'primary';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.Candidate?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.Job?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">My Referrals</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of the candidates you have referred.</p>
      </div>

      <Card className="bg-slate-50 border border-slate-100 shadow-none">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by candidate name or job title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading your referrals..." />
      ) : error ? (
        <div className="text-red-500 py-4 text-center">{error}</div>
      ) : filteredReferrals.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No referrals found"
          description={searchTerm ? "No referrals match your search." : "You haven't referred anyone yet."}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table 
            data={filteredReferrals}
            columns={[
              {
                header: 'Candidate',
                render: (row) => (
                  <div>
                    <div className="font-medium text-navy">{row.Candidate?.name}</div>
                    <div className="text-xs text-slate-500">{row.Candidate?.email}</div>
                  </div>
                )
              },
              {
                header: 'Job',
                render: (row) => (
                  <div>
                    <div className="font-medium text-navy">{row.Job?.title}</div>
                    <div className="text-xs text-slate-500">{row.Job?.department}</div>
                  </div>
                )
              },
              {
                header: 'Date',
                render: (row) => new Date(row.createdAt).toLocaleDateString()
              },
              {
                header: 'Status',
                render: (row) => (
                  <Badge variant={getStatusColor(row.status)}>
                    {getStatusLabel(row.status)}
                  </Badge>
                )
              }
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default EmployeeReferrals;
