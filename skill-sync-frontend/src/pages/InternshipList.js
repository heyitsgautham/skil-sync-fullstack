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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkIcon from '@mui/icons-material/Work';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [internshipToDelete, setInternshipToDelete] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        stipend: '',
        required_skills: []
    });

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

    const handleViewDetails = (internship) => {
        setSelectedInternship(internship);
        setDetailsDialogOpen(true);
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

    const handleEditClick = (internship) => {
        setSelectedInternship(internship);
        setEditFormData({
            title: internship.title,
            description: internship.description,
            location: internship.location || '',
            duration: internship.duration || '',
            stipend: internship.stipend || '',
            required_skills: internship.required_skills || []
        });
        setEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            // Convert required_skills string to array if needed
            const skills = typeof editFormData.required_skills === 'string' 
                ? editFormData.required_skills.split(',').map(s => s.trim()).filter(s => s)
                : editFormData.required_skills;

            await apiClient.put(`/internship/${selectedInternship.id}`, {
                ...editFormData,
                required_skills: skills
            });
            
            setSuccessMessage('Internship updated successfully');
            setShowSuccess(true);
            setEditDialogOpen(false);
            fetchInternships(userRole);
        } catch (err) {
            console.error('Error updating internship:', err);
            setError(err.response?.data?.detail || 'Failed to update internship');
        }
    };

    const handleDeleteClick = (internship) => {
        setInternshipToDelete(internship);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await apiClient.delete(`/internship/${internshipToDelete.id}`);
            setSuccessMessage('Internship deleted successfully');
            setShowSuccess(true);
            setDeleteDialogOpen(false);
            fetchInternships(userRole);
        } catch (err) {
            console.error('Error deleting internship:', err);
            setError(err.response?.data?.detail || 'Failed to delete internship');
        }
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
                                backgroundColor: 'rgba(214, 38, 26, 0.05)',
                                '&:hover fieldset': {
                                    borderColor: '#d32f2f',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#d32f2f',
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
                                            boxShadow: '0 8px 32px rgba(211, 10, 10, 0.08)',
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
                                                        background: 'linear-gradient(135deg, #d32f2f 0%, #d32f2fdd 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                        boxShadow: '0 4px 12px rgba(211, 10, 10, 0.3)',
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
                                            {userRole === 'admin' ? (
                                                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleEditClick(internship)}
                                                        sx={{
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            borderColor: '#667eea',
                                                            color: '#667eea',
                                                            fontWeight: 700,
                                                            textTransform: 'none',
                                                            fontSize: '1rem',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                borderColor: '#667eea',
                                                                background: 'rgba(102, 126, 234, 0.1)',
                                                                transform: 'translateY(-2px)',
                                                            },
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDeleteClick(internship)}
                                                        sx={{
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            borderColor: '#f5576c',
                                                            color: '#f5576c',
                                                            fontWeight: 700,
                                                            textTransform: 'none',
                                                            fontSize: '1rem',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                borderColor: '#f5576c',
                                                                background: 'rgba(245, 87, 108, 0.1)',
                                                                transform: 'translateY(-2px)',
                                                            },
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => userRole === 'company' ? handleViewDetails(internship) : handleApply(internship)}
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
                                            )}
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

                {/* Edit Internship Dialog */}
                <Dialog 
                    open={editDialogOpen} 
                    onClose={() => setEditDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 700
                    }}>
                        Edit Internship
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={editFormData.title}
                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            margin="normal"
                            multiline
                            rows={4}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Location"
                            value={editFormData.location}
                            onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Duration"
                            value={editFormData.duration}
                            onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                            margin="normal"
                            placeholder="e.g., 3 months"
                        />
                        <TextField
                            fullWidth
                            label="Stipend"
                            value={editFormData.stipend}
                            onChange={(e) => setEditFormData({ ...editFormData, stipend: e.target.value })}
                            margin="normal"
                            placeholder="e.g., $1000/month"
                        />
                        <TextField
                            fullWidth
                            label="Required Skills (comma-separated)"
                            value={Array.isArray(editFormData.required_skills) 
                                ? editFormData.required_skills.join(', ') 
                                : editFormData.required_skills}
                            onChange={(e) => setEditFormData({ ...editFormData, required_skills: e.target.value })}
                            margin="normal"
                            placeholder="e.g., Python, React, SQL"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button 
                            onClick={() => setEditDialogOpen(false)}
                            sx={{ color: '#666' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleEditSubmit}
                            variant="contained"
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8e 100%)',
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog 
                    open={deleteDialogOpen} 
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        color: 'white',
                        fontWeight: 700
                    }}>
                        ⚠️ Confirm Delete Internship
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Are you sure you want to delete this internship?
                        </Typography>
                        
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(245, 87, 108, 0.1)' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {internshipToDelete?.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {internshipToDelete?.company_name}
                            </Typography>
                        </Paper>

                        <Typography color="error" sx={{ mb: 1, fontWeight: 600 }}>
                            ⚠️ This action cannot be undone!
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            The following data will be permanently deleted:
                        </Typography>
                        
                        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                            <li><Typography variant="body2">Internship posting</Typography></li>
                            <li><Typography variant="body2">All student applications</Typography></li>
                            <li><Typography variant="body2">All matching data</Typography></li>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button 
                            onClick={() => setDeleteDialogOpen(false)}
                            sx={{ color: '#666' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            sx={{
                                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #e04558 0%, #d97fe6 100%)',
                                }
                            }}
                        >
                            Delete Internship
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Internship Details Dialog (for Company Users) */}
                <Dialog 
                    open={detailsDialogOpen} 
                    onClose={() => setDetailsDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 700
                    }}>
                        Internship Details
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {selectedInternship && (
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {selectedInternship.title}
                                </Typography>
                                
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Company: {selectedInternship.company_name || 'Your Company'}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                    {selectedInternship.location && (
                                        <Chip
                                            icon={<LocationOnIcon />}
                                            label={selectedInternship.location}
                                            sx={{ backgroundColor: '#f0f4ff', color: '#667eea' }}
                                        />
                                    )}
                                    {selectedInternship.duration && (
                                        <Chip
                                            icon={<TimerIcon />}
                                            label={selectedInternship.duration}
                                            sx={{ backgroundColor: '#fff0f5', color: '#764ba2' }}
                                        />
                                    )}
                                    {selectedInternship.stipend && (
                                        <Chip
                                            icon={<MonetizationOnIcon />}
                                            label={selectedInternship.stipend}
                                            sx={{ backgroundColor: '#f0fff4', color: '#10b981' }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                        {selectedInternship.description}
                                    </Typography>
                                </Box>

                                {selectedInternship.required_skills && selectedInternship.required_skills.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Required Skills
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedInternship.required_skills.map((skill, index) => (
                                                <Chip
                                                    key={index}
                                                    label={skill}
                                                    size="small"
                                                    sx={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {selectedInternship.preferred_skills && selectedInternship.preferred_skills.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Preferred Skills
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedInternship.preferred_skills.map((skill, index) => (
                                                <Chip
                                                    key={index}
                                                    label={skill}
                                                    size="small"
                                                    sx={{ backgroundColor: '#f3e5f5', color: '#6a1b9a' }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {(selectedInternship.min_experience !== undefined || selectedInternship.max_experience !== undefined) && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Experience Required
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedInternship.min_experience || 0} - {selectedInternship.max_experience || 0} years
                                        </Typography>
                                    </Box>
                                )}

                                {selectedInternship.required_education && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Education Required
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedInternship.required_education}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Posted on: {new Date(selectedInternship.created_at).toLocaleDateString()} | 
                                        Status: {selectedInternship.is_active ? ' Active' : ' Inactive'}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button 
                            onClick={() => setDetailsDialogOpen(false)}
                            variant="outlined"
                            sx={{ 
                                color: '#667eea',
                                borderColor: '#667eea',
                                '&:hover': {
                                    borderColor: '#667eea',
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                }
                            }}
                        >
                            Close
                        </Button>
                        <Button 
                            onClick={() => {
                                setDetailsDialogOpen(false);
                                handleEditClick(selectedInternship);
                            }}
                            variant="contained"
                            startIcon={<EditIcon />}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                }
                            }}
                        >
                            Edit Internship
                        </Button>
                    </DialogActions>
                </Dialog>

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
