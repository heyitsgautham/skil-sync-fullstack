/**
 * InternshipApplicationDialog Component
 * 
 * Provides a dialog for students to apply to internships with:
 * - Cover letter input
 * - Option to upload tailored resume
 * - Real-time match score preview
 * - Application submission
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import apiClient from '../services/api';

const InternshipApplicationDialog = ({ open, onClose, internship, onSuccess }) => {
    const [useTailoredResume, setUseTailoredResume] = useState(false);
    const [tailoredResumeFile, setTailoredResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (!allowedTypes.includes(fileExtension)) {
                setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            setTailoredResumeFile(file);
            setError('');
            setUploadStatus(`Selected: ${file.name}`);
        }
    };

    const handleRemoveFile = () => {
        setTailoredResumeFile(null);
        setUploadStatus('');
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            // Create FormData for multipart/form-data request
            const formData = new FormData();

            // Add use_tailored_resume flag
            formData.append('use_tailored_resume', (useTailoredResume && tailoredResumeFile !== null).toString());

            // Add tailored resume file if provided
            if (useTailoredResume && tailoredResumeFile) {
                formData.append('tailored_resume', tailoredResumeFile);
            }

            const response = await apiClient.post(
                `/internship/${internship.id}/apply`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Show success message with match score
            const matchScore = response.data.application_similarity_score || response.data.match_score;
            const resumeType = response.data.used_tailored_resume ? 'tailored' : 'active';

            if (onSuccess) {
                onSuccess({
                    message: `Successfully applied with ${resumeType} resume! Match score: ${matchScore}%`,
                    matchScore,
                    resumeType,
                });
            }

            handleClose();
        } catch (err) {
            console.error('Error applying to internship:', err);
            setError(err.response?.data?.detail || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setUseTailoredResume(false);
        setTailoredResumeFile(null);
        setError('');
        setUploadStatus('');
        onClose();
    };

    if (!internship) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                        Apply to Internship
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {internship.title} at {internship.company_name}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Tailored Resume Option */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        borderRadius: 2,
                    }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={useTailoredResume}
                                onChange={(e) => setUseTailoredResume(e.target.checked)}
                                sx={{
                                    color: '#667eea',
                                    '&.Mui-checked': {
                                        color: '#667eea',
                                    }
                                }}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AutoAwesomeIcon sx={{ fontSize: 20, color: '#667eea' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Upload tailored resume for this internship
                                </Typography>
                            </Box>
                        }
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4.5, mt: 0.5 }}>
                        💡 Tip: Customize your resume to highlight skills matching this role for a better match score!
                    </Typography>

                    {/* File Upload Section */}
                    {useTailoredResume && (
                        <Box sx={{ mt: 2, ml: 4.5 }}>
                            {!tailoredResumeFile ? (
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#764ba2',
                                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                        }
                                    }}
                                >
                                    Choose File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            ) : (
                                <Chip
                                    icon={<DescriptionIcon />}
                                    label={tailoredResumeFile.name}
                                    onDelete={handleRemoveFile}
                                    color="primary"
                                    sx={{
                                        maxWidth: '100%',
                                        '& .MuiChip-label': {
                                            maxWidth: 'calc(100% - 64px)',
                                        }
                                    }}
                                />
                            )}

                            {uploadStatus && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                                    ✓ {uploadStatus}
                                </Typography>
                            )}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* Info Box */}
                <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                        <strong>What happens after you apply?</strong>
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        • Your application will be reviewed by the company
                        <br />
                        • You'll receive an AI-generated match score
                        <br />
                        • Check "My Applications" to track status
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || (useTailoredResume && !tailoredResumeFile)}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{
                        px: 4,
                        py: 1,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                        },
                        '&:disabled': {
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%)',
                        }
                    }}
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InternshipApplicationDialog;
