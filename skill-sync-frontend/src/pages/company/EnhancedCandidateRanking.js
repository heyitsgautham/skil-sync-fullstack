import React, { useState, useEffect } from 'react';
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
    Grid,
    Alert,
    CircularProgress,
    Chip,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Stack,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Skeleton,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    FilterList as FilterListIcon,
    Sort as SortIcon,
    Compare as CompareIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import CandidateExplanationCard from '../../components/company/CandidateExplanationCard';
import CandidateComparison from '../../components/company/CandidateComparison';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base URL and auth interceptor
const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * EnhancedCandidateRanking Component
 * 
 * Enhanced version of intelligent ranking with:
 * - CandidateExplanationCard integration
 * - Side-by-side comparison modal
 * - Advanced filtering
 * - Multiple sort options
 * - Pagination
 * - Selection mode for comparison
 */
const EnhancedCandidateRanking = () => {
    const [internships, setInternships] = useState([]);
    const [selectedInternship, setSelectedInternship] = useState('');
    const [rankedCandidates, setRankedCandidates] = useState([]);
    const [explanations, setExplanations] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingExplanations, setLoadingExplanations] = useState(false);

    // Filter & Sort State
    const [filters, setFilters] = useState({
        minScore: 0,
        recommendation: 'all', // all, SHORTLIST, MAYBE, REJECT
        requiredSkills: [],
    });
    const [sortBy, setSortBy] = useState('overall_score'); // overall_score, skills, experience, confidence
    const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

    // Pagination
    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Comparison Mode
    const [comparisonMode, setComparisonMode] = useState(false);
    const [selectedForComparison, setSelectedForComparison] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [showComparisonModal, setShowComparisonModal] = useState(false);

    useEffect(() => {
        fetchInternships();
    }, []);

    const fetchInternships = async () => {
        try {
            const response = await api.get('/api/internship/my-posts');

            // Ensure internship_id exists, otherwise use id as fallback
            const processedInternships = (response.data || []).map(internship => ({
                ...internship,
                internship_id: internship.internship_id || internship.id
            }));

            setInternships(processedInternships);
        } catch (error) {
            toast.error('Failed to load internships');
        }
    };

    const handleRankCandidates = async () => {
        if (!selectedInternship) {
            toast.error('Please select an internship');
            return;
        }

        setLoading(true);
        setRankedCandidates([]);
        setExplanations({});

        try {
            const response = await api.post(
                `/api/filter/rank-candidates/${selectedInternship}?limit=50&only_applicants=false`,
                {}
            );

            const candidates = response.data.ranked_candidates || [];
            setRankedCandidates(candidates);

            // Check if precomputed explanations exist
            if (response.data.cache_status?.cached_count > 0) {
                toast.success(`Loaded ${candidates.length} candidates with cached explanations`);
            } else {
                toast.success(`Ranked ${candidates.length} candidates. Load explanations for details.`);
            }

            setPage(1);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to rank candidates');
        } finally {
            setLoading(false);
        }
    };

    const loadExplanationsForPage = async () => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const candidatesOnPage = filteredAndSortedCandidates.slice(startIndex, endIndex);

        setLoadingExplanations(true);

        try {
            const promises = candidatesOnPage.map(async (candidate) => {
                if (explanations[candidate.student_id]) {
                    return null; // Already loaded
                }

                try {
                    const response = await api.get(
                        `/api/recommendations/candidates/${candidate.student_id}/explanation?internship_id=${selectedInternship}`
                    );
                    return { id: candidate.student_id, data: response.data };
                } catch (err) {
                    console.error(`Failed to load explanation for candidate ${candidate.student_id}`, err);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const newExplanations = { ...explanations };

            results.forEach((result) => {
                if (result) {
                    newExplanations[result.id] = result.data;
                }
            });

            setExplanations(newExplanations);
        } finally {
            setLoadingExplanations(false);
        }
    };

    useEffect(() => {
        if (rankedCandidates.length > 0 && selectedInternship) {
            loadExplanationsForPage();
        }
    }, [page, rankedCandidates]);

    // Filter & Sort Logic
    const filteredAndSortedCandidates = rankedCandidates
        .filter((candidate) => {
            if (candidate.match_score < filters.minScore) return false;

            const explanation = explanations[candidate.student_id];
            if (filters.recommendation !== 'all' && explanation) {
                if (explanation.recommendation !== filters.recommendation) return false;
            }

            return true;
        })
        .sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'overall_score':
                    valueA = a.match_score || 0;
                    valueB = b.match_score || 0;
                    break;
                case 'skills':
                    valueA = explanations[a.student_id]?.component_scores?.skills || 0;
                    valueB = explanations[b.student_id]?.component_scores?.skills || 0;
                    break;
                case 'experience':
                    valueA = explanations[a.student_id]?.component_scores?.experience || 0;
                    valueB = explanations[b.student_id]?.component_scores?.experience || 0;
                    break;
                case 'confidence':
                    valueA = explanations[a.student_id]?.confidence || 0;
                    valueB = explanations[b.student_id]?.confidence || 0;
                    break;
                default:
                    valueA = a.match_score || 0;
                    valueB = b.match_score || 0;
            }

            return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
        });

    const totalPages = Math.ceil(filteredAndSortedCandidates.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const candidatesOnPage = filteredAndSortedCandidates.slice(startIndex, startIndex + itemsPerPage);

    // Comparison Functions
    const handleToggleComparison = (candidateId) => {
        if (selectedForComparison.includes(candidateId)) {
            setSelectedForComparison(selectedForComparison.filter((id) => id !== candidateId));
        } else {
            if (selectedForComparison.length >= 2) {
                toast.error('You can only compare 2 candidates at a time');
                return;
            }
            setSelectedForComparison([...selectedForComparison, candidateId]);
        }
    };

    const handleCompare = async () => {
        if (selectedForComparison.length !== 2) {
            toast.error('Please select exactly 2 candidates to compare');
            return;
        }

        try {
            const response = await api.get(
                `/api/recommendations/internship/${selectedInternship}/compare?candidates=${selectedForComparison[0]},${selectedForComparison[1]}`
            );
            setComparisonData(response.data);
            setShowComparisonModal(true);
        } catch (error) {
            toast.error('Failed to generate comparison');
        }
    };

    const handleAction = async (action, candidateId) => {
        toast.success(`Action "${action}" for candidate ${candidateId} - Feature coming soon!`);
        // Implement actions: shortlist, schedule, assessment, view_resume, download_pdf
    };

    return (
        <Layout>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={800} gutterBottom>
                        Enhanced Candidate Ranking
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        AI-powered explainable candidate matching with detailed analysis
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
                                    onChange={(e) => setSelectedInternship(e.target.value)}
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
                </Paper>

                {/* Filters & Sort */}
                {rankedCandidates.length > 0 && (
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Min Score
                                </Typography>
                                <Select
                                    fullWidth
                                    value={filters.minScore || 0}
                                    onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                                >
                                    <MenuItem value={0}>All Scores</MenuItem>
                                    <MenuItem value={60}>60+</MenuItem>
                                    <MenuItem value={70}>70+</MenuItem>
                                    <MenuItem value={80}>80+</MenuItem>
                                </Select>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Recommendation
                                </Typography>
                                <Select
                                    fullWidth
                                    value={filters.recommendation || 'all'}
                                    onChange={(e) => setFilters({ ...filters, recommendation: e.target.value })}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="SHORTLIST">Shortlist</MenuItem>
                                    <MenuItem value="MAYBE">Maybe</MenuItem>
                                    <MenuItem value="REJECT">Reject</MenuItem>
                                </Select>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Sort By
                                </Typography>
                                <Select
                                    fullWidth
                                    value={sortBy || 'overall_score'}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <MenuItem value="overall_score">Overall Score</MenuItem>
                                    <MenuItem value="skills">Skills Match</MenuItem>
                                    <MenuItem value="experience">Experience</MenuItem>
                                    <MenuItem value="confidence">Confidence</MenuItem>
                                </Select>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Order
                                </Typography>
                                <Select
                                    fullWidth
                                    value={sortOrder || 'desc'}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <MenuItem value="desc">Highest First</MenuItem>
                                    <MenuItem value="asc">Lowest First</MenuItem>
                                </Select>
                            </Grid>
                        </Grid>

                        {/* Comparison Mode Toggle */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={comparisonMode}
                                        onChange={(e) => {
                                            setComparisonMode(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedForComparison([]);
                                            }
                                        }}
                                    />
                                }
                                label="Comparison Mode"
                            />
                            {comparisonMode && (
                                <>
                                    <Chip
                                        label={`${selectedForComparison.length}/2 selected`}
                                        color={selectedForComparison.length === 2 ? 'success' : 'default'}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<CompareIcon />}
                                        onClick={handleCompare}
                                        disabled={selectedForComparison.length !== 2}
                                    >
                                        Compare Selected
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Paper>
                )}

                {/* Results Summary */}
                {rankedCandidates.length > 0 && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Showing {candidatesOnPage.length} of {filteredAndSortedCandidates.length} candidates
                        (Total: {rankedCandidates.length})
                    </Alert>
                )}

                {/* Candidate Cards */}
                <Stack spacing={3} sx={{ mb: 4 }}>
                    {loadingExplanations && candidatesOnPage.map((_, index) => (
                        <Skeleton key={index} variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                    ))}

                    {!loadingExplanations && candidatesOnPage.map((candidate) => {
                        const explanation = explanations[candidate.student_id];

                        if (comparisonMode) {
                            return (
                                <Box
                                    key={candidate.student_id}
                                    sx={{
                                        position: 'relative',
                                        border: selectedForComparison.includes(candidate.student_id) ? '3px solid #11998e' : 'none',
                                        borderRadius: 3,
                                        p: selectedForComparison.includes(candidate.student_id) ? 1 : 0,
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedForComparison.includes(candidate.student_id)}
                                                onChange={() => handleToggleComparison(candidate.student_id)}
                                            />
                                        }
                                        label="Select for comparison"
                                        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                                    />
                                    {explanation ? (
                                        <CandidateExplanationCard
                                            explanation={explanation}
                                            onAction={handleAction}
                                        />
                                    ) : (
                                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                                    )}
                                </Box>
                            );
                        }

                        return explanation ? (
                            <CandidateExplanationCard
                                key={candidate.student_id}
                                explanation={explanation}
                                onAction={handleAction}
                            />
                        ) : (
                            <Skeleton key={candidate.student_id} variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                        );
                    })}
                </Stack>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, value) => setPage(value)}
                            color="primary"
                            size="large"
                        />
                    </Box>
                )}

                {/* Comparison Modal */}
                <Dialog
                    open={showComparisonModal}
                    onClose={() => setShowComparisonModal(false)}
                    maxWidth="xl"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Candidate Comparison</Typography>
                            <IconButton onClick={() => setShowComparisonModal(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {comparisonData && (
                            <CandidateComparison
                                comparison={comparisonData}
                                onExport={() => toast.success('Export feature coming soon!')}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </Container>
        </Layout>
    );
};

export default EnhancedCandidateRanking;
