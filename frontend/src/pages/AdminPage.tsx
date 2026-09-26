import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
  FileCheck2, 
  Upload, 
  Plus, 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Copy 
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'questions' | 'users' | 'audit'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [coverage, setCoverage] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiRequest('/admin/stats');
      setStats(statsRes.stats);
      setCoverage(statsRes.questionCoverage || []);

      const qRes = await apiRequest('/admin/questions');
      setQuestions(qRes.questions || []);

      const uRes = await apiRequest('/admin/users');
      setUsers(uRes.users || []);

      const aRes = await apiRequest('/admin/audit-logs');
      setAuditLogs(aRes.auditLogs || []);
    } catch (err) {
      console.error('Failed to load admin portal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV content');
      return;
    }
    setImporting(true);

    try {
      const res = await apiRequest('/admin/questions/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      });

      toast.success(res.message);
      setShowCsvModal(false);
      setCsvText('');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`User role updated to ${newRole}`);
      loadAdminData();
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const csvTemplate = `language_slug,topic,difficulty,question_text,option_0,option_1,option_2,option_3,correct_option_index,explanation
python,Functions,Beginner,Which keyword defines a function in Python?,def,function,fun,create,0,def keyword is used in Python
javascript,Objects,Intermediate,Which method converts JSON string to object?,JSON.parse(),JSON.stringify(),parseJSON(),toObject(),0,JSON.parse parses JSON strings`;

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading admin portal...</div>;
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-400" /> Admin Management Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage platform content, question banks, user accounts, and review audit logs.</p>
        </div>

        <button
          onClick={() => setShowCsvModal(true)}
          className="theme-btn-primary flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-red-600/20"
        >
          <Upload className="h-4 w-4" /> Bulk Import Questions (CSV)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 ${activeTab === 'stats' ? 'border-b-2 border-red-500 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Overview Statistics
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 ${activeTab === 'questions' ? 'border-b-2 border-red-500 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Question Bank ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 ${activeTab === 'users' ? 'border-b-2 border-red-500 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 ${activeTab === 'audit' ? 'border-b-2 border-red-500 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-xs text-slate-400">Total Registered Users</span>
              <p className="text-2xl font-black text-slate-100">{stats?.totalUsers || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-xs text-slate-400">Lessons Completed</span>
              <p className="text-2xl font-black text-slate-100">{stats?.totalLessonsCompleted || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-xs text-slate-400">Total Test Attempts</span>
              <p className="text-2xl font-black text-slate-100">{stats?.totalAttempts || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-xs text-slate-400">Overall Pass Rate</span>
              <p className="text-2xl font-black text-emerald-400">{stats?.overallPassRate || 0}%</p>
            </div>
          </div>

          {/* Question Coverage per Language */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Question Bank Coverage by Language</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {coverage.map((c) => {
                const count = parseInt(c.question_count) || 0;
                const isLow = count < 20;

                return (
                  <div key={c.language_slug} className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="text-xs font-bold text-slate-200">{c.language_name}</span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isLow ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{count} Questions</span>
                      {isLow && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Language</th>
                  <th className="p-4">Topic / Difficulty</th>
                  <th className="p-4">Question Text</th>
                  <th className="p-4">Options</th>
                  <th className="p-4">Correct Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-red-400">{q.language_name}</td>
                    <td className="p-4">{q.topic} • {q.difficulty}</td>
                    <td className="p-4 max-w-xs truncate">{q.question_text}</td>
                    <td className="p-4 text-[10px] text-slate-400">{Array.isArray(q.options) ? q.options.join(', ') : '4 options'}</td>
                    <td className="p-4 font-bold text-emerald-400">Option {String.fromCharCode(65 + q.correct_option)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Lessons</th>
                  <th className="p-4">Tests</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-slate-100">{u.full_name} (@{u.username})</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">{u.lessons_completed || 0}</td>
                    <td className="p-4">{u.assessment_attempts || 0}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRoleChange(u.id, u.role)}
                        className="text-[11px] font-semibold text-red-400 hover:underline"
                      >
                        Toggle Role ({u.role === 'admin' ? 'Student' : 'Admin'})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-4 font-bold text-amber-400">{log.action}</td>
                    <td className="p-4">{log.target_type} ({log.target_id || 'N/A'})</td>
                    <td className="p-4 text-slate-400">{log.admin_username}</td>
                    <td className="p-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-red-400" /> Bulk Import Question Bank (CSV)
              </h3>
              <button onClick={() => setShowCsvModal(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">Paste raw CSV contents containing questions according to the format specification below:</p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-red-400 font-bold border-b border-slate-800 pb-1 mb-1">
                <span>CSV Template Specification:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(csvTemplate);
                    toast.info('Template copied to clipboard');
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                >
                  <Copy className="h-3 w-3" /> Copy Template
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{csvTemplate}</pre>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste your CSV content here..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCsv}
                disabled={importing}
                className="theme-btn-primary rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {importing ? 'Importing Batch...' : 'Process CSV Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
