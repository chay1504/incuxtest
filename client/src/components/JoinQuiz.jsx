import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function JoinQuiz({ socket, setUser, user, disqualified }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        socket.on('join_success', () => {
            navigate('/quiz');
        });

        socket.on('join_error', (msg) => {
            setError(msg);
        });

        return () => {
            socket.off('join_success');
            socket.off('join_error');
        };
    }, [socket, navigate]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (disqualified) return;
        if (code.length === 6) {
            socket.emit('student_join', { username: user.username, code });
        } else {
            setError('Please enter a valid 6-digit code');
        }
    };

    const createAdminSession = () => {
        socket.emit('admin_create_session');
        // Ensure admin user is set (usually username 'admin')
        navigate('/admin');
    };

    if (disqualified) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-4xl font-black text-rose-500 mb-4">YOU ARE DISQUALIFIED</h1>
                <p className="text-slate-400">You cannot rejoin this session.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass rounded-2xl shadow-2xl"
            >
                <h1 className="mb-2 text-4xl font-black text-center gradient-text">Ready to Join?</h1>
                <p className="text-center text-slate-400 mb-8">Logged in as {user.name}</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="6-Digit Code"
                            maxLength={6}
                            className="w-full py-3 pl-12 pr-4 bg-slate-800 border-2 border-slate-700 rounded-xl focus:border-sky-500 outline-none transition-all tracking-[0.5em] font-mono text-center"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm font-medium text-rose-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-4 text-lg font-bold bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <PlayCircle size={24} /> Join Session
                    </button>
                </form>

                {user.username === 'admin' && (
                    <div className="mt-12 pt-8 border-t border-slate-700 text-center">
                        <button
                            onClick={createAdminSession}
                            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Control Dashboard (Admin)
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default JoinQuiz;
