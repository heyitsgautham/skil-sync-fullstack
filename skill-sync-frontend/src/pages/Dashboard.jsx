import React from 'react';
import { Container, Box, Typography, Paper, Grid, Chip, Alert, Snackbar } from '@mui/material';
import {
    AccountCircle as AccountCircleIcon,
    Business as BusinessIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Layout from '../components/Layout';
import StudentDashboard from './dashboard/StudentDashboard';
import CompanyDashboard from './dashboard/CompanyDashboard';
import AdminNavCards from './dashboard/AdminNavCards';
import AdminToolCards from './dashboard/AdminToolCards';
import AdminDialogs from './dashboard/AdminDialogs';
import useAdminTools from './dashboard/useAdminTools';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const role = user?.role?.toLowerCase();
    const adminTools = useAdminTools(role);

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
                                background:
                                    role === 'admin'
                                        ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                                        : 'linear-gradient(135deg, #1976d2 0%, #1976d2dd 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 3,
                                boxShadow:
                                    role === 'admin'
                                        ? '0 8px 24px rgba(211, 47, 47, 0.3)'
                                        : '0 8px 24px rgba(25, 118, 210, 0.3)',
                            }}
                        >
                            {React.cloneElement(getRoleIcon(), {
                                sx: { fontSize: 48, color: 'white', m: 0 },
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
                                {role === 'admin'
                                    ? 'Welcome back, Admin!'
                                    : `Welcome back, ${user?.full_name || 'User'}!`}
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
                                    background:
                                        'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
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

                {role === 'student' && <StudentDashboard navigate={navigate} />}
                {role === 'company' && <CompanyDashboard navigate={navigate} />}
                {role === 'admin' && (
                    <Grid container spacing={3}>
                        <AdminNavCards navigate={navigate} />
                        <AdminToolCards {...adminTools} />
                    </Grid>
                )}

                {!['student', 'company', 'admin'].includes(role) && (
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">
                            Invalid role detected. Please contact support.
                        </Typography>
                    </Paper>
                )}
            </Container>

            <Snackbar
                open={adminTools.snackbar.open}
                autoHideDuration={6000}
                onClose={() => adminTools.setSnackbar({ ...adminTools.snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => adminTools.setSnackbar({ ...adminTools.snackbar, open: false })}
                    severity={adminTools.snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {adminTools.snackbar.message}
                </Alert>
            </Snackbar>

            {role === 'admin' && <AdminDialogs {...adminTools} />}
        </Layout>
    );
};

export default Dashboard;
