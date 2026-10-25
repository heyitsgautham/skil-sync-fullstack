import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    ManageAccounts as ManageAccountsIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    AdminPanelSettings as AdminIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VisibilityOff as VisibilityOffIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        full_name: '',
        is_active: 1,
        anonymization_enabled: false
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users.filter(
                (user) =>
                    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please ensure you have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditFormData({
            full_name: user.full_name,
            is_active: user.is_active !== undefined ? user.is_active : 1,
            anonymization_enabled: user.anonymization_enabled || false
        });
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            // Remove role from the request - role changes not allowed
            const { role, ...updateData } = editFormData;
            await api.put(`/auth/users/${selectedUser.id}`, updateData);
            setSnackbar({
                open: true,
                message: 'User updated successfully',
                severity: 'success'
            });
            setEditDialogOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to update user',
                severity: 'error'
            });
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/auth/users/${selectedUser.id}`);
            setSnackbar({
                open: true,
                message: 'User deleted successfully',
                severity: 'success'
            });
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to delete user',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getCurrentUserId = () => {
        // Get current user ID from localStorage or token
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id;
    };

    const getAdminCount = () => {
        return users.filter(u => u.role === 'admin').length;
    };

    const canDeleteUser = (user) => {
        const currentUserId = getCurrentUserId();

        // Cannot delete yourself
        if (user.id === currentUserId) {
            return { allowed: false, reason: 'Cannot delete your own account' };
        }

        // Cannot delete last admin
        if (user.role === 'admin' && getAdminCount() <= 1) {
            return { allowed: false, reason: 'Cannot delete the last administrator' };
        }

        return { allowed: true, reason: '' };
    };

    const getRoleIcon = (role) => {
        switch (role.toLowerCase()) {
            case 'student':
                return <PersonIcon sx={{ fontSize: 20, color: '#1976d2' }} />;
            case 'company':
                return <BusinessIcon sx={{ fontSize: 20, color: '#2e7d32' }} />;
            case 'admin':
                return <AdminIcon sx={{ fontSize: 20, color: '#d32f2f' }} />;
            default:
                return <PersonIcon sx={{ fontSize: 20 }} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role.toLowerCase()) {
            case 'student':
                return {
                    background: 'linear-gradient(135deg, rgba(19, 39, 128, 0.15) 0%, rgba(19, 13, 95, 0.15) 100%)',
                    border: '1px solid rgba(11, 25, 85, 0.3)',
                    color: '#1976d2',
                };
            case 'company':
                return {
                    background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%)',
                    border: '1px solid rgba(17, 153, 142, 0.3)',
                    color: '#11998e',
                };
            case 'admin':
                return {
                    background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.15) 0%, rgba(240, 147, 251, 0.15) 100%)',
                    border: '1px solid rgba(245, 87, 108, 0.3)',
                    color: '#f5576c',
                };
            default:
                return {
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    color: '#666',
                };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <Layout>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress size={60} />
                    </Box>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg,#d32f2f 0%, #d32f2fdd 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 3,
                                    boxShadow: '0 8px 24px rgba(211, 47, 47         , 0.3)',
                                }}
                            >
                                <ManageAccountsIcon sx={{ fontSize: 36, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        color: '#1a1a1a',
                                        letterSpacing: '-0.5px',
                                    }}
                                >
                                    User Management
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Manage all users in the system
                                </Typography>
                            </Box>
                        </Box>
                        <Chip
                            label={`${filteredUsers.length} Users`}
                            sx={{
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                color: '#667eea',
                                fontWeight: 700,
                                fontSize: '1rem',
                                height: '40px',
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#667eea' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                            },
                        }}
                    />
                </Paper>

                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Joined</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <PersonIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            No users found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        background: user.role.toLowerCase() === 'student'
                                                            ? '#1976d2'
                                                            : user.role.toLowerCase() === 'company'
                                                                ? '#2e7d32'
                                                                : '#d32f2f',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                    }}
                                                >
                                                    {user.role.toLowerCase() === 'student' && (
                                                        <PersonIcon sx={{ color: 'white', fontSize: 22 }} />
                                                    )}
                                                    {user.role.toLowerCase() === 'company' && (
                                                        <BusinessIcon sx={{ color: 'white', fontSize: 22 }} />
                                                    )}
                                                    {user.role.toLowerCase() === 'admin' && (
                                                        <AdminIcon sx={{ color: 'white', fontSize: 22 }} />
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {user.full_name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getRoleIcon(user.role)}
                                                label={user.role}
                                                size="small"
                                                sx={{
                                                    ...getRoleColor(user.role),
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {user.role.toLowerCase() === 'company' ? (
                                                <Tooltip title={user.anonymization_enabled ? "Anonymization Enabled - Company views anonymized resumes" : "Anonymization Disabled - Company views original resumes"}>
                                                    <Chip
                                                        icon={user.anonymization_enabled ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                        label={user.anonymization_enabled ? "Anonymized" : "Original"}
                                                        size="small"
                                                        sx={{
                                                            background: user.anonymization_enabled
                                                                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)'
                                                                : 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(21, 101, 192, 0.15) 100%)',
                                                            border: user.anonymization_enabled
                                                                ? '1px solid rgba(46, 125, 50, 0.3)'
                                                                : '1px solid rgba(25, 118, 210, 0.3)',
                                                            color: user.anonymization_enabled ? '#2e7d32' : '#1976d2',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </Tooltip>
                                            ) : user.role.toLowerCase() === 'student' ? (
                                                <Tooltip title={user.is_active === 1 ? "Active - Visible in candidate rankings" : "Inactive - Hidden from candidate rankings"}>
                                                    <Chip
                                                        label={user.is_active === 1 ? "Active" : "Inactive"}
                                                        size="small"
                                                        sx={{
                                                            background: user.is_active === 1
                                                                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)'
                                                                : 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%)',
                                                            border: user.is_active === 1
                                                                ? '1px solid rgba(46, 125, 50, 0.3)'
                                                                : '1px solid rgba(211, 47, 47, 0.3)',
                                                            color: user.is_active === 1 ? '#2e7d32' : '#d32f2f',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title={user.is_active === 1 ? "Active" : "Inactive"}>
                                                    <Chip
                                                        label={user.is_active === 1 ? "Active" : "Inactive"}
                                                        size="small"
                                                        sx={{
                                                            background: user.is_active === 1
                                                                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)'
                                                                : 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%)',
                                                            border: user.is_active === 1
                                                                ? '1px solid rgba(46, 125, 50, 0.3)'
                                                                : '1px solid rgba(211, 47, 47, 0.3)',
                                                            color: user.is_active === 1 ? '#2e7d32' : '#d32f2f',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.created_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit User">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(user)}
                                                    sx={{
                                                        color: '#263991ff',
                                                        mr: 1,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={
                                                !canDeleteUser(user).allowed
                                                    ? canDeleteUser(user).reason
                                                    : "Delete User"
                                            }>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={!canDeleteUser(user).allowed}
                                                        sx={{
                                                            color: canDeleteUser(user).allowed ? '#f5576c' : '#ccc',
                                                            '&:hover': {
                                                                backgroundColor: canDeleteUser(user).allowed
                                                                    ? 'rgba(245, 87, 108, 0.1)'
                                                                    : 'transparent',
                                                            },
                                                            '&.Mui-disabled': {
                                                                color: '#ccc',
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Edit User Dialog */}
                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{
                        background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                        color: 'white',
                        fontWeight: 700
                    }}>
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
                        <Box sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: 2,
                            border: '1px solid rgba(102, 126, 234, 0.3)'
                        }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Current Role
                            </Typography>
                            <Chip
                                label={selectedUser?.role}
                                size="small"
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 600
                                }}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                ℹ️ Role cannot be changed for security reasons
                            </Typography>
                        </Box>

                        {/* Student Status - Active/Inactive */}
                        {selectedUser?.role.toLowerCase() === 'student' && (
                            <Box sx={{
                                p: 2,
                                mt: 2,
                                bgcolor: 'rgba(25, 118, 210, 0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(25, 118, 210, 0.2)'
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={editFormData.is_active === 1}
                                            onChange={(e) => setEditFormData({
                                                ...editFormData,
                                                is_active: e.target.checked ? 1 : 0
                                            })}
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
                                                    : '🚫 Inactive - Candidate hidden from all internship rankings'
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                                />
                                <Box sx={{
                                    mt: 2,
                                    p: 1.5,
                                    bgcolor: 'rgba(211, 47, 47, 0.05)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(211, 47, 47, 0.2)'
                                }}>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'flex-start', color: '#d32f2f' }}>
                                        <strong>⚠️ Note:</strong>&nbsp;When inactive, this candidate will NOT appear in the Candidate Ranking page for any internship. Use this to temporarily hide candidates from company views.
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Company Anonymization Toggle */}
                        {selectedUser?.role.toLowerCase() === 'company' && (
                            <Box sx={{
                                p: 2,
                                mt: 2,
                                bgcolor: 'rgba(46, 125, 50, 0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(46, 125, 50, 0.2)'
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={editFormData.anonymization_enabled}
                                            onChange={(e) => setEditFormData({
                                                ...editFormData,
                                                anonymization_enabled: e.target.checked
                                            })}
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
                                                    : '👁️ Company views original resumes with full information'
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                                />
                                <Box sx={{
                                    mt: 2,
                                    p: 1.5,
                                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(25, 118, 210, 0.2)'
                                }}>
                                    <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <strong>ℹ️ Info:</strong>&nbsp;When enabled, the company will see anonymized versions of student resumes with personal information (name, email, phone, address) automatically redacted to prevent bias in the screening process.
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
                        <Button
                            onClick={() => setEditDialogOpen(false)}
                            sx={{ color: '#666' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            variant="contained"
                            sx={{
                                background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        color: 'white',
                        fontWeight: 700
                    }}>
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
                                    fontWeight: 600
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
                                    <li><Typography variant="body2">All student resumes</Typography></li>
                                    <li><Typography variant="body2">All internship applications</Typography></li>
                                    <li><Typography variant="body2">All matching data</Typography></li>
                                    <li><Typography variant="body2">ChromaDB embeddings</Typography></li>
                                </>
                            )}
                            {selectedUser?.role === 'company' && (
                                <>
                                    <li><Typography variant="body2">All posted internships</Typography></li>
                                    <li><Typography variant="body2">All student applications to their internships</Typography></li>
                                    <li><Typography variant="body2">All matching data</Typography></li>
                                </>
                            )}
                            {selectedUser?.role === 'admin' && (
                                <>
                                    <li><Typography variant="body2">Admin user account</Typography></li>
                                    <li><Typography variant="body2" color="warning.main">
                                        Note: At least one admin must remain in the system
                                    </Typography></li>
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            onClick={() => setDeleteDialogOpen(false)}
                            sx={{ color: '#666' }}
                        >
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
                                }
                            }}
                        >
                            Delete User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Layout>
    );
};

export default ManageUsers;
