import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Alert, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import Layout from '../components/Layout';
import { InternshipListSkeleton } from '../components/SkeletonLoader';
import FilterPanel from '../components/FilterPanel';
import PaginationControls from '../components/PaginationControls';
import SortControls from '../components/SortControls';
import NoRecommendations from './recommendations/NoRecommendations';
import RecommendationCard from './recommendations/RecommendationCard';
import ResumeTip from './recommendations/ResumeTip';

const RecommendedInternships = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Pagination state
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize')) || 5);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filter state
    const [filters, setFilters] = useState({
        minScore: parseInt(searchParams.get('minScore')) || 0,
        maxScore: parseInt(searchParams.get('maxScore')) || 100,
        skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
        location: searchParams.get('location') || '',
        experienceLevel: searchParams.get('experienceLevel') || '',
        daysPosted: searchParams.get('daysPosted') || '',
    });

    // Sort state
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'score');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

    const [recommendations, setRecommendations] = useState([]);
    const [allRecommendations, setAllRecommendations] = useState([]); // Store unfiltered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableSkills, setAvailableSkills] = useState([]);

    // Fetch recommendations only once on mount
    useEffect(() => {
        fetchRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update URL params when filters change (for state persistence)
    useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('pageSize', pageSize);
        if (filters.minScore > 0) params.set('minScore', filters.minScore);
        if (filters.maxScore < 100) params.set('maxScore', filters.maxScore);
        if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
        if (filters.location) params.set('location', filters.location);
        if (filters.experienceLevel) params.set('experienceLevel', filters.experienceLevel);
        if (filters.daysPosted) params.set('daysPosted', filters.daysPosted);
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        setSearchParams(params, { replace: true });
    }, [page, pageSize, filters, sortBy, sortOrder, setSearchParams]);

    // Client-side filtering function
    const applyFilters = useCallback(
        (items) => {
            if (!items || items.length === 0) return [];

            return items.filter((item) => {
                // Match score filter
                const score = item.match_score || 0;
                if (score < filters.minScore || score > filters.maxScore) {
                    return false;
                }

                // Skills filter (at least one required skill matches)
                if (filters.skills.length > 0) {
                    const hasMatchingSkill = item.required_skills?.some((skill) => filters.skills.includes(skill));
                    if (!hasMatchingSkill) return false;
                }

                // Location filter (case-insensitive partial match)
                if (filters.location) {
                    const locationMatch = item.location?.toLowerCase().includes(filters.location.toLowerCase());
                    if (!locationMatch) return false;
                }

                // Experience level filter
                if (filters.experienceLevel) {
                    if (item.experience_level !== filters.experienceLevel) return false;
                }

                // Days posted filter
                if (filters.daysPosted) {
                    const postedDate = new Date(item.posted_date);
                    const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
                    const maxDays = parseInt(filters.daysPosted);
                    if (daysAgo > maxDays) return false;
                }

                return true;
            });
        },
        [filters],
    );

    // Client-side sorting function
    const applySorting = useCallback(
        (items) => {
            if (!items || items.length === 0) return [];

            const sorted = [...items].sort((a, b) => {
                let aValue, bValue;

                switch (sortBy) {
                    case 'score':
                        aValue = a.match_score || 0;
                        bValue = b.match_score || 0;
                        break;
                    case 'date':
                        aValue = new Date(a.posted_date);
                        bValue = new Date(b.posted_date);
                        break;
                    case 'title':
                        aValue = a.title?.toLowerCase() || '';
                        bValue = b.title?.toLowerCase() || '';
                        break;
                    default:
                        aValue = a.match_score || 0;
                        bValue = b.match_score || 0;
                }

                // Apply sort order
                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                } else {
                    return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                }
            });

            return sorted;
        },
        [sortBy, sortOrder],
    );

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call the internship match endpoint (old working endpoint)
            // Fetch max allowed recommendations, then filter/sort client-side
            const response = await apiClient.get('/internship/match', {
                params: { top_k: 50 }, // Max allowed by endpoint
            });

            // Store unfiltered data
            const allItems = response.data || [];
            setAllRecommendations(allItems);

            // Apply client-side filtering and sorting
            let filteredItems = applyFilters(allItems);
            let sortedItems = applySorting(filteredItems);

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedItems = sortedItems.slice(startIndex, endIndex);

            setRecommendations(paginatedItems);
            setTotal(sortedItems.length);
            setTotalPages(Math.ceil(sortedItems.length / pageSize));

            // Extract unique skills for filter options
            const skills = new Set();
            allItems.forEach((item) => {
                item.required_skills?.forEach((skill) => skills.add(skill));
            });
            setAvailableSkills(Array.from(skills).sort());

            if (paginatedItems.length === 0 && sortedItems.length > 0) {
                setPage(1); // Reset to first page if current page is empty
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);

            // Handle different error response formats
            let errorMessage = 'Failed to fetch recommendations';

            if (err.response?.data?.detail) {
                // If detail is an array (validation errors), format it
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail
                        .map((e) => e.msg || e.message || JSON.stringify(e))
                        .join(', ');
                } else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else {
                    errorMessage = JSON.stringify(err.response.data.detail);
                }
            }

            setError(errorMessage);

            if (err.response?.status === 404) {
                toast.error('Please upload your resume first to get recommendations');
            } else if (err.response?.status === 403) {
                toast.error('You must be logged in as a student to view recommendations');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Re-apply filters and sorting when they change (without re-fetching from API)
    useEffect(() => {
        if (allRecommendations.length === 0) return;

        // Apply client-side filtering and sorting to existing data
        let filteredItems = applyFilters(allRecommendations);
        let sortedItems = applySorting(filteredItems);

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = sortedItems.slice(startIndex, endIndex);

        setRecommendations(paginatedItems);
        setTotal(sortedItems.length);
        setTotalPages(Math.ceil(sortedItems.length / pageSize));
    }, [allRecommendations, applyFilters, applySorting, page, pageSize]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
    };

    const handleClearFilters = () => {
        setFilters({
            minScore: 0,
            maxScore: 100,
            skills: [],
            location: '',
            experienceLevel: '',
            daysPosted: '',
        });
        setPage(1);
    };

    const handleSortChange = ({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setPage(1); // Reset to first page when sort changes
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(1); // Reset to first page when page size changes
    };

    return (
        <Layout>
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                flexShrink: 0,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: { xs: 0, sm: 3 },
                                mb: { xs: 2, sm: 0 },
                                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
                            }}
                        >
                            <TrendingUpIcon sx={{ fontSize: 48, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: '#1a1a1a',
                                    mb: 1,
                                    letterSpacing: '-0.5px',
                                    fontSize: { xs: '1.6rem', sm: '2.125rem' },
                                }}
                            >
                                AI-Powered Recommendations
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Personalized internship matches based on your skills and experience
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {loading && (
                    <Box>
                        <InternshipListSkeleton count={6} />
                    </Box>
                )}

                {!loading && error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            error.includes('resume') ? (
                                <Button color="inherit" size="small" onClick={() => navigate('/upload-resume')}>
                                    Upload Resume
                                </Button>
                            ) : (
                                <Button color="inherit" size="small" onClick={fetchRecommendations}>
                                    Retry
                                </Button>
                            )
                        }
                    >
                        {error}
                    </Alert>
                )}

                {/* Show filters when there are recommendations OR after initial load */}
                {!loading && !error && allRecommendations.length > 0 && (
                    <>
                        <FilterPanel
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClear={handleClearFilters}
                            availableSkills={availableSkills}
                            showLocation={true}
                            showDaysPosted={true}
                        />

                        <SortControls sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
                    </>
                )}

                {!loading && !error && recommendations.length === 0 && total === 0 && (
                    <NoRecommendations
                        filters={filters}
                        allRecommendations={allRecommendations}
                        navigate={navigate}
                        fetchRecommendations={fetchRecommendations}
                        handleClearFilters={handleClearFilters}
                    />
                )}

                {!loading && !error && recommendations.length > 0 && (
                    <>
                        {/* Results */}
                        <Grid container spacing={3}>
                            {recommendations.map((internship, index) => (
                                <Grid size={{ xs: 12 }} key={internship.id} sx={{ display: 'flex' }}>
                                    <RecommendationCard internship={internship} index={index} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination Controls */}
                        <PaginationControls
                            page={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    </>
                )}

                {!loading && !error && total > 0 && recommendations.length > 0 && <ResumeTip />}
            </Container>
        </Layout>
    );
};

export default RecommendedInternships;
