// Picks a job and the match-quality buckets for the candidate report email.
import {
    Box,
    Card,
    Button,
    Typography,
    Grid,
    CircularProgress,
    FormControlLabel,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Checkbox,
    FormGroup,
    FormLabel,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const JobEmailSection = ({
    jobStats,
    selectedJob,
    setSelectedJob,
    sendingEmail,
    setConfirmDialog,
    matchFilters,
    getSelectedJobStats,
    handleFilterChange,
    getFilteredCandidateCount,
}) => (
    <Box>
        <Typography variant="h6" gutterBottom>
            Send Customized Candidate Email
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
            Select a job position and filter candidates by match quality to send a customized email with CSV/Excel
            exports.
        </Typography>

        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                    <InputLabel>Select Job Position</InputLabel>
                    <Select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        label="Select Job Position"
                        disabled={sendingEmail || jobStats.length === 0}
                    >
                        {jobStats.map((job) => (
                            <MenuItem key={job.internship_id} value={job.internship_id}>
                                {job.internship_title} ({job.total_applicants} candidates)
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* Match Quality Filters */}
            {selectedJob && (
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                            Select Candidate Categories to Include:
                        </FormLabel>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={matchFilters.all}
                                        onChange={() => handleFilterChange('all')}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            ALL
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            (Select all categories)
                                        </Typography>
                                    </Box>
                                }
                            />
                            <Box
                                sx={{
                                    ml: 3,
                                    mt: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={matchFilters.greatMatches}
                                            onChange={() => handleFilterChange('greatMatches')}
                                            disabled={matchFilters.all}
                                            color="success"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip size="small" label="GREAT MATCHES" color="success" />
                                            <Typography variant="body2" color="text.secondary">
                                                (≥80% match - {getSelectedJobStats()?.great_matches || 0} candidates)
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={matchFilters.goodMatches}
                                            onChange={() => handleFilterChange('goodMatches')}
                                            disabled={matchFilters.all}
                                            color="info"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip size="small" label="GOOD MATCHES" color="info" />
                                            <Typography variant="body2" color="text.secondary">
                                                (60-79% match - {getSelectedJobStats()?.good_matches || 0} candidates)
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={matchFilters.otherMatches}
                                            onChange={() => handleFilterChange('otherMatches')}
                                            disabled={matchFilters.all}
                                            color="default"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip size="small" label="OTHER MATCHES" color="default" />
                                            <Typography variant="body2" color="text.secondary">
                                                (&lt;60% match - {getSelectedJobStats()?.bad_matches || 0} candidates)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                        </FormGroup>

                        {/* Filtered count display */}
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                                Total candidates to include: {getFilteredCandidateCount()} /{' '}
                                {getSelectedJobStats()?.total_applicants || 0}
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
            )}

            <Grid size={{ xs: 12 }}>
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={sendingEmail ? <CircularProgress size={20} /> : <SendIcon />}
                    onClick={() => setConfirmDialog(true)}
                    disabled={
                        !selectedJob || sendingEmail || jobStats.length === 0 || getFilteredCandidateCount() === 0
                    }
                >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
            </Grid>
        </Grid>
    </Box>
);

export default JobEmailSection;
