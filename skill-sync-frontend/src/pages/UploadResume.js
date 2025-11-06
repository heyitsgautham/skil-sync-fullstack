import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Collapse,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import Layout from '../components/Layout';

const UploadResume = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [myResumes, setMyResumes] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [expandedResumes, setExpandedResumes] = useState({});

    useEffect(() => {
        fetchMyResumes();
    }, []);

    const fetchMyResumes = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/resume/my-resumes');
            setMyResumes(response.data);
        } catch (err) {
            console.error('Error fetching resumes:', err);
            setError('Failed to load your resumes');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                setError('Please select a PDF, Word document, or TXT file');
                setSelectedFile(null);
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File size must be less than 10MB');
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setError('');
            setSuccess('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await apiClient.post('/resume/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const successMessage = 'Resume uploaded and parsed successfully!';
            setSuccess(successMessage);
            toast.success(successMessage);
            setSelectedFile(null);
            // Reset file input
            document.getElementById('resume-file-input').value = '';
            // Refresh the resumes list
            fetchMyResumes();
        } catch (err) {
            console.error('Upload error:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to upload resume';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (resumeId) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            await apiClient.delete(`/resume/${resumeId}`);
            toast.success('Resume deleted successfully');
            setSuccess('Resume deleted successfully');
            fetchMyResumes();
        } catch (err) {
            console.error('Delete error:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to delete resume';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleSetActive = async (resumeId) => {
        try {
            await apiClient.put(`/resume/${resumeId}/activate`);
            toast.success('Resume set as active');
            fetchMyResumes();
        } catch (err) {
            console.error('Activate error:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to activate resume';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const toggleExpandResume = (resumeId) => {
        setExpandedResumes(prev => ({
            ...prev,
            [resumeId]: !prev[resumeId]
        }));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                setError('Please select a PDF, Word document, or TXT file');
                toast.error('Please select a PDF, Word document, or TXT file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                toast.error('File size must be less than 10MB');
                return;
            }

            setSelectedFile(file);
            setError('');
            setSuccess('');
            toast.success(`File "${file.name}" selected`);
        }
    };

    return (
        <Layout>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            mb: 2,
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                        }}
                    >
                        <FileUploadIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Upload Your Resume
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Get personalized internship recommendations powered by AI
                    </Typography>
                </Box>

                {/* Upload Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
                        border: '2px solid',
                        borderColor: 'rgba(59, 130, 246, 0.1)',
                    }}
                >
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert
                            severity="success"
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => setSuccess('')}
                        >
                            {success}
                        </Alert>
                    )}

                    {/* Drag and Drop Zone */}
                    <Box
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        sx={{
                            border: '3px dashed',
                            borderColor: dragActive ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
                            borderRadius: 4,
                            p: 6,
                            textAlign: 'center',
                            backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'white',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            },
                        }}
                    >
                        <input
                            id="resume-file-input"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />

                        {selectedFile ? (
                            <Box>
                                <DescriptionIcon
                                    sx={{
                                        fontSize: 80,
                                        color: '#3b82f6',
                                        mb: 2,
                                    }}
                                />
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                    {selectedFile.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <label htmlFor="resume-file-input">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            disabled={uploading}
                                            sx={{
                                                borderRadius: 2,
                                                borderColor: '#3b82f6',
                                                color: '#3b82f6',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    borderColor: '#1d4ed8',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                                },
                                            }}
                                        >
                                            Choose Different File
                                        </Button>
                                    </label>
                                    <Button
                                        variant="contained"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        startIcon={uploading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                                        sx={{
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                            fontWeight: 700,
                                            px: 4,
                                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)',
                                            },
                                        }}
                                    >
                                        {uploading ? 'Processing...' : 'Upload & Parse Resume'}
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <label htmlFor="resume-file-input" style={{ cursor: 'pointer' }}>
                                <CloudUploadIcon
                                    sx={{
                                        fontSize: 80,
                                        color: '#3b82f6',
                                        mb: 2,
                                    }}
                                />
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                    Drag & Drop Your Resume Here
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                    or click to browse files
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Supports PDF, DOC, DOCX, TXT (Max 10MB)
                                </Typography>
                            </label>
                        )}

                        {uploading && (
                            <Box sx={{ mt: 3 }}>
                                <LinearProgress
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        },
                                    }}
                                />
                                <Typography variant="body2" sx={{ mt: 2, color: '#3b82f6', fontWeight: 600 }}>
                                    Analyzing your resume with AI...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* My Resumes Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            mb: 3,
                        }}
                    >
                        My Resumes
                    </Typography>

                    {loading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: 200,
                            }}
                        >
                            <CircularProgress size={60} sx={{ color: '#3b82f6' }} />
                        </Box>
                    ) : myResumes.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
                                border: '2px dashed',
                                borderColor: 'rgba(59, 130, 246, 0.2)',
                            }}
                        >
                            <DescriptionIcon sx={{ fontSize: 60, color: '#3b82f6', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                No Resumes Yet
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Upload your first resume to get started with personalized recommendations!
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {myResumes.map((resume) => {
                                const isExpanded = expandedResumes[resume.id];
                                const skillsToShow = isExpanded ? resume.extracted_skills : resume.extracted_skills?.slice(0, 6);
                                const hasMoreSkills = resume.extracted_skills?.length > 6;

                                return (
                                    <Grid size={{ xs: 12, md: 6 }} key={resume.id}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                borderRadius: 4,
                                                border: '2px solid',
                                                borderColor: resume.is_active === 1 ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)',
                                                background: resume.is_active === 1
                                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)'
                                                    : 'white',
                                                transition: 'all 0.3s ease',
                                                position: 'relative',
                                                overflow: 'visible',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.2)',
                                                },
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                {/* Status Badge and Set Active Button */}
                                                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                                                    {resume.is_active === 1 ? (
                                                        <Chip
                                                            icon={<CheckCircleIcon />}
                                                            label="Active"
                                                            size="small"
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                                                                color: 'white',
                                                                fontWeight: 700,
                                                                border: 'none',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            startIcon={<StarIcon />}
                                                            onClick={() => handleSetActive(resume.id)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                textTransform: 'none',
                                                                fontWeight: 600,
                                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                color: '#3b82f6',
                                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                                },
                                                            }}
                                                        >
                                                            Set Active
                                                        </Button>
                                                    )}
                                                </Box>

                                                {/* File Icon and Name */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pr: 12 }}>
                                                    <Box
                                                        sx={{
                                                            width: 50,
                                                            height: 50,
                                                            borderRadius: 2,
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mr: 2,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <DescriptionIcon sx={{ color: 'white', fontSize: 28 }} />
                                                    </Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 700,
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {resume.file_name}
                                                    </Typography>
                                                </Box>

                                                {/* Skills Section */}
                                                <Box sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: 'text.secondary',
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.75rem',
                                                                letterSpacing: 1,
                                                            }}
                                                        >
                                                            Extracted Skills ({resume.extracted_skills?.length || 0})
                                                        </Typography>
                                                        {hasMoreSkills && (
                                                            <Button
                                                                size="small"
                                                                onClick={() => toggleExpandResume(resume.id)}
                                                                endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    fontWeight: 600,
                                                                    color: '#3b82f6',
                                                                    minWidth: 'auto',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                            >
                                                                {isExpanded ? 'Show Less' : 'Show All'}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {skillsToShow?.map((skill, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={skill}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                    color: '#3b82f6',
                                                                    fontWeight: 600,
                                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                                    },
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>

                                                {/* Delete Button */}
                                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDelete(resume.id)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 600,
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </Container>
        </Layout>
    );
};

export default UploadResume;
