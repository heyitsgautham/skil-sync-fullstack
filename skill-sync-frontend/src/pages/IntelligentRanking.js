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
    Checkbox,
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
import EmailIcon from '@mui/icons-material/Email';
import Layout from '../components/Layout';
import FlaggedCandidatesModal from '../components/FlaggedCandidatesModal';
import SendEmailModal from '../components/SendEmailModal';
import CandidateFilters from '../components/CandidateFilters';
import ActiveFilters from '../components/ActiveFilters';
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

    // Email modal state
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false); // Track if in selection mode

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

    const [anonymizationEnabled, setAnonymizationEnabled] = useState(false); // Track anonymization status

    // Filter state
    const [activeFilters, setActiveFilters] = useState({});
    const [totalBeforeFilter, setTotalBeforeFilter] = useState(0);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [paginatedCandidates, setPaginatedCandidates] = useState([]);

    // Track if all are expanded
    const [allExpanded, setAllExpanded] = useState(false);


    useEffect(() => {
        fetchInternships();
    }, []);

    // Auto-refresh when toggle changes (if internship is selected and we already have results)
    useEffect(() => {
        if (selectedInternship && rankedCandidates.length > 0) {
            handleRankCandidates();
        }
    }, [onlyApplicants]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pagination effect - update displayed candidates when page or pageSize changes
    useEffect(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setPaginatedCandidates(rankedCandidates.slice(startIndex, endIndex));
    }, [rankedCandidates, page, pageSize]);

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

    const fetchInternshipSkills = async (internshipId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/api/internship/${internshipId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                // const allSkills = [...new Set([...required, ...preferred])]; // Remove duplicates - not used
            }
        } catch (error) {
            console.error('Error fetching internship skills:', error);
            // Don't show error toast, just use default skills
        }
    };

    const handleApplyFilters = (filters) => {
        setActiveFilters(filters);
        handleRankCandidates(filters);
    };

    const handleResetFilters = () => {
        setActiveFilters({});
        handleRankCandidates({});
    };

    const handleRankCandidates = async (filters = {}) => {
        if (!selectedInternship) {
            toast.error('Please select an internship');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            console.log('🚀 Calling rank-candidates API with internship ID:', selectedInternship);
            console.log('👥 Only applicants mode:', onlyApplicants);
            console.log('🔍 Filters:', filters);

            // Build query parameters
            const params = new URLSearchParams({
                limit: '50',
                only_applicants: onlyApplicants.toString()
            });

            // Add filter parameters
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                console.log(`🔍 Filter param: ${key} = ${value} (type: ${typeof value})`);
                // Handle boolean values explicitly
                if (typeof value === 'boolean') {
                    params.append(key, value.toString());
                    console.log(`✅ Added boolean filter: ${key}=${value.toString()}`);
                } else if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                    console.log(`✅ Added filter: ${key}=${value.toString()}`);
                }
            });

            console.log(`🌐 Full API URL: http://localhost:8000/api/filter/rank-candidates/${selectedInternship}?${params.toString()}`);

            const response = await axios.post(
                `http://localhost:8000/api/filter/rank-candidates/${selectedInternship}?${params.toString()}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('📊 Rank candidates response:', response.data);
            console.log('👥 Total candidates:', response.data.total_candidates);
            console.log('📊 Total before filter:', response.data.total_before_filter);
            console.log('🏆 Ranked candidates count:', response.data.ranked_candidates?.length);
            console.log('🔒 Anonymization enabled:', response.data.anonymization_enabled);

            // Log flagged candidates in results
            const flaggedInResults = response.data.ranked_candidates?.filter(c => c.is_flagged) || [];
            console.log(`🚩 Flagged candidates in results: ${flaggedInResults.length}`);
            if (flaggedInResults.length > 0) {
                console.log('🚩 Flagged candidate IDs:', flaggedInResults.map(c => c.candidate_id));
            }

            setRankedCandidates(response.data.ranked_candidates || []);
            setScoringInfo(response.data.scoring_info || null);
            setAnonymizationEnabled(response.data.anonymization_enabled || false);
            setActiveFilters(filters);
            setTotalBeforeFilter(response.data.total_before_filter || response.data.total_candidates);

            // Reset to first page when new results come in
            setPage(1);

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
                const filterInfo = response.data.filters_applied?.length > 0
                    ? ` (${response.data.filters_applied.length} filters applied)`
                    : '';
                toast.success(`✨ Ranked ${response.data.ranked_candidates.length} candidates successfully!${filterInfo}`);
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

            // First, get resume metadata
            const metadataResponse = await axios.get(
                `http://localhost:8000/api/recommendations/resume/${studentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { internship_id: selectedInternship }
                }
            );

            const { anonymized, storage_type, url } = metadataResponse.data;
            const isAnonymized = anonymized === true;

            // If it's S3 storage (old flow), use direct URL
            if (storage_type === 's3') {
                window.open(url, '_blank');
                toast.dismiss('resume-fetch');
                const displayName = anonymizationEnabled ? 'Anonymous Candidate' : studentName;
                toast.success(`📄 Opening ${displayName}'s resume`, { duration: 3000 });
                return;
            }

            // For API storage, download PDF with authentication and display as blob
            toast.loading('Loading PDF...', { id: 'resume-fetch' });

            const pdfResponse = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // Important: get binary data
            });

            // Create blob URL and open in new tab
            const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');

            // Clean up blob URL after a delay
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

            toast.dismiss('resume-fetch');

            // Show appropriate message based on anonymization
            const displayName = anonymizationEnabled ? 'Anonymous Candidate' : studentName;
            if (isAnonymized) {
                toast.success(`🔒 Opening anonymized resume`, {
                    duration: 4000,
                    description: 'Names, emails, and phone numbers have been redacted',
                });
            } else {
                toast.success(`📄 Opening ${displayName}'s resume`, {
                    duration: 3000,
                });
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
        setAllExpanded(true);
    }, [rankedCandidates]);

    const handleCollapseAll = useCallback(() => {
        const allCollapsed = {};
        rankedCandidates.forEach((candidate, index) => {
            allCollapsed[`score-${index}`] = false;
            allCollapsed[`skills-${index}`] = false;
            allCollapsed[`ai-${index}`] = false;
        });
        setExpandedAccordions(allCollapsed);
        setAllExpanded(false);
    }, [rankedCandidates]);

    const handleToggleExpandAll = useCallback(() => {
        if (allExpanded) {
            handleCollapseAll();
        } else {
            handleExpandAll();
        }
    }, [allExpanded, handleExpandAll, handleCollapseAll]);

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

    // Email sending handlers
    const handleToggleCandidateSelection = (candidate) => {
        setSelectedCandidates(prev => {
            const isSelected = prev.some(c => c.candidate_id === candidate.candidate_id);
            if (isSelected) {
                return prev.filter(c => c.candidate_id !== candidate.candidate_id);
            } else {
                return [...prev, candidate];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedCandidates.length === rankedCandidates.length) {
            setSelectedCandidates([]);
        } else {
            setSelectedCandidates(rankedCandidates);
        }
    };

    const handleEnableSelectionMode = () => {
        setSelectionMode(true);
        setSelectedCandidates([]);
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedCandidates([]);
        toast('Selection cancelled', { icon: 'ℹ️' });
    };

    const handleOpenEmailModal = () => {
        if (!selectionMode) {
            // First click - enable selection mode
            handleEnableSelectionMode();
            toast.success('Selection mode enabled. Select candidates to send emails.');
            return;
        }

        // Second click (when in selection mode) - open email modal
        if (selectedCandidates.length === 0) {
            toast.error('Please select at least one candidate');
            return;
        }
        setEmailModalOpen(true);
    };

    const handleCloseEmailModal = () => {
        setEmailModalOpen(false);
    };

    const handleEmailSendComplete = (result) => {
        toast.success(`Successfully sent ${result.emails_sent} email(s)!`);
        setSelectedCandidates([]);
        setSelectionMode(false);
        setEmailModalOpen(false);
    };

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {/* Internship Selector */}
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

                {/* Advanced Filters - Always visible and collapsible */}
                <CandidateFilters
                    onApplyFilters={handleApplyFilters}
                    onReset={handleResetFilters}
                    scoringInfo={scoringInfo}
                />

                {/* Active Filters Display */}
                {rankedCandidates.length > 0 && Object.keys(activeFilters).length > 0 && (
                    <ActiveFilters
                        filters={activeFilters}
                        totalCandidates={rankedCandidates.length}
                        totalBeforeFilter={totalBeforeFilter}
                    />
                )}

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
                                {selectionMode && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={handleCancelSelection}
                                        sx={{ minWidth: 120 }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    startIcon={<EmailIcon />}
                                    onClick={handleOpenEmailModal}
                                    sx={{
                                        minWidth: 200,
                                        borderColor: selectionMode ? '#667eea' : '#4caf50',
                                        color: selectionMode ? '#667eea' : '#4caf50',
                                        '&:hover': {
                                            borderColor: selectionMode ? '#5568d3' : '#45a049',
                                            backgroundColor: selectionMode ? 'rgba(102, 126, 234, 0.04)' : 'rgba(76, 175, 80, 0.04)',
                                        },
                                    }}
                                >
                                    {selectionMode
                                        ? `Send Email (${selectedCandidates.length} selected)`
                                        : 'Send Clustered Email'
                                    }
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleToggleExpandAll}
                                >
                                    {allExpanded ? 'Collapse All' : 'Expand All'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleExportClick}
                                    disabled={exportLoading || rankedCandidates.length === 0}
                                    sx={{
                                        minWidth: 40,
                                        px: 1,
                                        borderColor: '#4caf50',
                                        color: '#4caf50',
                                        '&:hover': {
                                            borderColor: '#45a049',
                                            backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                        },
                                    }}
                                >
                                    {exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
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

                        {/* Select All Checkbox - Only visible in selection mode */}
                        {selectionMode && (
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Checkbox
                                    checked={selectedCandidates.length === rankedCandidates.length && rankedCandidates.length > 0}
                                    indeterminate={selectedCandidates.length > 0 && selectedCandidates.length < rankedCandidates.length}
                                    onChange={handleSelectAll}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    {selectedCandidates.length === 0
                                        ? 'Select candidates to send emails'
                                        : `${selectedCandidates.length} candidate${selectedCandidates.length > 1 ? 's' : ''} selected`
                                    }
                                </Typography>
                            </Box>
                        )}

                        {paginatedCandidates.map((candidate, index) => {
                            const actualIndex = (page - 1) * pageSize + index; // Calculate actual index in full list
                            return (
                                <Card
                                    key={candidate.candidate_id}
                                    sx={{
                                        mb: 3,
                                        border: selectionMode && selectedCandidates.some(c => c.candidate_id === candidate.candidate_id)
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
                                                        checked={selectedCandidates.some(c => c.candidate_id === candidate.candidate_id)}
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
                                                                        '&:hover': anonymizationEnabled ? {} : {
                                                                            backgroundColor: '#d32f2f',
                                                                        }
                                                                    }}
                                                                    onClick={anonymizationEnabled ? undefined : () => handleFlaggedClick(candidate)}
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
                                                                        '&:hover': anonymizationEnabled ? {} : {
                                                                            color: '#d32f2f',
                                                                        }
                                                                    }}
                                                                    onClick={anonymizationEnabled ? undefined : () => handleFlaggedClick(candidate)}
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
                                                        setExpandedAccordions(prev => ({
                                                            ...prev,
                                                            [`skills-${actualIndex}`]: !prev[`skills-${actualIndex}`]
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
                                                        setExpandedAccordions(prev => ({
                                                            ...prev,
                                                            [`score-${actualIndex}`]: !prev[`score-${actualIndex}`]
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
                                        {expandedAccordions[`skills-${actualIndex}`] && (
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
                                                                                py: 2
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
                                                                                py: 2
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        )}

                                                        {/* No Required Skills */}
                                                        {(!candidate.match_details.matched_required_skills || candidate.match_details.matched_required_skills.length === 0) &&
                                                            (!candidate.match_details.missing_required_skills || candidate.match_details.missing_required_skills.length === 0) && (
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
                                                                                py: 2
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
                                                                                py: 2
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        )}

                                                        {/* No Preferred Skills */}
                                                        {(!candidate.match_details.matched_preferred_skills || candidate.match_details.matched_preferred_skills.length === 0) &&
                                                            (!candidate.match_details.missing_preferred_skills || candidate.match_details.missing_preferred_skills.length === 0) && (
                                                                <Typography variant="body1" color="text.secondary">
                                                                    No preferred skills specified
                                                                </Typography>
                                                            )}
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        )}

                                    </CardContent>
                                </Card>
                            )
                        })}

                        {/* Pagination Controls */}
                        {rankedCandidates.length > 0 && (
                            <Box sx={{ mt: 4, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, rankedCandidates.length)} of {rankedCandidates.length} candidates
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Per Page</InputLabel>
                                        <Select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(e.target.value);
                                                setPage(1); // Reset to first page
                                            }}
                                            label="Per Page"
                                        >
                                            <MenuItem value={5}>5 per page</MenuItem>
                                            <MenuItem value={10}>10 per page</MenuItem>
                                            <MenuItem value={25}>25 per page</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                                        <Typography variant="body2">
                                            Page {page} of {Math.ceil(rankedCandidates.length / pageSize)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={page >= Math.ceil(rankedCandidates.length / pageSize)}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </Button>
                                </Box>
                            </Box>
                        )}
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

            {/* Email Modal */}
            <SendEmailModal
                open={emailModalOpen}
                onClose={handleCloseEmailModal}
                selectedCandidates={selectedCandidates}
                internshipTitle={selectedInternshipData?.title || 'Internship'}
                internshipId={selectedInternship}
                onSendComplete={handleEmailSendComplete}
            />
        </Layout>
    );
};

export default IntelligentRanking;