/**
 * Email Notification Component for Company Dashboard
 * 
 * This component provides UI for:
 * - Previewing daily summary emails
 * - Sending daily summary emails
 * - Managing email preferences
 */

import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    Snackbar,
    Box,
    Typography,
    CircularProgress,
    FormControlLabel,
    Switch,
    Card,
    CardContent
} from '@mui/material';
import {
    Email as EmailIcon,
    Preview as PreviewIcon,
    Send as SendIcon,
    Close as CloseIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

const EmailNotificationPanel = ({ token }) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [stats, setStats] = useState({ totalApplications: 0, internships: 0 });
    const [preferences, setPreferences] = useState({
        daily_summary: true,
        new_applications: true,
        weekly_report: false
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    const handlePreviewEmail = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/notifications/preview-daily-summary?hours=24`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to generate preview');
            }

            const data = await response.json();
            setPreviewHtml(data.preview_html);
            setStats({
                totalApplications: data.total_applications,
                internships: data.internships_with_applications
            });
            setPreviewOpen(true);
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

    const handleSendEmail = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/notifications/send-daily-summary?hours=24&preview_only=false`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            const data = await response.json();

            setSnackbar({
                open: true,
                message: data.message,
                severity: data.email_sent ? 'success' : 'warning'
            });

            if (data.email_sent) {
                setPreviewOpen(false);
            }
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

    const handleLoadPreferences = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/notifications/email-settings`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load preferences');
            }

            const data = await response.json();
            setPreferences(data.preferences);
            setSettingsOpen(true);
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.message}`,
                severity: 'error'
            });
        }
    };

    const handleSavePreferences = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/notifications/email-settings`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        daily_summary_enabled: preferences.daily_summary,
                        new_applications_enabled: preferences.new_applications,
                        weekly_report_enabled: preferences.weekly_report
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save preferences');
            }

            setSnackbar({
                open: true,
                message: 'Email preferences updated successfully',
                severity: 'success'
            });
            setSettingsOpen(false);
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

    return (
        <Box>
            {/* Email Actions Card */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Email Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Manage daily summaries and email preferences
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            onClick={handlePreviewEmail}
                            disabled={loading}
                        >
                            Preview Daily Summary
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleSendEmail}
                            disabled={loading}
                        >
                            Send Daily Summary Now
                        </Button>

                        <Button
                            variant="text"
                            startIcon={<SettingsIcon />}
                            onClick={handleLoadPreferences}
                            disabled={loading}
                        >
                            Email Settings
                        </Button>
                    </Box>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Email Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Daily Summary Preview
                    <IconButton
                        aria-label="close"
                        onClick={() => setPreviewOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>{stats.totalApplications}</strong> new application(s) across{' '}
                        <strong>{stats.internships}</strong> internship posting(s) in the last 24 hours
                    </Alert>

                    {previewHtml ? (
                        <Box
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: '500px'
                            }}
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    ) : (
                        <Typography>Loading preview...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handleSendEmail}
                        disabled={loading}
                    >
                        Send This Email
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Settings Dialog */}
            <Dialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Email Preferences
                    <IconButton
                        aria-label="close"
                        onClick={() => setSettingsOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={preferences.daily_summary}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, daily_summary: e.target.checked })
                                    }
                                />
                            }
                            label="Daily Summary Emails"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                            Receive a daily summary of all new applications at midnight
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={preferences.new_applications}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, new_applications: e.target.checked })
                                    }
                                />
                            }
                            label="Instant Application Notifications"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                            Get notified immediately when someone applies (coming soon)
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={preferences.weekly_report}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, weekly_report: e.target.checked })
                                    }
                                />
                            }
                            label="Weekly Analytics Report"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                            Receive a weekly summary with charts and analytics (coming soon)
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSavePreferences}
                        disabled={loading}
                    >
                        Save Preferences
                    </Button>
                </DialogActions>
            </Dialog>

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
    );
};

export default EmailNotificationPanel;
