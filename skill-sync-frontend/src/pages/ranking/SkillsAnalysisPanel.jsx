// A candidate's matched and missing skills, against the internship's required and preferred lists.
import { Box, Typography, Paper, Chip, Grid } from '@mui/material';

const SkillsAnalysisPanel = ({ candidate }) => (
    <Paper sx={{ p: 3, mb: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={4}>
            {/* Required Skills Section - Top Left */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1976d2' }}>
                    Required Skills
                </Typography>

                {/* Matched Required Skills */}
                {candidate.match_details.matched_required_skills?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="600" sx={{ mb: 1.5, color: '#2e7d32' }}>
                            ✓ Has ({candidate.match_details.matched_required_skills.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {candidate.match_details.matched_required_skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    size="medium"
                                    sx={{
                                        backgroundColor: '#dcfce7',
                                        color: '#166534',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        py: 2,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Missing Required Skills */}
                {candidate.match_details.missing_required_skills?.length > 0 && (
                    <Box>
                        <Typography variant="body1" fontWeight="600" sx={{ mb: 1.5, color: '#d32f2f' }}>
                            ✗ Missing ({candidate.match_details.missing_required_skills.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {candidate.match_details.missing_required_skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    size="medium"
                                    sx={{
                                        backgroundColor: '#fee2e2',
                                        color: '#991b1b',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        py: 2,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* No Required Skills */}
                {(!candidate.match_details.matched_required_skills ||
                    candidate.match_details.matched_required_skills.length === 0) &&
                    (!candidate.match_details.missing_required_skills ||
                        candidate.match_details.missing_required_skills.length === 0) && (
                        <Typography variant="body1" color="text.secondary">
                            No required skills specified
                        </Typography>
                    )}
            </Grid>

            {/* Preferred Skills Section - Top Right */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#9c27b0' }}>
                    Preferred Skills
                </Typography>

                {/* Matched Preferred Skills */}
                {candidate.match_details.matched_preferred_skills?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="600" sx={{ mb: 1.5, color: '#7b1fa2' }}>
                            ✓ Has ({candidate.match_details.matched_preferred_skills.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {candidate.match_details.matched_preferred_skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    size="medium"
                                    sx={{
                                        backgroundColor: '#f3e5f5',
                                        color: '#6a1b9a',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        py: 2,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Missing Preferred Skills */}
                {candidate.match_details.missing_preferred_skills?.length > 0 && (
                    <Box>
                        <Typography variant="body1" fontWeight="600" sx={{ mb: 1.5, color: '#f57c00' }}>
                            ✗ Missing ({candidate.match_details.missing_preferred_skills.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {candidate.match_details.missing_preferred_skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    size="medium"
                                    sx={{
                                        backgroundColor: '#fff3e0',
                                        color: '#e65100',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        py: 2,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* No Preferred Skills */}
                {(!candidate.match_details.matched_preferred_skills ||
                    candidate.match_details.matched_preferred_skills.length === 0) &&
                    (!candidate.match_details.missing_preferred_skills ||
                        candidate.match_details.missing_preferred_skills.length === 0) && (
                        <Typography variant="body1" color="text.secondary">
                            No preferred skills specified
                        </Typography>
                    )}
            </Grid>
        </Grid>
    </Paper>
);

export default SkillsAnalysisPanel;
