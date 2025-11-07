import React, { useState } from 'react';
import {
    Box,
    Paper,
    Slider,
    Typography,
    FormControlLabel,
    Switch,
    Button,
    Grid,
    Chip,
    Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const CandidateFilters = ({ onApplyFilters, onReset }) => {
    const [filters, setFilters] = useState({
        matchScoreRange: [0, 100],
        experienceRange: [0, 24], // Changed to months (0-24 months = 0-2 years)
        excludeFlagged: false
    });

    const handleMatchScoreChange = (event, newValue) => {
        // Prevent thumbs from crossing
        if (newValue[0] >= newValue[1]) {
            return; // Don't update if min >= max
        }
        setFilters({ ...filters, matchScoreRange: newValue });
    };

    const handleExperienceChange = (event, newValue) => {
        // Prevent thumbs from crossing
        if (newValue[0] >= newValue[1]) {
            return; // Don't update if min >= max
        }
        setFilters({ ...filters, experienceRange: newValue });
    };

    const handleExcludeFlaggedChange = (event) => {
        const newExcludeFlaggedValue = event.target.checked;
        setFilters({ ...filters, excludeFlagged: newExcludeFlaggedValue });
        
        // Apply the filter immediately when toggled
        const apiFilters = {};

        // Match score range (only send if different from default [0, 100])
        if (filters.matchScoreRange[0] > 0) {
            apiFilters.min_match_score = filters.matchScoreRange[0];
        }
        if (filters.matchScoreRange[1] < 100) {
            apiFilters.max_match_score = filters.matchScoreRange[1];
        }

        // Experience range - Convert months to years for API (backend expects years)
        if (filters.experienceRange[0] > 0) {
            apiFilters.min_experience = filters.experienceRange[0] / 12;
        }
        if (filters.experienceRange[1] < 24) {
            apiFilters.max_experience = filters.experienceRange[1] / 12;
        }

        // Use the NEW value for exclude_flagged (not the old state)
        apiFilters.exclude_flagged = newExcludeFlaggedValue;

        console.log('🚩 Hide Flagged toggled - applying filter immediately:', apiFilters);
        onApplyFilters(apiFilters);
    };

    const handleApplyFilters = () => {
        const apiFilters = {};

        // Match score range (only send if different from default [0, 100])
        if (filters.matchScoreRange[0] > 0) {
            apiFilters.min_match_score = filters.matchScoreRange[0];
        }
        if (filters.matchScoreRange[1] < 100) {
            apiFilters.max_match_score = filters.matchScoreRange[1];
        }

        // Experience range - Convert months to years for API (backend expects years)
        if (filters.experienceRange[0] > 0) {
            apiFilters.min_experience = filters.experienceRange[0] / 12; // Convert months to years
        }
        if (filters.experienceRange[1] < 24) {
            apiFilters.max_experience = filters.experienceRange[1] / 12; // Convert months to years
        }

        // Exclude flagged - always send this parameter
        apiFilters.exclude_flagged = filters.excludeFlagged;

        console.log('🔍 Applying filters:', apiFilters); // Debug log

        onApplyFilters(apiFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            matchScoreRange: [0, 100],
            experienceRange: [0, 24],
            excludeFlagged: false
        });
        if (onReset) {
            onReset();
        }
    };

    const activeFiltersCount = [
        filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100,
        filters.experienceRange[0] > 0 || filters.experienceRange[1] < 24,
        filters.excludeFlagged
    ].filter(Boolean).length;

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterListIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Advanced Filters
                    </Typography>
                    {activeFiltersCount > 0 && (
                        <Chip
                            label={`${activeFiltersCount} active`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {activeFiltersCount > 0 && (
                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={handleResetFilters}
                            sx={{ mr: 1 }}
                        >
                            Clear All
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Filter Content */}
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
                    {/* Match Score Filter */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography gutterBottom fontWeight="600">
                            Match Score Range: {filters.matchScoreRange[0]}% - {filters.matchScoreRange[1]}%
                        </Typography>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Slider
                                value={filters.matchScoreRange}
                                onChange={handleMatchScoreChange}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}%`}
                                min={0}
                                max={100}
                                step={5}
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' }
                                ]}
                                disableSwap
                                sx={{
                                    '& .MuiSlider-thumb': {
                                        width: 20,
                                        height: 20,
                                    },
                                    '& .MuiSlider-track': {
                                        height: 6,
                                    },
                                    '& .MuiSlider-rail': {
                                        height: 6,
                                        opacity: 0.3,
                                    },
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Experience Filter */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography gutterBottom fontWeight="600">
                            Experience Range: {filters.experienceRange[0]} - {filters.experienceRange[1]} months
                        </Typography>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Slider
                                value={filters.experienceRange}
                                onChange={handleExperienceChange}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}m`}
                                min={0}
                                max={24}
                                step={1}
                                marks={[
                                    { value: 0, label: '0m' },
                                    { value: 6, label: '6m' },
                                    { value: 12, label: '1y' },
                                    { value: 18, label: '18m' },
                                    { value: 24, label: '2y' }
                                ]}
                                disableSwap
                                sx={{
                                    '& .MuiSlider-thumb': {
                                        width: 20,
                                        height: 20,
                                    },
                                    '& .MuiSlider-track': {
                                        height: 6,
                                    },
                                    '& .MuiSlider-rail': {
                                        height: 6,
                                        opacity: 0.3,
                                    },
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Exclude Flagged Switch & Apply Button */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography gutterBottom fontWeight="600">
                            Candidate Filtering
                        </Typography>
                        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.excludeFlagged}
                                        onChange={handleExcludeFlaggedChange}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight="600">
                                        Hide Flagged
                                    </Typography>
                                }
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApplyFilters}
                                startIcon={<FilterListIcon />}
                                size="medium"
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
        </Paper>
    );
};

export default CandidateFilters;
