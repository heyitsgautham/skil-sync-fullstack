import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
} from '@mui/material';
import {
    Work as WorkIcon,
    Analytics as AnalyticsIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

/** Admin dashboard links to user management, internship oversight and analytics. */
const AdminNavCards = ({ navigate }) => (
        <>
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
        </>
);

export default AdminNavCards;
