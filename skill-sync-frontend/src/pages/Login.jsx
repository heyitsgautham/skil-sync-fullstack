import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import { Email, Lock } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import FloatingParticles from '../components/FloatingParticles';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(formData.email, formData.password);
            toast.success('Login successful! Welcome back.');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <FloatingParticles />
            <Container component="main" maxWidth="xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut"
                    }}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <Paper
                        elevation={24}
                        sx={{
                            padding: 5,
                            width: '100%',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Box
                                sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                }}
                            >
                                <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
                                    S
                                </Typography>
                            </Box>
                            <Typography
                                component="h1"
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                }}
                            >
                                SkillSync
                            </Typography>
                            <Typography
                                component="h2"
                                variant="h6"
                                sx={{ color: '#666', fontWeight: 600 }}
                            >
                                Welcome Back
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                    },
                                }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    mt: 4,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
                            </Button>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#667eea',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Don't have an account? Sign Up
                                    </Typography>
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default Login;
