import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { jobService, referralService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import { LoadingState, EmptyState } from '../../components/States';
import { Search, MapPin, Briefcase, ChevronRight, UploadCloud, FileText, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

const EmployeeJobs = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const isReferMode = searchParams.get('action') === 'refer';
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Details Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [detailedJob, setDetailedJob] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Referral Modal state
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [referralFormData, setReferralFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (!resumeFile) {
        setResumeError("Candidate resume is required.");
      }
      return;
    }

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx'];
    if (!allowed.includes(ext)) {
      setResumeError("Invalid file type. Only PDF, DOC, and DOCX formats are accepted.");
      setResumeFile(null);
      e.target.value = '';
      return;
    }

    // Validate size (5 MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setResumeError("File is too large. Maximum allowed file size is 5 MB.");
      setResumeFile(null);
      e.target.value = '';
      return;
    }

    setResumeFile(file);
    setResumeError(null);
  };

  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    if (!detailedJob) return;

    if (!resumeFile) {
      setResumeError("Candidate resume is required (PDF, DOC, or DOCX, max 5 MB).");
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
        message: 'Referral submitted successfully with candidate resume!'
      });

      // Reset form on success after brief pause
      setTimeout(() => {
        setIsReferralModalOpen(false);
        setReferralFormData({ candidateName: '', candidateEmail: '', candidatePhone: '' });
        setResumeFile(null);
        setResumeError(null);
        setSubmissionFeedback(null);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit referral. Please try again.';
      toast.error(errorMsg);
      setSubmissionFeedback({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setSubmittingReferral(false);
    }
  };

  useEffect(() => {
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
    fetchJobs();
  }, []);

  const openViewModal = async (jobId) => {
    setIsViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await jobService.getJobById(jobId);
      setDetailedJob(res.data.job);
    } catch (err) {
      toast.error('Failed to load job details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openReferralModal = () => {
    setIsViewModalOpen(false);
    setReferralFormData({ candidateName: '', candidateEmail: '', candidatePhone: '' });
    setResumeFile(null);
    setResumeError(null);
    setSubmissionFeedback(null);
    setIsReferralModalOpen(true);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Browse Open Roles</h1>
        <p className="text-slate-500 text-sm mt-1">Find the perfect role to refer your network to.</p>
      </div>

      {isReferMode && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
          <UserPlus className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-primary">Refer a Candidate</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any open position below and click <span className="font-semibold text-navy">Refer</span> to submit a candidate with their mandatory resume.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-slate-50 border border-slate-100 shadow-none">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by title or department..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading available jobs..." />
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState 
          icon={Briefcase} 
          title="No open jobs" 
          description={searchTerm ? "No jobs match your search." : "Check back later for new opportunities!"} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="hover:border-secondary transition-colors border border-transparent flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-navy text-lg">{job.title}</h3>
                <Badge variant="success">Open</Badge>
              </div>
              <p className="text-sm text-secondary font-medium mb-4">{job.department}</p>
              
              <div className="flex items-center text-xs text-slate-500 space-x-4 mb-4">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {job.location}</span>
                <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" /> {job.experience || 'Any exp'}</span>
              </div>
              
              <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1">
                {job.description}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 mt-auto">
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => openViewModal(job.id)}
                  >
                    Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => {
                      setDetailedJob(job);
                      openReferralModal();
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Refer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                <Badge variant="success">Open</Badge>
                <span className="text-slate-500 text-sm">{detailedJob.department} &bull; {detailedJob.location}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-2">Experience Required</h4>
              <p className="text-slate-600">{detailedJob.experience || 'Not specified'}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-2">Job Description</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{detailedJob.description}</p>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Failed to load job details.</div>
        )}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          <Button 
            className="bg-primary text-white" 
            disabled={!detailedJob || detailsLoading}
            onClick={openReferralModal}
          >
            Refer Someone
          </Button>
        </div>
      </Modal>

      {/* REFERRAL FORM MODAL */}
      <Modal
        isOpen={isReferralModalOpen}
        onClose={() => {
          if (!submittingReferral) {
            setIsReferralModalOpen(false);
          }
        }}
        title={`Refer for ${detailedJob?.title}`}
      >
        <form id="referral-form" onSubmit={handleReferralSubmit} className="space-y-4">
          <Input 
            label="Candidate Full Name" 
            required 
            value={referralFormData.candidateName} 
            onChange={(e) => setReferralFormData({...referralFormData, candidateName: e.target.value})} 
          />
          <Input 
            label="Candidate Email" 
            type="email"
            required 
            value={referralFormData.candidateEmail} 
            onChange={(e) => setReferralFormData({...referralFormData, candidateEmail: e.target.value})} 
          />
          <Input 
            label="Candidate Phone" 
            type="tel"
            value={referralFormData.candidatePhone} 
            onChange={(e) => setReferralFormData({...referralFormData, candidatePhone: e.target.value})} 
          />

          {/* Mandatory Resume Upload Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Candidate Resume <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                PDF, DOC, DOCX &bull; Max 5 MB
              </span>
            </div>

            {!resumeFile ? (
              <div className="mt-1">
                <label 
                  htmlFor="resume-upload" 
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    resumeError 
                      ? 'border-red-300 bg-red-50/50 hover:bg-red-50' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary'
                  }`}
                >
                  <UploadCloud className={`w-8 h-8 mb-1.5 ${resumeError ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-700">
                    Click to select candidate resume
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    Accepted formats: PDF, DOC, DOCX (up to 5 MB)
                  </span>
                  <input 
                    id="resume-upload" 
                    type="file" 
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                    className="hidden" 
                    onChange={handleResumeChange} 
                  />
                </label>
              </div>
            ) : (
              <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-navy truncate" title={resumeFile.name}>
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <label
                    htmlFor="resume-upload-replace"
                    className="text-xs font-semibold text-secondary hover:text-navy cursor-pointer px-2 py-1 rounded hover:bg-slate-200/60"
                  >
                    Replace
                    <input 
                      id="resume-upload-replace" 
                      type="file" 
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                      className="hidden" 
                      onChange={handleResumeChange} 
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50"
                    onClick={() => {
                      setResumeFile(null);
                      setResumeError("Candidate resume is required.");
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {resumeError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {resumeError}
              </p>
            )}
          </div>

          {/* Submission Feedback Message */}
          {submissionFeedback && (
            <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
              submissionFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {submissionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-normal">{submissionFeedback.message}</span>
            </div>
          )}
        </form>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setIsReferralModalOpen(false)}
            disabled={submittingReferral}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="referral-form" 
            disabled={submittingReferral || !resumeFile || !referralFormData.candidateName || !referralFormData.candidateEmail}
          >
            {submittingReferral ? 'Submitting Referral...' : 'Submit Referral'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeJobs;
