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
} from '@mui/material';
import {
    ManageAccounts as ManageAccountsIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
            // Since there's no specific endpoint for listing all users, we'll need to create one
            // For now, this is a placeholder that will show the structure
            // You would need to add a backend endpoint like GET /auth/users for admins

            // Simulating the API call structure
            const response = await api.get('/auth/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. This feature requires a backend endpoint.');
            // Fallback to demo data for display purposes
            const demoUsers = [
                {
                    id: 1,
                    full_name: 'John Doe',
                    email: 'john@example.com',
                    role: 'student',
                    created_at: new Date().toISOString(),
                },
                {
                    id: 2,
                    full_name: 'Tech Corp',
                    email: 'hr@techcorp.com',
                    role: 'company',
                    created_at: new Date().toISOString(),
                },
            ];
            setUsers(demoUsers);
            setFilteredUsers(demoUsers);
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role.toLowerCase()) {
            case 'student':
                return <PersonIcon sx={{ fontSize: 20, color: '#667eea' }} />;
            case 'company':
                return <BusinessIcon sx={{ fontSize: 20, color: '#11998e' }} />;
            case 'admin':
                return <AdminIcon sx={{ fontSize: 20, color: '#f5576c' }} />;
            default:
                return <PersonIcon sx={{ fontSize: 20 }} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role.toLowerCase()) {
            case 'student':
                return {
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    color: '#667eea',
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
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 3,
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
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
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Joined</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
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
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                    }}
                                                >
                                                    <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                                        {user.full_name.charAt(0).toUpperCase()}
                                                    </Typography>
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
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.created_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: '#667eea',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    <PersonIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Layout>
    );
};

export default ManageUsers;
