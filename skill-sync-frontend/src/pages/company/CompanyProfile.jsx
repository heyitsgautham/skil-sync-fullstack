/**
 * Company Profile Page - Feature 7
 * Allows companies to view and edit their profile information
 * Includes "Send Email" button with job selection dropdown
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
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import authService from '../../services/authService';

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

  const [formData, setFormData] = useState({
    company_name: '',
    hr_contact_name: '',
    email: '',
    mailing_email: '',
    phone: '',
    phone_visible: false
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
    fetchJobStats();
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
        phone_visible: data.phone_visible !== undefined ? data.phone_visible : true
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

  const fetchJobStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/job-email-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job statistics');
      }

      const data = await response.json();
      setJobStats(data.jobs || []);
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

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
        phone_visible: formData.phone_visible
      };

      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile({ ...data, company_name: data.full_name || data.company_name });
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
      company_name: profile.company_name || '',
      hr_contact_name: profile.hr_contact_name || '',
      email: profile.email || '',
      mailing_email: profile.mailing_email || profile.email || '',
      phone: profile.phone || '',
      phone_visible: profile.phone_visible || false
    });
    setEditing(false);
  };

  const handleSendEmail = async () => {
    if (!selectedJob) {
      setSnackbar({
        open: true,
        message: 'Please select a job position',
        severity: 'warning'
      });
      return;
    }

    setSendingEmail(true);
    setConfirmDialog(false);

    try {
      const response = await fetch(`${API_BASE_URL}/profile/send-job-email/${selectedJob}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: `Email sent successfully! ${data.total_applicants} applicants included.`,
        severity: 'success'
      });
      setSelectedJob('');
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
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
    return jobStats.find(job => job.internship_id === parseInt(selectedJob));
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

            <Divider sx={{ mb: 3 }} />

            {/* Avatar and Company Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: 40,
                  bgcolor: 'secondary.main',
                  mr: 3
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

            {/* Profile Fields */}
            <Grid container spacing={3}>
              {/* Company Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* HR Contact Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="HR Contact Name"
                  value={formData.hr_contact_name}
                  onChange={(e) => setFormData({ ...formData, hr_contact_name: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Company Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Mailing Email */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mailing Email"
                  value={formData.mailing_email}
                  onChange={(e) => setFormData({ ...formData, mailing_email: e.target.value })}
                  disabled={!editing}
                  placeholder="Email for receiving applicant notifications"
                  helperText="This email will be used to send job applicant summaries"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Phone */}
              <Grid size={{ xs: 12, sm: 8 }}>
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

              {/* Phone Visibility Toggle */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.phone_visible}
                      onChange={(e) => setFormData({ ...formData, phone_visible: e.target.checked })}
                      disabled={!editing}
                      color="primary"
                    />
                  }
                  label="Phone Visible to Students"
                  labelPlacement="top"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Job Email Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Send Job Applicants Email
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a job position to send a summary email with all applicant details, including CSV/Excel exports and match statistics.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Job Position</InputLabel>
                    <Select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      label="Select Job Position"
                      disabled={sendingEmail || jobStats.length === 0}
                    >
                      {jobStats.map((job) => (
                        <MenuItem key={job.internship_id} value={job.internship_id}>
                          {job.internship_title} ({job.total_applicants} candidates)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={sendingEmail ? <CircularProgress size={20} /> : <SendIcon />}
                    onClick={() => setConfirmDialog(true)}
                    disabled={!selectedJob || sendingEmail || jobStats.length === 0}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                </Grid>

                {/* Job Statistics */}
                {selectedJob && getSelectedJobStats() && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50', p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Applicant Statistics for {getSelectedJobStats().internship_title}:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`Great Matches (80%+): ${getSelectedJobStats().great_matches}`}
                          color="success"
                        />
                        <Chip
                          label={`Good Matches (60-79%): ${getSelectedJobStats().good_matches}`}
                          color="info"
                        />
                        <Chip
                          label={`Other Matches (<60%): ${getSelectedJobStats().bad_matches}`}
                          color="default"
                        />
                        <Chip
                          label={`Tailored Resumes: ${getSelectedJobStats().tailored_resume_count}`}
                          color="secondary"
                        />
                      </Box>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
          <DialogTitle>Confirm Email Send</DialogTitle>
          <DialogContent>
            <DialogContentText component="div">
              Are you sure you want to send the applicant summary email for{' '}
              <strong>{getSelectedJobStats()?.internship_title}</strong>?
              <br /><br />
              The email will include:
              <ul>
                <li>CSV export of all {getSelectedJobStats()?.total_applicants} candidates</li>
                <li>Match statistics breakdown</li>
                <li>Summary of tailored resumes</li>
              </ul>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} variant="contained" autoFocus>
              Send Email
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
    </Layout>
  );
};

export default CompanyProfile;
