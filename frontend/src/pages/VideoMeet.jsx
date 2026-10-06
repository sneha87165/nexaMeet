import React, { useEffect, useRef, useState, useContext } from 'react';
import { io } from "socket.io-client";
import { useParams, useNavigate } from 'react-router-dom';
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Snackbar,
    Alert,
    Tooltip,
    Avatar,
    Typography,
    Chip
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PanToolIcon from '@mui/icons-material/PanTool';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

import styles from "../style/videoComponent.module.css";
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext';

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ]
};

const QUICK_EMOJIS = ["👍", "❤️", "👏", "🎉", "😂", "🔥"];

export default function VideoMeet() {
    const { url: meetingUrl } = useParams();
    const navigate = useNavigate();
    const { userData } = useContext(AuthContext);

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const lobbyVideoRef = useRef(null);
    const connectionsRef = useRef({});
    const queuedCandidatesRef = useRef({});
    const localStreamRef = useRef(null);
    const chatEndRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(true);

    const [isHandRaised, setIsHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState({}); // socketId -> username
    const [reactions, setReactions] = useState([]); // [{ id, emoji, username }]

    const [showChat, setShowChat] = useState(false);
    const [showReactionsMenu, setShowReactionsMenu] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [unreadMessages, setUnreadMessages] = useState(0);

    const [inLobby, setInLobby] = useState(true);
    const [username, setUsername] = useState(() => {
        return userData?.name || userData?.username || localStorage.getItem("temp_username") || "";
    });

    const [remoteVideos, setRemoteVideos] = useState([]); // [{ socketId, stream, username }]
    const [participantNames, setParticipantNames] = useState({}); // socketId -> username
    const [participantCount, setParticipantCount] = useState(1);
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Initial check for media device permissions on mount
    useEffect(() => {
        initMediaStream();
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }

        return () => {
            cleanupMediaAndSockets();
        };
    }, []);

    // Ensure video stream attaches to the meeting video element whenever lobby state switches
    useEffect(() => {
        if (!inLobby && localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch((e) => console.log("Video play:", e));
        }
    }, [inLobby, videoEnabled]);

    // Auto-scroll chat to latest message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, showChat]);

    const initMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            localStreamRef.current = stream;

            if (lobbyVideoRef.current) {
                lobbyVideoRef.current.srcObject = stream;
            }
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setVideoAvailable(true);
            setAudioAvailable(true);
            setVideoEnabled(true);
            setAudioEnabled(true);
        } catch (err) {
            console.warn("Could not get both video and audio permissions:", err);
            try {
                const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true });
                localStreamRef.current = videoOnly;
                if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = videoOnly;
                if (localVideoRef.current) localVideoRef.current.srcObject = videoOnly;
                setVideoAvailable(true);
                setAudioAvailable(false);
            } catch (vErr) {
                setVideoAvailable(false);
            }

            try {
                const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!localStreamRef.current) localStreamRef.current = audioOnly;
                setAudioAvailable(true);
            } catch (aErr) {
                setAudioAvailable(false);
            }
        }
    };

    const cleanupMediaAndSockets = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        Object.keys(connectionsRef.current).forEach((peerId) => {
            try {
                connectionsRef.current[peerId].close();
            } catch (e) {
                console.error("Error closing peer:", e);
            }
        });
        connectionsRef.current = {};
        queuedCandidatesRef.current = {};

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };

    const handleJoinMeeting = async () => {
        const finalName = username.trim() || `User_${Math.floor(1000 + Math.random() * 9000)}`;
        setUsername(finalName);
        localStorage.setItem("temp_username", finalName);

        // If local stream is missing, try acquiring before joining
        if (!localStreamRef.current || localStreamRef.current.getTracks().length === 0) {
            await initMediaStream();
        }

        setInLobby(false);
        initializeSocketAndWebRTC(finalName);
    };

    const createPeerConnection = (peerId) => {
        const peerConnection = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[peerId] = peerConnection;
        queuedCandidatesRef.current[peerId] = [];

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('signal', peerId, JSON.stringify({ ice: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            const stream = event.streams[0];
            setRemoteVideos((prev) => {
                const exists = prev.find((v) => v.socketId === peerId);
                if (exists) {
                    return prev.map((v) => (v.socketId === peerId ? { ...v, stream } : v));
                }
                return [...prev, { socketId: peerId, stream }];
            });
        };

        // Add local tracks if available, otherwise transceivers for receiving remote media
        if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
            localStreamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        } else {
            try {
                peerConnection.addTransceiver('video', { direction: 'recvonly' });
                peerConnection.addTransceiver('audio', { direction: 'recvonly' });
            } catch (e) {
                console.warn("Transceiver fallback:", e);
            }
        }

        return peerConnection;
    };

    const initializeSocketAndWebRTC = (currentUserName) => {
        socketRef.current = io(server, { secure: false, transports: ["websocket", "polling"] });

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            const roomIdentifier = meetingUrl || window.location.pathname.replace("/", "");
            socketRef.current.emit('join-call', roomIdentifier, currentUserName);

            socketRef.current.on('signal', handleSignalFromServer);
            socketRef.current.on('chat-message', handleIncomingMessage);
            socketRef.current.on('user-raised-hand', handleHandRaisedEvent);
            socketRef.current.on('reaction-received', handleReactionReceived);

            socketRef.current.on('user-left', (peerSocketId, leftUserName) => {
                if (connectionsRef.current[peerSocketId]) {
                    connectionsRef.current[peerSocketId].close();
                    delete connectionsRef.current[peerSocketId];
                }
                delete queuedCandidatesRef.current[peerSocketId];

                setRemoteVideos((prev) => prev.filter((v) => v.socketId !== peerSocketId));
                setParticipantNames((prev) => {
                    const next = { ...prev };
                    delete next[peerSocketId];
                    return next;
                });
                setParticipantCount((prev) => Math.max(1, prev - 1));

                const name = leftUserName || "A participant";
                setSnackbarMsg(`${name} left the meeting`);
                setSnackbarOpen(true);
            });

            socketRef.current.on('user-joined', (newSocketId, allClients, participantDetails) => {
                setParticipantCount(allClients.length);

                if (participantDetails && Array.isArray(participantDetails)) {
                    const nameMap = {};
                    participantDetails.forEach((p) => {
                        nameMap[p.socketId] = p.username;
                    });
                    setParticipantNames(nameMap);
                }

                allClients.forEach((peerId) => {
                    if (peerId === socketIdRef.current) return;
                    if (!connectionsRef.current[peerId]) {
                        createPeerConnection(peerId);
                    }
                });

                // If we are the newly joined user, initiate offers to all existing peers
                if (newSocketId === socketIdRef.current) {
                    for (let peerId in connectionsRef.current) {
                        const peerConn = connectionsRef.current[peerId];
                        peerConn.createOffer().then((description) => {
                            return peerConn.setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', peerId, JSON.stringify({ sdp: peerConn.localDescription }));
                            });
                        }).catch(console.error);
                    }
                }
            });
        });
    };

    const handleSignalFromServer = async (fromId, signalData) => {
        try {
            const signal = JSON.parse(signalData);
            if (fromId === socketIdRef.current) return;

            let peerConn = connectionsRef.current[fromId];
            if (!peerConn) {
                peerConn = createPeerConnection(fromId);
            }

            if (signal.sdp) {
                await peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                // Process any queued ICE candidates for this peer
                if (queuedCandidatesRef.current[fromId] && queuedCandidatesRef.current[fromId].length > 0) {
                    while (queuedCandidatesRef.current[fromId].length > 0) {
                        const cand = queuedCandidatesRef.current[fromId].shift();
                        await peerConn.addIceCandidate(cand).catch((e) => console.warn("Buffered ICE error:", e));
                    }
                }

                if (signal.sdp.type === 'offer') {
                    const description = await peerConn.createAnswer();
                    await peerConn.setLocalDescription(description);
                    socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: peerConn.localDescription }));
                }
            }

            if (signal.ice) {
                const iceCandidate = new RTCIceCandidate(signal.ice);
                if (peerConn.remoteDescription && peerConn.remoteDescription.type) {
                    await peerConn.addIceCandidate(iceCandidate).catch((e) => console.warn("Add ICE error:", e));
                } else {
                    if (!queuedCandidatesRef.current[fromId]) {
                        queuedCandidatesRef.current[fromId] = [];
                    }
                    queuedCandidatesRef.current[fromId].push(iceCandidate);
                }
            }
        } catch (err) {
            console.error("Signaling error:", err);
        }
    };

    const handleIncomingMessage = (data, sender, senderSocketId, timestamp) => {
        setMessages((prev) => [
            ...prev,
            {
                data,
                sender,
                senderSocketId,
                timestamp: timestamp || new Date().toISOString()
            }
        ]);

        if (senderSocketId !== socketIdRef.current && !showChat) {
            setUnreadMessages((prev) => prev + 1);
        }
    };

    const handleHandRaisedEvent = (data) => {
        setRaisedHands((prev) => ({
            ...prev,
            [data.socketId]: data.isRaised ? data.username : false
        }));

        if (data.isRaised && data.socketId !== socketIdRef.current) {
            setSnackbarMsg(`✋ ${data.username} raised their hand`);
            setSnackbarOpen(true);
        }
    };

    const handleReactionReceived = (data) => {
        setReactions((prev) => [...prev, data]);
        setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== data.id));
        }, 3500);
    };

    const sendReaction = (emoji) => {
        if (!socketRef.current) return;
        socketRef.current.emit("send-reaction", { username, emoji });
        setShowReactionsMenu(false);
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleHandRaise = () => {
        const nextState = !isHandRaised;
        setIsHandRaised(nextState);
        if (socketRef.current) {
            socketRef.current.emit("raise-hand", { username, isRaised: nextState });
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                Object.values(connectionsRef.current).forEach((peerConn) => {
                    const sender = peerConn.getSenders().find((s) => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = () => {
                    revertToCameraTrack();
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error("Screen sharing error:", err);
            }
        } else {
            revertToCameraTrack();
        }
    };

    const revertToCameraTrack = async () => {
        setIsScreenSharing(false);
        if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(connectionsRef.current).forEach((peerConn) => {
                const sender = peerConn.getSenders().find((s) => s.track && s.track.kind === 'video');
                if (sender && camTrack) {
                    sender.replaceTrack(camTrack);
                }
            });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }
    };

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;
        socketRef.current.emit('chat-message', message.trim(), username);
        setMessage("");
    };

    const handleEndCall = () => {
        cleanupMediaAndSockets();
        navigate("/home");
    };

    const copyMeetingInfo = () => {
        const meetingCode = meetingUrl || window.location.pathname.replace("/", "");
        navigator.clipboard.writeText(window.location.href);
        setSnackbarMsg(`Meeting link copied! (Code: ${meetingCode})`);
        setSnackbarOpen(true);
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.meetContainerRoot}>
            {/* Floating Live Reactions */}
            <div className={styles.floatingReactionsContainer}>
                {reactions.map((r) => (
                    <div key={r.id} className={styles.floatingEmojiItem}>
                        <span className={styles.floatingEmojiText}>{r.emoji}</span>
                        <span className={styles.floatingEmojiUser}>{r.username}</span>
                    </div>
                ))}
            </div>

            {inLobby ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyCard}>
                        <Typography variant="h4" sx={{ fontWeight: '800', mb: 0.5, color: '#f8fafc', letterSpacing: "-0.5px" }}>
                            Join Video Meeting
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                            Room ID: <strong style={{ color: "#38bdf8" }}>{meetingUrl}</strong>
                        </Typography>

                        <div className={styles.lobbyVideoPreviewWrapper}>
                            <video
                                ref={(el) => {
                                    lobbyVideoRef.current = el;
                                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                        el.srcObject = localStreamRef.current;
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                                className={styles.lobbyVideoPreview}
                            />
                            {!videoEnabled && (
                                <div className={styles.videoOffOverlay}>
                                    <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: '#2563eb', fontWeight: 'bold' }}>
                                        {username ? username[0].toUpperCase() : 'U'}
                                    </Avatar>
                                </div>
                            )}
                        </div>

                        <div className={styles.lobbyControls}>
                            <Tooltip title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}>
                                <IconButton
                                    onClick={toggleAudio}
                                    sx={{
                                        bgcolor: audioEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        '&:hover': { bgcolor: audioEnabled ? 'rgba(255,255,255,0.2)' : '#dc2626' }
                                    }}
                                >
                                    {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}>
                                <IconButton
                                    onClick={toggleVideo}
                                    sx={{
                                        bgcolor: videoEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        '&:hover': { bgcolor: videoEnabled ? 'rgba(255,255,255,0.2)' : '#dc2626' }
                                    }}
                                >
                                    {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Tooltip>
                        </div>

                        <div style={{ marginTop: '24px', width: '100%', maxWidth: '360px' }}>
                            <TextField
                                fullWidth
                                label="Your Name"
                                variant="outlined"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&:hover fieldset': { borderColor: '#38bdf8' }
                                    },
                                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                                }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleJoinMeeting}
                                sx={{
                                    py: 1.5,
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                Join Meeting
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Top Bar with Room Info & Clean Action Buttons */}
                    <div className={styles.topBar}>
                        <div className={styles.roomBadge}>
                            <Typography variant="subtitle1" sx={{ fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: "#38bdf8" }}>NEXAMEET</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                                <span>Room: {meetingUrl}</span>
                            </Typography>
                            <Chip
                                icon={<PeopleIcon style={{ color: '#38bdf8' }} />}
                                label={`${participantCount} Online`}
                                size="small"
                                sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', ml: 2, fontWeight: '600' }}
                            />
                        </div>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={copyMeetingInfo}
                            sx={{
                                color: '#e2e8f0',
                                borderColor: 'rgba(255,255,255,0.2)',
                                textTransform: 'none',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                '&:hover': { borderColor: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }
                            }}
                        >
                            Copy Link
                        </Button>
                    </div>

                    {/* Main Video Grid */}
                    <div className={styles.conferenceGrid}>
                        {/* Local User Tile */}
                        <div className={styles.videoTile}>
                            <video
                                ref={(el) => {
                                    localVideoRef.current = el;
                                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                        el.srcObject = localStreamRef.current;
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                                className={styles.localVideoElement}
                            />
                            {!videoEnabled && (
                                <div className={styles.avatarPlaceholder}>
                                    <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: '#2563eb', fontWeight: 'bold' }}>
                                        {username ? username[0].toUpperCase() : 'Me'}
                                    </Avatar>
                                </div>
                            )}
                            <div className={styles.participantNameBadge}>
                                <span>{username} (You)</span>
                                {isHandRaised && <span className={styles.handBadge}>✋ Hand Raised</span>}
                            </div>
                        </div>

                        {/* Remote Participants Tiles */}
                        {remoteVideos.map((video) => {
                            const peerHandRaised = raisedHands[video.socketId];
                            const peerName = participantNames[video.socketId] || `Participant (${video.socketId.slice(0, 4)})`;
                            return (
                                <div key={video.socketId} className={styles.videoTile}>
                                    <video
                                        ref={(el) => {
                                            if (el && video.stream && el.srcObject !== video.stream) {
                                                el.srcObject = video.stream;
                                                el.play().catch((e) => console.log("Remote play error:", e));
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className={styles.videoElement}
                                    />
                                    <div className={styles.participantNameBadge}>
                                        <span>{peerName}</span>
                                        {peerHandRaised && <span className={styles.handBadge}>✋ Hand Raised</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* In-Meeting Chat Drawer / Side Panel */}
                    {showChat && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatHeader}>
                                <div>
                                    <Typography variant="h6" sx={{ fontWeight: '800', color: '#f8fafc', fontSize: '1.05rem' }}>
                                        In-Call Messages
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        Visible only to people in this meeting
                                    </Typography>
                                </div>
                                <IconButton size="small" onClick={() => setShowChat(false)} sx={{ color: '#94a3b8' }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            {/* Quick Emoji Bar inside Chat */}
                            <div className={styles.chatEmojiBar}>
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        className={styles.quickEmojiBtn}
                                        onClick={() => sendReaction(emoji)}
                                        title={`React with ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>

                            {/* Chat History Messages */}
                            <div className={styles.chattingDisplay}>
                                {messages.length > 0 ? (
                                    messages.map((item, index) => {
                                        const isMe = item.senderSocketId === socketIdRef.current;
                                        return (
                                            <div
                                                key={index}
                                                className={`${styles.messageBubble} ${isMe ? styles.myMessage : styles.theirMessage}`}
                                            >
                                                <div className={styles.messageMeta}>
                                                    <strong>{isMe ? 'You' : item.sender}</strong>
                                                    <small>{formatTime(item.timestamp)}</small>
                                                </div>
                                                <p className={styles.messageText}>{item.data}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.emptyChat}>
                                        <ChatIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', mb: 1 }} />
                                        <p>No messages yet.<br />Send a message to everyone in this call!</p>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Field */}
                            <div className={styles.chattingArea}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#ffffff',
                                            backgroundColor: 'rgba(255,255,255,0.06)',
                                            borderRadius: '20px',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                                            '&:hover fieldset': { borderColor: '#38bdf8' }
                                        }
                                    }}
                                />
                                <IconButton
                                    onClick={sendMessage}
                                    sx={{
                                        ml: 1,
                                        bgcolor: '#2563eb',
                                        color: 'white',
                                        '&:hover': { bgcolor: '#1d4ed8' }
                                    }}
                                >
                                    <SendIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
                    )}

                    {/* Bottom Floating Control Bar */}
                    <div className={styles.bottomControlBar}>
                        <Tooltip title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}>
                            <IconButton
                                onClick={toggleAudio}
                                sx={{
                                    bgcolor: audioEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                                    color: 'white',
                                    m: 0.5,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: audioEnabled ? 'rgba(255,255,255,0.2)' : '#dc2626' }
                                }}
                            >
                                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}>
                            <IconButton
                                onClick={toggleVideo}
                                sx={{
                                    bgcolor: videoEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                                    color: 'white',
                                    m: 0.5,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: videoEnabled ? 'rgba(255,255,255,0.2)' : '#dc2626' }
                                }}
                            >
                                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}>
                                <IconButton
                                    onClick={toggleScreenShare}
                                    sx={{
                                        bgcolor: isScreenSharing ? '#10b981' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        m: 0.5,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        '&:hover': { bgcolor: isScreenSharing ? '#059669' : 'rgba(255,255,255,0.2)' }
                                    }}
                                >
                                    {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title={isHandRaised ? "Lower Hand" : "Raise Hand (✋)"}>
                            <IconButton
                                onClick={toggleHandRaise}
                                sx={{
                                    bgcolor: isHandRaised ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    m: 0.5,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: isHandRaised ? '#d97706' : 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <PanToolIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Emoji Reaction Picker Bar */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2px 6px', margin: '0 4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {QUICK_EMOJIS.map((emoji) => (
                                <Tooltip key={emoji} title={`React ${emoji}`}>
                                    <button
                                        onClick={() => sendReaction(emoji)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '1.25rem',
                                            cursor: 'pointer',
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            transition: 'transform 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {emoji}
                                    </button>
                                </Tooltip>
                            ))}
                        </div>

                        <Tooltip title="In-Call Chat">
                            <Badge badgeContent={unreadMessages} color="primary">
                                <IconButton
                                    onClick={() => {
                                        setShowChat(!showChat);
                                        setUnreadMessages(0);
                                    }}
                                    sx={{
                                        bgcolor: showChat ? '#2563eb' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        m: 0.5,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        '&:hover': { bgcolor: showChat ? '#1d4ed8' : 'rgba(255,255,255,0.2)' }
                                    }}
                                >
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        <Tooltip title="Leave Meeting">
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<CallEndIcon />}
                                onClick={handleEndCall}
                                sx={{
                                    borderRadius: '24px',
                                    px: 3,
                                    ml: 1.5,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                Leave
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ bgcolor: '#1e293b', color: '#ffffff', border: '1px solid #38bdf8' }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </div>
    );
}
