import React from 'react';
import { Box, Chip, Typography, Paper } from '@mui/material';

const ActiveFilters = ({ filters, totalCandidates, totalBeforeFilter }) => {
    const formatExperience = (years) => {
        const months = Math.round(years * 12);
        if (months >= 12) {
            const fullYears = Math.floor(months / 12);
            const remainingMonths = months % 12;
            if (remainingMonths === 0) {
                return `${fullYears}y`;
            }
            return `${fullYears}y ${remainingMonths}m`;
        }
        return `${months}m`;
    };

    const getFilterChips = () => {
        const chips = [];

        // Match score range
        if (filters.min_match_score !== undefined && filters.max_match_score !== undefined) {
            chips.push({ 
                key: 'match_range', 
                label: `Match ${filters.min_match_score}% - ${filters.max_match_score}%`, 
                color: 'primary' 
            });
        } else if (filters.min_match_score !== undefined && filters.min_match_score > 0) {
            chips.push({ key: 'min_score', label: `Match ≥ ${filters.min_match_score}%`, color: 'primary' });
        } else if (filters.max_match_score !== undefined && filters.max_match_score < 100) {
            chips.push({ key: 'max_score', label: `Match ≤ ${filters.max_match_score}%`, color: 'primary' });
        }

        // Experience range (backend sends years, we display as months)
        if (filters.min_experience !== undefined && filters.max_experience !== undefined) {
            chips.push({ 
                key: 'exp_range', 
                label: `Experience ${formatExperience(filters.min_experience)} - ${formatExperience(filters.max_experience)}`, 
                color: 'secondary' 
            });
        } else if (filters.min_experience !== undefined && filters.min_experience > 0) {
            chips.push({ key: 'min_exp', label: `Experience ≥ ${formatExperience(filters.min_experience)}`, color: 'secondary' });
        } else if (filters.max_experience !== undefined && filters.max_experience < 2) {
            chips.push({ key: 'max_exp', label: `Experience ≤ ${formatExperience(filters.max_experience)}`, color: 'secondary' });
        }

        if (filters.exclude_flagged) {
            chips.push({ key: 'flagged', label: '🚫 Excluding flagged', color: 'warning' });
        }

        return chips;
    };

    const chips = getFilterChips();

    if (chips.length === 0) return null;

    return (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
            <Typography variant="body2" fontWeight="bold" color="primary.main" gutterBottom>
                🔍 Active Filters:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {chips.map((chip) => (
                    <Chip
                        key={chip.key}
                        label={chip.label}
                        size="small"
                        color={chip.color}
                        variant="filled"
                    />
                ))}
            </Box>
            {totalBeforeFilter !== undefined && totalBeforeFilter !== totalCandidates && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    📊 Showing <strong>{totalCandidates}</strong> of <strong>{totalBeforeFilter}</strong> candidates
                    {' '}({Math.round((totalCandidates / totalBeforeFilter) * 100)}% match filters)
                </Typography>
            )}
        </Paper>
    );
};

export default ActiveFilters;
