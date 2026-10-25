// One recommended internship with its match score, matched skills and apply action, animated in by list position.
import { Box, Typography, Card, CardContent, Grid, Divider } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { motion } from 'framer-motion';
import AnimatedMatchScore from '../../components/AnimatedMatchScore';

const RecommendationCard = ({ internship, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: 'easeOut',
        }}
        style={{ width: '100%' }}
    >
        <Card
            elevation={0}
            sx={{
                width: '100%',
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
            <CardContent sx={{ p: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 3,
                        gap: 3,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            }}
                        >
                            <WorkIcon sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h5"
                                component="div"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1a1a1a',
                                    mb: 0.5,
                                }}
                            >
                                {internship.title}
                            </Typography>
                            {internship.company_name && (
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#3b82f6',
                                    }}
                                >
                                    {internship.company_name}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ minWidth: 120 }}>
                        <AnimatedMatchScore score={internship.match_score} size={100} showLabel={false} />
                    </Box>
                </Box>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        mb: 3,
                        lineHeight: 1.7,
                    }}
                >
                    {internship.description}
                </Typography>

                <Divider sx={{ my: 3, borderColor: 'rgba(0,0,0,0.08)' }} />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {internship.location && (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOnIcon sx={{ mr: 1, color: 'action.active' }} />
                                <Typography variant="body2">{internship.location}</Typography>
                            </Box>
                        </Grid>
                    )}
                    {internship.duration && (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon sx={{ mr: 1, color: 'action.active' }} />
                                <Typography variant="body2">{internship.duration}</Typography>
                            </Box>
                        </Grid>
                    )}
                    {internship.stipend && (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AttachMoneyIcon sx={{ mr: 1, color: 'action.active' }} />
                                <Typography variant="body2">{internship.stipend}</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    </motion.div>
);

export default RecommendationCard;
