import React from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { DeleteForever as DeleteIcon, CloudUpload as ReindexIcon, Warning as WarningIcon } from '@mui/icons-material';

/** Confirmation dialogs for clearing ChromaDB and re-indexing every resume. */
const AdminDialogs = ({
    clearChromaDialog,
    setClearChromaDialog,
    reindexDialog,
    setReindexDialog,
    systemStatus,
    handleClearChromaDB,
    handleReindexAllStudents,
}) => (
    <>
        {/* Clear ChromaDB Confirmation Dialog */}
        <Dialog open={clearChromaDialog} onClose={() => setClearChromaDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#c53030' }}>
                <WarningIcon />
                Clear All ChromaDB Embeddings
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    <strong>⚠️ WARNING:</strong> This will permanently DELETE:
                </DialogContentText>
                <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                    <li>All student resume embeddings from ChromaDB</li>
                    <li>All student-internship match data</li>
                    <li>All embedding IDs from the database</li>
                </Box>
                <DialogContentText sx={{ mt: 2, color: 'error.main', fontWeight: 600 }}>
                    This action cannot be undone. Are you absolutely sure?
                </DialogContentText>
                {systemStatus && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Items to be deleted:
                        </Typography>
                        <Typography variant="body2">
                            • {systemStatus.resumes?.with_embeddings || 0} resume embeddings
                        </Typography>
                        <Typography variant="body2">
                            • {systemStatus.matches?.total || 0} student-internship matches
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setClearChromaDialog(false)} variant="outlined" sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleClearChromaDB}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{ textTransform: 'none' }}
                >
                    Yes, Delete Everything
                </Button>
            </DialogActions>
        </Dialog>

        {/* Reindex All Students Confirmation Dialog */}
        <Dialog open={reindexDialog} onClose={() => setReindexDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f57c00' }}>
                <ReindexIcon />
                Re-index All 50 Student Resumes
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    This will re-process all student resumes from scratch:
                </DialogContentText>
                <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                    <li>
                        Extract text from all resume files in <code>app/public/resumes/</code>
                    </li>
                    <li>Parse each resume using Gemini AI (consumes API credits)</li>
                    <li>Generate new embeddings using HuggingFace</li>
                    <li>Update PostgreSQL database and ChromaDB</li>
                    <li>Recalculate all student-internship matches</li>
                </Box>
                <DialogContentText sx={{ mt: 2 }}>
                    <strong>Estimated time:</strong> 2-5 minutes for 50 resumes
                </DialogContentText>
                <Alert severity="info" sx={{ mt: 2 }}>
                    This is a background task. You can continue using the dashboard while it runs.
                </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setReindexDialog(false)} variant="outlined" sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleReindexAllStudents}
                    variant="contained"
                    color="warning"
                    startIcon={<ReindexIcon />}
                    sx={{
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                    }}
                >
                    Start Re-indexing
                </Button>
            </DialogActions>
        </Dialog>
    </>
);

export default AdminDialogs;
