/**
 * Company Profile Page - Feature 7
 * Allows companies to view and edit their profile information
 * Includes "Send Email" button with job selection dropdown
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Button,
    Typography,
    Avatar,
    Snackbar,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../services/apiConfig';
import CompanyProfileFields from './companyProfile/CompanyProfileFields';
import JobEmailSection from './companyProfile/JobEmailSection';
import ConfirmSendDialog from './companyProfile/ConfirmSendDialog';
import { responseErrorMessage } from '../../services/apiErrors';

const CompanyProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Job email state
    const [jobStats, setJobStats] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);

    // Match quality filter state
    const [matchFilters, setMatchFilters] = useState({
        all: true,
        greatMatches: true,
        goodMatches: true,
        otherMatches: true,
    });

    const [formData, setFormData] = useState({
        company_name: '',
        hr_contact_name: '',
        email: '',
        mailing_email: '',
        phone: '',
        phone_visible: false,
    });

    const token = localStorage.getItem('token');

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();

            // If company_name doesn't exist, try to get it from full_name or currentUser
            let companyName = data.company_name || data.full_name;
            if (!companyName) {
                const currentUser = authService.getCurrentUser();
                companyName = currentUser?.full_name || currentUser?.company_name || '';
            }

            setProfile({ ...data, company_name: companyName });
            setFormData({
                company_name: companyName,
                hr_contact_name: data.hr_contact_name || '',
                email: data.email || '',
                mailing_email: data.mailing_email || data.email || '',
                phone: data.phone || '',
                phone_visible: data.phone_visible !== undefined ? data.phone_visible : true,
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchJobStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/profile/job-email-stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to fetch job statistics'));
            }

            const data = await response.json();
            setJobStats(data.jobs || []);
        } catch (error) {
            console.error('Error fetching job stats:', error);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
        fetchJobStats();
    }, [fetchProfile, fetchJobStats]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert company_name to full_name for backend
            const updateData = {
                full_name: formData.company_name,
                hr_contact_name: formData.hr_contact_name,
                email: formData.email,
                mailing_email: formData.mailing_email,
                phone: formData.phone,
                phone_visible: formData.phone_visible,
            };

            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to update profile'));
            }

            const data = await response.json();

            authService.updateCurrentUser({ full_name: data.full_name, email: data.email });
            setProfile({ ...data, company_name: data.full_name || data.company_name });
            setEditing(false);
            setSnackbar({
                open: true,
                message: 'Profile updated successfully!',
                severity: 'success',
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            company_name: profile.company_name || '',
            hr_contact_name: profile.hr_contact_name || '',
            email: profile.email || '',
            mailing_email: profile.mailing_email || profile.email || '',
            phone: profile.phone || '',
            phone_visible: profile.phone_visible || false,
        });
        setEditing(false);
    };

    const handleSendEmail = async () => {
        if (!selectedJob) {
            setSnackbar({
                open: true,
                message: 'Please select a job position',
                severity: 'warning',
            });
            return;
        }

        setSendingEmail(true);
        setConfirmDialog(false);

        try {
            // Prepare filter parameters
            const filters = [];
            if (matchFilters.greatMatches) filters.push('great');
            if (matchFilters.goodMatches) filters.push('good');
            if (matchFilters.otherMatches) filters.push('other');

            // Build query params
            const queryParams = new URLSearchParams();
            filters.forEach((filter) => queryParams.append('filters', filter));

            const response = await fetch(
                `${API_BASE_URL}/profile/send-job-email/${selectedJob}?${queryParams.toString()}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to send email'));
            }

            const data = await response.json();
            setSnackbar({
                open: true,
                message: `Email sent successfully! ${data.total_applicants} applicants included.`,
                severity: 'success',
            });
            setSelectedJob('');

            // Reset filters to default (all selected)
            setMatchFilters({
                all: true,
                greatMatches: true,
                goodMatches: true,
                otherMatches: true,
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const getSelectedJobStats = () => {
        return jobStats.find((job) => job.internship_id === parseInt(selectedJob));
    };

    const handleFilterChange = (filterName) => {
        if (filterName === 'all') {
            // Toggle all filters
            const newValue = !matchFilters.all;
            setMatchFilters({
                all: newValue,
                greatMatches: newValue,
                goodMatches: newValue,
                otherMatches: newValue,
            });
        } else {
            // Update individual filter
            const newFilters = {
                ...matchFilters,
                [filterName]: !matchFilters[filterName],
            };

            // Check if all individual filters are selected
            const allIndividualSelected = newFilters.greatMatches && newFilters.goodMatches && newFilters.otherMatches;

            newFilters.all = allIndividualSelected;
            setMatchFilters(newFilters);
        }
    };

    const getFilteredCandidateCount = () => {
        if (!selectedJob || !getSelectedJobStats()) return 0;

        const stats = getSelectedJobStats();
        let count = 0;

        if (matchFilters.greatMatches) count += stats.great_matches;
        if (matchFilters.goodMatches) count += stats.good_matches;
        if (matchFilters.otherMatches) count += stats.bad_matches;

        return count;
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
                <Card elevation={0} sx={{ maxWidth: 1000, margin: '0 auto', borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h4" component="h1">
                                Company Profile
                            </Typography>
                            {!editing ? (
                                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                                    Edit Profile
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" onClick={handleCancel} disabled={saving}>
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

                        <Divider sx={{ mb: 3 }} />

                        {/* Avatar and Company Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                            <Avatar
                                sx={{
                                    width: 100,
                                    height: 100,
                                    fontSize: 40,
                                    bgcolor: 'secondary.main',
                                    mr: 3,
                                }}
                            >
                                {getInitials(profile?.company_name)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    {profile?.company_name || 'Company'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Company Account
                                </Typography>
                            </Box>
                        </Box>

                        <CompanyProfileFields editing={editing} formData={formData} setFormData={setFormData} />

                        <Divider sx={{ my: 4 }} />

                        <JobEmailSection
                            jobStats={jobStats}
                            selectedJob={selectedJob}
                            setSelectedJob={setSelectedJob}
                            sendingEmail={sendingEmail}
                            setConfirmDialog={setConfirmDialog}
                            matchFilters={matchFilters}
                            getSelectedJobStats={getSelectedJobStats}
                            handleFilterChange={handleFilterChange}
                            getFilteredCandidateCount={getFilteredCandidateCount}
                        />
                    </CardContent>
                </Card>

                <ConfirmSendDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                    matchFilters={matchFilters}
                    handleSendEmail={handleSendEmail}
                    getSelectedJobStats={getSelectedJobStats}
                    getFilteredCandidateCount={getFilteredCandidateCount}
                />

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

export default CompanyProfile;
