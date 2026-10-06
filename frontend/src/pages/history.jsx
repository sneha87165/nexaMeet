import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    Box,
    Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const history = await getHistoryOfUser();
                setMeetings(history || []);
            } catch (err) {
                setSnackbarMsg("Failed to load meeting history");
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setSnackbarMsg(`Copied "${code}" to clipboard!`);
        setSnackbarOpen(true);
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <IconButton
                        onClick={() => navigate("/home")}
                        sx={{ backgroundColor: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
                    >
                        <HomeIcon color="primary" />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0f172a" }}>
                        Meeting History
                    </Typography>
                </div>
            </div>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : meetings.length > 0 ? (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px"
                }}>
                    {meetings.map((item, index) => (
                        <Card
                            key={index}
                            sx={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                border: "1px solid #e2e8f0",
                                transition: "transform 0.2s, box-shadow 0.2s",
                                '&:hover': {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
                                }
                            }}
                        >
                            <CardContent>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <Chip
                                        label={item.meetingCode}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                                    />
                                    <IconButton size="small" onClick={() => copyCode(item.meetingCode)} title="Copy Code">
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </div>

                                <Typography variant="body2" sx={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <CalendarTodayIcon fontSize="inherit" />
                                    {formatDate(item.date)}
                                </Typography>
                            </CardContent>

                            <CardActions sx={{ px: 2, pb: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    startIcon={<VideoCallIcon />}
                                    onClick={() => navigate(`/${item.meetingCode}`)}
                                    sx={{ borderRadius: "8px", textTransform: "none" }}
                                >
                                    Re-join Meeting
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </div>
            ) : (
                <Box sx={{ textAlign: "center", py: 8, color: "#94a3b8" }}>
                    <Typography variant="h6">No meeting history yet.</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Create or join a meeting to see your past call sessions here.
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 3, textTransform: "none" }}
                        onClick={() => navigate("/home")}
                    >
                        Go to Home
                    </Button>
                </Box>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity="info" onClose={() => setSnackbarOpen(false)}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </div>
    );
}