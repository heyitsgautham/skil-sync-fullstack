// A student's applications, newest first, with where each one stands.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Container, Paper, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import apiClient from '../services/api';
import Layout from '../components/Layout';

const STATUS_STYLES = {
    pending: { label: 'Under review', color: '#b45309', background: 'rgba(245, 158, 11, 0.12)' },
    shortlisted: { label: 'Shortlisted', color: '#1d4ed8', background: 'rgba(59, 130, 246, 0.12)' },
    accepted: { label: 'Accepted', color: '#15803d', background: 'rgba(34, 197, 94, 0.12)' },
    rejected: { label: 'Not selected', color: '#b91c1c', background: 'rgba(239, 68, 68, 0.12)' },
};

/** The API sends Python's str(datetime), such as "2026-10-26 16:58:01.123456+00:00". */
export function formatAppliedDate(value) {
    if (!value) return '';
    const iso = value.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ApplicationRow = ({ application }) => {
    const status = STATUS_STYLES[application.status] || STATUS_STYLES.pending;
    const applied = formatAppliedDate(application.created_at);
    return (
        <Paper
            elevation={0}
            data-testid="application-row"
            sx={{
                p: 3,
                mb: 2,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
            }}
        >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {application.internship_title || `Internship #${application.internship_id}`}
                </Typography>
                <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1 }}>
                    {application.company_name || 'Unknown company'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: 'text.secondary' }}>
                    {application.internship_location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{application.internship_location}</Typography>
                        </Box>
                    )}
                    {applied && <Typography variant="body2">Applied {applied}</Typography>}
                    {application.used_tailored_resume === 1 && <Typography variant="body2">Tailored resume</Typography>}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                {application.internship_is_active === false && (
                    <Chip label="Posting closed" size="small" variant="outlined" />
                )}
                {application.match_score != null && (
                    <Chip label={`${application.match_score}% match`} size="small" sx={{ fontWeight: 600 }} />
                )}
                <Chip
                    label={status.label}
                    size="small"
                    sx={{ fontWeight: 700, color: status.color, background: status.background }}
                />
            </Box>
        </Paper>
    );
};

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/internship/applications/my-applications');
            setApplications(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load your applications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

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
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 3,
                            flexShrink: 0,
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                        }}
                    >
                        <AssignmentIcon sx={{ fontSize: 44, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 1 }}>
                            My Applications
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Every internship you have applied to and where each application stands
                        </Typography>
                    </Box>
                </Paper>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, borderRadius: 2 }}
                        action={
                            <Button color="inherit" size="small" onClick={fetchApplications}>
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {!loading && !error && applications.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{ p: 6, textAlign: 'center', borderRadius: 4, background: 'rgba(255, 255, 255, 0.95)' }}
                    >
                        <WorkIcon sx={{ fontSize: 56, color: '#3b82f6', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            No applications yet
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Internships you apply to show up here.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/internships')}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 4 }}
                        >
                            Browse Internships
                        </Button>
                    </Paper>
                )}

                {!loading &&
                    !error &&
                    applications.map((application) => (
                        <ApplicationRow key={application.id} application={application} />
                    ))}
            </Container>
        </Layout>
    );
};

export default MyApplications;
