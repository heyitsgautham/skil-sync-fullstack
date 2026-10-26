import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Alert,
    Checkbox,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';
import SkillsAnalysisPanel from './SkillsAnalysisPanel';

/** One ranked candidate with scores, skills gaps, flags and links. */
const CandidateCard = ({
    candidate,
    index,
    expandedAccordions,
    setExpandedAccordions,
    setEmailModalOpen,
    selectedCandidates,
    setSelectedCandidates,
    selectionMode,
    anonymizationEnabled,
    page,
    pageSize,
    ensureHttpProtocol,
    getScoreColor,
    handleViewResume,
    handleFlaggedClick,
    handleToggleCandidateSelection,
}) => {
    const actualIndex = (page - 1) * pageSize + index; // Calculate actual index in full list
    return (
        <Card
            key={candidate.candidate_id}
            sx={{
                mb: 3,
                border:
                    selectionMode && selectedCandidates.some((c) => c.candidate_id === candidate.candidate_id)
                        ? '2px solid #667eea'
                        : '1px solid #e0e0e0',
                boxShadow: 1,
                borderRadius: 3,
            }}
        >
            <CardContent sx={{ py: 2 }}>
                {/* Header with Rank, Name and View Resume Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left side: Rank, Name, Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {selectionMode && (
                            <Checkbox
                                checked={selectedCandidates.some((c) => c.candidate_id === candidate.candidate_id)}
                                onChange={() => handleToggleCandidateSelection(candidate)}
                                sx={{ mr: 1 }}
                            />
                        )}
                        {/* Rank Badge - Vertically centered with dynamic color */}
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: getScoreColor(candidate.match_score),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                mr: 2,
                                flexShrink: 0,
                                alignSelf: 'center',
                                boxShadow: `0 2px 8px ${getScoreColor(candidate.match_score)}40`,
                            }}
                        >
                            #{actualIndex + 1}
                        </Box>

                        {/* Name, Badges, and Buttons stacked */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {/* Name and status badges row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {anonymizationEnabled ? `Candidate #${actualIndex + 1}` : candidate.candidate_name}
                                </Typography>
                                {anonymizationEnabled && (
                                    <Chip
                                        label="🔒 Anonymous"
                                        size="small"
                                        sx={{
                                            backgroundColor: '#ff9800',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem',
                                            height: 22,
                                        }}
                                    />
                                )}
                                {candidate.scoring_breakdown?.has_tailored && (
                                    <Chip
                                        label="✨ Tailored"
                                        size="small"
                                        sx={{
                                            backgroundColor: '#9c27b0',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem',
                                            height: 22,
                                        }}
                                    />
                                )}
                                {/* FLAGGED BADGE */}
                                {candidate.is_flagged && (
                                    <>
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                backgroundColor: '#f44336',
                                                cursor: anonymizationEnabled ? 'default' : 'pointer',
                                                '&:hover': anonymizationEnabled
                                                    ? {}
                                                    : {
                                                          backgroundColor: '#d32f2f',
                                                      },
                                            }}
                                            onClick={
                                                anonymizationEnabled ? undefined : () => handleFlaggedClick(candidate)
                                            }
                                        >
                                            <WarningIcon sx={{ color: 'white', fontSize: '0.9rem' }} />
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#f44336',
                                                cursor: anonymizationEnabled ? 'default' : 'pointer',
                                                textDecoration: anonymizationEnabled ? 'none' : 'underline',
                                                fontWeight: 'bold',
                                                '&:hover': anonymizationEnabled
                                                    ? {}
                                                    : {
                                                          color: '#d32f2f',
                                                      },
                                            }}
                                            onClick={
                                                anonymizationEnabled ? undefined : () => handleFlaggedClick(candidate)
                                            }
                                        >
                                            {candidate.flag_reason_text}
                                        </Typography>
                                    </>
                                )}
                            </Box>

                            {/* Action buttons row */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleViewResume(candidate.student_id, candidate.student_name)}
                                    startIcon={<DescriptionIcon />}
                                >
                                    Resume
                                </Button>
                                {!anonymizationEnabled && candidate.github_url && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<GitHubIcon />}
                                        href={ensureHttpProtocol(candidate.github_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            borderColor: '#333',
                                            color: '#333',
                                            minWidth: 'auto',
                                            '&:hover': {
                                                borderColor: '#000',
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            },
                                        }}
                                    >
                                        GitHub
                                    </Button>
                                )}
                                {!anonymizationEnabled && candidate.linkedin_url && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<LinkedInIcon />}
                                        href={ensureHttpProtocol(candidate.linkedin_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            borderColor: '#0077B5',
                                            color: '#0077B5',
                                            minWidth: 'auto',
                                            '&:hover': {
                                                borderColor: '#005582',
                                                backgroundColor: 'rgba(0, 119, 181, 0.04)',
                                            },
                                        }}
                                    >
                                        LinkedIn
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right side: Experience, Skills and Score buttons */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                        {/* Send Mail Button - Individual Email */}
                        <Button
                            variant="outlined"
                            startIcon={<EmailIcon />}
                            onClick={() => {
                                setSelectedCandidates([candidate]);
                                setEmailModalOpen(true);
                            }}
                            sx={{
                                minWidth: 80,
                                height: 40,
                                borderRadius: 2,
                                borderColor: '#4caf50',
                                color: '#4caf50',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    borderColor: '#45a049',
                                    backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                },
                            }}
                        >
                            Mail
                        </Button>

                        {/* Skills Button - Outlined Box */}
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setExpandedAccordions((prev) => ({
                                    ...prev,
                                    [`skills-${actualIndex}`]: !prev[`skills-${actualIndex}`],
                                }));
                            }}
                            sx={{
                                minWidth: 80,
                                height: 40,
                                borderRadius: 2,
                                borderColor: '#2196f3',
                                color: '#2196f3',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    borderColor: '#1976d2',
                                    backgroundColor: 'rgba(33, 150, 243, 0.04)',
                                },
                            }}
                        >
                            Skills
                        </Button>

                        {/* Score Button - Outlined Box */}
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setExpandedAccordions((prev) => ({
                                    ...prev,
                                    [`score-${actualIndex}`]: !prev[`score-${actualIndex}`],
                                }));
                            }}
                            sx={{
                                minWidth: 100,
                                height: 40,
                                borderRadius: 2,
                                borderColor: getScoreColor(candidate.match_score),
                                color: getScoreColor(candidate.match_score),
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    borderColor: getScoreColor(candidate.match_score),
                                    backgroundColor: `${getScoreColor(candidate.match_score)}10`,
                                },
                            }}
                        >
                            {candidate.match_score.toFixed(0)}% Match
                        </Button>
                    </Box>
                </Box>

                {/* Score Breakdown - Controlled by Score Button */}
                {expandedAccordions[`score-${actualIndex}`] && (
                    <Paper sx={{ p: 2, mb: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                            Score Breakdown
                        </Typography>

                        {/* Tailored Resume Info */}
                        {candidate.scoring_breakdown?.has_tailored && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    ✨ Tailored Resume Detected
                                </Typography>
                                <Typography variant="caption" display="block">
                                    {candidate.scoring_breakdown.final_weight}
                                </Typography>
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {Object.entries(candidate.component_scores).map(([key, value]) => (
                                <Grid size={12} key={key}>
                                    <Box sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {key.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {value.toFixed(1)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={value}
                                            sx={{
                                                height: 8,
                                                borderRadius: 5,
                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                },
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Skills Analysis - Controlled by Skills Button */}
                {expandedAccordions[`skills-${actualIndex}`] && <SkillsAnalysisPanel candidate={candidate} />}
            </CardContent>
        </Card>
    );
};

export default CandidateCard;
