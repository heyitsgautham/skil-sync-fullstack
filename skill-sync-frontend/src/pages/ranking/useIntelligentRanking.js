import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../services/apiConfig';

/** State, data loading and handlers for the AI candidate ranking page. */
export default function useIntelligentRanking() {
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
    const [onlyApplicants] = useState(false); // Default to showing all candidates

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
            const response = await axios.get(`${API_BASE_URL}/internship/my-posts`, {
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
            const response = await axios.get(`${API_BASE_URL}/internship/${internshipId}`, {
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

            // Build query parameters
            const params = new URLSearchParams({
                limit: '50',
                only_applicants: onlyApplicants.toString()
            });

            // Add filter parameters
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                // Handle boolean values explicitly
                if (typeof value === 'boolean') {
                    params.append(key, value.toString());
                } else if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });

            const response = await axios.post(
                `${API_BASE_URL}/filter/rank-candidates/${selectedInternship}?${params.toString()}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

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
                `${API_BASE_URL}/recommendations/resume/${studentId}`,
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
                `${API_BASE_URL}/filter/export-candidates/${selectedInternship}`,
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

    return {
        internships,
        setInternships,
        selectedInternship,
        setSelectedInternship,
        selectedInternshipData,
        setSelectedInternshipData,
        rankedCandidates,
        setRankedCandidates,
        loading,
        setLoading,
        loadingInternships,
        setLoadingInternships,
        scoringInfo,
        setScoringInfo,
        exportMenuAnchor,
        setExportMenuAnchor,
        exportLoading,
        setExportLoading,
        expandedAccordions,
        setExpandedAccordions,
        flaggedModalOpen,
        setFlaggedModalOpen,
        selectedFlaggedCandidate,
        setSelectedFlaggedCandidate,
        emailModalOpen,
        setEmailModalOpen,
        selectedCandidates,
        setSelectedCandidates,
        selectionMode,
        setSelectionMode,
        anonymizationEnabled,
        setAnonymizationEnabled,
        activeFilters,
        setActiveFilters,
        totalBeforeFilter,
        setTotalBeforeFilter,
        page,
        setPage,
        pageSize,
        setPageSize,
        paginatedCandidates,
        setPaginatedCandidates,
        allExpanded,
        setAllExpanded,
        ensureHttpProtocol,
        fetchInternships,
        fetchInternshipSkills,
        handleApplyFilters,
        handleResetFilters,
        handleRankCandidates,
        getScoreColor,
        handleExportClick,
        handleExportClose,
        handleViewResume,
        handleExport,
        handleExpandAll,
        handleCollapseAll,
        handleToggleExpandAll,
        handleFlaggedClick,
        handleCloseFlaggedModal,
        handleToggleCandidateSelection,
        handleSelectAll,
        handleEnableSelectionMode,
        handleCancelSelection,
        handleOpenEmailModal,
        handleCloseEmailModal,
        handleEmailSendComplete,
    };
}
