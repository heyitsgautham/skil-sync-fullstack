import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Upload as UploadIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

/** Student dashboard cards: resume management and AI recommendations. */
const StudentDashboard = ({ navigate }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15,
                duration: 0.5,
                ease: 'easeOut',
            },
        }),
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
                            },
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 20,
                                    delay: 0.2,
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
                            },
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

export default StudentDashboard;
