import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tooltip,
    Paper,
    Stack,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

/**
 * ComponentScoreBar Component
 * 
 * Interactive stacked bar chart visualization for component scores.
 * Shows semantic, skills, experience, education, and projects contributions
 * with hover tooltips and expandable details.
 * 
 * Features:
 * - Color-coded segments for each component
 * - Hover tooltip with score, percentage, and formula
 * - Click to expand detailed breakdown
 * - Responsive design
 * 
 * @param {object} componentScores - Object with component scores: {semantic, skills, experience, education, projects}
 * @param {object} rubricWeights - Optional rubric weights for formula display
 */
const ComponentScoreBar = ({ componentScores, rubricWeights }) => {
    const [expandedComponent, setExpandedComponent] = useState(null);

    if (!componentScores) {
        return (
            <Typography variant="body2" color="text.secondary">
                No component scores available
            </Typography>
        );
    }

    const components = [
        {
            key: 'semantic',
            label: 'Semantic Similarity',
            color: '#1976d2',
            description: 'Resume-job description semantic match using embeddings',
            formula: 'Cosine similarity between resume and job description vectors',
        },
        {
            key: 'skills',
            label: 'Skills Match',
            color: '#2e7d32',
            description: 'Percentage of required skills found in resume',
            formula: '(Matched skills / Total required skills) × 100 × Proficiency factor',
        },
        {
            key: 'experience',
            label: 'Experience',
            color: '#ed6c02',
            description: 'Years of relevant experience vs requirements',
            formula: 'Min(Relevant years / Preferred years, 1.0) × 100',
        },
        {
            key: 'education',
            label: 'Education',
            color: '#9c27b0',
            description: 'Education level and field match',
            formula: 'Degree match (0-100) + Field relevance (0-100) / 2',
        },
        {
            key: 'projects',
            label: 'Projects',
            color: '#d32f2f',
            description: 'Project relevance and technical depth',
            formula: 'Project count × Tech stack match × Impact assessment',
        },
    ];

    // Calculate total and percentages
    const total = Object.values(componentScores).reduce((sum, val) => sum + val, 0);
    const componentsWithData = components
        .map((comp) => ({
            ...comp,
            value: componentScores[comp.key] || 0,
            weight: rubricWeights ? rubricWeights[comp.key] : null,
            percentage: total > 0 ? ((componentScores[comp.key] || 0) / total) * 100 : 0,
        }))
        .filter((comp) => comp.value > 0);

    const handleComponentClick = (key) => {
        setExpandedComponent(expandedComponent === key ? null : key);
    };

    return (
        <Box>
            {/* Stacked Bar Chart */}
            <Box
                sx={{
                    display: 'flex',
                    height: 48,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2,
                    mb: 2,
                }}
            >
                {componentsWithData.map((comp) => {
                    if (comp.percentage === 0) return null;

                    return (
                        <Tooltip
                            key={comp.key}
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        {comp.label}
                                    </Typography>
                                    <Typography variant="body2">
                                        Score: {comp.value.toFixed(1)} / 100
                                    </Typography>
                                    <Typography variant="body2">
                                        Contribution: {comp.percentage.toFixed(0)}%
                                    </Typography>
                                    {comp.weight && (
                                        <Typography variant="body2">
                                            Weight: {(comp.weight * 100).toFixed(0)}%
                                        </Typography>
                                    )}
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {comp.description}
                                    </Typography>
                                </Box>
                            }
                            arrow
                            placement="top"
                        >
                            <Box
                                sx={{
                                    width: `${comp.percentage}%`,
                                    backgroundColor: comp.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    '&:hover': {
                                        opacity: 0.85,
                                        transform: 'scale(1.02)',
                                        zIndex: 1,
                                    },
                                }}
                                onClick={() => handleComponentClick(comp.key)}
                            >
                                {comp.percentage > 12 && (
                                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                                        <Typography variant="body2" fontWeight={700}>
                                            {comp.percentage.toFixed(0)}%
                                        </Typography>
                                        {comp.percentage > 20 && (
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                {comp.label.split(' ')[0]}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            {/* Legend */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {componentsWithData.map((comp) => (
                    <Box
                        key={comp.key}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            opacity: expandedComponent && expandedComponent !== comp.key ? 0.5 : 1,
                            transition: 'opacity 0.2s',
                        }}
                        onClick={() => handleComponentClick(comp.key)}
                    >
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                backgroundColor: comp.color,
                                borderRadius: 1,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {comp.label}
                        </Typography>
                        {expandedComponent === comp.key ? (
                            <ExpandLessIcon fontSize="small" />
                        ) : (
                            <ExpandMoreIcon fontSize="small" />
                        )}
                    </Box>
                ))}
            </Stack>

            {/* Expanded Details */}
            {componentsWithData.map((comp) => (
                <Collapse key={comp.key} in={expandedComponent === comp.key}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: comp.color + '15',
                            borderLeft: 4,
                            borderColor: comp.color,
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            {comp.label} Details
                        </Typography>

                        <Stack spacing={1}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Raw Score
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {comp.value.toFixed(2)} / 100
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Contribution to Overall Score
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {comp.percentage.toFixed(1)}%
                                </Typography>
                            </Box>

                            {comp.weight && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Rubric Weight
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {(comp.weight * 100).toFixed(0)}%
                                    </Typography>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body2">
                                    {comp.description}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Calculation Formula
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        p: 1,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {comp.formula}
                                </Typography>
                            </Box>

                            {comp.weight && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Weighted Score
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {(comp.value * comp.weight).toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                </Collapse>
            ))}

            {/* Total Score Summary */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    textAlign: 'center',
                }}
            >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Overall Score
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary">
                    {total.toFixed(1)}
                </Typography>
                {rubricWeights && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Based on weighted component scores
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default ComponentScoreBar;
