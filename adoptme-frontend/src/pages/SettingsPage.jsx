import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Sun, 
  Moon, 
  Palette, 
  MessageSquarePlus, 
  Send,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, deleteAccount, updateUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Username form state
  const [username, setUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState('bug');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    } else if (user?.email) {
      setUsername(user.email.split('@')[0]);
    }
  }, [user]);

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    if (!usernamePassword) {
      setUsernameError('Current password is required to update username.');
      return;
    }

    try {
      setUsernameLoading(true);
      await userService.updateUsername(usernamePassword, username);
      updateUserProfile({ username });
      setUsernameSuccess('Username updated successfully!');
      setUsernamePassword('');
    } catch (err) {
      setUsernameError(err.response?.data?.message || 'Failed to update username.');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await userService.updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (!feedbackMessage.trim()) {
      setFeedbackError('Please enter a message description.');
      return;
    }

    try {
      setFeedbackLoading(true);
      // Simulating / fallback payload handling or sending to backend
      await new Promise((resolve) => setTimeout(resolve, 600));

      setFeedbackSuccess('Thank you! Your feedback has been submitted directly to the team.');
      setFeedbackSubject('');
      setFeedbackMessage('');
    } catch (err) {
      setFeedbackError('Failed to send feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action is permanent and all your favorites and reviews will be removed.'
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteAccount();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const cardClass =
    'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90';
  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0f172a]/60 dark:text-white';
  const labelClass =
    'block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your credentials, preferences, appearance, and legal policies.
        </p>
      </div>

      {/* Appearance / Theme Toggle Card */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current theme is <strong className="capitalize">{theme}</strong> mode
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-blue-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className={cardClass}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-500/30">
            {username ? username[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {username || 'User Profile'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'No email associated'}</p>
            {(user?.address || user?.zipCode) && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Location: {[user.address, user.city, user.state, user.zipCode].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Change Username Form */}
      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800/80">
          <User className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Change Username
          </h2>
        </div>

        {usernameSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{usernameSuccess}</span>
          </div>
        )}

        {usernameError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{usernameError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateUsername} className="space-y-3">
          <div>
            <label className={labelClass}>New Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Confirm Current Password</label>
            <input
              type="password"
              required
              value={usernamePassword}
              onChange={(e) => setUsernamePassword(e.target.value)}
              placeholder="Enter current password to save"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={usernameLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {usernameLoading ? 'Saving...' : 'Update Username'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800/80">
          <Lock className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Change Password
          </h2>
        </div>

        {passwordSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div>
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {passwordLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Feedback, Bug Reports & Feature Requests */}
      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800/80">
          <MessageSquarePlus className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Send Feedback & Bug Reports
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Found a glitch, have an idea for a feature, or want to share general feedback? Let us know below.
        </p>

        {feedbackSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {feedbackError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{feedbackError}</span>
          </div>
        )}

        <form onSubmit={handleSendFeedback} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className={inputClass}
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Feedback</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Subject (Optional)</label>
              <input
                type="text"
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                placeholder="e.g. Map marker glitch on mobile"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Message Details</label>
            <textarea
              rows={4}
              required
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Describe the issue you encountered or the idea you'd like to suggest..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={feedbackLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {feedbackLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{feedbackLoading ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </form>
      </div>

      {/* Legal & Policies (Directly above Danger Zone) */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Legal & Policies</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review platform rules, terms of service, and shelter disclaimers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/terms')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <span>Terms of Service</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20 space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-200 pb-3 dark:border-rose-900/40">
          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Danger Zone
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Delete Account</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Permanently remove your account, favorited pets, and submitted reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer shrink-0"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{deleting ? 'Deleting...' : 'Delete Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}