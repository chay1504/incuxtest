import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Lock, LogIn } from 'lucide-react';

function Auth({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

        try {
            const response = await axios.post(`${base}/api/login`, { username, password });
            if (response.data) {
                onLoginSuccess(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 glass rounded-3xl shadow-2xl"
            >
                <h1 className="mb-2 text-4xl font-black text-center gradient-text">Quiz Platform</h1>
                <p className="text-center text-slate-400 mb-8">Welcome back! Sign in to continue.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full py-3 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-sky-500 outline-none transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full py-3 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-sky-500 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm font-medium text-rose-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-4 text-lg font-bold bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <LogIn size={20} />
                        Sign In
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default Auth;
