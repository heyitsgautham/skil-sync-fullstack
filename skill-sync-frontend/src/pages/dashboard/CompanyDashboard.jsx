import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Work as WorkIcon, PostAdd as PostAddIcon, People as PeopleIcon } from '@mui/icons-material';

/** Company dashboard cards: post, manage and rank internships. */
const CompanyDashboard = ({ navigate }) => (
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
                    },
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
                    },
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
                    },
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

export default CompanyDashboard;
