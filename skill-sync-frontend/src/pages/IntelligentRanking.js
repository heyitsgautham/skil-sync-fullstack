import React from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Checkbox,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import Layout from '../components/Layout';
import FlaggedCandidatesModal from '../components/FlaggedCandidatesModal';
import SendEmailModal from '../components/SendEmailModal';
import CandidateFilters from '../components/CandidateFilters';
import ActiveFilters from '../components/ActiveFilters';
import useIntelligentRanking from './ranking/useIntelligentRanking';
import InternshipSelector from './ranking/InternshipSelector';
import RankingToolbar from './ranking/RankingToolbar';
import CandidateCard from './ranking/CandidateCard';
import RankingPagination from './ranking/RankingPagination';

const IntelligentRanking = () => {
    const ranking = useIntelligentRanking();
    const {
        selectedInternship,
        selectedInternshipData,
        rankedCandidates,
        loading,
        scoringInfo,
        flaggedModalOpen,
        selectedFlaggedCandidate,
        emailModalOpen,
        selectedCandidates,
        selectionMode,
        activeFilters,
        totalBeforeFilter,
        paginatedCandidates,
        handleApplyFilters,
        handleResetFilters,
        handleCloseFlaggedModal,
        handleSelectAll,
        handleCloseEmailModal,
        handleEmailSendComplete,
    } = ranking;

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {/* Internship Selector */}
                <InternshipSelector {...ranking} />

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
                        <RankingToolbar {...ranking} />

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

                        {paginatedCandidates.map((candidate, index) => (
                            <CandidateCard key={candidate.candidate_id} {...ranking} candidate={candidate} index={index} />
                        ))}

                        <RankingPagination {...ranking} />
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
