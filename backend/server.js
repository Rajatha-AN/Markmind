require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/invitations', require('./routes/invitations'));

// ── Socket.IO ─────────────────────────────────────────────
const onlineUsers = new Map(); // socketId → { userId, username, spaceId }

io.on('connection', (socket) => {
  console.log('[Socket] connected:', socket.id);

  // Join a space room
  socket.on('join-space', ({ spaceId, userId, username }) => {
    // Leave any previous space
    const prev = onlineUsers.get(socket.id);
    if (prev?.spaceId) {
      socket.leave(prev.spaceId);
      io.to(prev.spaceId).emit('member-left', { userId: prev.userId, username: prev.username });
    }

    socket.join(spaceId);
    onlineUsers.set(socket.id, { userId, username, spaceId });

    // Notify others in the room
    socket.to(spaceId).emit('member-joined', { userId, username });

    // Send current online list back to the joining socket
    const roomMembers = [...onlineUsers.values()].filter(u => u.spaceId === spaceId);
    socket.emit('online-members', roomMembers);
  });

  // Leave space (navigate away)
  socket.on('leave-space', ({ spaceId }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      socket.leave(spaceId);
      io.to(spaceId).emit('member-left', { userId: user.userId, username: user.username });
      onlineUsers.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user?.spaceId) {
      io.to(user.spaceId).emit('member-left', { userId: user.userId, username: user.username });
    }
    onlineUsers.delete(socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`[Server] running on port ${PORT}`));
