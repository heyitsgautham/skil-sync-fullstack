import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Stack,
    Divider,
    Alert,
    Button,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

/**
 * CandidateComparison Component
 * 
 * Side-by-side comparison of two candidates showing:
 * - Overall scores
 * - Component score breakdown
 * - Skill-by-skill comparison
 * - Experience comparison
 * - Education comparison
 * - Natural language "Why A > B" summary
 * - Actionable next steps
 * 
 * @param {object} comparison - Comparison object from API
 * @param {function} onExport - Callback to export comparison
 */
const CandidateComparison = ({ comparison, onExport }) => {
    if (!comparison) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No comparison data available
                </Typography>
            </Paper>
        );
    }

    const {
        candidate_a,
        candidate_b,
        winner,
        overall_comparison,
        component_comparison,
        skill_comparison,
        experience_comparison,
        education_comparison,
        summary,
        next_steps,
    } = comparison;

    // Get winner highlight
    const isWinnerA = winner === 'candidate_a';
    const isWinnerB = winner === 'candidate_b';

    // Component score bar
    const ComponentComparisonBar = ({ label, scoreA, scoreB }) => {
        const maxScore = Math.max(scoreA, scoreB, 50);
        const percentA = (scoreA / maxScore) * 100;
        const percentB = (scoreB / maxScore) * 100;

        return (
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={percentA}
                            sx={{
                                height: 24,
                                borderRadius: 1,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: scoreA > scoreB ? '#4caf50' : '#9e9e9e',
                                    borderRadius: 1,
                                },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Candidate A: {scoreA.toFixed(1)}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={percentB}
                            sx={{
                                height: 24,
                                borderRadius: 1,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: scoreB > scoreA ? '#4caf50' : '#9e9e9e',
                                    borderRadius: 1,
                                },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Candidate B: {scoreB.toFixed(1)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Box>
            {/* Header */}
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color: 'white',
                }}
            >
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Candidate Comparison
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Candidate A: #{candidate_a?.candidate_id}
                        </Typography>
                        <Typography variant="h3" fontWeight={800}>
                            {candidate_a?.overall_score || 0}
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>
                        vs
                    </Typography>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                        <Typography variant="h5" fontWeight={600}>
                            Candidate B: #{candidate_b?.candidate_id}
                        </Typography>
                        <Typography variant="h3" fontWeight={800}>
                            {candidate_b?.overall_score || 0}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Summary Alert */}
            {summary && (
                <Alert
                    severity={isWinnerA ? 'success' : 'info'}
                    icon={<TrendingUpIcon />}
                    sx={{ mb: 3, borderRadius: 2 }}
                >
                    <Typography variant="body1" fontWeight={600}>
                        {summary}
                    </Typography>
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Component Scores Comparison */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Component Score Comparison
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        {component_comparison && (
                            <>
                                <ComponentComparisonBar
                                    label="Semantic Similarity"
                                    scoreA={component_comparison.semantic?.candidate_a || 0}
                                    scoreB={component_comparison.semantic?.candidate_b || 0}
                                />
                                <ComponentComparisonBar
                                    label="Skills Match"
                                    scoreA={component_comparison.skills?.candidate_a || 0}
                                    scoreB={component_comparison.skills?.candidate_b || 0}
                                />
                                <ComponentComparisonBar
                                    label="Experience"
                                    scoreA={component_comparison.experience?.candidate_a || 0}
                                    scoreB={component_comparison.experience?.candidate_b || 0}
                                />
                                <ComponentComparisonBar
                                    label="Education"
                                    scoreA={component_comparison.education?.candidate_a || 0}
                                    scoreB={component_comparison.education?.candidate_b || 0}
                                />
                                <ComponentComparisonBar
                                    label="Projects"
                                    scoreA={component_comparison.projects?.candidate_a || 0}
                                    scoreB={component_comparison.projects?.candidate_b || 0}
                                />
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* Skills Comparison */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Skills Comparison
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        {skill_comparison && (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Skill</strong></TableCell>
                                            <TableCell align="center"><strong>Candidate A</strong></TableCell>
                                            <TableCell align="center"><strong>Candidate B</strong></TableCell>
                                            <TableCell align="center"><strong>Winner</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {skill_comparison.map((skill, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{skill.skill_name}</TableCell>
                                                <TableCell align="center">
                                                    {skill.candidate_a_has ? (
                                                        <Chip
                                                            icon={<CheckCircleIcon />}
                                                            label={skill.candidate_a_proficiency || 'Yes'}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<CancelIcon />}
                                                            label="Missing"
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {skill.candidate_b_has ? (
                                                        <Chip
                                                            icon={<CheckCircleIcon />}
                                                            label={skill.candidate_b_proficiency || 'Yes'}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<CancelIcon />}
                                                            label="Missing"
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {skill.winner === 'tie' ? (
                                                        <Typography variant="caption">Tie</Typography>
                                                    ) : (
                                                        <Typography variant="caption" fontWeight={600} color="success.main">
                                                            {skill.winner === 'candidate_a' ? 'A' : 'B'}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Summary Stats */}
                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Candidate A Matched
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {skill_comparison?.filter(s => s.candidate_a_has).length || 0} / {skill_comparison?.length || 0}
                                </Typography>
                            </Paper>
                            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Candidate B Matched
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {skill_comparison?.filter(s => s.candidate_b_has).length || 0} / {skill_comparison?.length || 0}
                                </Typography>
                            </Paper>
                        </Box>
                    </Paper>
                </Grid>

                {/* Experience & Education Comparison */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Experience Comparison
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        {experience_comparison && (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Relevant Years
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="h6">
                                            A: {experience_comparison.candidate_a?.relevant_years || 0} yrs
                                        </Typography>
                                        <Typography variant="h6">
                                            B: {experience_comparison.candidate_b?.relevant_years || 0} yrs
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Project Count
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="h6">
                                            A: {experience_comparison.candidate_a?.project_count || 0}
                                        </Typography>
                                        <Typography variant="h6">
                                            B: {experience_comparison.candidate_b?.project_count || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Education Comparison
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        {education_comparison && (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Candidate A
                                    </Typography>
                                    <Typography variant="body2">
                                        {education_comparison.candidate_a?.degree || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {education_comparison.candidate_a?.institution || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Candidate B
                                    </Typography>
                                    <Typography variant="body2">
                                        {education_comparison.candidate_b?.degree || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {education_comparison.candidate_b?.institution || 'N/A'}
                                    </Typography>
                                </Box>
                            </Stack>
                        )}
                    </Paper>
                </Grid>

                {/* Next Steps */}
                {next_steps && (
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Recommended Next Steps
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        For Candidate A
                                    </Typography>
                                    <Stack spacing={1}>
                                        {next_steps.candidate_a?.map((step, index) => (
                                            <Typography key={index} variant="body2">
                                                {index + 1}. {step}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        For Candidate B
                                    </Typography>
                                    <Stack spacing={1}>
                                        {next_steps.candidate_b?.map((step, index) => (
                                            <Typography key={index} variant="body2">
                                                {index + 1}. {step}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Export Button */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={onExport}
                    size="large"
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Export Comparison Report
                </Button>
            </Box>
        </Box>
    );
};

export default CandidateComparison;
