import React from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { FileText, CheckCircle, Clock, Check } from 'lucide-react';

const CandidateDashboard = () => {
  const applicationStatus = [
    { step: 'Application Submitted', date: 'Oct 01, 2026', completed: true },
    { step: 'Resume Review', date: 'Oct 03, 2026', completed: true },
    { step: 'Technical Interview', date: 'Scheduled for Oct 12', completed: false, current: true },
    { step: 'Final Decision', date: 'Pending', completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">My Application</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your referral application.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Status Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <h2 className="text-xl font-bold text-navy">Senior Frontend Engineer</h2>
                <p className="text-slate-500 text-sm mt-1">Referred by: Alice HR</p>
              </div>
              <div className="self-start">
                <Badge variant="primary">In Progress</Badge>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Application Journey</h3>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                {applicationStatus.map((status, idx) => (
                  <div key={idx} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 ${
                      status.completed ? 'bg-secondary border-secondary' : 
                      status.current ? 'bg-white border-primary' : 'bg-white border-slate-300'
                    }`}>
                      {status.completed && <Check className="w-3 h-3 text-white absolute -top-[1px] -left-[1px]" />}
                    </div>
                    
                    <div>
                      <h4 className={`text-base font-semibold ${status.current ? 'text-primary' : status.completed ? 'text-slate-800' : 'text-slate-500'}`}>
                        {status.step}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">{status.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="bg-secondary-50 border-none shadow-none">
            <h3 className="text-lg font-bold text-secondary mb-2">Next Steps</h3>
            <p className="text-sm text-slate-700 mb-4">Your Technical Interview is coming up. Please ensure your environment is set up.</p>
            <button className="w-full bg-white text-secondary font-medium py-2 rounded-lg border border-secondary-100 hover:bg-slate-50 transition-colors text-sm">
              View Interview Details
            </button>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Submitted Documents</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                <FileText className="w-5 h-5 text-slate-400 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">resume_final.pdf</p>
                  <p className="text-xs text-slate-500">245 KB</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;

