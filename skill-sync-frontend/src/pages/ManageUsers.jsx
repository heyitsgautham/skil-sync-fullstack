import { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    TextField,
    InputAdornment,
    Snackbar,
} from '@mui/material';
import { ManageAccounts as ManageAccountsIcon, Search as SearchIcon } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import UsersTable from './manageUsers/UsersTable';
import EditUserDialog from './manageUsers/EditUserDialog';
import DeleteUserDialog from './manageUsers/DeleteUserDialog';

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
        anonymization_enabled: false,
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
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
                    user.role.toLowerCase().includes(searchTerm.toLowerCase()),
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
            anonymization_enabled: user.anonymization_enabled || false,
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
                severity: 'success',
            });
            setEditDialogOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to update user',
                severity: 'error',
            });
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/auth/users/${selectedUser.id}`);
            setSnackbar({
                open: true,
                message: 'User deleted successfully',
                severity: 'success',
            });
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to delete user',
                severity: 'error',
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
        return users.filter((u) => u.role === 'admin').length;
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
                                background:
                                    'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
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

                <UsersTable
                    filteredUsers={filteredUsers}
                    handleEditClick={handleEditClick}
                    handleDeleteClick={handleDeleteClick}
                    canDeleteUser={canDeleteUser}
                />

                <EditUserDialog
                    editDialogOpen={editDialogOpen}
                    setEditDialogOpen={setEditDialogOpen}
                    selectedUser={selectedUser}
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    handleEditSubmit={handleEditSubmit}
                />

                <DeleteUserDialog
                    deleteDialogOpen={deleteDialogOpen}
                    setDeleteDialogOpen={setDeleteDialogOpen}
                    selectedUser={selectedUser}
                    handleDeleteConfirm={handleDeleteConfirm}
                />

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Layout>
    );
};

export default ManageUsers;
