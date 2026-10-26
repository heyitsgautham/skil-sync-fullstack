import React from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

/** Per-page picker and previous and next buttons under the list. */
const RankingPagination = ({ rankedCandidates, page, setPage, pageSize, setPageSize }) => {
    return (
        rankedCandidates.length > 0 && (
            <Box sx={{ mt: 4, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, rankedCandidates.length)} of{' '}
                        {rankedCandidates.length} candidates
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="ranking-page-size-label">Per Page</InputLabel>
                        <Select
                            labelId="ranking-page-size-label"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(e.target.value);
                                setPage(1); // Reset to first page
                            }}
                            label="Per Page"
                        >
                            <MenuItem value={5}>5 per page</MenuItem>
                            <MenuItem value={10}>10 per page</MenuItem>
                            <MenuItem value={25}>25 per page</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        Previous
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                        <Typography variant="body2">
                            Page {page} of {Math.ceil(rankedCandidates.length / pageSize)}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={page >= Math.ceil(rankedCandidates.length / pageSize)}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        )
    );
};

export default RankingPagination;
