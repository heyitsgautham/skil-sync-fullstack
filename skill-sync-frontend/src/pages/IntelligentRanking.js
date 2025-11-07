import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Divider,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import TableViewIcon from '@mui/icons-material/TableView';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import WarningIcon from '@mui/icons-material/Warning';
import Layout from '../components/Layout';
import FlaggedCandidatesModal from '../components/FlaggedCandidatesModal';
import axios from 'axios';
import toast from 'react-hot-toast';

const IntelligentRanking = () => {
    const [internships, setInternships] = useState([]);
    const [selectedInternship, setSelectedInternship] = useState('');
    const [selectedInternshipData, setSelectedInternshipData] = useState(null);
    const [rankedCandidates, setRankedCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingInternships, setLoadingInternships] = useState(true);
    const [scoringInfo, setScoringInfo] = useState(null);
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [expandedAccordions, setExpandedAccordions] = useState({});
    const [onlyApplicants, setOnlyApplicants] = useState(false); // Default to showing all candidates
    
    // Flagged candidates modal state
    const [flaggedModalOpen, setFlaggedModalOpen] = useState(false);
    const [selectedFlaggedCandidate, setSelectedFlaggedCandidate] = useState(null);

    // Helper function to ensure URL has proper protocol
    const ensureHttpProtocol = (url) => {
        if (!url) return url;
        // If URL already has http:// or https://, return as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Otherwise, add https://
        return `https://${url}`;
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    // Auto-refresh when toggle changes (if internship is selected and we already have results)
    useEffect(() => {
        if (selectedInternship && rankedCandidates.length > 0) {
            handleRankCandidates();
        }
    }, [onlyApplicants]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchInternships = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/internship/my-posts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure internship_id exists, otherwise use id as fallback
            const processedInternships = (response.data || []).map(internship => ({
                ...internship,
                internship_id: internship.internship_id || internship.id
            }));
            setInternships(processedInternships);
        } catch (error) {
            console.error('Error fetching internships:', error);
            toast.error('Failed to load internships');
        } finally {
            setLoadingInternships(false);
        }
    };

    const handleRankCandidates = async () => {
        if (!selectedInternship) {
            toast.error('Please select an internship');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            console.log('🚀 Calling rank-candidates API with internship ID:', selectedInternship);
            console.log('👥 Only applicants mode:', onlyApplicants);
            const response = await axios.post(
                `http://localhost:8000/api/filter/rank-candidates/${selectedInternship}?limit=50&only_applicants=${onlyApplicants}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('📊 Rank candidates response:', response.data);
            console.log('👥 Total candidates:', response.data.total_candidates);
            console.log('🏆 Ranked candidates count:', response.data.ranked_candidates?.length);

            setRankedCandidates(response.data.ranked_candidates || []);
            setScoringInfo(response.data.scoring_info || null);

            // Reset accordion state - ALL COLLAPSED by default
            const initialState = {};
            // Explicitly set all to collapsed for better performance
            response.data.ranked_candidates?.forEach((_, idx) => {
                initialState[`score-${idx}`] = false;
                initialState[`skills-${idx}`] = false;
                initialState[`ai-${idx}`] = false;
            });
            setExpandedAccordions(initialState);

            if (response.data.ranked_candidates?.length > 0) {
                toast.success(`✨ Ranked ${response.data.ranked_candidates.length} candidates successfully!`);
            } else {
                const message = response.data.total_candidates === 0
                    ? 'No candidates found with uploaded resumes'
                    : 'No matching candidates found for this internship';
                toast(message, { icon: 'ℹ️' });
            }
        } catch (error) {
            console.error('Error ranking candidates:', error);
            toast.error(error.response?.data?.detail || 'Failed to rank candidates');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4caf50'; // Green
        if (score >= 60) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    const getMatchLabel = (score) => {
        if (score >= 80) return 'Strong Match';
        if (score >= 60) return 'Moderate Match';
        return 'Weak Match';
    };

    const handleExportClick = (event) => {
        setExportMenuAnchor(event.currentTarget);
    };

    const handleExportClose = () => {
        setExportMenuAnchor(null);
    };

    const handleViewResume = async (studentId, studentName) => {
        try {
            toast.loading('Fetching resume...', { id: 'resume-fetch' });

            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/recommendations/resume/${studentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { internship_id: selectedInternship }
                }
            );

            toast.dismiss('resume-fetch');

            // Determine resume type for user feedback
            const resumeType = response.data.is_tailored ? '📝 tailored' : 'base';
            const resumeIcon = response.data.is_tailored ? '📝' : '📄';

            if (response.data.storage_type === 's3') {
                // Open S3 presigned URL in new tab
                window.open(response.data.url, '_blank');

                // Show appropriate message based on resume type
                if (response.data.is_tailored) {
                    toast.success(`${resumeIcon} Opening ${studentName}'s tailored resume for this internship`, {
                        duration: 4000,
                    });
                } else {
                    // Check if message indicates this is a fallback
                    if (response.data.message && response.data.message.includes('active base resume')) {
                        toast.success(`${resumeIcon} Opening ${studentName}'s base resume`, {
                            duration: 3000,
                            icon: '📄',
                        });
                    } else {
                        toast.success(`${resumeIcon} Opening ${studentName}'s resume`, {
                            duration: 3000,
                        });
                    }
                }
            } else if (response.data.storage_type === 'local') {
                // For local storage, we need a different endpoint to serve the file
                toast('Resume stored locally. Please contact admin.', { icon: 'ℹ️' });
            }
        } catch (error) {
            toast.dismiss('resume-fetch');
            console.error('Error fetching resume:', error);
            toast.error(error.response?.data?.detail || 'Failed to fetch resume');
        }
    };

    const handleExport = async (format) => {
        if (!selectedInternship) {
            toast.error('Please select an internship first');
            return;
        }

        if (rankedCandidates.length === 0) {
            toast.error('Please rank candidates first');
            return;
        }

        setExportLoading(true);
        handleExportClose();

        try {
            const token = localStorage.getItem('token');
            const exportType = 'filtered'; // Export all filtered results

            const response = await axios.get(
                `http://localhost:8000/api/filter/export-candidates/${selectedInternship}`,
                {
                    params: {
                        format: format,
                        export_type: exportType,
                        only_applicants: false
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const internshipTitle = selectedInternshipData?.title || 'Internship';
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const filename = `${internshipTitle.replace(/ /g, '_')}_Candidates_${date}.${format}`;

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`✅ Exported ${rankedCandidates.length} candidates to ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.detail || 'Failed to export candidates');
        } finally {
            setExportLoading(false);
        }
    };

    const handleExpandAll = useCallback(() => {
        const allExpanded = {};
        rankedCandidates.forEach((candidate, index) => {
            allExpanded[`score-${index}`] = true;
            allExpanded[`skills-${index}`] = true;
            allExpanded[`ai-${index}`] = true;
        });
        setExpandedAccordions(allExpanded);
    }, [rankedCandidates]);

    const handleCollapseAll = useCallback(() => {
        const allCollapsed = {};
        rankedCandidates.forEach((candidate, index) => {
            allCollapsed[`score-${index}`] = false;
            allCollapsed[`skills-${index}`] = false;
            allCollapsed[`ai-${index}`] = false;
        });
        setExpandedAccordions(allCollapsed);
    }, [rankedCandidates]);

    // Optimized toggle handler
    const handleAccordionChange = useCallback((key) => (e, isExpanded) => {
        setExpandedAccordions(prev => ({
            ...prev,
            [key]: isExpanded
        }));
    }, []);

    const handleFlaggedClick = (candidate) => {
        setSelectedFlaggedCandidate(candidate);
        setFlaggedModalOpen(true);
    };

    const handleCloseFlaggedModal = () => {
        setFlaggedModalOpen(false);
        setSelectedFlaggedCandidate(null);
    };

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PsychologyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            AI-Powered Candidate Ranking
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Intelligent resume filtering system powered by Google Gemini AI and semantic matching
                    </Typography>
                </Box>

                {/* Internship Selector */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 8 }}>
                            <FormControl fullWidth>
                                <InputLabel>Select Internship</InputLabel>
                                <Select
                                    value={selectedInternship || ''}
                                    label="Select Internship"
                                    onChange={(e) => {
                                        const value = e.target.value || '';
                                        setSelectedInternship(value);
                                        // Store the full internship data for later use
                                        const internshipData = internships.find(i => i.internship_id === value);
                                        setSelectedInternshipData(internshipData);
                                    }}
                                    disabled={loadingInternships}
                                >
                                    {internships.map((internship) => (
                                        <MenuItem key={internship.internship_id} value={internship.internship_id}>
                                            {internship.title} - {internship.location || 'Remote'}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleRankCandidates}
                                disabled={!selectedInternship || loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                                sx={{ height: 56 }}
                            >
                                {loading ? 'Analyzing...' : 'Rank Candidates'}
                            </Button>
                        </Grid>
                    </Grid>

                    {/* View Mode Toggle */}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={onlyApplicants ? "👥 Applicants Only" : "🌐 All Candidates"}
                            color={onlyApplicants ? "primary" : "default"}
                            onClick={() => setOnlyApplicants(!onlyApplicants)}
                            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {onlyApplicants
                                ? "Showing only students who applied (includes tailored resumes)"
                                : "Showing all potential candidates (discovery mode)"}
                        </Typography>
                    </Box>

                    {/* Scoring Methodology Info */}
                    {scoringInfo && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Scoring Methodology: {scoringInfo.methodology}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {Object.entries(scoringInfo.components).map(([key, value]) => (
                                    <Chip
                                        key={key}
                                        label={`${key.replace(/_/g, ' ')}: ${value}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Alert>
                    )}
                </Paper>

                {/* Ranked Candidates List */}
                {rankedCandidates.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h5">
                                    <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Top Candidates ({rankedCandidates.length})
                                </Typography>
                                {rankedCandidates.filter(c => c.scoring_breakdown?.has_tailored).length > 0 && (
                                    <Chip
                                        label={`✨ ${rankedCandidates.filter(c => c.scoring_breakdown?.has_tailored).length} with tailored resumes`}
                                        sx={{
                                            backgroundColor: '#9c27b0',
                                            color: 'white',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Export and Expand/Collapse Buttons */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleExpandAll}
                                >
                                    Expand All
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleCollapseAll}
                                >
                                    Collapse All
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                                    onClick={handleExportClick}
                                    disabled={exportLoading || rankedCandidates.length === 0}
                                    sx={{ minWidth: 150 }}
                                >
                                    {exportLoading ? 'Exporting...' : 'Export Data'}
                                </Button>
                                <Menu
                                    anchorEl={exportMenuAnchor}
                                    open={Boolean(exportMenuAnchor)}
                                    onClose={handleExportClose}
                                >
                                    <MenuItem onClick={() => handleExport('csv')}>
                                        <ListItemIcon>
                                            <DescriptionIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Export as CSV" secondary="Excel compatible" />
                                    </MenuItem>
                                    <MenuItem onClick={() => handleExport('xlsx')}>
                                        <ListItemIcon>
                                            <TableViewIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Export as XLSX" secondary="Native Excel with formatting" />
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Box>

                        {rankedCandidates.map((candidate, index) => (
                            <Card
                                key={candidate.candidate_id}
                                sx={{
                                    mb: 3,
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <CardContent>
                                    {/* Header with Rank and Score */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '1.5rem',
                                                mr: 2,
                                            }}
                                        >
                                            #{index + 1}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {candidate.candidate_name}
                                                </Typography>
                                                {candidate.scoring_breakdown?.has_tailored && (
                                                    <Chip
                                                        label="✨ Tailored Resume"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#9c27b0',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem',
                                                            height: 24,
                                                        }}
                                                    />
                                                )}
                                                {/* FLAGGED BADGE */}
                                                {candidate.is_flagged && (
                                                    <>
                                                        <Chip
                                                            icon={<WarningIcon sx={{ color: 'white !important' }} />}
                                                            label="FLAGGED"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#f44336',
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.75rem',
                                                                height: 24,
                                                            }}
                                                        />
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: '#f44336',
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                fontWeight: 'bold',
                                                                '&:hover': {
                                                                    color: '#d32f2f',
                                                                }
                                                            }}
                                                            onClick={() => handleFlaggedClick(candidate)}
                                                        >
                                                            {candidate.flag_reason_text}
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                ID: {candidate.candidate_id}
                                            </Typography>
                                        </Box>

                                        {/* Social Profile Links */}
                                        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                                            {candidate.linkedin_url && (
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
                                                        '&:hover': {
                                                            borderColor: '#005582',
                                                            backgroundColor: 'rgba(0, 119, 181, 0.04)',
                                                        },
                                                    }}
                                                >
                                                    LinkedIn
                                                </Button>
                                            )}
                                            {candidate.github_url && (
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
                                                        '&:hover': {
                                                            borderColor: '#000',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                        },
                                                    }}
                                                >
                                                    GitHub
                                                </Button>
                                            )}
                                        </Box>

                                        <Chip
                                            label={`${candidate.match_score.toFixed(1)}% Match`}
                                            sx={{
                                                backgroundColor: getScoreColor(candidate.match_score),
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                px: 2,
                                            }}
                                        />
                                    </Box>

                                    {/* Match Label */}
                                    <Alert
                                        severity={candidate.match_score >= 80 ? 'success' : candidate.match_score >= 60 ? 'warning' : 'error'}
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {getMatchLabel(candidate.match_score)}
                                        </Typography>
                                    </Alert>

                                    {/* Component Scores */}
                                    <Accordion
                                        expanded={expandedAccordions[`score-${index}`] || false}
                                        onChange={handleAccordionChange(`score-${index}`)}
                                        TransitionProps={{ timeout: 200, unmountOnExit: true }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                📊 Score Breakdown
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
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
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Skills Match Details */}
                                    <Accordion
                                        expanded={expandedAccordions[`skills-${index}`] || false}
                                        onChange={handleAccordionChange(`skills-${index}`)}
                                        TransitionProps={{ timeout: 200, unmountOnExit: true }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                💼 Skills Analysis
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {/* Matched Skills */}
                                            {candidate.match_details.matched_skills?.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            Matched Skills ({candidate.match_details.matched_skills.length})
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {candidate.match_details.matched_skills.map((skill) => (
                                                            <Chip
                                                                key={skill}
                                                                label={skill}
                                                                size="small"
                                                                sx={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Missing Skills */}
                                            {candidate.match_details.missing_skills?.length > 0 && (
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            Missing Skills ({candidate.match_details.missing_skills.length})
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {candidate.match_details.missing_skills.map((skill) => (
                                                            <Chip
                                                                key={skill}
                                                                label={skill}
                                                                size="small"
                                                                sx={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* AI Explanation */}
                                    <Accordion
                                        expanded={expandedAccordions[`ai-${index}`] || false}
                                        onChange={handleAccordionChange(`ai-${index}`)}
                                        TransitionProps={{ timeout: 200, unmountOnExit: true }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                🤖 AI Analysis & Recommendation
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Paper
                                                sx={{
                                                    p: 2,
                                                    backgroundColor: '#f9fafb',
                                                    borderLeft: '4px solid #667eea',
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                                    {candidate.explanation}
                                                </Typography>
                                            </Paper>
                                        </AccordionDetails>
                                    </Accordion>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Action Buttons */}
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => handleViewResume(candidate.student_id, candidate.student_name)}
                                                startIcon={<DescriptionIcon />}
                                            >
                                                View Resume
                                            </Button>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                color="primary"
                                                onClick={() => toast.success('Candidate shortlisted!')}
                                            >
                                                Shortlist
                                            </Button>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                color="success"
                                                onClick={() => toast.success('Interview scheduling feature coming soon!')}
                                            >
                                                Schedule Interview
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Empty State */}
                {!loading && rankedCandidates.length === 0 && selectedInternship && (
                    <Paper sx={{ p: 6, textAlign: 'center' }}>
                        <PsychologyIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No candidates ranked yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Click "Rank Candidates" to see AI-powered intelligent rankings
                        </Typography>
                    </Paper>
                )}
            </Container>

            {/* Flagged Candidates Modal */}
            {selectedFlaggedCandidate && (
                <FlaggedCandidatesModal
                    open={flaggedModalOpen}
                    onClose={handleCloseFlaggedModal}
                    candidateId={selectedFlaggedCandidate.candidate_id}
                    flaggedWith={selectedFlaggedCandidate.flagged_with}
                    flagReasons={selectedFlaggedCandidate.flag_reasons}
                />
            )}
        </Layout>
    );
};

export default IntelligentRanking;
