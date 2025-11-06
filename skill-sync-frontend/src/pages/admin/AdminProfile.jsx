/**
 * Admin Profile Page - Feature 7
 * Allows admins to view and edit their profile information
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Avatar,
    Grid,
    Snackbar,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout';

const AdminProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const [formData, setFormData] = useState({
        full_name: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            setProfile(data);
            setFormData({
                full_name: data.full_name || ''
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            setProfile(data);
            setEditing(false);
            setSnackbar({
                open: true,
                message: 'Profile updated successfully!',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            full_name: profile.full_name || ''
        });
        setEditing(false);
    };

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.charAt(0).toUpperCase();
    };

    if (loading) {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Card elevation={0} sx={{ maxWidth: 800, margin: '0 auto', borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                                Admin Profile
                            </Typography>
                            {!editing ? (
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditing(true)}
                                    color="error"
                                >
                                    Edit Profile
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={saving}
                                        color="error"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        {/* Avatar and Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                            <Avatar
                                sx={{
                                    width: 100,
                                    height: 100,
                                    fontSize: 40,
                                    bgcolor: 'error.main',
                                    mr: 3
                                }}
                            >
                                {getInitials(profile?.full_name)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    {profile?.full_name || 'Administrator'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AdminIcon fontSize="small" /> System Administrator
                                </Typography>
                            </Box>
                        </Box>

                        {/* Profile Fields */}
                        <Grid container spacing={3}>
                            {/* Name */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    disabled={!editing}
                                    InputProps={{
                                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                />
                            </Grid>

                            {/* Email (Read-only) */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={profile?.email || ''}
                                    disabled
                                    InputProps={{
                                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                    helperText="Email cannot be changed"
                                />
                            </Grid>

                            {/* Admin Info */}
                            <Grid size={{ xs: 12 }}>
                                <Card variant="outlined" sx={{ p: 2, bgcolor: 'error.50', borderColor: 'error.200' }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'error.dark' }}>
                                        Administrator Privileges
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        As an administrator, you have full access to:
                                    </Typography>
                                    <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            User Management - Create, edit, and delete users
                                        </Typography>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            System Analytics - View comprehensive platform statistics
                                        </Typography>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            Internship Oversight - Monitor and manage all internship postings
                                        </Typography>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            RAG System Controls - Manage AI matching and recommendations
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Layout>
    );
};

export default AdminProfile;
