import { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Grid,
    TextField,
    InputAdornment,
    Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import apiClient from '../services/api';
import Layout from '../components/Layout';
import InternshipApplicationDialog from '../components/InternshipApplicationDialog';
import InternshipCard from './internshipList/InternshipCard';
import EditInternshipDialog from './internshipList/EditInternshipDialog';
import DeleteInternshipDialog from './internshipList/DeleteInternshipDialog';
import InternshipDetailsDialog from './internshipList/InternshipDetailsDialog';

const InternshipList = () => {
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
        required_skills: [],
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
                    internship.required_skills?.some((skill) => skill.toLowerCase().includes(query)),
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
            required_skills: internship.required_skills || [],
        });
        setEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            // Convert required_skills string to array if needed
            const skills =
                typeof editFormData.required_skills === 'string'
                    ? editFormData.required_skills
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s)
                    : editFormData.required_skills;

            await apiClient.put(`/internship/${selectedInternship.id}`, {
                ...editFormData,
                required_skills: skills,
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
                                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                                '&:hover fieldset': {
                                    borderColor: '#4caf50',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#4caf50',
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
                            {userRole === 'company' ? 'My Posted Internships' : 'Browse Internships'}
                            {' - '}
                            {filteredInternships.length}{' '}
                            {filteredInternships.length === 1 ? 'Internship' : 'Internships'}
                            {' Found'}
                        </Typography>
                        <Grid container spacing={3}>
                            {filteredInternships.map((internship) => (
                                <Grid size={{ xs: 12, md: 6 }} key={internship.id} sx={{ display: 'flex' }}>
                                    <InternshipCard
                                        internship={internship}
                                        userRole={userRole}
                                        handleApply={handleApply}
                                        handleViewDetails={handleViewDetails}
                                        handleEditClick={handleEditClick}
                                        handleDeleteClick={handleDeleteClick}
                                    />
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

                <EditInternshipDialog
                    editDialogOpen={editDialogOpen}
                    setEditDialogOpen={setEditDialogOpen}
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    userRole={userRole}
                    handleEditSubmit={handleEditSubmit}
                />

                <DeleteInternshipDialog
                    deleteDialogOpen={deleteDialogOpen}
                    setDeleteDialogOpen={setDeleteDialogOpen}
                    internshipToDelete={internshipToDelete}
                    handleDeleteConfirm={handleDeleteConfirm}
                />

                <InternshipDetailsDialog
                    detailsDialogOpen={detailsDialogOpen}
                    setDetailsDialogOpen={setDetailsDialogOpen}
                    selectedInternship={selectedInternship}
                    userRole={userRole}
                    handleEditClick={handleEditClick}
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
