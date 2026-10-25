import React from 'react';
import {
    Box,
    Typography,
    Button,
    MenuItem,
    Chip,
    CircularProgress,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import TableViewIcon from '@mui/icons-material/TableView';
import EmailIcon from '@mui/icons-material/Email';

/** Result count, selection and email controls, expand toggle and export menu. */
const RankingToolbar = ({
    rankedCandidates,
    exportMenuAnchor,
    exportLoading,
    selectedCandidates,
    selectionMode,
    allExpanded,
    handleExportClick,
    handleExportClose,
    handleExport,
    handleToggleExpandAll,
    handleCancelSelection,
    handleOpenEmailModal,
}) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">
                <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Candidates ({rankedCandidates.length})
            </Typography>
            {rankedCandidates.filter((c) => c.scoring_breakdown?.has_tailored).length > 0 && (
                <Chip
                    label={`✨ ${rankedCandidates.filter((c) => c.scoring_breakdown?.has_tailored).length} with tailored resumes`}
                    sx={{
                        backgroundColor: '#9c27b0',
                        color: 'white',
                        fontWeight: 'bold',
                    }}
                />
            )}
        </Box>

        {/* Export and Expand/Collapse Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
            {selectionMode && (
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelSelection}
                    sx={{ minWidth: 120 }}
                >
                    Cancel
                </Button>
            )}
            <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={handleOpenEmailModal}
                sx={{
                    minWidth: 200,
                    borderColor: selectionMode ? '#667eea' : '#4caf50',
                    color: selectionMode ? '#667eea' : '#4caf50',
                    '&:hover': {
                        borderColor: selectionMode ? '#5568d3' : '#45a049',
                        backgroundColor: selectionMode ? 'rgba(102, 126, 234, 0.04)' : 'rgba(76, 175, 80, 0.04)',
                    },
                }}
            >
                {selectionMode ? `Send Email (${selectedCandidates.length} selected)` : 'Send Clustered Email'}
            </Button>
            <Button size="small" variant="outlined" onClick={handleToggleExpandAll}>
                {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
            <Button
                variant="outlined"
                onClick={handleExportClick}
                disabled={exportLoading || rankedCandidates.length === 0}
                sx={{
                    minWidth: 40,
                    px: 1,
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                        borderColor: '#45a049',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)',
                    },
                }}
            >
                {exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
            </Button>
            <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={handleExportClose}>
                <MenuItem onClick={() => handleExport('csv')}>
                    <ListItemIcon>
                        <DescriptionIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Export as CSV" secondary="Excel compatible" />
                </MenuItem>
                <MenuItem onClick={() => handleExport('xlsx')}>
                    <ListItemIcon>
                        <TableViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Export as XLSX" secondary="Native Excel with formatting" />
                </MenuItem>
            </Menu>
        </Box>
    </Box>
);

export default RankingToolbar;
