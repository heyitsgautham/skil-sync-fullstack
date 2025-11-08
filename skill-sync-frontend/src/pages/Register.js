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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import { Email, Lock, Person, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import FloatingParticles from '../components/FloatingParticles';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'student',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear messages when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = () => {
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.full_name.length < 2) {
            setError('Full name must be at least 2 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Don't send confirmPassword to backend
            const { confirmPassword, ...registrationData } = formData;
            const response = await authService.register(registrationData);

            const successMessage = response.message || 'Registration successful! Redirecting to login...';
            setSuccess(successMessage);
            toast.success(successMessage);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Registration failed');
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
                                Create Account
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                {success}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="full_name"
                                label="Full Name"
                                name="full_name"
                                autoComplete="name"
                                autoFocus
                                value={formData.full_name}
                                onChange={handleChange}
                                disabled={loading}
                                helperText="⚠️ Enter your full name EXACTLY as it appears on your resume"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: '#667eea' }} />
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
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
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
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                helperText="Must be at least 8 characters"
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
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
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
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                    },
                                }}
                            >
                                <InputLabel id="role-label">Role</InputLabel>
                                <Select
                                    labelId="role-label"
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    label="Role"
                                    onChange={handleChange}
                                    disabled={loading}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PersonAdd sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="company">Company</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
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
                                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign Up'}
                            </Button>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link to="/login" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#667eea',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Already have an account? Sign In
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

export default Register;
