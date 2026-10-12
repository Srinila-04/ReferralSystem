import React, { useState, useEffect } from 'react';
import { jobService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { LoadingState, EmptyState } from '../../components/States';
import { Plus, Search, Briefcase, Edit, Eye, XCircle } from 'lucide-react';

const HRJobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailedJob, setDetailedJob] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    experience: ''
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobService.getJobs();
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openEditModal = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      experience: job.experience || ''
    });
    setIsEditModalOpen(true);
  };

  const openCloseModal = (job) => {
    setSelectedJob(job);
    setIsCloseModalOpen(true);
  };

  const openViewModal = async (job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await jobService.getJobById(job.id);
      setDetailedJob(res.data.job);
    } catch (err) {
      toast.error('Failed to load job details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await jobService.createJob(formData);
      toast.success('Job posting created successfully!');
      setIsCreateModalOpen(false);
      setFormData({ title: '', description: '', department: '', location: '', experience: '' });
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await jobService.updateJob(selectedJob.id, formData);
      toast.success('Job posting updated successfully!');
      setIsEditModalOpen(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseJob = async () => {
    setIsSubmitting(true);
    try {
      await jobService.closeJob(selectedJob.id);
      toast.success('Job marked as closed.');
      setIsCloseModalOpen(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Job Title', accessor: 'title', render: (row) => (
      <div>
        <p className="font-bold text-navy">{row.title}</p>
        <p className="text-xs text-slate-500">{row.experience ? `${row.experience} exp` : 'No exp specified'}</p>
      </div>
    )},
    { header: 'Department', accessor: 'department' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'open' ? 'success' : 'default'}>
        {row.status}
      </Badge>
    )},
    { header: 'Actions', accessor: 'actions', className: 'text-right', cellClassName: 'text-right', render: (row) => (
      <div className="flex justify-end space-x-2">
        <button 
          title="View Details" 
          className="p-1.5 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded"
          onClick={(e) => { e.stopPropagation(); openViewModal(row); }}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          title="Edit Job" 
          className="p-1.5 text-slate-400 hover:text-secondary transition-colors bg-slate-50 rounded"
          onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          title="Close Job" 
          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded"
          onClick={(e) => { e.stopPropagation(); openCloseModal(row); }}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Job Openings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage active recruitment postings.</p>
        </div>
        <Button className="flex items-center" onClick={() => {
          setFormData({ title: '', description: '', department: '', location: '', experience: '' });
          setIsCreateModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500">
            Showing {filteredJobs.length} jobs
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading jobs..." />
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState 
            icon={Briefcase} 
            title="No jobs found" 
            description={searchTerm ? "Try adjusting your search criteria" : "There are currently no active job postings."} 
          />
        ) : (
          <Table columns={columns} data={filteredJobs} />
        )}
      </Card>

      {/* CREATE JOB MODAL */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Job Opening"
      >
        <form id="create-job-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <Input 
            label="Job Title" 
            required 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Department" 
              required 
              value={formData.department} 
              onChange={(e) => setFormData({...formData, department: e.target.value})} 
            />
            <Input 
              label="Location" 
              required 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
          </div>
          <Input 
            label="Experience Required" 
            placeholder="e.g. 3-5 years"
            value={formData.experience} 
            onChange={(e) => setFormData({...formData, experience: e.target.value})} 
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </form>
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="create-job-form" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Publish Job'}
          </Button>
        </div>
      </Modal>

      {/* EDIT JOB MODAL */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Job Opening"
      >
        <form id="edit-job-form" onSubmit={handleEditSubmit} className="space-y-4">
          <Input 
            label="Job Title" 
            required 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Department" 
              required 
              value={formData.department} 
              onChange={(e) => setFormData({...formData, department: e.target.value})} 
            />
            <Input 
              label="Location" 
              required 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
          </div>
          <Input 
            label="Experience Required" 
            placeholder="e.g. 3-5 years"
            value={formData.experience} 
            onChange={(e) => setFormData({...formData, experience: e.target.value})} 
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </form>
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="edit-job-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      {/* VIEW JOB MODAL */}
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
                <Badge variant={detailedJob.status === 'open' ? 'success' : 'default'}>{detailedJob.status}</Badge>
                <span className="text-slate-500 text-sm">{detailedJob.department} &bull; {detailedJob.location}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-2">Experience</h4>
              <p className="text-slate-600">{detailedJob.experience || 'Not specified'}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-2">Description</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{detailedJob.description}</p>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Failed to load job details.</div>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      {/* CLOSE JOB CONFIRMATION MODAL */}
      <Modal 
        isOpen={isCloseModalOpen} 
        onClose={() => setIsCloseModalOpen(false)}
        title="Close Job Opening"
      >
        <div className="text-slate-600">
          Are you sure you want to close the job opening for <strong>{selectedJob?.title}</strong>? 
          This action will prevent further referrals for this role.
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCloseJob} 
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            {isSubmitting ? 'Closing...' : 'Yes, Close Job'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HRJobs;
