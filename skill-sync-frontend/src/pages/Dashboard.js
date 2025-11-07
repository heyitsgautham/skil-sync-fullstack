import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    AccountCircle as AccountCircleIcon,
    Upload as UploadIcon,
    Work as WorkIcon,
    AutoAwesome as AIIcon,
    Business as BusinessIcon,
    PostAdd as PostAddIcon,
    People as PeopleIcon,
    AdminPanelSettings as AdminIcon,
    Analytics as AnalyticsIcon,
    ManageAccounts as ManageAccountsIcon,
    Refresh as RefreshIcon,
    DeleteForever as DeleteIcon,
    CloudUpload as ReindexIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import Layout from '../components/Layout';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const role = user?.role?.toLowerCase();

    // State for recompute embeddings
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [recomputeResult, setRecomputeResult] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // State for ChromaDB management
    const [isClearingChroma, setIsClearingChroma] = useState(false);
    const [isReindexing, setIsReindexing] = useState(false);
    const [clearChromaDialog, setClearChromaDialog] = useState(false);
    const [reindexDialog, setReindexDialog] = useState(false);
    const [systemStatus, setSystemStatus] = useState(null);

    // Handler for recomputing embeddings
    const handleRecomputeEmbeddings = async () => {
        setIsRecomputing(true);
        setRecomputeResult(null);

        try {
            const response = await fetch('http://localhost:8000/api/admin/recompute-embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to recompute embeddings');
            }

            const data = await response.json();
            setRecomputeResult(data);
            setSnackbar({
                open: true,
                message: `Successfully recomputed embeddings! ${data.resumes.recomputed + data.internships.recomputed} new embeddings generated.`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Error recomputing embeddings:', error);
            setSnackbar({
                open: true,
                message: 'Failed to recompute embeddings. Please try again.',
                severity: 'error',
            });
        } finally {
            setIsRecomputing(false);
        }
    };

    // Handler for clearing ChromaDB
    const handleClearChromaDB = async () => {
        setClearChromaDialog(false);
        setIsClearingChroma(true);

        try {
            const response = await fetch('http://localhost:8000/api/admin/clear-chromadb', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to clear ChromaDB');
            }

            const data = await response.json();
            setSnackbar({
                open: true,
                message: `Successfully cleared ChromaDB! ${data.resumes_cleared} embeddings and ${data.matches_cleared} matches deleted.`,
                severity: 'success',
            });

            // Refresh system status
            fetchSystemStatus();
        } catch (error) {
            console.error('Error clearing ChromaDB:', error);
            setSnackbar({
                open: true,
                message: 'Failed to clear ChromaDB. Please try again.',
                severity: 'error',
            });
        } finally {
            setIsClearingChroma(false);
        }
    };

    // Handler for reindexing all students
    const handleReindexAllStudents = async () => {
        setReindexDialog(false);
        setIsReindexing(true);

        try {
            const response = await fetch('http://localhost:8000/api/admin/reindex-all-students', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to start reindexing');
            }

            const data = await response.json();
            setSnackbar({
                open: true,
                message: `Started reindexing ${data.total_files} student resumes. This will take 2-5 minutes. Check back soon!`,
                severity: 'info',
            });

            // Poll system status after 30 seconds
            setTimeout(() => {
                fetchSystemStatus();
                setIsReindexing(false);
                setSnackbar({
                    open: true,
                    message: 'Reindexing completed! System status updated.',
                    severity: 'success',
                });
            }, 30000);
        } catch (error) {
            console.error('Error starting reindex:', error);
            setSnackbar({
                open: true,
                message: 'Failed to start reindexing. Please try again.',
                severity: 'error',
            });
            setIsReindexing(false);
        }
    };

    // Fetch system status
    const fetchSystemStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/system-status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch system status');
            }

            const data = await response.json();
            setSystemStatus(data);
        } catch (error) {
            console.error('Error fetching system status:', error);
        }
    };

    // Fetch system status on mount (only for admin)
    React.useEffect(() => {
        if (role === 'admin') {
            fetchSystemStatus();
        }
    }, [role]);

    // Role-specific dashboard content
    const renderStudentDashboard = () => {
        const cardVariants = {
            hidden: { opacity: 0, y: 50 },
            visible: (i) => ({
                opacity: 1,
                y: 0,
                transition: {
                    delay: i * 0.15,
                    duration: 0.5,
                    ease: "easeOut"
                }
            })
        };

        return (
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div
                        custom={0}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        style={{ height: '100%' }}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                                }
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0.2
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 3,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 3,
                                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                                        }}
                                    >
                                        <UploadIcon sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>
                                </motion.div>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                                    Resume Management
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                    Upload and manage your resume for better internship matching powered by AI.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => navigate('/upload-resume')}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                        },
                                    }}
                                >
                                    Manage Resume
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        style={{ height: '100%' }}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                                }
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
                                    }}
                                >
                                    <AIIcon sx={{ fontSize: 32, color: 'white' }} />
                                </Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                                    AI Recommendations
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                    Get personalized internship recommendations based on your skills and resume.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => navigate('/recommendations')}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 16px rgba(240, 147, 251, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
                                        },
                                    }}
                                >
                                    View Recommendations
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        );
    };

    const renderCompanyDashboard = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
                            }}
                        >
                            <PostAddIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Post Internship
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            Create and publish new internship opportunities for talented students.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/internships/create')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(67, 233, 123, 0.4)',
                                },
                            }}
                        >
                            Post New Internship
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
                            }}
                        >
                            <WorkIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Manage Listings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            View, edit, and manage your posted internship listings with ease.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/internships')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(79, 172, 254, 0.4)',
                                },
                            }}
                        >
                            View My Internships
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(250, 112, 154, 0.3)',
                            }}
                        >
                            <PeopleIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            AI Candidate Ranking
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            Rank candidates using intelligent AI-powered matching for your internships.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/intelligent-ranking')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(250, 112, 154, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(250, 112, 154, 0.4)',
                                },
                            }}
                        >
                            Rank Candidates
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderAdminDashboard = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                            }}
                        >
                            <ManageAccountsIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            User Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            Manage students, companies, and other admin accounts in the system.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/admin/users')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                },
                            }}
                        >
                            Manage Users
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(17, 153, 142, 0.3)',
                            }}
                        >
                            <WorkIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Internship Oversight
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            Monitor and manage all internship listings and applications platform-wide.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/internships')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(17, 153, 142, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(17, 153, 142, 0.4)',
                                },
                            }}
                        >
                            View All Internships
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
                            }}
                        >
                            <AnalyticsIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Analytics Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                            View system statistics, match rates, and engagement metrics.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/admin/analytics')}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(240, 147, 251, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
                                },
                            }}
                        >
                            View Analytics
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
                            }}
                        >
                            <RefreshIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            AI Embeddings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Recompute embeddings for resumes, internships, and candidate rankings with intelligent caching.
                        </Typography>

                        {recomputeResult && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                                    Resumes: {recomputeResult.resumes.cached} cached, {recomputeResult.resumes.recomputed} recomputed
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                                    Internships: {recomputeResult.internships.cached} cached, {recomputeResult.internships.recomputed} recomputed
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                    Matches: {recomputeResult.matches.recalculated} recalculated
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleRecomputeEmbeddings}
                            disabled={isRecomputing}
                            startIcon={isRecomputing ? <CircularProgress size={20} /> : <RefreshIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isRecomputing
                                    ? 'linear-gradient(135deg, #a8b8c8 0%, #b0c0d0 100%)'
                                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
                                '&:hover': {
                                    transform: isRecomputing ? 'none' : 'translateY(-2px)',
                                    boxShadow: isRecomputing
                                        ? '0 4px 16px rgba(79, 172, 254, 0.3)'
                                        : '0 8px 24px rgba(79, 172, 254, 0.4)',
                                },
                            }}
                        >
                            {isRecomputing ? 'Processing...' : 'Recompute Embeddings'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Clear ChromaDB Card */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Clear Embeddings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Delete all student resume embeddings and match data from ChromaDB. This action is permanent!
                        </Typography>

                        {/* {systemStatus && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 2, border: '1px solid #fee' }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5, color: '#c53030' }}>
                                    📊 Current Status
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                    Total Resumes: {systemStatus.resumes?.total || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                    With Embeddings: {systemStatus.resumes?.with_embeddings || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    Total Matches: {systemStatus.matches?.total || 0}
                                </Typography>
                            </Box>  
                        )} */}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setClearChromaDialog(true)}
                            disabled={isClearingChroma}
                            startIcon={isClearingChroma ? <CircularProgress size={20} /> : <DeleteIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isClearingChroma
                                    ? 'linear-gradient(135deg, #d0a0a0 0%, #d8a8a8 100%)'
                                    : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                                '&:hover': {
                                    transform: isClearingChroma ? 'none' : 'translateY(-2px)',
                                    boxShadow: isClearingChroma
                                        ? '0 4px 16px rgba(255, 107, 107, 0.3)'
                                        : '0 8px 24px rgba(255, 107, 107, 0.4)',
                                },
                            }}
                        >
                            {isClearingChroma ? 'Clearing...' : 'Clear ChromaDB'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Reindex All Students Card */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(255, 167, 38, 0.3)',
                            }}
                        >
                            <ReindexIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Re-index All Students
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Bulk re-upload and re-process all 50 student resumes from scratch. Takes 2-5 minutes.
                        </Typography>

                        {isReindexing && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffecb3' }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#f57c00' }}>
                                    ⏳ Reindexing in progress...
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    This may take 2-5 minutes. The page will update automatically.
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setReindexDialog(true)}
                            disabled={isReindexing}
                            startIcon={isReindexing ? <CircularProgress size={20} /> : <ReindexIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isReindexing
                                    ? 'linear-gradient(135deg, #d8b896 0%, #e0c09e 100%)'
                                    : 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(255, 167, 38, 0.3)',
                                '&:hover': {
                                    transform: isReindexing ? 'none' : 'translateY(-2px)',
                                    boxShadow: isReindexing
                                        ? '0 4px 16px rgba(255, 167, 38, 0.3)'
                                        : '0 8px 24px rgba(255, 167, 38, 0.4)',
                                },
                            }}
                        >
                            {isReindexing ? 'Reindexing...' : 'Re-index Resumes'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const getRoleIcon = () => {
        switch (role) {
            case 'student':
                return <AccountCircleIcon sx={{ fontSize: 60, mr: 2, color: 'primary.main' }} />;
            case 'company':
                return <BusinessIcon sx={{ fontSize: 60, mr: 2, color: 'primary.main' }} />;
            case 'admin':
                return <AdminIcon sx={{ fontSize: 60, mr: 2, color: 'primary.main' }} />;
            default:
                return <AccountCircleIcon sx={{ fontSize: 60, mr: 2, color: 'primary.main' }} />;
        }
    };

    const getRoleColor = () => {
        switch (role) {
            case 'student':
                return 'primary';
            case 'company':
                return 'success';
            case 'admin':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Layout>
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #d32f2f 0%, #d32f2fdd 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 3,
                                boxShadow: '0 8px 24px rgba(211, 47, 47, 0.3)',
                            }}
                        >
                            {React.cloneElement(getRoleIcon(), {
                                sx: { fontSize: 48, color: 'white', m: 0 }
                            })} 
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: '#1a1a1a',
                                    mb: 1,
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                Welcome back, {user?.full_name || 'User'}!
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#666666ff',
                                    mb: 1.5,
                                    fontWeight: 500,
                                }}
                            >
                                {user?.email || 'N/A'}
                            </Typography>
                            <Chip
                                label={user?.role || 'N/A'}
                                sx={{
                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                    color: '#667eea',
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                    px: 2,
                                    py: 0.5,
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {role === 'student' && renderStudentDashboard()}
                {role === 'company' && renderCompanyDashboard()}
                {role === 'admin' && renderAdminDashboard()}

                {!['student', 'company', 'admin'].includes(role) && (
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">
                            Invalid role detected. Please contact support.
                        </Typography>
                    </Paper>
                )}
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Clear ChromaDB Confirmation Dialog */}
            <Dialog
                open={clearChromaDialog}
                onClose={() => setClearChromaDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#c53030' }}>
                    <WarningIcon />
                    Clear All ChromaDB Embeddings
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        <strong>⚠️ WARNING:</strong> This will permanently DELETE:
                    </DialogContentText>
                    <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                        <li>All student resume embeddings from ChromaDB</li>
                        <li>All student-internship match data</li>
                        <li>All embedding IDs from the database</li>
                    </Box>
                    <DialogContentText sx={{ mt: 2, color: 'error.main', fontWeight: 600 }}>
                        This action cannot be undone. Are you absolutely sure?
                    </DialogContentText>
                    {systemStatus && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Items to be deleted:
                            </Typography>
                            <Typography variant="body2">
                                • {systemStatus.resumes?.with_embeddings || 0} resume embeddings
                            </Typography>
                            <Typography variant="body2">
                                • {systemStatus.matches?.total || 0} student-internship matches
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setClearChromaDialog(false)}
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClearChromaDB}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        Yes, Delete Everything
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reindex All Students Confirmation Dialog */}
            <Dialog
                open={reindexDialog}
                onClose={() => setReindexDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f57c00' }}>
                    <ReindexIcon />
                    Re-index All 50 Student Resumes
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        This will re-process all student resumes from scratch:
                    </DialogContentText>
                    <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                        <li>Extract text from all resume files in <code>app/public/resumes/</code></li>
                        <li>Parse each resume using Gemini AI (consumes API credits)</li>
                        <li>Generate new embeddings using HuggingFace</li>
                        <li>Update PostgreSQL database and ChromaDB</li>
                        <li>Recalculate all student-internship matches</li>
                    </Box>
                    <DialogContentText sx={{ mt: 2 }}>
                        <strong>Estimated time:</strong> 2-5 minutes for 50 resumes
                    </DialogContentText>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        This is a background task. You can continue using the dashboard while it runs.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setReindexDialog(false)}
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReindexAllStudents}
                        variant="contained"
                        color="warning"
                        startIcon={<ReindexIcon />}
                        sx={{
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                        }}
                    >
                        Start Re-indexing
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default Dashboard;
