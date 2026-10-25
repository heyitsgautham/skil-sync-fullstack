// Edits an internship posting: title, description, location, duration, stipend and skills.
import React from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const EditInternshipDialog = ({
    editDialogOpen,
    setEditDialogOpen,
    editFormData,
    setEditFormData,
    userRole,
    handleEditSubmit,
}) => (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
            sx={{
                background:
                    userRole === 'admin'
                        ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
            }}
        >
            Edit Internship
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <TextField
                fullWidth
                label="Title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                margin="normal"
                required
            />
            <TextField
                fullWidth
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                required
            />
            <TextField
                fullWidth
                label="Location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                margin="normal"
            />
            <TextField
                fullWidth
                label="Duration"
                value={editFormData.duration}
                onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                margin="normal"
                placeholder="e.g., 3 months"
            />
            <TextField
                fullWidth
                label="Stipend"
                value={editFormData.stipend}
                onChange={(e) => setEditFormData({ ...editFormData, stipend: e.target.value })}
                margin="normal"
                placeholder="e.g., $1000/month"
            />
            <TextField
                fullWidth
                label="Required Skills (comma-separated)"
                value={
                    Array.isArray(editFormData.required_skills)
                        ? editFormData.required_skills.join(', ')
                        : editFormData.required_skills
                }
                onChange={(e) => setEditFormData({ ...editFormData, required_skills: e.target.value })}
                margin="normal"
                placeholder="e.g., Python, React, SQL"
            />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#666' }}>
                Cancel
            </Button>
            <Button
                onClick={handleEditSubmit}
                variant="contained"
                sx={{
                    background:
                        userRole === 'admin'
                            ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                        background:
                            userRole === 'admin'
                                ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                                : 'linear-gradient(135deg, #5568d3 0%, #6a3f8e 100%)',
                    },
                }}
            >
                Save Changes
            </Button>
        </DialogActions>
    </Dialog>
);

export default EditInternshipDialog;
