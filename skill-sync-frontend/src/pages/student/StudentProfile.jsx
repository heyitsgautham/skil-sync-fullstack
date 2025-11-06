/**
 * Student Profile Page - Feature 7
 * Allows students to view and edit their profile information
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
    LinkedIn as LinkedInIcon,
    GitHub as GitHubIcon,
    Phone as PhoneIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout';

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        linkedin_url: '',
        github_url: ''
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
                full_name: data.full_name || '',
                phone: data.phone || '',
                linkedin_url: data.linkedin_url || '',
                github_url: data.github_url || ''
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
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            linkedin_url: profile.linkedin_url || '',
            github_url: profile.github_url || ''
        });
        setEditing(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
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
                <Card elevation={0} sx={{ maxWidth: 900, margin: '0 auto', borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                                My Profile
                            </Typography>
                            {!editing ? (
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditing(true)}
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
                                    bgcolor: 'primary.main',
                                    mr: 3
                                }}
                            >
                                {getInitials(profile?.full_name)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    {profile?.full_name || 'Student'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Student
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

                            {/* Phone */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!editing}
                                    placeholder="+1-555-0123"
                                    InputProps={{
                                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                />
                            </Grid>

                            {/* LinkedIn URL */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="LinkedIn Profile URL"
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    disabled={!editing}
                                    placeholder="https://linkedin.com/in/yourprofile"
                                    InputProps={{
                                        startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                />
                            </Grid>

                            {/* GitHub URL */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="GitHub Profile URL"
                                    value={formData.github_url}
                                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                                    disabled={!editing}
                                    placeholder="https://github.com/yourusername"
                                    InputProps={{
                                        startAdornment: <GitHubIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                />
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

export default StudentProfile;
