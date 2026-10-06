import { Server } from "socket.io";

const connections = {}; // roomId -> [socketId]
const messages = {};    // roomId -> [{ sender, data, timestamp, socketIdSender }]
const socketRoomMap = {}; // socketId -> roomId
const socketUserMap = {}; // socketId -> username

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join-call", (path, username) => {
            const roomId = path;
            const displayName = username || `User-${socket.id.slice(0, 4)}`;

            if (!connections[roomId]) {
                connections[roomId] = [];
            }

            if (!connections[roomId].includes(socket.id)) {
                connections[roomId].push(socket.id);
            }
            socketRoomMap[socket.id] = roomId;
            socketUserMap[socket.id] = displayName;
            socket.join(roomId);

            console.log(`User '${displayName}' (${socket.id}) joined room ${roomId}. Total: ${connections[roomId].length}`);

            // Prepare list of participants with usernames
            const participantDetails = connections[roomId].map((id) => ({
                socketId: id,
                username: socketUserMap[id] || `User-${id.slice(0, 4)}`
            }));

            // Notify all peers in this room about the new participant and send current participant list
            for (let i = 0; i < connections[roomId].length; i++) {
                io.to(connections[roomId][i]).emit("user-joined", socket.id, connections[roomId], participantDetails);
            }

            // Sync chat history to newly joined user
            if (messages[roomId] && messages[roomId].length > 0) {
                messages[roomId].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.data,
                        msg.sender,
                        msg.socketIdSender,
                        msg.timestamp
                    );
                });
            }
        });

        // WebRTC Signaling Relay
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // Chat Messaging
        socket.on("chat-message", (data, sender) => {
            const roomId = socketRoomMap[socket.id];

            if (roomId && connections[roomId]) {
                if (!messages[roomId]) {
                    messages[roomId] = [];
                }

                const msgObj = {
                    sender: sender || socketUserMap[socket.id] || "Anonymous",
                    data: data,
                    socketIdSender: socket.id,
                    timestamp: new Date().toISOString()
                };

                messages[roomId].push(msgObj);

                // Broadcast to all participants in this room
                io.to(roomId).emit(
                    "chat-message",
                    msgObj.data,
                    msgObj.sender,
                    msgObj.socketIdSender,
                    msgObj.timestamp
                );
            }
        });

        // Hand Raise Notification
        socket.on("raise-hand", (userData) => {
            const roomId = socketRoomMap[socket.id];
            if (roomId) {
                io.to(roomId).emit("user-raised-hand", {
                    socketId: socket.id,
                    username: (userData && userData.username) || socketUserMap[socket.id] || "Participant",
                    isRaised: userData ? userData.isRaised : false
                });
            }
        });

        // Emoji Reaction Broadcast
        socket.on("send-reaction", (data) => {
            const roomId = socketRoomMap[socket.id];
            if (roomId) {
                io.to(roomId).emit("reaction-received", {
                    socketId: socket.id,
                    username: (data && data.username) || socketUserMap[socket.id] || "Participant",
                    emoji: data ? data.emoji : "👍",
                    id: Date.now() + Math.random()
                });
            }
        });

        // Camera / Mic Toggle State Relay
        socket.on("toggle-media", (data) => {
            const roomId = socketRoomMap[socket.id];
            if (roomId) {
                socket.to(roomId).emit("user-toggle-media", {
                    socketId: socket.id,
                    mediaType: data?.mediaType, // 'video' | 'audio'
                    enabled: !!data?.enabled
                });
            }
        });

        // Disconnect Handler
        socket.on("disconnect", () => {
            const roomId = socketRoomMap[socket.id];
            const userName = socketUserMap[socket.id];
            console.log(`Socket disconnected: ${userName || socket.id} (${socket.id})`);

            if (roomId && connections[roomId]) {
                // Notify remaining participants
                connections[roomId] = connections[roomId].filter((id) => id !== socket.id);
                connections[roomId].forEach((peerId) => {
                    io.to(peerId).emit("user-left", socket.id, userName);
                });

                if (connections[roomId].length === 0) {
                    delete connections[roomId];
                    delete messages[roomId];
                }
            }

            delete socketRoomMap[socket.id];
            delete socketUserMap[socket.id];
        });
    });

    return io;
};

