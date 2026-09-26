import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { User as UserIcon, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, updateUserLocal, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(user?.daily_goal_minutes || 30);
  const [primaryGoal, setPrimaryGoal] = useState<string>(user?.primary_goal || 'Interview Preparation');
  const [saving, setSaving] = useState(false);

  // Delete Account Confirmation Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, bio, dailyGoalMinutes, primaryGoal }),
      });

      updateUserLocal({ full_name: fullName, bio, daily_goal_minutes: dailyGoalMinutes, primary_goal: primaryGoal });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (confirmUsername.trim().toLowerCase() !== user.username.toLowerCase()) {
      toast.error(`Please type your exact username "${user.username}" to confirm deletion.`);
      return;
    }

    setDeleting(true);

    try {
      const res = await apiRequest('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmUsername }),
      });

      toast.success(res.message || 'Your account has been deleted.');
      logout();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-red-600 dark:text-red-400" /> My Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your account details, learning goals, and account settings.</p>
      </div>

      {/* Main Profile Form Card */}
      <div className="theme-card rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400 font-black text-2xl border border-red-500/30">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user.full_name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username} • {user.email}</p>
            <span className="inline-block mt-2 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-500/20">
              Role: {user.role.toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username (Immutable)</label>
              <input
                type="text"
                disabled
                value={`@${user.username}`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2 px-3 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bio / Headline</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Software engineer passionate about backend architecture and algorithm optimization..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Daily Target (Minutes)</label>
              <select
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Goal</label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="theme-btn-primary flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>

      {/* DANGER ZONE: Delete Account Card */}
      <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
          <Trash2 className="h-5 w-5 shrink-0" />
          <h3 className="text-base font-extrabold">Danger Zone — Delete Account</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Permanently delete your CodeSphere profile, lesson progress, coding challenge submissions, and 10-question assessment records. This operation cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
        >
          <Trash2 className="h-4 w-4" /> Permanently Delete Account
        </button>
      </div>

      {/* Confirmation Modal for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Account Confirmation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will permanently delete your account and remove all data from PostgreSQL database. Type your exact username <span className="font-extrabold text-red-500">@{user.username}</span> to confirm.
            </p>

            <input
              type="text"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              placeholder={`Type "${user.username}" to confirm`}
              className="w-full rounded-xl border border-red-500/40 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-center text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmUsername('');
                }}
                className="w-1/2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-1/2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
