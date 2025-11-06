import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Avatar,
    Chip,
    Button,
    Divider,
    Stack,
    Tooltip,
    IconButton,
    Collapse,
    Badge,
    LinearProgress,
    Paper,
    Alert,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Code as CodeIcon,
    Star as StarIcon,
    Download as DownloadIcon,
    Event as EventIcon,
    Assignment as AssignmentIcon,
    Verified as VerifiedIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import ComponentScoreBar from './ComponentScoreBar';

/**
 * CandidateExplanationCard Component
 * 
 * Comprehensive candidate explanation card showing detailed match analysis.
 * Displays component scores, matched/missing skills, experience, education, projects,
 * AI recommendations, and provenance.
 * 
 * @param {object} explanation - Full explanation object from API
 * @param {function} onAction - Callback for action buttons: (action, candidateId) => void
 * @param {boolean} anonymized - Whether to show anonymized view (blind mode)
 */
const CandidateExplanationCard = ({ explanation, onAction, anonymized = false }) => {
    const [expandedSections, setExpandedSections] = useState({
        skills: true,
        experience: false,
        education: false,
        projects: false,
        aiRecommendation: true,
        provenance: false,
    });

    const [selectedSkill, setSelectedSkill] = useState(null);

    if (!explanation) {
        return (
            <Card>
                <CardContent>
                    <Typography>No explanation available</Typography>
                </CardContent>
            </Card>
        );
    }

    const {
        candidate_id,
        overall_score,
        confidence,
        recommendation,
        component_scores,
        matched_skills = [],
        missing_skills = [],
        experience_analysis = {},
        education_analysis = {},
        project_analysis = {},
        ai_recommendation = {},
        provenance = {},
        audit_id,
    } = explanation;

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section],
        });
    };

    // Get recommendation badge color
    const getRecommendationColor = (rec) => {
        switch (rec) {
            case 'SHORTLIST':
                return 'success';
            case 'MAYBE':
                return 'warning';
            case 'REJECT':
                return 'error';
            default:
                return 'default';
        }
    };

    // Get confidence level
    const getConfidenceLevel = (conf) => {
        if (conf >= 0.8) return { label: 'High', color: 'success' };
        if (conf >= 0.6) return { label: 'Medium', color: 'warning' };
        return { label: 'Low', color: 'error' };
    };

    // Get impact color
    const getImpactColor = (impact) => {
        switch (impact?.toLowerCase()) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'default';
            default:
                return 'default';
        }
    };

    const confidenceInfo = getConfidenceLevel(confidence);

    return (
        <Card
            elevation={3}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: recommendation === 'SHORTLIST' ? 'success.light' : 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${recommendation === 'SHORTLIST' ? '#11998e' : '#757575'
                        } 0%, ${recommendation === 'SHORTLIST' ? '#38ef7d' : '#9e9e9e'
                        } 100%)`,
                    color: 'white',
                    p: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            border: '3px solid white',
                            boxShadow: 3,
                        }}
                    >
                        {anonymized ? '?' : candidate_id}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {anonymized ? `Candidate #${candidate_id}` : `Candidate ID: ${candidate_id}`}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip
                                icon={
                                    recommendation === 'SHORTLIST' ? <CheckIcon /> :
                                        recommendation === 'MAYBE' ? <WarningIcon /> : <CancelIcon />
                                }
                                label={recommendation}
                                size="small"
                                color={getRecommendationColor(recommendation)}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip
                                label={`${confidenceInfo.label} Confidence`}
                                size="small"
                                color={confidenceInfo.color}
                                variant="outlined"
                                sx={{ borderColor: 'white', color: 'white' }}
                            />
                            {audit_id && (
                                <Chip
                                    icon={<VerifiedIcon />}
                                    label={`Audit: ${audit_id}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderColor: 'white', color: 'white' }}
                                />
                            )}
                        </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={800}>
                            {overall_score}
                        </Typography>
                        <Typography variant="caption">Overall Score</Typography>
                    </Box>
                </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
                {/* Component Score Bar */}
                <ComponentScoreBar
                    componentScores={component_scores}
                    rubricWeights={explanation?.rubric_weights}
                />

                {/* WHY Summary */}
                {ai_recommendation?.justification && (
                    <Alert
                        severity={recommendation === 'SHORTLIST' ? 'success' : 'info'}
                        icon={<InfoIcon />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body2">
                            <strong>Why this candidate:</strong> {ai_recommendation.justification}
                        </Typography>
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Matched Skills Section */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 1,
                        }}
                        onClick={() => toggleSection('skills')}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            🎯 Skills Match ({matched_skills.length} matched, {missing_skills.length} missing)
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.skills ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={expandedSections.skills}>
                        <Stack spacing={2}>
                            {/* Matched Skills */}
                            {matched_skills.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                                        Matched Skills
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {matched_skills.map((skill, index) => (
                                            <Tooltip
                                                key={index}
                                                title={`Confidence: ${(skill.confidence * 100).toFixed(0)}% | Evidence snippets available`}
                                                arrow
                                            >
                                                <Chip
                                                    label={`${skill.skill} • ${skill.proficiency || 'N/A'}`}
                                                    color="success"
                                                    size="small"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Missing Skills */}
                            {missing_skills.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                                        Missing Skills
                                    </Typography>
                                    <Stack spacing={1}>
                                        {missing_skills.map((skill, index) => (
                                            <Paper
                                                key={index}
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    backgroundColor: 'error.lighter',
                                                    borderLeft: 3,
                                                    borderColor: 'error.main',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {skill.skill}
                                                    </Typography>
                                                    <Chip
                                                        label={`${skill.impact || 'Medium'} Impact`}
                                                        size="small"
                                                        color={getImpactColor(skill.impact)}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {skill.reason || 'Not found in resume'}
                                                </Typography>
                                                {skill.recommendation && (
                                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                        <strong>Recommendation:</strong> {skill.recommendation}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Collapse>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Experience Section */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 1,
                        }}
                        onClick={() => toggleSection('experience')}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            💼 Experience ({experience_analysis.relevant_years || 0} relevant years)
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.experience ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={expandedSections.experience}>
                        <Stack spacing={1.5}>
                            {experience_analysis.breakdown?.map((exp, index) => (
                                <Paper key={index} elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {exp.title || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {exp.company || 'N/A'} • {exp.duration || 'N/A'}
                                    </Typography>
                                    {exp.skills && (
                                        <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                                            {exp.skills.map((skill, idx) => (
                                                <Chip key={idx} label={skill} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    </Collapse>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Education Section */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 1,
                        }}
                        onClick={() => toggleSection('education')}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            🎓 Education
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.education ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={expandedSections.education}>
                        <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                            <Typography variant="body2" fontWeight={600}>
                                {education_analysis.degree || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {education_analysis.institution || 'N/A'}
                            </Typography>
                            {education_analysis.gpa && (
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    GPA: {education_analysis.gpa}
                                </Typography>
                            )}
                        </Paper>
                    </Collapse>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Projects Section */}
                {project_analysis.projects && project_analysis.projects.length > 0 && (
                    <>
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    mb: 1,
                                }}
                                onClick={() => toggleSection('projects')}
                            >
                                <Typography variant="h6" fontWeight={600}>
                                    🧾 Projects ({project_analysis.projects.length})
                                </Typography>
                                <IconButton size="small">
                                    {expandedSections.projects ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>

                            <Collapse in={expandedSections.projects}>
                                <Stack spacing={1.5}>
                                    {project_analysis.projects.slice(0, 3).map((proj, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {proj.name || `Project ${index + 1}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {proj.description || 'No description'}
                                            </Typography>
                                            {proj.technologies && (
                                                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                                                    {proj.technologies.map((tech, idx) => (
                                                        <Chip key={idx} label={tech} size="small" color="primary" variant="outlined" />
                                                    ))}
                                                </Stack>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            </Collapse>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                {/* AI Recommendation Section */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 1,
                        }}
                        onClick={() => toggleSection('aiRecommendation')}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            🤖 AI Recommendation
                        </Typography>
                        <IconButton size="small">
                            {expandedSections.aiRecommendation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={expandedSections.aiRecommendation}>
                        <Stack spacing={2}>
                            {ai_recommendation.strengths && (
                                <Box>
                                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                                        Strengths
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {ai_recommendation.strengths.map((strength, index) => (
                                            <Typography key={index} variant="body2">
                                                • {strength}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {ai_recommendation.concerns && (
                                <Box>
                                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                        Concerns
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {ai_recommendation.concerns.map((concern, index) => (
                                            <Typography key={index} variant="body2">
                                                • {concern}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {ai_recommendation.interview_questions && (
                                <Box>
                                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                                        Interview Focus Questions
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {ai_recommendation.interview_questions.map((question, index) => (
                                            <Typography key={index} variant="body2">
                                                {index + 1}. {question}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Collapse>
                </Box>

                {/* Provenance (Collapsible) */}
                {provenance && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    mb: 1,
                                }}
                                onClick={() => toggleSection('provenance')}
                            >
                                <Typography variant="subtitle2" color="text.secondary">
                                    View Provenance
                                </Typography>
                                <IconButton size="small">
                                    {expandedSections.provenance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>

                            <Collapse in={expandedSections.provenance}>
                                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Model: {provenance.model || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Generated: {provenance.timestamp || 'N/A'}
                                    </Typography>
                                </Paper>
                            </Collapse>
                        </Box>
                    </>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => onAction && onAction('shortlist', candidate_id)}
                        size="small"
                    >
                        Shortlist
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<EventIcon />}
                        onClick={() => onAction && onAction('schedule', candidate_id)}
                        size="small"
                    >
                        Schedule Interview
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AssignmentIcon />}
                        onClick={() => onAction && onAction('assessment', candidate_id)}
                        size="small"
                    >
                        Send Assessment
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => onAction && onAction('view_resume', candidate_id)}
                        size="small"
                    >
                        View Resume
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => onAction && onAction('download_pdf', candidate_id)}
                        size="small"
                    >
                        Download PDF
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default CandidateExplanationCard;
