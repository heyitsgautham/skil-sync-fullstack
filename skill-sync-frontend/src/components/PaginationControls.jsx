import React from 'react';
import {
    Box,
    Pagination,
    FormControl,
    Select,
    MenuItem,
    Typography,
    Paper,
} from '@mui/material';

/**
 * Reusable Pagination Controls Component
 * 
 * @param {Object} props
 * @param {Number} props.page - Current page number
 * @param {Number} props.totalPages - Total number of pages
 * @param {Number} props.pageSize - Items per page
 * @param {Number} props.total - Total number of items
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onPageSizeChange - Callback when page size changes
 * @param {Array} props.pageSizeOptions - Available page size options
 */
const PaginationControls = ({
    page = 1,
    totalPages = 1,
    pageSize = 5,
    total = 0,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 25, 50, 100],
}) => {
    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mt: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
            }}
        >
            {/* Items count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
                    <strong>{total}</strong> results
                </Typography>

                {/* Page size selector */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value)}
                        displayEmpty
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        }}
                    >
                        {pageSizeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option} per page
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Pagination */}
            <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => onPageChange(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                sx={{
                    '& .MuiPaginationItem-root': {
                        fontWeight: 600,
                    },
                }}
            />
        </Paper>
    );
};

export default PaginationControls;
