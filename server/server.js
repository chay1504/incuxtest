const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const questions = require('./questions.json');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// In-memory data stores
let users = {}; // { username: { password, name, status: 'active'|'disqualified', score: 0 } }
let quizState = {
    isActive: false,
    currentQuestionIndex: -1,
    questionStartTime: null,
    participants: {}, // { username: { socketId, score, answers: [] } }
    roomCode: null,
    attendance: 0
};

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Auth Endpoints
app.post('/api/signup', (req, res) => {
    const { username, password, name } = req.body;
    if (users[username]) return res.status(400).json({ error: 'Username already exists' });
    users[username] = { password, name, status: 'active', score: 0 };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ username, name: user.name, status: user.status });
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('admin_create_session', () => {
        quizState.roomCode = generateRoomCode();
        quizState.isActive = false;
        quizState.participants = {};
        quizState.attendance = 0;
        quizState.currentQuestionIndex = -1;
        socket.emit('session_created', quizState.roomCode);
    });

    socket.on('student_join', ({ username, code }) => {
        const user = users[username];
        if (!user) return socket.emit('join_error', 'User not found');
        if (user.status === 'disqualified') return socket.emit('join_error', 'You are disqualified from this session');

        if (code === quizState.roomCode) {
            quizState.participants[username] = {
                socketId: socket.id,
                score: user.score,
                answers: []
            };
            if (!Object.values(quizState.participants).some(p => p.socketId === socket.id)) {
                quizState.attendance++;
            }
            socket.join(quizState.roomCode);
            socket.emit('join_success');
            io.emit('attendance_update', quizState.attendance);
        } else {
            socket.emit('join_error', 'Invalid Room Code');
        }
    });

    socket.on('cheat_detected', ({ username, reason }) => {
        console.log(`Cheat detected for ${username}: ${reason}`);
        if (users[username]) {
            users[username].status = 'disqualified';
            socket.emit('disqualified', { reason });
            socket.disconnect();

            // Clean up participant
            delete quizState.participants[username];
            quizState.attendance = Math.max(0, quizState.attendance - 1);
            io.emit('attendance_update', quizState.attendance);

            // Log to all (optional) or just admin
            console.log(`${username} has been disqualified.`);
        }
    });

    socket.on('admin_start_quiz', () => {
        if (quizState.roomCode) {
            quizState.isActive = true;
            nextQuestion();
        }
    });

    socket.on('submit_answer', ({ username, answer }) => {
        const participant = quizState.participants[username];
        const user = users[username];
        if (participant && user && user.status === 'active' && quizState.isActive) {
            const question = questions[quizState.currentQuestionIndex];
            const timeTaken = (Date.now() - quizState.questionStartTime) / 1000;
            const isCorrect = answer === question.answer;

            let points = 0;
            if (isCorrect) {
                points = Math.max(100, Math.round(1000 * (1 - timeTaken / 25)));
                user.score += points;
                participant.score = user.score;
            }

            participant.answers.push({
                questionId: question.id,
                isCorrect,
                points,
                timeTaken
            });

            socket.emit('answer_submitted', { success: true });
            updateAdminStats();
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnect if needed
    });
});

function nextQuestion() {
    quizState.currentQuestionIndex++;
    if (quizState.currentQuestionIndex < questions.length) {
        quizState.questionStartTime = Date.now();
        const question = questions[quizState.currentQuestionIndex];

        // Don't send the answer to students!
        const questionData = {
            question: question.question,
            options: question.options,
            index: quizState.currentQuestionIndex,
            total: questions.length
        };

        io.to(quizState.roomCode).emit('new_question', questionData);

        let timeLeft = 25;
        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                startIntermission();
            }
        }, 1000);
    } else {
        endQuiz();
    }
}

function startIntermission() {
    io.to(quizState.roomCode).emit('intermission', 5);
    setTimeout(() => {
        nextQuestion();
    }, 5000);
}

function updateAdminStats() {
    if (quizState.currentQuestionIndex === -1) return;

    const question = questions[quizState.currentQuestionIndex];
    const participantValues = Object.values(quizState.participants);

    const stats = {
        correct: participantValues.filter(p => {
            const lastAns = p.answers[p.answers.length - 1];
            return lastAns && lastAns.questionId === question.id && lastAns.isCorrect;
        }).length,
        incorrect: participantValues.filter(p => {
            const lastAns = p.answers[p.answers.length - 1];
            return lastAns && lastAns.questionId === question.id && !lastAns.isCorrect;
        }).length,
        totalResponded: participantValues.filter(p => {
            const lastAns = p.answers[p.answers.length - 1];
            return lastAns && lastAns.questionId === question.id;
        }).length
    };
    io.emit('admin_stats_update', stats);
}

function endQuiz() {
    quizState.isActive = false;
    const leaderboard = Object.entries(users)
        .sort((a, b) => b[1].score - a[1].score)
        .map(([username, data]) => ({ name: data.name, score: data.score, status: data.status }));

    io.to(quizState.roomCode).emit('quiz_ended', leaderboard);
}

// REST endpoints for data export
app.get('/export/csv', (req, res) => {
    const sorted = Object.entries(users).sort((a, b) => b[1].score - a[1].score);
    let csv = "Rank,Name,Username,Score,Status\n";
    sorted.forEach(([username, data], i) => {
        csv += `${i + 1},${data.name},${username},${data.score},${data.status}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.csv');
    res.send(csv);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
