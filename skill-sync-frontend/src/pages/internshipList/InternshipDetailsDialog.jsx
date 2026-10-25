// Shows every field of one internship to the company or admin that can edit it.
import { Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EditIcon from '@mui/icons-material/Edit';

const InternshipDetailsDialog = ({
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedInternship,
    userRole,
    handleEditClick,
}) => (
    <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
            sx={{
                background:
                    userRole === 'company'
                        ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
            }}
        >
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

                    {(selectedInternship.min_experience !== undefined ||
                        selectedInternship.max_experience !== undefined) && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Experience Required
                            </Typography>
                            <Typography variant="body2">
                                {selectedInternship.min_experience || 0} - {selectedInternship.max_experience || 0}{' '}
                                years
                            </Typography>
                        </Box>
                    )}

                    {selectedInternship.required_education && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Education Required
                            </Typography>
                            <Typography variant="body2">{selectedInternship.required_education}</Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Posted on: {new Date(selectedInternship.created_at).toLocaleDateString()} | Status:{' '}
                            {selectedInternship.is_active ? ' Active' : ' Inactive'}
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
                    color: userRole === 'company' ? '#4caf50' : '#667eea',
                    borderColor: userRole === 'company' ? '#4caf50' : '#667eea',
                    '&:hover': {
                        borderColor: userRole === 'company' ? '#4caf50' : '#667eea',
                        backgroundColor: userRole === 'company' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                    },
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
                    background:
                        userRole === 'company'
                            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                        background:
                            userRole === 'company'
                                ? 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)'
                                : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                }}
            >
                Edit Internship
            </Button>
        </DialogActions>
    </Dialog>
);

export default InternshipDetailsDialog;
