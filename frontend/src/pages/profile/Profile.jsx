import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Shield, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import { profileService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    role: '',
    status: '',
    id: '',
    avatar: null,
    createdAt: null,
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null); // { type: 'success'|'error', message: '' }

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState(null);

  // Avatar & Cropper Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropError, setCropError] = useState(null);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageObjRef = useRef(null);

  // Fetch current profile details on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    setProfileAlert(null);
    try {
      const res = await profileService.getProfile();
      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        setProfileData({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          department: p.department || '',
          designation: p.designation || '',
          role: p.role || '',
          status: p.status || 'active',
          id: p.id || '',
          avatar: p.avatar || null,
          createdAt: p.createdAt || null,
        });
        updateUser({
          name: p.name,
          email: p.email,
          avatar: p.avatar,
          department: p.department,
          designation: p.designation,
          phone: p.phone,
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setProfileAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load your profile details.',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle Profile Form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileAlert(null);

    if (!profileData.name.trim()) {
      toast.error('Full name is required.');
      setProfileAlert({ type: 'error', message: 'Full name is required.' });
      return;
    }
    if (!profileData.email.trim()) {
      toast.error('Email address is required.');
      setProfileAlert({ type: 'error', message: 'Email address is required.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await profileService.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        department: profileData.department.trim(),
        designation: profileData.designation.trim(),
      });

      if (res.data?.success) {
        toast.success('Profile updated successfully!');
        setProfileAlert({ type: 'success', message: 'Profile details saved successfully!' });
        updateUser({
          name: profileData.name.trim(),
          email: profileData.email.trim(),
          phone: profileData.phone.trim(),
          department: profileData.department.trim(),
          designation: profileData.designation.trim(),
        });
      }
    } catch (err) {
      console.error('Update profile error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save changes. Please try again.';
      toast.error(errorMsg);
      setProfileAlert({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (!passwordData.currentPassword) {
      toast.error('Current password is required.');
      setPasswordAlert({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (!passwordData.newPassword) {
      toast.error('New password is required.');
      setPasswordAlert({ type: 'error', message: 'New password is required.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      setPasswordAlert({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      setPasswordAlert({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (res.data?.success) {
        toast.success('Password changed successfully!');
        setPasswordAlert({ type: 'success', message: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      console.error('Change password error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to change password. Please try again.';
      toast.error(errorMsg);
      setPasswordAlert({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- Avatar Upload & Canvas Cropper Logic ---
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please select a JPG, PNG, or WEBP image.');
      setProfileAlert({
        type: 'error',
        message: 'Invalid file format. Please select a JPG, PNG, or WEBP image.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (max 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image file size exceeds the 5 MB limit. Please select a smaller photo.');
      setProfileAlert({
        type: 'error',
        message: 'Image file size exceeds the 5 MB limit. Please select a smaller photo.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFileName(file.name);
    setCropError(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load selected image into an HTML Image object for canvas rendering
  useEffect(() => {
    if (!selectedImageSrc) return;
    const img = new Image();
    img.src = selectedImageSrc;
    img.onload = () => {
      imageObjRef.current = img;
      renderCropCanvas();
    };
  }, [selectedImageSrc]);

  // Re-render crop canvas whenever zoom or pan changes
  useEffect(() => {
    if (imageObjRef.current && isCropModalOpen) {
      renderCropCanvas();
    }
  }, [zoomLevel, panOffset, isCropModalOpen]);

  const renderCropCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Compute dimensions to fit the image
    const minDim = Math.min(img.width, img.height);
    const baseScale = width / minDim;
    const currentScale = baseScale * zoomLevel;

    const drawWidth = img.width * currentScale;
    const drawHeight = img.height * currentScale;

    // Center image + apply pan offset
    const centerX = width / 2;
    const centerY = height / 2;
    const drawX = centerX - drawWidth / 2 + panOffset.x;
    const drawY = centerY - drawHeight / 2 + panOffset.y;

    // Draw the source image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Draw circular dark vignette overlay with transparent center
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(0, 0, width, height);

    // Cut out clear circular crop aperture in center
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    const radius = width / 2 - 16;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation to draw circular guide border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#6F85C5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  // Mouse & Touch Pan Handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const resetCropper = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleSaveCrop = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    setIsUploadingAvatar(true);
    setCropError(null);

    try {
      // Create a clean export canvas of 400x400
      const exportCanvas = document.createElement('canvas');
      const exportSize = 400;
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const exportCtx = exportCanvas.getContext('2d');

      const width = canvas.width;
      const height = canvas.height;
      const minDim = Math.min(img.width, img.height);
      const baseScale = width / minDim;
      const currentScale = baseScale * zoomLevel;

      const drawWidth = img.width * currentScale;
      const drawHeight = img.height * currentScale;

      const centerX = width / 2;
      const centerY = height / 2;
      const drawX = centerX - drawWidth / 2 + panOffset.x;
      const drawY = centerY - drawHeight / 2 + panOffset.y;

      // Crop aperture details (radius = width / 2 - 16)
      const cropRadius = width / 2 - 16;
      const cropDiameter = cropRadius * 2;
      const cropLeft = centerX - cropRadius;
      const cropTop = centerY - cropRadius;

      // Scale factor from crop aperture to export canvas
      const scaleToExport = exportSize / cropDiameter;

      // Draw exact cropped region onto export canvas
      exportCtx.drawImage(
        img,
        (drawX - cropLeft) * scaleToExport,
        (drawY - cropTop) * scaleToExport,
        drawWidth * scaleToExport,
        drawHeight * scaleToExport
      );

      // Convert export canvas to Blob
      exportCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            setCropError('Failed to generate cropped image. Please try again.');
            setIsUploadingAvatar(false);
            return;
          }

          const formData = new FormData();
          const cleanName = selectedFileName.replace(/\.[^/.]+$/, '') + '-avatar.jpg';
          formData.append('avatar', blob, cleanName);

          try {
            const res = await profileService.uploadAvatar(formData);
            if (res.data?.success) {
              const newAvatarUrl = res.data.avatarUrl;
              setProfileData((prev) => ({ ...prev, avatar: newAvatarUrl }));
              updateUser({ avatar: newAvatarUrl });
              setIsCropModalOpen(false);
              setSelectedImageSrc(null);
              toast.success('Profile picture updated successfully!');
              setProfileAlert({
                type: 'success',
                message: 'Profile picture updated successfully!',
              });
            }
          } catch (uploadErr) {
            console.error('Avatar upload error:', uploadErr);
            const errText = uploadErr.response?.data?.message || 'Failed to upload profile picture.';
            toast.error(errText);
            setCropError(errText);
          } finally {
            setIsUploadingAvatar(false);
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Crop processing error:', err);
      toast.error('Error during image processing.');
      setCropError('Error during image processing.');
      setIsUploadingAvatar(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profileData.name || user?.name || 'User'
  )}&background=08245F&color=fff`;

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-secondary mb-3" />
        <p className="text-sm">Loading your profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Account Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and update your personal details, profile photo, and security credentials.
        </p>
      </div>

      {/* Top Banner Card with Avatar and Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex-shrink-0">
            <img
              src={profileData.avatar || defaultAvatar}
              alt={profileData.name}
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-secondary text-white p-2.5 rounded-full shadow-lg hover:bg-secondary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary cursor-pointer"
            title="Upload and crop new profile picture"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{profileData.name}</h2>
              <p className="text-sm text-slate-500">{profileData.email}</p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-secondary-50 text-secondary border border-secondary/20">
                <Shield className="w-3 h-3 mr-1" />
                {profileData.role || 'User'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                {profileData.status}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="text-slate-700 font-medium">
                {profileData.department || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Designation</span>
              <span className="text-slate-700 font-medium">
                {profileData.designation || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Member Since</span>
              <span className="text-slate-700 font-medium">
                {profileData.createdAt
                  ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Personal Details & Password */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-lg font-bold text-navy flex items-center">
                <User className="w-5 h-5 mr-2 text-secondary" />
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your identity, contact information, and organizational details.
              </p>
            </div>
          </div>

          {profileAlert && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
                profileAlert.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {profileAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{profileAlert.message}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="e.g. user@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g. +1 555-0199"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    placeholder="e.g. Engineering, Sales, HR"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Designation / Job Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="designation"
                    value={profileData.designation}
                    onChange={handleProfileChange}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Read-Only System Security Fields */}
            <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 p-6 sm:p-7 rounded-b-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  System Credentials & Permissions
                </span>
                <span className="text-[11px] text-slate-400"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Assigned Role</span>
                  <span className="text-xs font-semibold text-navy capitalize">{profileData.role}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Account Status</span>
                  <span className="text-xs font-semibold text-emerald-600 capitalize">{profileData.status}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">User ID</span>
                  <span className="text-xs font-mono text-slate-600">{profileData.id}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2.5 bg-navy hover:bg-navy/90 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving Profile...
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Change Password Flow (1 Column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-navy flex items-center">
                <Lock className="w-5 h-5 mr-2 text-secondary" />
                Change Password
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your account secure with a strong password.
              </p>
            </div>

            {passwordAlert && (
              <div
                className={`mb-5 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  passwordAlert.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {passwordAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{passwordAlert.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    placeholder="Enter current password"
                    className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="At least 6 characters"
                    className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    placeholder="Confirm new password"
                    className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-slate-400 text-[11px] leading-relaxed">
            Passwords must contain at least 6 characters. Do not share your login credentials with anyone.
          </div>
        </div>
      </div>

      {/* --- Interactive Image Cropper Modal --- */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Adjust Profile Picture</h3>
                <p className="text-xs text-slate-500">Pan and zoom to crop your avatar.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setSelectedImageSrc(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex flex-col items-center flex-1 overflow-y-auto">
              {cropError && (
                <div className="w-full mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cropError}</span>
                </div>
              )}

              {/* Canvas Viewport */}
              <div
                className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] max-w-full rounded-xl overflow-hidden bg-slate-950 shadow-inner cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerDown({ clientX: touch.clientX, clientY: touch.clientY });
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
                }}
                onTouchEnd={handlePointerUp}
              >
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="w-full h-full block"
                />
              </div>

              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Click and drag inside the viewport to reposition image.
              </p>

              {/* Controls: Zoom slider & Reset */}
              <div className="w-full mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-secondary" />
                    Zoom Level: {zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    type="button"
                    onClick={resetCropper}
                    className="text-secondary hover:text-navy text-xs flex items-center gap-1 focus:outline-none font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.1).toFixed(1)))}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-full accent-secondary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.1).toFixed(1)))}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setSelectedImageSrc(null);
                }}
                disabled={isUploadingAvatar}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isUploadingAvatar}
                className="px-4 py-2 text-xs font-semibold bg-navy hover:bg-navy/90 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center cursor-pointer disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving Avatar...
                  </>
                ) : (
                  'Crop & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

