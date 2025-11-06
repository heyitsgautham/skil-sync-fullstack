import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Chip,
    TextField,
    InputAdornment,
    Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkIcon from '@mui/icons-material/Work';
import apiClient from '../services/api';
import Layout from '../components/Layout';
import InternshipApplicationDialog from '../components/InternshipApplicationDialog';

const InternshipList = () => {
    const navigate = useNavigate();
    const [internships, setInternships] = useState([]);
    const [filteredInternships, setFilteredInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState('');
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Get user role from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || '');
        fetchInternships(user.role);
    }, []);

    useEffect(() => {
        // Filter internships based on search query
        if (searchQuery.trim() === '') {
            setFilteredInternships(internships);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = internships.filter(
                (internship) =>
                    internship.title.toLowerCase().includes(query) ||
                    internship.description.toLowerCase().includes(query) ||
                    internship.company_name?.toLowerCase().includes(query) ||
                    internship.location?.toLowerCase().includes(query) ||
                    internship.required_skills?.some(skill =>
                        skill.toLowerCase().includes(query)
                    )
            );
            setFilteredInternships(filtered);
        }
    }, [searchQuery, internships]);

    const fetchInternships = async (role) => {
        setLoading(true);
        setError('');
        try {
            // If user is a company, fetch only their internships
            // Otherwise, fetch all internships
            const endpoint = role === 'company' ? '/internship/my-posts' : '/internship/list';
            const response = await apiClient.get(endpoint);
            setInternships(response.data);
            setFilteredInternships(response.data);
        } catch (err) {
            console.error('Error fetching internships:', err);
            setError(err.response?.data?.detail || 'Failed to load internships');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (internship) => {
        setSelectedInternship(internship);
        setApplicationDialogOpen(true);
    };

    const handleApplicationSuccess = (result) => {
        setSuccessMessage(result.message);
        setShowSuccess(true);
        // Optionally refresh internships list
        fetchInternships(userRole);
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
    };

    return (
        <Layout>
            <Container maxWidth="lg">
                {/* Search Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <TextField
                        fullWidth
                        placeholder="Search by title, company, skills, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#667eea' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                '&:hover fieldset': {
                                    borderColor: '#667eea',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                },
                            },
                        }}
                    />
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Internships List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredInternships.length === 0 ? (
                    <Alert severity="info">
                        {searchQuery
                            ? 'No internships found matching your search.'
                            : 'No internships available at the moment. Check back later!'}
                    </Alert>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1a1a1a', mb: 3 }}>
                            {userRole === 'company' ? 'My Posted Internships' : 'Browse Internships'} - {filteredInternships.length} {filteredInternships.length === 1 ? 'Internship' : 'Internships'} Found
                        </Typography>
                        <Grid container spacing={3}>
                            {filteredInternships.map((internship) => (
                                <Grid size={{ xs: 12, md: 6 }} key={internship.id} sx={{ display: 'flex' }}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            width: '100%',
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                                    }}
                                                >
                                                    <WorkIcon sx={{ color: 'white', fontSize: 28 }} />
                                                </Box>
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        component="div"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: '#1a1a1a',
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {internship.title}
                                                    </Typography>
                                                    {/* Company Name */}
                                                    {internship.company_name && (
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#667eea',
                                                            }}
                                                        >
                                                            {internship.company_name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {internship.description}
                                            </Typography>

                                            {/* Location */}
                                            {internship.location && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {internship.location}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Duration */}
                                            {internship.duration && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {internship.duration}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Stipend */}
                                            {internship.stipend && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {internship.stipend}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Required Skills */}
                                            {internship.required_skills && internship.required_skills.length > 0 && (
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            mb: 1,
                                                            display: 'block',
                                                            color: '#666',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                        }}
                                                    >
                                                        Required Skills
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {internship.required_skills.map((skill, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={skill}
                                                                size="small"
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                                                    color: '#667eea',
                                                                    fontWeight: 600,
                                                                    '&:hover': {
                                                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </CardContent>

                                        <CardActions sx={{ p: 3, pt: 0 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => handleApply(internship)}
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    fontSize: '1rem',
                                                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                    },
                                                }}
                                            >
                                                {userRole === 'company' ? 'View Details' : 'Apply Now'}
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {/* Application Dialog */}
                <InternshipApplicationDialog
                    open={applicationDialogOpen}
                    onClose={() => setApplicationDialogOpen(false)}
                    internship={selectedInternship}
                    onSuccess={handleApplicationSuccess}
                />

                {/* Success Snackbar */}
                <Snackbar
                    open={showSuccess}
                    autoHideDuration={6000}
                    onClose={handleCloseSuccess}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                        {successMessage}
                    </Alert>
                </Snackbar>
            </Container>
        </Layout>
    );
};

export default InternshipList;
