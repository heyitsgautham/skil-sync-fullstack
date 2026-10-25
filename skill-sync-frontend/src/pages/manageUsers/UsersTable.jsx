// The user list: one row per account with its role, status, join date and edit and delete actions.
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
    AdminPanelSettings as AdminIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VisibilityOff as VisibilityOffIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { formatDate, getRoleColor, getRoleIcon } from './userDisplay';

const UsersTable = ({ filteredUsers, handleEditClick, handleDeleteClick, canDeleteUser }) => (
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
                                            background:
                                                user.role.toLowerCase() === 'student'
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
                                    <Typography sx={{ fontWeight: 600 }}>{user.full_name}</Typography>
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
                                    <Tooltip
                                        title={
                                            user.anonymization_enabled
                                                ? 'Anonymization Enabled - Company views anonymized resumes'
                                                : 'Anonymization Disabled - Company views original resumes'
                                        }
                                    >
                                        <Chip
                                            icon={
                                                user.anonymization_enabled ? <VisibilityOffIcon /> : <VisibilityIcon />
                                            }
                                            label={user.anonymization_enabled ? 'Anonymized' : 'Original'}
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
                                    <Tooltip
                                        title={
                                            user.is_active === 1
                                                ? 'Active - Visible in candidate rankings'
                                                : 'Inactive - Hidden from candidate rankings'
                                        }
                                    >
                                        <Chip
                                            label={user.is_active === 1 ? 'Active' : 'Inactive'}
                                            size="small"
                                            sx={{
                                                background:
                                                    user.is_active === 1
                                                        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)'
                                                        : 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%)',
                                                border:
                                                    user.is_active === 1
                                                        ? '1px solid rgba(46, 125, 50, 0.3)'
                                                        : '1px solid rgba(211, 47, 47, 0.3)',
                                                color: user.is_active === 1 ? '#2e7d32' : '#d32f2f',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title={user.is_active === 1 ? 'Active' : 'Inactive'}>
                                        <Chip
                                            label={user.is_active === 1 ? 'Active' : 'Inactive'}
                                            size="small"
                                            sx={{
                                                background:
                                                    user.is_active === 1
                                                        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%)'
                                                        : 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%)',
                                                border:
                                                    user.is_active === 1
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
                                <Tooltip
                                    title={!canDeleteUser(user).allowed ? canDeleteUser(user).reason : 'Delete User'}
                                >
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
                                                },
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
);

export default UsersTable;
