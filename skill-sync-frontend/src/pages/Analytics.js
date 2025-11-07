import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Analytics as AnalyticsIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Work as WorkIcon,
    Description as DescriptionIcon,
    TrendingUp as TrendingUpIcon,
    AutoAwesome as AIIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalCompanies: 0,
        totalAdmins: 0,
        totalInternships: 0,
        totalResumes: 0,
        activeInternships: 0,
        averageMatchScore: 0,
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch real analytics data from the backend
            const response = await api.get('/auth/analytics');

            setStats({
                totalUsers: response.data.total_users,
                totalStudents: response.data.total_students,
                totalCompanies: response.data.total_companies,
                totalAdmins: response.data.total_admins,
                totalInternships: response.data.total_internships,
                totalResumes: response.data.total_resumes,
                activeInternships: response.data.active_internships,
                averageMatchScore: 85, // This can be calculated based on actual matching data
            });
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.response?.data?.detail || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, gradient }) => (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        boxShadow: `0 8px 24px ${color}30`,
                    }}
                >
                    <Icon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 800,
                        color: '#1a1a1a',
                        mb: 1,
                        letterSpacing: '-1px',
                    }}
                >
                    {value.toLocaleString()}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                >
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Layout>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress size={60} />
                    </Box>
                </Container>
            </Layout>
        );
    }

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
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg,#d32f2f 0%, #d32f2fdd 100% )',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 3,
                                boxShadow: '0 8px 24px rgba(211, 10, 10, 0.3)',
                            }}
                        >
                            <AnalyticsIcon sx={{ fontSize: 48, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: '#1a1a1a',
                                    mb: 1,
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                Analytics Dashboard
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                System statistics and platform insights
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {error && (
                    <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={PersonIcon}
                            color="#667eea"
                            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Students"
                            value={stats.totalStudents}
                            icon={PersonIcon}
                            color="#11998e"
                            gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Companies"
                            value={stats.totalCompanies}
                            icon={BusinessIcon}
                            color="#f093fb"
                            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Total Internships"
                            value={stats.totalInternships}
                            icon={WorkIcon}
                            color="#4facfe"
                            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Active Internships"
                            value={stats.activeInternships}
                            icon={TrendingUpIcon}
                            color="#43e97b"
                            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <StatCard
                            title="Resumes Uploaded"
                            value={stats.totalResumes}
                            icon={DescriptionIcon}
                            color="#fa709a"
                            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(255,255,255,0.3)',
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                        }}
                                    >
                                        <AIIcon sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                            AI Matching Performance
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            System-wide matching accuracy
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h2"
                                            sx={{
                                                fontWeight: 800,
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                letterSpacing: '-2px',
                                            }}
                                        >
                                            {stats.averageMatchScore}%
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            Average Match Score
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '3px solid rgba(102, 126, 234, 0.3)',
                                        }}
                                    >
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 800,
                                                color: '#667eea',
                                            }}
                                        >
                                            {stats.averageMatchScore}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Layout>
    );
};

export default Analytics;
