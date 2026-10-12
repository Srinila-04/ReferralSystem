import React, { useState, useEffect } from 'react';
import { referralService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import { useToast } from '../../context/ToastContext';
import { LoadingState, EmptyState } from '../../components/States';
import { Users, Search, Edit, Mail, CheckCircle2, AlertCircle, Loader2, Send, FileText } from 'lucide-react';

const HRReferrals = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Status update modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [updating, setUpdating] = useState(false);

  // Email decision modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailReferral, setEmailReferral] = useState(null);
  const [emailDecision, setEmailDecision] = useState('shortlisted'); // 'shortlisted' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('');
  const [emailPreview, setEmailPreview] = useState({ subject: '', html: '' });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [showConfirm, setShowConfirm] = useState(false);

  // Resume viewing modal state
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedResumeReferral, setSelectedResumeReferral] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [resumeFileType, setResumeFileType] = useState(null); // 'pdf' | 'doc' | 'none' | 'error'
  const [resumeErrorMessage, setResumeErrorMessage] = useState(null);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralService.getAllReferrals();
      setReferrals(res.data.referrals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const openUpdateModal = (referral) => {
    setSelectedReferral(referral);
    setStatusForm({ status: referral.status, remarks: referral.remarks || '' });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReferral) return;
    
    setUpdating(true);
    try {
      await referralService.updateStatus(selectedReferral.id, statusForm.status, statusForm.remarks);
      toast.success('Referral status updated successfully!');
      setIsModalOpen(false);
      fetchReferrals(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update referral status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Resume viewing handler
  const openResumeModal = async (referral) => {
    setSelectedResumeReferral(referral);
    setIsResumeModalOpen(true);
    setResumeLoading(true);
    setResumeErrorMessage(null);
    setResumeBlobUrl(null);
    setResumeFileType(null);

    try {
      const response = await referralService.getResume(referral.id);
      const contentType = response.headers?.['content-type'] || '';
      
      const isWordDoc = 
        contentType.includes('word') || 
        contentType.includes('officedocument') ||
        referral.Candidate?.resumeName?.endsWith('.doc') || 
        referral.Candidate?.resumeName?.endsWith('.docx');

      if (isWordDoc) {
        setResumeFileType('doc');
      } else {
        setResumeFileType('pdf');
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResumeBlobUrl(url);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setResumeFileType('none');
        setResumeErrorMessage('No resume was uploaded for this candidate.');
      } else {
        setResumeFileType('error');
        setResumeErrorMessage(err.response?.data?.message || 'Failed to load candidate resume.');
      }
    } finally {
      setResumeLoading(false);
    }
  };

  const closeResumeModal = () => {
    setIsResumeModalOpen(false);
    if (resumeBlobUrl) {
      URL.revokeObjectURL(resumeBlobUrl);
      setResumeBlobUrl(null);
    }
    setSelectedResumeReferral(null);
  };

  // Helper to generate template preview
  const generateClientFallbackPreview = (candidateName, jobTitle, decision, reason) => {
    if (decision === 'shortlisted') {
      return {
        subject: `Update on your application for ${jobTitle}`,
        html: `<p>Dear ${candidateName},</p><p>We are pleased to inform you that you have been shortlisted for <strong>${jobTitle}</strong>.</p><p>Our HR team will contact you with the next steps.</p><p>Regards,<br>HR Team</p>`
      };
    } else {
      return {
        subject: `Update on your application for ${jobTitle}`,
        html: `<p>Dear ${candidateName},</p><p>Thank you for your interest in <strong>${jobTitle}</strong>. After careful consideration, we will not be moving forward with your application at this time.</p>${reason && reason.trim() ? `<p>Reason: ${reason.trim()}</p>` : ''}<p>Regards,<br>HR Team</p>`
      };
    }
  };

  const openEmailModal = (referral) => {
    setEmailReferral(referral);
    const initialDecision = referral.status === 'rejected' ? 'rejected' : 'shortlisted';
    setEmailDecision(initialDecision);
    setRejectionReason(referral.remarks || '');
    setEmailStatusMessage(null);
    setShowConfirm(false);
    setIsEmailModalOpen(true);
    loadEmailPreview(referral, initialDecision, referral.remarks || '');
  };

  const loadEmailPreview = async (referral, decision, reason) => {
    const candidateName = referral.Candidate?.name || 'Candidate';
    const jobTitle = referral.Job?.title || 'Open Position';

    // If current DB status matches decision, query backend preview API
    if (referral.status === decision) {
      try {
        setLoadingPreview(true);
        const res = await referralService.sendReferralEmail(referral.id, {
          action: 'preview',
          reason: reason || ''
        });
        setEmailPreview({
          subject: res.data.subject,
          html: res.data.html
        });
        return;
      } catch (err) {
        // Fallback to client template on error
      } finally {
        setLoadingPreview(false);
      }
    }

    // Default to matching template
    setEmailPreview(generateClientFallbackPreview(candidateName, jobTitle, decision, reason));
  };

  const handleDecisionChange = (decision) => {
    setEmailDecision(decision);
    setEmailStatusMessage(null);
    setShowConfirm(false);
    if (emailReferral) {
      loadEmailPreview(emailReferral, decision, rejectionReason);
    }
  };

  const handleReasonChange = (reason) => {
    setRejectionReason(reason);
    if (emailReferral && emailDecision === 'rejected') {
      loadEmailPreview(emailReferral, 'rejected', reason);
    }
  };

  const handleSendEmail = async () => {
    if (!emailReferral) return;

    setSendingEmail(true);
    setEmailStatusMessage(null);

    try {
      // 1. If the referral's status in DB doesn't match the chosen decision yet, sync it
      if (emailReferral.status !== emailDecision) {
        await referralService.updateStatus(
          emailReferral.id,
          emailDecision,
          emailDecision === 'rejected' ? rejectionReason : ''
        );
      }

      // 2. Call backend to send the email
      const res = await referralService.sendReferralEmail(emailReferral.id, {
        action: 'send',
        reason: emailDecision === 'rejected' ? rejectionReason : ''
      });

      const successMsg = res.data?.message || `Email sent successfully to ${emailReferral.Candidate?.email}!`;
      setEmailStatusMessage({
        type: 'success',
        text: successMsg
      });
      toast.success(successMsg);
      setShowConfirm(false);

      // Refresh referrals list to update UI table
      fetchReferrals();
    } catch (err) {
      const errorText = 
        err.response?.data?.message || 
        (err.response?.status === 409
          ? "This candidate's email address has not been verified. Please ask the referring employee to verify or correct the email address before sending this email."
          : err.response?.status === 502
          ? "Email sending failed on the server. Please check SMTP settings."
          : "Failed to send email. Please try again.");

      setEmailStatusMessage({
        type: 'error',
        text: errorText
      });
      toast.error(errorText);
      setShowConfirm(false);
    } finally {
      setSendingEmail(false);
    }
  };

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
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.Candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.Job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.Employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Referral Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review employee referrals, view candidate resumes, update recruitment stages, and dispatch decision notifications.</p>
      </div>

      <Card className="bg-slate-50 border border-slate-100 shadow-none">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by candidate, job, or referrer..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading referrals..." />
      ) : error ? (
        <div className="text-red-500 py-4 text-center">{error}</div>
      ) : filteredReferrals.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No referrals found"
          description={searchTerm ? "No referrals match your search." : "No referrals have been submitted yet."}
        />
      ) : (
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <Table 
            data={filteredReferrals}
            columns={[
              {
                header: 'Candidate',
                render: (row) => (
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-medium text-navy">{row.Candidate?.name}</span>
                      {row.Candidate?.emailVerified ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full" title="Email Verified">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full" title="Email Unverified">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.Candidate?.email}</div>
                  </div>
                )
              },
              {
                header: 'Job Applied',
                render: (row) => (
                  <div>
                    <div className="font-medium text-navy">{row.Job?.title}</div>
                    <div className="text-xs text-slate-500">{row.Job?.department}</div>
                  </div>
                )
              },
              {
                header: 'Referred By',
                render: (row) => (
                  <div>
                    <div className="font-medium text-navy">{row.Employee?.name}</div>
                    <div className="text-xs text-slate-500">{row.Employee?.email}</div>
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
              },
              {
                header: 'Actions',
                className: 'text-right',
                cellClassName: 'text-right',
                render: (row) => (
                  <div className="inline-flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="inline-flex items-center"
                      onClick={() => openUpdateModal(row)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Update
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="inline-flex items-center text-navy hover:text-primary hover:border-primary/40"
                      onClick={() => openResumeModal(row)}
                      title={row.Candidate?.hasResume ? "View candidate resume inline" : "Check candidate resume"}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1 text-secondary" /> Resume
                    </Button>

                    <Button 
                      variant={row.status === 'shortlisted' || row.status === 'rejected' ? 'primary' : 'outline'}
                      size="sm" 
                      className="inline-flex items-center"
                      onClick={() => openEmailModal(row)}
                      title="Send shortlisted or rejected decision email"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" /> Send Email
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Referral Status"
      >
        <form id="status-form" onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Referral Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
            required
            options={[
              { value: 'referred', label: 'Referred' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'shortlisted', label: 'Shortlisted' },
              { value: 'interview', label: 'Interview' },
              { value: 'selected', label: 'Selected' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks (Optional)
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/25 focus:border-secondary text-sm font-medium transition-all shadow-xs"
              rows="3"
              value={statusForm.remarks}
              onChange={(e) => setStatusForm({...statusForm, remarks: e.target.value})}
              placeholder="Add notes about this status change..."
            ></textarea>
          </div>

          {(statusForm.status === 'shortlisted' || statusForm.status === 'rejected') && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start space-x-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Tip: After saving this status, you can dispatch an official decision notification to the candidate via the <strong>Send Email</strong> button.
              </span>
            </div>
          )}
        </form>
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="status-form" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      {/* VIEW RESUME MODAL */}
      <Modal
        isOpen={isResumeModalOpen}
        onClose={closeResumeModal}
        title={selectedResumeReferral ? `Resume: ${selectedResumeReferral.Candidate?.name}` : "Candidate Resume"}
      >
        {selectedResumeReferral && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 sm:gap-0">
              <div>
                <span className="font-semibold text-navy">{selectedResumeReferral.Candidate?.name}</span>
                <span className="text-slate-400 mx-1.5">&bull;</span>
                <span className="text-slate-600 break-all">{selectedResumeReferral.Candidate?.email}</span>
              </div>
              <div className="text-slate-500">
                Job: <span className="font-medium text-navy">{selectedResumeReferral.Job?.title}</span>
              </div>
            </div>

            {resumeLoading ? (
              <div className="py-12">
                <LoadingState message="Loading candidate resume..." />
              </div>
            ) : resumeFileType === 'pdf' && resumeBlobUrl ? (
              <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                <iframe 
                  src={resumeBlobUrl} 
                  className="w-full h-[380px] sm:h-[500px] md:h-[600px] border-none"
                  title={`Resume preview for ${selectedResumeReferral.Candidate?.name}`}
                />
              </div>
            ) : resumeFileType === 'doc' ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy">Microsoft Word Document (.doc / .docx)</h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    This candidate uploaded their resume in Word format ({selectedResumeReferral.Candidate?.resumeName || 'Word file'}). In-browser inline preview is natively supported for PDF documents.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 max-w-sm mx-auto text-left space-y-1">
                  <p><strong>Candidate:</strong> {selectedResumeReferral.Candidate?.name}</p>
                  <p><strong>Email:</strong> {selectedResumeReferral.Candidate?.email}</p>
                  <p><strong>Status:</strong> Submitted on {new Date(selectedResumeReferral.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-navy">No Resume Available</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {resumeErrorMessage || 'No resume was uploaded for this candidate.'}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={closeResumeModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* SEND SHORTLISTED / REJECTED EMAIL MODAL */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => {
          if (!sendingEmail) {
            setIsEmailModalOpen(false);
          }
        }}
        title="Send Decision Email"
      >
        {emailReferral && (
          <div className="space-y-5">
            {/* Candidate & Job Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-navy">{emailReferral.Candidate?.name}</h4>
                  <p className="text-xs text-slate-500">{emailReferral.Candidate?.email}</p>
                </div>
                <div>
                  {emailReferral.Candidate?.emailVerified ? (
                    <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3 mr-1" /> Unverified Email
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
                <span><strong>Job:</strong> {emailReferral.Job?.title}</span>
                <span><strong>Referred by:</strong> {emailReferral.Employee?.name}</span>
              </div>
            </div>

            {/* Email Verification Warning if Unverified */}
            {!emailReferral.Candidate?.emailVerified && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Candidate email is not verified</p>
                  <p className="mt-0.5 text-amber-700">
                    The backend requires candidates to verify their email address before decision emails can be delivered. Attempting to send will return a 409 status until the candidate verifies.
                  </p>
                </div>
              </div>
            )}

            {/* Decision Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Decision Outcome
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDecisionChange('shortlisted')}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    emailDecision === 'shortlisted'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Shortlisted</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecisionChange('rejected')}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    emailDecision === 'rejected'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Rejected</span>
                </button>
              </div>
            </div>

            {/* Optional Rejection Reason (only shown if Rejected) */}
            {emailDecision === 'rejected' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  rows="2"
                  value={rejectionReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  placeholder="e.g. Another candidate with more relevant domain experience was selected."
                ></textarea>
                <p className="text-xs text-slate-400 mt-1">
                  If provided, this reason will be included in the candidate's notification email.
                </p>
              </div>
            )}

            {/* Email Preview Section */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Preview
                </label>
                {loadingPreview && (
                  <span className="text-xs text-slate-400 flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Updating preview...
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 text-xs space-y-1">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">To:</span> {emailReferral.Candidate?.name} &lt;{emailReferral.Candidate?.email}&gt;
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">Subject:</span> {emailPreview.subject}
                  </div>
                </div>
                <div 
                  className="p-4 text-sm text-slate-700 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                />
              </div>
            </div>

            {/* Status Feedback Banners */}
            {emailStatusMessage && (
              <div className={`p-3.5 rounded-lg text-xs flex items-start space-x-2.5 ${
                emailStatusMessage.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {emailStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium leading-normal">
                  {emailStatusMessage.text}
                </div>
              </div>
            )}

            {/* Confirmation Box (if confirm requested) */}
            {showConfirm && !emailStatusMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                <div className="font-bold flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                  Please confirm email delivery
                </div>
                <p>
                  Are you sure you want to send the <strong>{emailDecision.toUpperCase()}</strong> email to <strong>{emailReferral.Candidate?.email}</strong>?
                </p>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    className="px-2.5 py-1 text-xs border border-amber-300 rounded bg-white hover:bg-slate-50 font-medium text-slate-700"
                    onClick={() => setShowConfirm(false)}
                    disabled={sendingEmail}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1 text-xs rounded bg-primary hover:bg-primary-hover text-white font-semibold flex items-center"
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                  >
                    {sendingEmail && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Confirm & Send Now
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEmailModalOpen(false)}
                disabled={sendingEmail}
              >
                Close
              </Button>
              
              {!showConfirm && !emailStatusMessage?.type && (
                <Button 
                  variant="primary"
                  className="flex items-center space-x-1.5"
                  onClick={() => setShowConfirm(true)}
                  disabled={sendingEmail}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Proceed to Send</span>
                </Button>
              )}

              {emailStatusMessage?.type === 'success' && (
                <Button
                  variant="primary"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HRReferrals;
