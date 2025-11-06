import React, { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    Chip,
    Collapse,
    IconButton,
    Badge,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

/**
 * EvidenceSnippet Component
 * 
 * Displays a single evidence snippet with highlighted text, source information,
 * confidence score, and expandable context.
 * 
 * Features:
 * - Highlighted skill/keyword in text
 * - Source badge (resume section)
 * - Confidence score indicator
 * - Line numbers (if available)
 * - Expandable context
 * - Visual confidence color coding
 * 
 * @param {string} snippet - The evidence text snippet
 * @param {string} source - Source of evidence (e.g., "Resume.pdf - Experience Section")
 * @param {number} confidence - Confidence score (0-1)
 * @param {string} highlightedTerm - Term to highlight in the snippet
 * @param {string} context - Additional context (expandable)
 * @param {number} lineStart - Starting line number
 * @param {number} lineEnd - Ending line number
 * @param {string} section - Section name (e.g., "Experience", "Projects")
 */
const EvidenceSnippet = ({
    snippet,
    source,
    confidence,
    highlightedTerm,
    context,
    lineStart,
    lineEnd,
    section,
}) => {
    const [expanded, setExpanded] = useState(false);

    // Get confidence level and color
    const getConfidenceInfo = (conf) => {
        if (conf >= 0.8) {
            return { level: 'High', color: 'success', bgColor: '#e8f5e9' };
        } else if (conf >= 0.6) {
            return { level: 'Medium', color: 'warning', bgColor: '#fff9c4' };
        } else {
            return { level: 'Low', color: 'error', bgColor: '#ffebee' };
        }
    };

    const confidenceInfo = confidence !== undefined ? getConfidenceInfo(confidence) : null;

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
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#000',
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
        <Paper
            elevation={2}
            sx={{
                overflow: 'hidden',
                borderRadius: 2,
                border: '1px solid',
                borderColor: confidenceInfo ? `${confidenceInfo.color}.light` : 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 1.5,
                    backgroundColor: confidenceInfo ? confidenceInfo.bgColor : '#f5f5f5',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <DescriptionIcon fontSize="small" color="action" />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {source || 'Resume'}
                    </Typography>
                    {section && (
                        <Chip
                            label={section}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {confidenceInfo && (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label={`${(confidence * 100).toFixed(0)}% ${confidenceInfo.level}`}
                            size="small"
                            color={confidenceInfo.color}
                            sx={{ fontWeight: 600, height: 24 }}
                        />
                    )}

                    {(lineStart !== undefined || lineEnd !== undefined) && (
                        <Chip
                            label={`L${lineStart || '?'}-${lineEnd || '?'}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>
            </Box>

            {/* Snippet Content */}
            <Box sx={{ p: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderLeft: '4px solid',
                        borderLeftColor: confidenceInfo ? `${confidenceInfo.color}.main` : 'primary.main',
                        borderRadius: 1,
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    <Typography variant="body2" component="div">
                        {snippet ? highlightText(snippet, highlightedTerm) : 'No snippet available'}
                    </Typography>
                </Paper>

                {/* Expandable Context */}
                {context && (
                    <Box sx={{ mt: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                mb: expanded ? 1 : 0,
                            }}
                            onClick={() => setExpanded(!expanded)}
                        >
                            <Typography variant="caption" fontWeight={600} color="primary" sx={{ flex: 1 }}>
                                {expanded ? 'Hide Context' : 'Show Context'}
                            </Typography>
                            <IconButton size="small">
                                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                        </Box>

                        <Collapse in={expanded}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    backgroundColor: '#f9f9f9',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {context}
                                </Typography>
                            </Paper>
                        </Collapse>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default EvidenceSnippet;
