import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Paper,
    Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/**
 * Reusable Sort Controls Component
 * 
 * @param {Object} props
 * @param {String} props.sortBy - Current sort field
 * @param {String} props.sortOrder - Current sort order (asc/desc)
 * @param {Function} props.onSortChange - Callback when sort changes
 * @param {Array} props.sortOptions - Available sort options [{ value, label }]
 */
const SortControls = ({
    sortBy = 'score',
    sortOrder = 'desc',
    onSortChange,
    sortOptions = [
        { value: 'score', label: 'Match Score' },
        { value: 'date', label: 'Date' },
        { value: 'title', label: 'Title' },
    ],
}) => {
    const handleSortByChange = (event) => {
        onSortChange({
            sortBy: event.target.value,
            sortOrder,
        });
    };

    const handleSortOrderChange = (event, newOrder) => {
        if (newOrder !== null) {
            onSortChange({
                sortBy,
                sortOrder: newOrder,
            });
        }
    };

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight="600" color="text.secondary">
                    Sort by:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                        value={sortBy}
                        onChange={handleSortByChange}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        }}
                    >
                        {sortOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
                aria-label="sort order"
                size="small"
            >
                <ToggleButton value="desc" aria-label="descending">
                    <ArrowDownwardIcon sx={{ mr: 0.5 }} fontSize="small" />
                    High to Low
                </ToggleButton>
                <ToggleButton value="asc" aria-label="ascending">
                    <ArrowUpwardIcon sx={{ mr: 0.5 }} fontSize="small" />
                    Low to High
                </ToggleButton>
            </ToggleButtonGroup>
        </Paper>
    );
};

export default SortControls;
