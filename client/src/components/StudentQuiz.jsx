import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle2, Trophy, AlertTriangle } from 'lucide-react';

function StudentQuiz({ socket, user, currentQuestion, timer, intermission, leaderboard, disqualified }) {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (currentQuestion) {
            setSelectedAnswer(null);
            setSubmitted(false);
        }
    }, [currentQuestion]);

    const handleSubmit = (option) => {
        if (submitted || intermission > 0 || disqualified) return;
        setSelectedAnswer(option);
        setSubmitted(true);
        socket.emit('submit_answer', { username: user.username, answer: option });
    };

    if (disqualified) {
        return (
            <div className="h-screen flex items-center justify-center bg-rose-950 p-6">
                <div className="bg-rose-900 border border-rose-600 p-8 rounded-xl max-w-lg text-center shadow-2xl">
                    <AlertTriangle className="mx-auto text-white mb-4" size={48} />
                    <h1 className="text-3xl font-bold text-white mb-4">You have been Disqualified.</h1>
                    <p className="text-rose-200">Cheat detected: Changing tabs or losing focus is against the rules.</p>
                    <p className="text-sm text-rose-300 mt-6">Your session has been terminated. You cannot rejoin.</p>
                </div>
            </div>
        );
    }

    if (leaderboard.length > 0 && !currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-2xl p-8 glass rounded-3xl"
                >
                    <div className="flex justify-center mb-6">
                        <Trophy className="text-amber-400" size={64} />
                    </div>
                    <h1 className="text-4xl font-black text-center mb-8 gradient-text">Quiz Finished!</h1>
                    <p className="text-center text-slate-400 mb-8">Performance results are being finalized.</p>
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                        <p className="text-center text-xl font-medium">Thank you for participating, <span className="text-sky-400">{user.name}</span>!</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!currentQuestion && !submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="space-y-4 text-center p-8 glass rounded-3xl">
                    <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="text-2xl font-bold text-slate-300">Question Starting Soon...</h2>
                    <p className="text-slate-500">Do not leave this page!</p>
                    <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                        <p className="text-amber-500 text-sm font-medium">⚠️ IMPORTANT: Switching tabs or apps will disqualify you instantly.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 pt-12">
            <AnimatePresence mode="wait">
                {intermission > 0 ? (
                    <motion.div
                        key="intermission"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center justify-center h-[60vh] text-center"
                    >
                        <h2 className="text-5xl font-black mb-4">Next Question In</h2>
                        <div className="text-9xl font-black text-sky-500 animate-pulse">{intermission}</div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentQuestion?.index}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-1 bg-slate-700 rounded-lg font-bold text-sky-400 text-lg">
                                    {currentQuestion?.index + 1}/{currentQuestion?.total}
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-6 py-2 rounded-xl font-mono text-2xl font-black ${timer < 10 ? 'text-rose-500 animate-pulse-fast' : 'text-emerald-400'}`}>
                                <Timer size={24} />
                                {timer}s
                            </div>
                        </div>

                        <div className="p-10 glass rounded-3xl shadow-2xl space-y-10">
                            <h1 className="text-3xl font-bold leading-tight">
                                {currentQuestion?.question}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentQuestion?.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        disabled={submitted}
                                        onClick={() => handleSubmit(option)}
                                        className={`p-6 text-left rounded-2xl border-2 transition-all text-lg font-medium relative overflow-hidden group 
                      ${selectedAnswer === option
                                                ? 'border-sky-500 bg-sky-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                                            } ${submitted && selectedAnswer !== option ? 'opacity-50' : ''}`}
                                    >
                                        <span className="flex items-center justify-between">
                                            {option}
                                            {selectedAnswer === option && submitted && (
                                                <CheckCircle2 className="text-sky-500" />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {submitted && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700"
                            >
                                <p className="text-slate-400 text-lg">Your answer has been submitted! Waiting for the next question...</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StudentQuiz;
