import React from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Settings, Play, Download, Trash2 } from 'lucide-react';

function AdminDashboard({ socket, roomCode, adminStats, leaderboard }) {

    const startQuiz = () => {
        socket.emit('admin_start_quiz');
    };

    const createSession = () => {
        socket.emit('admin_create_session');
    };

    const exportData = () => {
        const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        window.open(`${base}/export/csv`, '_blank');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 gradient-text">Admin Control Panel</h1>
                    <p className="text-slate-400">Manage your 200-student quiz session</p>
                </div>
                {!roomCode ? (
                    <button
                        onClick={createSession}
                        className="px-8 py-4 bg-sky-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-500 transition-all shadow-lg shadow-sky-900/40"
                    >
                        <Settings size={20} /> Initialize Session
                    </button>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 border-2 border-slate-700 px-6 py-3 rounded-2xl">
                            <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Room Code</span>
                            <span className="text-2xl font-mono font-black tracking-widest text-sky-400">{roomCode}</span>
                        </div>
                        <button
                            onClick={startQuiz}
                            className="px-8 py-4 bg-emerald-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40"
                        >
                            <Play size={20} /> Start Quiz
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    icon={<Users className="text-sky-400" />}
                    title="Attendance"
                    value={adminStats.attendance}
                    subtitle="Students joined"
                />
                <StatsCard
                    icon={<BarChart3 className="text-emerald-400" />}
                    title="Correct"
                    value={adminStats.correct}
                    subtitle="Last question"
                />
                <StatsCard
                    icon={<Trash2 className="text-rose-400" />}
                    title="Incorrect"
                    value={adminStats.incorrect}
                    subtitle="Last question"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass rounded-3xl p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Live Leaderboard</h2>
                        <button
                            onClick={exportData}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>

                    <div className="overflow-hidden bg-slate-800/50 rounded-2xl border border-slate-700">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                    <th className="px-6 py-4 font-medium uppercase">Rank</th>
                                    <th className="px-6 py-4 font-medium uppercase">Name</th>
                                    <th className="px-6 py-4 font-medium uppercase text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-20 text-center text-slate-500">No data available yet. Start the quiz to see results.</td>
                                    </tr>
                                ) : (
                                    leaderboard.slice(0, 10).map((p, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={i}
                                            className="hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${i === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/50' :
                                                        i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' :
                                                            i === 2 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/50' :
                                                                'text-slate-400'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{p.name}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-sky-400">{p.score}</td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold">Session Activity</h2>
                    <div className="space-y-4">
                        <ActivityBadge label="Backend Status" status="Online" color="emerald" />
                        <ActivityBadge label="Socket Connection" status="Active" color="sky" />
                        <ActivityBadge label="Question Bank" status="20 Loaded" color="amber" />
                    </div>
                    <div className="pt-8 border-t border-slate-700">
                        <p className="text-sm text-slate-400 leading-relaxed">
                            As an admin, you control the pace. Students receive points based on correctness and speed. The leaderboard is only visible here until the session ends.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon, title, value, subtitle }) {
    return (
        <div className="glass p-6 rounded-3xl flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                {React.cloneElement(icon, { size: 32 })}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-black">{value}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
        </div>
    );
}

function ActivityBadge({ label, status, color }) {
    const colorMap = {
        emerald: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
        sky: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
        amber: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    };
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">{label}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorMap[color]}`}>{status}</span>
        </div>
    );
}

export default AdminDashboard;
