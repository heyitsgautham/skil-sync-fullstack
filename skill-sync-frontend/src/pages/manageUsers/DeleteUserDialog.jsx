// Confirms deleting one account and lists what goes with it.
import { Box, Typography, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const DeleteUserDialog = ({ deleteDialogOpen, setDeleteDialogOpen, selectedUser, handleDeleteConfirm }) => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
            sx={{
                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                color: 'white',
                fontWeight: 700,
            }}
        >
            ⚠️ Confirm Delete User
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Are you sure you want to delete this user?
            </Typography>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(245, 87, 108, 0.1)' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedUser?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {selectedUser?.email}
                </Typography>
                <Chip
                    label={selectedUser?.role}
                    size="small"
                    sx={{
                        mt: 1,
                        textTransform: 'capitalize',
                        fontWeight: 600,
                    }}
                />
            </Paper>

            <Typography color="error" sx={{ mb: 1, fontWeight: 600 }}>
                ⚠️ This action cannot be undone!
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
                The following data will be permanently deleted:
            </Typography>

            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                {selectedUser?.role === 'student' && (
                    <>
                        <li>
                            <Typography variant="body2">All student resumes</Typography>
                        </li>
                        <li>
                            <Typography variant="body2">All internship applications</Typography>
                        </li>
                        <li>
                            <Typography variant="body2">All matching data</Typography>
                        </li>
                        <li>
                            <Typography variant="body2">ChromaDB embeddings</Typography>
                        </li>
                    </>
                )}
                {selectedUser?.role === 'company' && (
                    <>
                        <li>
                            <Typography variant="body2">All posted internships</Typography>
                        </li>
                        <li>
                            <Typography variant="body2">All student applications to their internships</Typography>
                        </li>
                        <li>
                            <Typography variant="body2">All matching data</Typography>
                        </li>
                    </>
                )}
                {selectedUser?.role === 'admin' && (
                    <>
                        <li>
                            <Typography variant="body2">Admin user account</Typography>
                        </li>
                        <li>
                            <Typography variant="body2" color="warning.main">
                                Note: At least one admin must remain in the system
                            </Typography>
                        </li>
                    </>
                )}
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#666' }}>
                Cancel
            </Button>
            <Button
                onClick={handleDeleteConfirm}
                variant="contained"
                color="error"
                sx={{
                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #e04558 0%, #d97fe6 100%)',
                    },
                }}
            >
                Delete User
            </Button>
        </DialogActions>
    </Dialog>
);

export default DeleteUserDialog;
