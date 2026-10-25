// Edits one account: its name, a student's active status or a company's anonymized resume view.
import {
    Box,
    Typography,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
} from '@mui/material';

const EditUserDialog = ({
    editDialogOpen,
    setEditDialogOpen,
    selectedUser,
    editFormData,
    setEditFormData,
    handleEditSubmit,
}) => (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
            sx={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                color: 'white',
                fontWeight: 700,
            }}
        >
            Edit User
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <TextField
                fullWidth
                label="Full Name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                margin="normal"
                sx={{ mb: 2 }}
            />
            <Box
                sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Current Role
                </Typography>
                <Chip
                    label={selectedUser?.role}
                    size="small"
                    sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                    }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    ℹ️ Role cannot be changed for security reasons
                </Typography>
            </Box>

            {/* Student Status - Active/Inactive */}
            {selectedUser?.role.toLowerCase() === 'student' && (
                <Box
                    sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: 'rgba(25, 118, 210, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editFormData.is_active === 1}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        is_active: e.target.checked ? 1 : 0,
                                    })
                                }
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#2e7d32',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#2e7d32',
                                    },
                                }}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    Candidate Status
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {editFormData.is_active === 1
                                        ? '✅ Active - Candidate appears in all internship rankings'
                                        : '🚫 Inactive - Candidate hidden from all internship rankings'}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    />
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: 'rgba(211, 47, 47, 0.05)',
                            borderRadius: 1,
                            border: '1px solid rgba(211, 47, 47, 0.2)',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ display: 'flex', alignItems: 'flex-start', color: '#d32f2f' }}
                        >
                            <strong>⚠️ Note:</strong>&nbsp;When inactive, this candidate will NOT appear in the
                            Candidate Ranking page for any internship. Use this to temporarily hide candidates from
                            company views.
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Company Anonymization Toggle */}
            {selectedUser?.role.toLowerCase() === 'company' && (
                <Box
                    sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: 'rgba(46, 125, 50, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(46, 125, 50, 0.2)',
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editFormData.anonymization_enabled}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        anonymization_enabled: e.target.checked,
                                    })
                                }
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#2e7d32',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#2e7d32',
                                    },
                                }}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    Resume Anonymization
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {editFormData.anonymization_enabled
                                        ? '🔒 Company views anonymized resumes (PII removed)'
                                        : '👁️ Company views original resumes with full information'}
                                </Typography>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    />
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            borderRadius: 1,
                            border: '1px solid rgba(25, 118, 210, 0.2)',
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="primary"
                            sx={{ display: 'flex', alignItems: 'flex-start' }}
                        >
                            <strong>ℹ️ Info:</strong>&nbsp;When enabled, the company will see anonymized versions of
                            student resumes with personal information (name, email, phone, address) automatically
                            redacted to prevent bias in the screening process.
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Admin Status */}
            {selectedUser?.role.toLowerCase() === 'admin' && (
                <FormControl fullWidth margin="normal" sx={{ mt: 2 }}>
                    <InputLabel>Account Status</InputLabel>
                    <Select
                        value={editFormData.is_active}
                        label="Account Status"
                        onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value })}
                    >
                        <MenuItem value={1}>Active</MenuItem>
                        <MenuItem value={0}>Inactive</MenuItem>
                    </Select>
                </FormControl>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#666' }}>
                Cancel
            </Button>
            <Button
                onClick={handleEditSubmit}
                variant="contained"
                sx={{
                    background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
                    },
                }}
            >
                Save Changes
            </Button>
        </DialogActions>
    </Dialog>
);

export default EditUserDialog;
