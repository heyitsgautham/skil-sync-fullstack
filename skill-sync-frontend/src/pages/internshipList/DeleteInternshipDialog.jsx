// Confirms deleting an internship posting.
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const DeleteInternshipDialog = ({ deleteDialogOpen, setDeleteDialogOpen, internshipToDelete, handleDeleteConfirm }) => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
            sx={{
                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                color: 'white',
                fontWeight: 700,
            }}
        >
            ⚠️ Confirm Delete Internship
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Are you sure you want to delete this internship?
            </Typography>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(245, 87, 108, 0.1)' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {internshipToDelete?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {internshipToDelete?.company_name}
                </Typography>
            </Paper>

            <Typography color="error" sx={{ mb: 1, fontWeight: 600 }}>
                ⚠️ This action cannot be undone!
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
                The following data will be permanently deleted:
            </Typography>

            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>
                    <Typography variant="body2">Internship posting</Typography>
                </li>
                <li>
                    <Typography variant="body2">All student applications</Typography>
                </li>
                <li>
                    <Typography variant="body2">All matching data</Typography>
                </li>
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
                Delete Internship
            </Button>
        </DialogActions>
    </Dialog>
);

export default DeleteInternshipDialog;
