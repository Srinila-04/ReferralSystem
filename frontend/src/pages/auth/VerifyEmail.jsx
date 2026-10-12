import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { referralService } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Status can be: 'loading', 'success', 'already_verified', 'invalid_or_expired', 'error'
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const requestInitiated = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (requestInitiated.current) return;
    requestInitiated.current = true;

    if (!token || !token.trim()) {
      setStatus('invalid_or_expired');
      setMessage('This verification link is invalid or has expired. Please request a new verification email.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await referralService.verifyEmail(token);
        if (response.data?.alreadyVerified) {
          setStatus('already_verified');
          setMessage("Your email address has already been verified. You're all set to receive application updates.");
        } else {
          setStatus('success');
          setMessage('Your email address has been verified successfully. You can now receive application updates.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message?.toLowerCase() || '';
        const statusCode = err.response?.status;

        if (
          statusCode === 400 || 
          statusCode === 404 || 
          errorMsg.includes('invalid') || 
          errorMsg.includes('expired') ||
          errorMsg.includes('not found')
        ) {
          setStatus('invalid_or_expired');
          setMessage('This verification link is invalid or has expired. Please request a new verification email.');
        } else {
          setStatus('error');
          setMessage("We couldn't verify your email right now. Please try again later.");
        }
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-3xl font-extrabold text-navy tracking-tight">ReferralSystem</h1>
        <p className="mt-2 text-sm text-slate-500">Candidate Email Verification</p>
      </div>

      <div className="w-full max-w-md">
        <Card className="py-8 px-6 sm:px-10 text-center shadow-lg border border-slate-100 rounded-2xl bg-white">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-secondary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-navy">Verifying your email...</h2>
              <p className="text-sm text-slate-500 max-w-xs">
                Please wait while we confirm your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-navy">Email Verified!</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                {message}
              </p>
              <div className="pt-4 w-full">
                <Link to="/login" className="w-full block">
                  <Button variant="primary" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-secondary flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-navy">Already Verified</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                {message}
              </p>
              <div className="pt-4 w-full">
                <Link to="/login" className="w-full block">
                  <Button variant="primary" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'invalid_or_expired' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-navy">Verification Link Invalid</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                {message}
              </p>
              <div className="pt-4 w-full">
                <Link to="/login" className="w-full block">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-navy">Verification Failed</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                {message}
              </p>
              <div className="pt-4 w-full flex flex-col space-y-2">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => {
                    requestInitiated.current = false;
                    setStatus('loading');
                    window.location.reload();
                  }}
                >
                  Try Again
                </Button>
                <Link to="/login" className="w-full block">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

