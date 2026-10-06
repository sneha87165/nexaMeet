import React, { useContext, useState, useEffect } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    IconButton,
    TextField,
    Typography,
    Snackbar,
    Alert,
    Avatar,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import SecurityIcon from '@mui/icons-material/Security';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ScreenShareOutlinedIcon from '@mui/icons-material/ScreenShareOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");

    const { addToUserHistory, userData, logout } = useContext(AuthContext);

    // Real-time digital clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const generateRandomRoom = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        return `${segment(3)}-${segment(4)}-${segment(3)}`;
    };

    const handleCreateInstantMeeting = async () => {
        const randomCode = generateRandomRoom();
        try {
            await addToUserHistory(randomCode);
        } catch (e) {
            console.warn("Could not record meeting history:", e);
        }
        navigate(`/${randomCode}`);
    };

    const handleOpenShareModal = () => {
        const code = generateRandomRoom();
        const fullLink = `${window.location.origin}/${code}`;
        setGeneratedLink(fullLink);
        setShareModalOpen(true);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setSnackbarMsg("Meeting link copied to clipboard!");
        setSnackbarOpen(true);
    };

    const handleJoinVideoCall = async () => {
        const trimmed = meetingCode.trim().replace(/^https?:\/\/[^\/]+\//, ''); // Clean if pasted full link
        if (!trimmed) {
            setSnackbarMsg("Please enter a valid meeting code or link");
            setSnackbarOpen(true);
            return;
        }

        try {
            await addToUserHistory(trimmed);
        } catch (e) {
            console.warn("Could not record meeting history:", e);
        }
        navigate(`/${trimmed}`);
    };

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#070b14",
            backgroundImage: "radial-gradient(circle at 20% 15%, rgba(37, 99, 235, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.12) 0%, transparent 50%)",
            color: "#ffffff",
            fontFamily: "'Inter', 'Roboto', sans-serif"
        }}>
            {/* Top Navigation Bar */}
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 40px",
                background: "rgba(11, 17, 32, 0.8)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                position: "sticky",
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 20px rgba(37, 99, 235, 0.5)"
                    }}>
                        <VideoCallIcon sx={{ color: "white", fontSize: 24 }} />
                    </div>
                    <Typography variant="h5" sx={{
                        fontWeight: "800",
                        letterSpacing: "-0.5px",
                        background: "linear-gradient(to right, #ffffff, #93c5fd)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        NEXAMEET
                    </Typography>
                </div>

                {/* Center Live Clock */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255, 255, 255, 0.04)",
                    padding: "6px 18px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: "#60a5fa" }} />
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#f1f5f9" }}>{formattedTime}</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.3)", margin: "0 4px" }}>•</span>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{formattedDate}</span>
                </div>

                {/* User & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Button
                        startIcon={<RestoreIcon />}
                        variant="text"
                        onClick={() => navigate("/history")}
                        sx={{
                            color: "#cbd5e1",
                            textTransform: "none",
                            borderRadius: "10px",
                            padding: "8px 16px",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            '&:hover': { background: "rgba(255, 255, 255, 0.08)", color: "#ffffff" }
                        }}
                    >
                        History
                    </Button>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "10px", borderLeft: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "#3b82f6", fontWeight: "bold" }}>
                            {userData?.name ? userData.name[0].toUpperCase() : (userData?.username ? userData.username[0].toUpperCase() : 'U')}
                        </Avatar>
                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#e2e8f0" }}>
                            {userData?.name || userData?.username || "User"}
                        </span>
                    </div>

                    <IconButton
                        size="small"
                        onClick={logout}
                        title="Logout"
                        sx={{
                            color: "#f87171",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            '&:hover': { background: "rgba(239, 68, 68, 0.2)" }
                        }}
                    >
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </div>
            </header>

            {/* Main Hero & Action Grid */}
            <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "50px 30px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" }}>
                    {/* Left Column: Hero & Actions */}
                    <div>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(37, 99, 235, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "30px",
                            padding: "6px 16px",
                            marginBottom: "24px"
                        }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                            <span style={{ fontSize: "0.85rem", color: "#93c5fd", fontWeight: "600" }}>Encrypted & Ultra Low Latency</span>
                        </div>

                        <h1 style={{
                            fontSize: "3.2rem",
                            fontWeight: "800",
                            lineHeight: "1.15",
                            letterSpacing: "-1px",
                            marginBottom: "16px",
                            background: "linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            Next-Generation Video Calls & Seamless Collaboration.
                        </h1>

                        <p style={{ fontSize: "1.15rem", color: "#94a3b8", lineHeight: "1.6", marginBottom: "36px", maxWidth: "540px" }}>
                            Host crystal-clear video meetings, share screens, chat in real-time, and react with emojis — right from your web browser.
                        </p>

                        {/* Action Cards Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                            {/* Card 1: Start Instant Meeting */}
                            <div
                                onClick={handleCreateInstantMeeting}
                                style={{
                                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                    borderRadius: "16px",
                                    padding: "24px",
                                    cursor: "pointer",
                                    boxShadow: "0 10px 30px rgba(37, 99, 235, 0.35)",
                                    transition: "all 0.25s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "150px"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <VideoCallIcon sx={{ color: "white", fontSize: 26 }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem", fontWeight: "700" }}>Instant Meeting</h3>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.8)" }}>Start a new call immediately</p>
                                </div>
                            </div>

                            {/* Card 2: Create Shareable Link */}
                            <div
                                onClick={handleOpenShareModal}
                                style={{
                                    background: "rgba(30, 41, 59, 0.6)",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    borderRadius: "16px",
                                    padding: "24px",
                                    cursor: "pointer",
                                    backdropFilter: "blur(12px)",
                                    transition: "all 0.25s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "150px"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.borderColor = "#60a5fa";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                                }}
                            >
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "rgba(59, 130, 246, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <LinkIcon sx={{ color: "#60a5fa", fontSize: 24 }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem", fontWeight: "700", color: "#f8fafc" }}>Get Link to Share</h3>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>Plan & invite others</p>
                                </div>
                            </div>
                        </div>

                        {/* Join with Code Box */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.7)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "16px",
                            padding: "16px 20px",
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
                        }}>
                            <MeetingRoomIcon sx={{ color: "#94a3b8" }} />
                            <TextField
                                fullWidth
                                variant="standard"
                                placeholder="Enter meeting code or link..."
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                                InputProps={{
                                    disableUnderline: true,
                                    style: { color: "#ffffff", fontSize: "1rem" }
                                }}
                            />
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={handleJoinVideoCall}
                                sx={{
                                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                                    borderRadius: "10px",
                                    px: 3,
                                    py: 1,
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)"
                                }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Interactive Visual Showcase */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <div style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: "480px",
                            background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
                            borderRadius: "24px",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            padding: "28px",
                            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(20px)"
                        }}>
                            {/* Graphic Mockup Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eab308" }} />
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }} />
                                </div>
                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>Live Conference Preview</span>
                            </div>

                            {/* Meeting Room Image Banner */}
                            <div style={{
                                width: "100%",
                                height: "220px",
                                borderRadius: "16px",
                                overflow: "hidden",
                                background: "#020617",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "24px",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                position: "relative"
                            }}>
                                <img
                                    src="/logo3.png"
                                    alt="NEXAMEET Conference Illustration"
                                    style={{ width: "80%", height: "auto", objectFit: "contain" }}
                                />
                                <div style={{
                                    position: "absolute",
                                    bottom: "12px",
                                    left: "12px",
                                    background: "rgba(0, 0, 0, 0.75)",
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                    fontSize: "0.75rem",
                                    color: "#38bdf8",
                                    border: "1px solid rgba(56, 189, 248, 0.3)"
                                }}>
                                    🎥 Ultra HD 1080p Stream
                                </div>
                            </div>

                            {/* Feature Grid Mini Badges */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}>
                                    <ChatBubbleOutlineIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                                    <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f1f5f9" }}>In-Call Chat</div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Live text & emojis</div>
                                    </div>
                                </div>

                                <div style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}>
                                    <ScreenShareOutlinedIcon sx={{ color: "#a855f7", fontSize: 20 }} />
                                    <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f1f5f9" }}>Screen Share</div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Tabs & Windows</div>
                                    </div>
                                </div>

                                <div style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}>
                                    <GroupsOutlinedIcon sx={{ color: "#34d399", fontSize: 20 }} />
                                    <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f1f5f9" }}>Multi-User</div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Group rooms</div>
                                    </div>
                                </div>

                                <div style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}>
                                    <SecurityIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                                    <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f1f5f9" }}>Protected</div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>JWT & WebRTC</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Shareable Link Modal */}
            <Dialog
                open={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                PaperProps={{
                    style: {
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "8px",
                        minWidth: "380px"
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    Here's your meeting link
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
                        Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
                    </Typography>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(255, 255, 255, 0.06)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>
                        <span style={{ fontSize: "0.9rem", color: "#93c5fd", wordBreak: "break-all" }}>{generatedLink}</span>
                        <IconButton size="small" onClick={handleCopyLink} title="Copy Link">
                            <ContentCopyIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                        </IconButton>
                    </div>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShareModalOpen(false)} sx={{ color: "#94a3b8" }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShareModalOpen(false);
                            navigate(`/${generatedLink.split("/").pop()}`);
                        }}
                        sx={{ background: "#2563eb", borderRadius: "8px" }}
                    >
                        Join Now
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="info" onClose={() => setSnackbarOpen(false)} sx={{ bgcolor: "#1e293b", color: "#ffffff", border: "1px solid #3b82f6" }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default withAuth(HomeComponent);
