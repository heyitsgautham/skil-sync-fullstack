import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

/** Internship picker and the Rank Candidates button. */
const InternshipSelector = ({ internships, selectedInternship, setSelectedInternship, setSelectedInternshipData, loading, loadingInternships, activeFilters, fetchInternshipSkills, handleRankCandidates }) => (
    <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 9 }}>
                <FormControl fullWidth size="medium">
                    <InputLabel>Select Internship</InputLabel>
                    <Select
                        value={selectedInternship || ''}
                        label="Select Internship"
                        onChange={(e) => {
                            const value = e.target.value || '';
                            setSelectedInternship(value);
                            const internshipData = internships.find(i => i.internship_id === value);
                            setSelectedInternshipData(internshipData);
                            if (value) {
                                fetchInternshipSkills(value);
                            }
                        }}
                        disabled={loadingInternships}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: 2,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            },
                        }}
                    >
                        {internships.map((internship) => (
                            <MenuItem
                                key={internship.internship_id}
                                value={internship.internship_id}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    }
                                }}
                            >
                                <Box>
                                    <Typography variant="body1" fontWeight="600">
                                        {internship.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {internship.location || 'Remote'}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => handleRankCandidates(activeFilters)}
                    disabled={!selectedInternship || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                    sx={{ height: 56 }}
                >
                    {loading ? 'Analyzing...' : 'Rank Candidates'}
                </Button>
            </Grid>
        </Grid>
    </Paper>
);

export default InternshipSelector;
