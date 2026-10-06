import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { Snackbar, Alert, CircularProgress } from '@mui/material';

const defaultTheme = createTheme();

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const [formState, setFormState] = React.useState(0); // 0: Login, 1: Register
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async (e) => {
        if (e) e.preventDefault();

        if (formState === 0 && (!username.trim() || !password.trim())) {
            setError("Please fill in both username and password");
            return;
        }

        if (formState === 1 && (!name.trim() || !username.trim() || !password.trim())) {
            setError("Please fill in all fields (Full Name, Username, Password)");
            return;
        }

        try {
            setError("");
            setLoading(true);

            if (formState === 0) {
                await handleLogin(username.trim(), password);
            }
            if (formState === 1) {
                const result = await handleRegister(name.trim(), username.trim(), password);
                setUsername("");
                setPassword("");
                setName("");
                setMessage(result || "Registration successful! You can now log in.");
                setOpen(true);
                setError("");
                setFormState(0);
            }
        } catch (err) {
            console.error("Auth error:", err);
            let msg = err.response?.data?.message || err.message;
            if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
                msg = "Cannot connect to Backend Server. Please ensure your backend is running with 'npm start' on Port 8000.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };



    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {formState === 0 ? "Sign In to NEXAMEET" : "Create your Account"}
                        </Typography>

                        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                            <Button
                                variant={formState === 0 ? "contained" : "outlined"}
                                onClick={() => {
                                    setFormState(0);
                                    setError("");
                                }}
                                sx={{ textTransform: 'none', px: 3 }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={formState === 1 ? "contained" : "outlined"}
                                onClick={() => {
                                    setFormState(1);
                                    setError("");
                                }}
                                sx={{ textTransform: 'none', px: 3 }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        <Box component="form" onSubmit={handleAuth} noValidate sx={{ mt: 1, width: '100%', maxWidth: '400px' }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="fullName"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="loginUsername"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                value={password}
                                type="password"
                                id="loginPassword"
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 'bold', textTransform: 'none' }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    formState === 0 ? "Sign In" : "Register Account"
                                )}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
            >
                <Alert severity="success" onClose={() => setOpen(false)}>
                    {message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}