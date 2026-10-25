// Role icons, role chip colors and date formatting shared by the user table and dialogs.
import { Person as PersonIcon, Business as BusinessIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';

export const getRoleIcon = (role) => {
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

export const getRoleColor = (role) => {
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

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
