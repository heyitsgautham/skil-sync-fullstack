import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import axios from 'axios';
import toast from 'react-hot-toast';

const FlaggedCandidatesModal = ({ open, onClose, candidateId, flaggedWith, flagReasons }) => {
    const [loading, setLoading] = useState(false);
    const [candidatesData, setcandidatesData] = useState([]);

    useEffect(() => {
        if (open && candidateId && flaggedWith) {
            fetchFlaggedCandidatesDetails();
        }
    }, [open, candidateId, flaggedWith]);

    const fetchFlaggedCandidatesDetails = async () => {
        setLoading(true);
        try {
            // Collect all unique candidate IDs (current + all flagged with)
            const allCandidateIds = new Set();
            allCandidateIds.add(candidateId);
            
            // Add all candidates flagged with this one
            Object.values(flaggedWith).forEach(candidatesList => {
                candidatesList.forEach(id => allCandidateIds.add(id));
            });

            const candidateIdsStr = Array.from(allCandidateIds).join(',');

            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/filter/flagged-candidates-details`,
                {
                    params: { candidate_ids: candidateIdsStr },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setcandidatesData(response.data.candidates || []);
        } catch (error) {
            console.error('Error fetching flagged candidates details:', error);
            toast.error('Failed to load candidate details');
        } finally {
            setLoading(false);
        }
    };

    const getReasonIcon = (reason) => {
        switch (reason) {
            case 'same_mobile':
                return <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />;
            case 'same_linkedin':
                return <LinkedInIcon sx={{ fontSize: 16, mr: 0.5 }} />;
            case 'same_github':
                return <GitHubIcon sx={{ fontSize: 16, mr: 0.5 }} />;
            default:
                return null;
        }
    };

    const getReasonLabel = (reason) => {
        const labels = {
            'same_mobile': 'Same Mobile Number',
            'same_linkedin': 'Same LinkedIn',
            'same_github': 'Same GitHub'
        };
        return labels[reason] || reason;
    };

    const getReasonColor = (reason) => {
        const colors = {
            'same_mobile': '#f44336',
            'same_linkedin': '#0077B5',
            'same_github': '#333'
        };
        return colors[reason] || '#757575';
    };

    // Helper to check if two candidates are flagged together for a specific reason
    const areFlaggedTogether = (candidateA, candidateB, reason) => {
        const candidateAFlaggedWith = candidateA.flagged_with?.[reason] || [];
        return candidateAFlaggedWith.includes(candidateB.candidate_id);
    };

    // Group candidates by flag reasons
    const groupCandidatesByReason = () => {
        const groups = {};
        
        flagReasons.forEach(reason => {
            if (!groups[reason]) {
                groups[reason] = [];
            }
            
            // Find the current candidate data
            const currentCandidate = candidatesData.find(c => c.candidate_id === candidateId);
            if (currentCandidate) {
                groups[reason].push(currentCandidate);
                
                // Add candidates flagged with this one for this reason
                const flaggedWithIds = flaggedWith[reason] || [];
                flaggedWithIds.forEach(flaggedId => {
                    const flaggedCandidate = candidatesData.find(c => c.candidate_id === flaggedId);
                    if (flaggedCandidate && !groups[reason].some(c => c.candidate_id === flaggedId)) {
                        groups[reason].push(flaggedCandidate);
                    }
                });
            }
        });
        
        return groups;
    };

    const groupedCandidates = loading ? {} : groupCandidatesByReason();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ color: '#f44336', fontSize: 30 }} />
                    <Typography variant="h5" fontWeight="bold">
                        Flagged Candidates
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="body2" fontWeight="bold">
                                ⚠️ Duplicate Information Detected
                            </Typography>
                            <Typography variant="body2">
                                The following candidates share identical contact information, which may indicate duplicate profiles or fraudulent applications.
                            </Typography>
                        </Alert>

                        {Object.entries(groupedCandidates).map(([reason, candidates], groupIndex) => (
                            <Box key={reason} sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    {getReasonIcon(reason)}
                                    <Typography variant="h6" fontWeight="bold">
                                        {getReasonLabel(reason)}
                                    </Typography>
                                    <Chip
                                        label={`${candidates.length} candidates`}
                                        size="small"
                                        sx={{
                                            backgroundColor: getReasonColor(reason),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>

                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell><strong>Name</strong></TableCell>
                                                <TableCell><strong>Email</strong></TableCell>
                                                <TableCell><strong>Phone</strong></TableCell>
                                                <TableCell><strong>LinkedIn</strong></TableCell>
                                                <TableCell><strong>GitHub</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {candidates.map((candidate) => (
                                                <TableRow
                                                    key={candidate.candidate_id}
                                                    sx={{
                                                        backgroundColor: candidate.candidate_id === candidateId ? '#fff3e0' : 'transparent',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {candidate.candidate_name}
                                                            {candidate.candidate_id === candidateId && (
                                                                <Chip label="Current" size="small" color="primary" />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <EmailIcon sx={{ fontSize: 16, color: '#666' }} />
                                                            <Typography variant="body2">{candidate.email}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <PhoneIcon
                                                                sx={{
                                                                    fontSize: 16,
                                                                    color: reason === 'same_mobile' ? '#f44336' : '#666'
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: reason === 'same_mobile' ? 'bold' : 'normal',
                                                                    color: reason === 'same_mobile' ? '#f44336' : 'inherit'
                                                                }}
                                                            >
                                                                {candidate.phone || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {candidate.linkedin_url ? (
                                                            <Link
                                                                href={candidate.linkedin_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    color: reason === 'same_linkedin' ? '#f44336' : '#0077B5',
                                                                    fontWeight: reason === 'same_linkedin' ? 'bold' : 'normal',
                                                                    textDecoration: 'none',
                                                                    '&:hover': { textDecoration: 'underline' }
                                                                }}
                                                            >
                                                                <LinkedInIcon sx={{ fontSize: 16 }} />
                                                                View Profile
                                                            </Link>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {candidate.github_url ? (
                                                            <Link
                                                                href={candidate.github_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    color: reason === 'same_github' ? '#f44336' : '#333',
                                                                    fontWeight: reason === 'same_github' ? 'bold' : 'normal',
                                                                    textDecoration: 'none',
                                                                    '&:hover': { textDecoration: 'underline' }
                                                                }}
                                                            >
                                                                <GitHubIcon sx={{ fontSize: 16 }} />
                                                                View Profile
                                                            </Link>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {groupIndex < Object.keys(groupedCandidates).length - 1 && (
                                    <Divider sx={{ my: 3 }} />
                                )}
                            </Box>
                        ))}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FlaggedCandidatesModal;
