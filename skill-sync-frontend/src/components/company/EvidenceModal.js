import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Chip,
    Stack,
    IconButton,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

/**
 * EvidenceModal Component
 * 
 * Modal dialog to display detailed evidence for a skill, experience, or project.
 * Shows source snippets with context, confidence scores, and line numbers.
 * 
 * @param {boolean} open - Whether modal is open
 * @param {function} onClose - Close callback
 * @param {array} evidenceList - List of evidence objects
 * @param {string} title - Modal title (skill/experience/project name)
 */
const EvidenceModal = ({ open, onClose, evidenceList = [], title }) => {
    // Get confidence color
    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        return 'error';
    };

    // Highlight term in text
    const highlightText = (text, term) => {
        if (!term || !text) return text;

        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.toLowerCase() === term.toLowerCase()) {
                return (
                    <span
                        key={index}
                        style={{
                            backgroundColor: '#ffeb3b',
                            fontWeight: 600,
                            padding: '2px 4px',
                            borderRadius: '4px',
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" />
                        <Typography variant="h6" fontWeight={600}>
                            Evidence for "{title}"
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {evidenceList.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No evidence snippets available
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {evidenceList.map((evidence, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 3,
                                    backgroundColor: '#f5f5f5',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                }}
                            >
                                {/* Evidence Header */}
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon fontSize="small" color="action" />
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {evidence.source || 'Resume'}
                                        </Typography>
                                    </Box>
                                    {evidence.confidence !== undefined && (
                                        <Chip
                                            label={`${(evidence.confidence * 100).toFixed(0)}% Confidence`}
                                            size="small"
                                            color={getConfidenceColor(evidence.confidence)}
                                        />
                                    )}
                                </Box>

                                {/* Section Info */}
                                {evidence.section && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        Section: {evidence.section}
                                    </Typography>
                                )}

                                {/* Line Numbers */}
                                {(evidence.line_start !== undefined || evidence.line_end !== undefined) && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        Lines {evidence.line_start || 'N/A'} - {evidence.line_end || 'N/A'}
                                    </Typography>
                                )}

                                <Divider sx={{ my: 1.5 }} />

                                {/* Evidence Snippet */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        backgroundColor: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderLeft: '4px solid #11998e',
                                        borderRadius: 1,
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <Typography variant="body2" component="div">
                                        {evidence.snippet ? highlightText(evidence.snippet, title) : 'No snippet available'}
                                    </Typography>
                                </Paper>

                                {/* Context (if available) */}
                                {evidence.context && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                                            Context:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {evidence.context}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Additional Details */}
                                {evidence.details && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                                            Details:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {evidence.details}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        ))}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EvidenceModal;
