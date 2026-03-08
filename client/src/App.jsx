import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Auth from './components/Auth';
import JoinQuiz from './components/JoinQuiz';
import StudentQuiz from './components/StudentQuiz';
import AdminDashboard from './components/AdminDashboard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(BACKEND_URL);

function App() {
    const [user, setUser] = useState(null); // { username, name, status }
    const [roomCode, setRoomCode] = useState('');
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [timer, setTimer] = useState(25);
    const [intermission, setIntermission] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [adminStats, setAdminStats] = useState({ correct: 0, incorrect: 0, attendance: 0 });
    const [disqualified, setDisqualified] = useState(false);

    useEffect(() => {
        socket.on('session_created', (code) => {
            setRoomCode(code);
        });

        socket.on('attendance_update', (count) => {
            setAdminStats(prev => ({ ...prev, attendance: count }));
        });

        socket.on('new_question', (question) => {
            setQuizStarted(true);
            setCurrentQuestion(question);
            setIntermission(0);
            setTimer(25);
        });

        socket.on('intermission', (duration) => {
            setIntermission(duration);
        });

        socket.on('admin_stats_update', (stats) => {
            setAdminStats(prev => ({ ...prev, ...stats }));
        });

        socket.on('quiz_ended', (lb) => {
            setLeaderboard(lb);
            setQuizStarted(false);
            setCurrentQuestion(null);
        });

        socket.on('disqualified', ({ reason }) => {
            setDisqualified(true);
            alert(`DISQUALIFIED: ${reason}`);
        });

        return () => {
            socket.off('session_created');
            socket.off('attendance_update');
            socket.off('new_question');
            socket.off('intermission');
            socket.off('admin_stats_update');
            socket.off('quiz_ended');
            socket.off('disqualified');
        };
    }, []);

    // Anti-Cheat Logic
    useEffect(() => {
        if (user && user.status === 'active' && !disqualified && quizStarted) {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    socket.emit('cheat_detected', { username: user.username, reason: 'Tab/Window switch detected' });
                    setDisqualified(true);
                }
            };

            const handleBlur = () => {
                socket.emit('cheat_detected', { username: user.username, reason: 'Window focus lost' });
                setDisqualified(true);
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleBlur);
            };
        }
    }, [user, disqualified, quizStarted]);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        if (userData.status === 'disqualified') {
            setDisqualified(true);
        }
    };

    return (
        <Router>
            <div className="min-h-screen bg-[#0f172a] text-white w-full">
                <Routes>
                    <Route
                        path="/"
                        element={!user ? <Auth onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/join" />}
                    />
                    <Route
                        path="/join"
                        element={user ? <JoinQuiz socket={socket} setUser={setUser} user={user} disqualified={disqualified} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/quiz"
                        element={user ? <StudentQuiz socket={socket} user={user} currentQuestion={currentQuestion} timer={timer} intermission={intermission} leaderboard={leaderboard} disqualified={disqualified} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/admin"
                        element={user && user.username === 'admin' ? <AdminDashboard socket={socket} roomCode={roomCode} adminStats={adminStats} leaderboard={leaderboard} /> : <Navigate to="/" />}
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
