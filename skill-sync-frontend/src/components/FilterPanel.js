import React from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Chip,
    IconButton,
    Collapse,
    Divider,
    Autocomplete,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Reusable FilterPanel Component for Advanced Filtering
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Function} props.onClear - Callback to clear all filters
 * @param {Array} props.availableSkills - List of skills for multi-select
 * @param {Boolean} props.showExperience - Show experience filter
 * @param {Boolean} props.showEducation - Show education filter
 * @param {Boolean} props.showLocation - Show location filter
 * @param {Boolean} props.showApplicationStatus - Show application status filter
 * @param {Boolean} props.showDaysPosted - Show days posted filter
 */
const FilterPanel = ({
    filters,
    onFilterChange,
    onClear,
    availableSkills = [],
    showExperience = true,
    showEducation = false,
    showLocation = false,
    showApplicationStatus = false,
    showDaysPosted = false,
}) => {
    const [expanded, setExpanded] = React.useState(true);
    const [tempFilters, setTempFilters] = React.useState(filters);

    // Update temp filters when parent filters change (e.g., on clear)
    React.useEffect(() => {
        setTempFilters(filters);
    }, [filters]);

    const handleScoreChange = (event, newValue) => {
        // Ensure values are valid and min doesn't exceed max
        if (!Array.isArray(newValue) || newValue.length !== 2) return;

        const [min, max] = newValue;

        // Enforce min <= max constraint strictly
        if (min > max) {
            // Prevent the update if values would cross
            return;
        }

        setTempFilters({
            ...tempFilters,
            minScore: Math.max(0, Math.min(100, min)),
            maxScore: Math.max(0, Math.min(100, max)),
        });
    };

    const handleExperienceChange = (event, newValue) => {
        // Ensure values are valid and min doesn't exceed max
        if (!Array.isArray(newValue) || newValue.length !== 2) return;

        const [min, max] = newValue;

        // Enforce min <= max constraint strictly
        if (min > max) {
            // Prevent the update if values would cross
            return;
        }

        setTempFilters({
            ...tempFilters,
            experienceMin: Math.max(0, Math.min(10, min)),
            experienceMax: Math.max(0, Math.min(10, max)),
        });
    };

    const handleSkillsChange = (event, newValue) => {
        setTempFilters({
            ...tempFilters,
            skills: newValue,
        });
    };

    const handleFieldChange = (field) => (event) => {
        setTempFilters({
            ...tempFilters,
            [field]: event.target.value,
        });
    };

    const handleApplyFilters = () => {
        onFilterChange(tempFilters);
    };

    const hasUnappliedChanges = JSON.stringify(tempFilters) !== JSON.stringify(filters);

    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'minScore' && value === 0) return false;
        if (key === 'maxScore' && value === 100) return false;
        if (key === 'experienceMin' && value === 0) return false;
        if (key === 'experienceMax' && value === 10) return false;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== '';
    }).length;

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
                    mb: expanded ? 2 : 0,
                    cursor: 'pointer',
                }}
                onClick={() => setExpanded(!expanded)}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            sx={{ mr: 1 }}
                        >
                            Clear All
                        </Button>
                    )}
                    <IconButton size="small">
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
            </Box>

            {/* Filter Content */}
            <Collapse in={expanded}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                    {/* Match Score Range */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography gutterBottom fontWeight="600">
                            Match Score Range: {tempFilters.minScore ?? 0}% - {tempFilters.maxScore ?? 100}%
                        </Typography>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Slider
                                value={[
                                    Math.max(0, Math.min(100, Number(tempFilters.minScore ?? 0))),
                                    Math.max(0, Math.min(100, Number(tempFilters.maxScore ?? 100)))
                                ]}
                                onChange={handleScoreChange}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}%`}
                                min={0}
                                max={100}
                                step={1}
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' },
                                ]}
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

                    {/* Skills Filter */}
                    {availableSkills.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                multiple
                                options={availableSkills}
                                value={tempFilters.skills || []}
                                onChange={handleSkillsChange}
                                freeSolo
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            variant="outlined"
                                            label={option}
                                            size="small"
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Filter by Skills"
                                        placeholder="Type or select skills"
                                        variant="outlined"
                                    />
                                )}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        paddingTop: '8px',
                                        paddingBottom: '8px',
                                    },
                                }}
                            />
                        </Grid>
                    )}

                    {/* Experience Range */}
                    {showExperience && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography gutterBottom fontWeight="600">
                                Experience: {tempFilters.experienceMin ?? 0} - {tempFilters.experienceMax ?? 10} years
                            </Typography>
                            <Box sx={{ px: 2, py: 1 }}>
                                <Slider
                                    value={[
                                        Math.max(0, Math.min(10, Number(tempFilters.experienceMin ?? 0))),
                                        Math.max(0, Math.min(10, Number(tempFilters.experienceMax ?? 10)))
                                    ]}
                                    onChange={handleExperienceChange}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${value}y`}
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    marks={[
                                        { value: 0, label: '0y' },
                                        { value: 5, label: '5y' },
                                        { value: 10, label: '10y+' },
                                    ]}
                                    sx={{
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
                    )}

                    {/* Education Level */}
                    {showEducation && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Education Level</InputLabel>
                                <Select
                                    value={tempFilters.educationLevel || ''}
                                    onChange={handleFieldChange('educationLevel')}
                                    label="Education Level"
                                >
                                    <MenuItem value="">All Levels</MenuItem>
                                    <MenuItem value="High School">High School</MenuItem>
                                    <MenuItem value="Bachelor">Bachelor's Degree</MenuItem>
                                    <MenuItem value="Master">Master's Degree</MenuItem>
                                    <MenuItem value="PhD">PhD</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {/* Location */}
                    {showLocation && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Location"
                                value={tempFilters.location || ''}
                                onChange={handleFieldChange('location')}
                                placeholder="e.g., New York, Remote"
                            />
                        </Grid>
                    )}

                    {/* Application Status */}
                    {showApplicationStatus && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Application Status</InputLabel>
                                <Select
                                    value={tempFilters.applicationStatus || ''}
                                    onChange={handleFieldChange('applicationStatus')}
                                    label="Application Status"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="accepted">Accepted</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {/* Days Posted */}
                    {showDaysPosted && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Posted Within</InputLabel>
                                <Select
                                    value={tempFilters.daysPosted || ''}
                                    onChange={handleFieldChange('daysPosted')}
                                    label="Posted Within"
                                >
                                    <MenuItem value="">Any Time</MenuItem>
                                    <MenuItem value={7}>Last 7 Days</MenuItem>
                                    <MenuItem value={14}>Last 14 Days</MenuItem>
                                    <MenuItem value={30}>Last 30 Days</MenuItem>
                                    <MenuItem value={60}>Last 60 Days</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                </Grid>

                {/* Apply Filter Button */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleApplyFilters}
                        disabled={!hasUnappliedChanges}
                        sx={{
                            px: 4,
                            py: 1,
                            fontWeight: 'bold',
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4,
                            },
                        }}
                    >
                        Apply Filters {hasUnappliedChanges && '(Modified)'}
                    </Button>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default FilterPanel;
