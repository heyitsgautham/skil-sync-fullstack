import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from '../components/Layout';
import CollapsibleSection from '../components/CollapsibleSection';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResumeIntelligence = () => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [processingDetails, setProcessingDetails] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);
    const [myResumes, setMyResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [processingSteps, setProcessingSteps] = useState([
        { label: 'Uploading file to server', completed: false, icon: <CloudUploadIcon /> },
        { label: 'Extracting text from PDF using PyPDF2', completed: false, icon: <TextFieldsIcon /> },
        { label: 'Analyzing skills section with AI', completed: false, icon: <CodeIcon /> },
        { label: 'Extracting work experience details', completed: false, icon: <WorkIcon /> },
        { label: 'Identifying education background', completed: false, icon: <SchoolIcon /> },
        { label: 'Processing certifications and projects', completed: false, icon: <EmojiEventsIcon /> },
        { label: 'Finalizing AI analysis', completed: false, icon: <AutoAwesomeIcon /> },
    ]);

    // Fetch user's resumes on component mount
    useEffect(() => {
        fetchMyResumes();
    }, []);

    // Fetch all resumes for current user
    const fetchMyResumes = async () => {
        setLoadingResumes(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/resume/my-resumes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyResumes(response.data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            toast.error('Failed to load your resumes');
        } finally {
            setLoadingResumes(false);
        }
    };

    // Load parsed data for a specific resume and automatically save to profile
    const loadResumeData = async (resumeId) => {
        setLoading(true);
        setSelectedResumeId(resumeId);
        try {
            const token = localStorage.getItem('token');

            console.log('Loading resume data for ID:', resumeId);

            // First, update the UI immediately for instant feedback
            setMyResumes(prevResumes =>
                prevResumes.map(resume => ({
                    ...resume,
                    is_active: resume.id === resumeId ? 1 : 0
                }))
            );

            // Then, activate the resume in the database
            try {
                await axios.put(
                    `http://localhost:8000/api/resume/${resumeId}/activate`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log('Resume activated successfully');
            } catch (activateError) {
                console.error('Error activating resume:', activateError);
                // Revert the optimistic update if activation failed
                await fetchMyResumes();
                // Continue anyway to load the data
            }

            // Then, get parsed data
            const response = await axios.get(
                `http://localhost:8000/api/resume/${resumeId}/parsed-data`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const structuredData = response.data.structured_data;
            setParsedData(structuredData);
            setProcessingDetails(response.data.processing_details);

            // Automatically save to profile
            if (structuredData && structuredData.all_skills) {
                try {
                    await axios.put(
                        'http://localhost:8000/api/students/profile',
                        {
                            skills: structuredData.all_skills,
                            total_experience_years: structuredData.total_experience_years || 0,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    toast.success('✅ Resume activated and profile updated!');
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                    toast.success('Resume activated successfully!');
                    // Don't show error to user, just log it
                }
            } else {
                toast.success('Resume activated successfully!');
            }
        } catch (error) {
            console.error('Error loading resume:', error);
            toast.error(error.response?.data?.detail || 'Failed to load resume data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        if (!e.target.files || !e.target.files[0]) return;

        const selectedFile = e.target.files[0];
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Please upload a PDF, DOCX, DOC, or TXT file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setParsedData(null);
        setProcessingDetails(null);
        setSelectedResumeId(null);
        // Reset processing steps
        setActiveStep(-1);
        setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
        toast.success(`Selected: ${selectedFile.name}`);
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
            const droppedFile = e.dataTransfer.files[0];
            const validTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain'
            ];

            if (!validTypes.includes(droppedFile.type)) {
                toast.error('Please upload a PDF, DOCX, DOC, or TXT file');
                return;
            }

            if (droppedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }

            setFile(droppedFile);
            setParsedData(null);
            setProcessingDetails(null);
            setActiveStep(-1);
            setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
            toast.success(`Selected: ${droppedFile.name}`);
        }
    };

    // Delete resume handler
    const handleDeleteResume = async (resumeId, resumeName, event) => {
        // Stop event propagation to prevent card click
        event.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete "${resumeName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/resume/${resumeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Resume deleted successfully');

            // If the deleted resume was being viewed, clear the view
            if (selectedResumeId === resumeId) {
                setParsedData(null);
                setProcessingDetails(null);
                setSelectedResumeId(null);
            }

            // Refresh the resumes list
            fetchMyResumes();
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete resume');
        }
    };

    // Simulate processing steps for demo
    const simulateProcessingSteps = async () => {
        const stepDurations = [800, 1200, 1500, 1300, 1000, 900, 700]; // milliseconds for each step

        for (let i = 0; i < processingSteps.length; i++) {
            setActiveStep(i);
            await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
            setProcessingSteps(prev => {
                const updated = [...prev];
                updated[i].completed = true;
                return updated;
            });
        }
    };

    const handleParseResume = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setLoading(true);
        setParsedData(null);
        setProcessingDetails(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Start simulating processing steps
            const simulationPromise = simulateProcessingSteps();

            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/filter/parse-resume',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Wait for simulation to complete
            await simulationPromise;

            const structuredData = response.data.structured_data;
            setParsedData(structuredData);
            setProcessingDetails(response.data.processing_details);
            setActiveStep(-1); // Hide stepper after completion
            setFile(null); // Clear file selection

            // Automatically save to profile
            if (structuredData && structuredData.all_skills) {
                try {
                    await axios.put(
                        'http://localhost:8000/api/students/profile',
                        {
                            skills: structuredData.all_skills,
                            total_experience_years: structuredData.total_experience_years || 0,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    toast.success('✨ Resume parsed and profile updated successfully!');
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                    toast.success('✨ Resume parsed successfully with AI!');
                }
            } else {
                toast.success('✨ Resume parsed successfully with AI!');
            }

            // Refresh resumes list
            fetchMyResumes();
        } catch (error) {
            console.error('Error parsing resume:', error);
            setActiveStep(-1);
            setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
            toast.error(error.response?.data?.detail || 'Failed to parse resume. Please try again.');
        } finally {
            setLoading(false);
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
                        <PsychologyIcon sx={{ fontSize: 40, color: 'white' }} />
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
                        AI Resume Intelligence
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Upload your resume and let AI extract your skills, experience, and education automatically
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
                        }}
                    >
                        <input
                            accept=".pdf,.doc,.docx,.txt"
                            style={{ display: 'none' }}
                            id="resume-upload"
                            type="file"
                            onChange={handleFileUpload}
                        />

                        <CloudUploadIcon
                            sx={{
                                fontSize: 64,
                                color: dragActive ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)',
                                mb: 2,
                            }}
                        />

                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {dragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            or
                        </Typography>

                        <label htmlFor="resume-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                size="large"
                                startIcon={<DescriptionIcon />}
                                sx={{
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderWidth: 2,
                                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                    },
                                }}
                            >
                                Browse Files
                            </Button>
                        </label>

                        <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                            Supported: PDF, DOCX, DOC, TXT • Max size: 10MB
                        </Typography>
                    </Box>

                    {file && (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Chip
                                icon={<CheckCircleIcon />}
                                label={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
                                color="success"
                                onDelete={() => {
                                    setFile(null);
                                    setParsedData(null);
                                    setProcessingDetails(null);
                                }}
                                sx={{
                                    fontSize: '0.9rem',
                                    padding: '20px 8px',
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                    )}

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleParseResume}
                            disabled={!file || loading}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{
                                px: 6,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
                                    transform: 'translateY(-2px)',
                                },
                                '&:disabled': {
                                    background: 'rgba(0, 0, 0, 0.12)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Parse Resume with AI
                        </Button>
                    </Box>
                </Paper>

                {/* My Resumes Section */}
                {myResumes.length > 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 4,
                            background: 'white',
                            border: '2px solid',
                            borderColor: 'rgba(59, 130, 246, 0.1)',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                            📁 My Uploaded Resumes
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Click on any resume to view its AI analysis
                        </Typography>

                        <Grid container spacing={2}>
                            {myResumes.map((resume) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resume.id}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            border: '2px solid',
                                            borderColor: selectedResumeId === resume.id
                                                ? '#3b82f6'
                                                : 'transparent',
                                            position: 'relative',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
                                                borderColor: '#3b82f6',
                                            },
                                            '&:hover .delete-button': {
                                                opacity: 1,
                                            },
                                        }}
                                        onClick={() => loadResumeData(resume.id)}
                                    >
                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                                <DescriptionIcon
                                                    sx={{
                                                        fontSize: 40,
                                                        color: selectedResumeId === resume.id ? '#3b82f6' : '#9ca3af',
                                                        mr: 2,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight="bold"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            wordBreak: 'break-word',
                                                            lineHeight: 1.3,
                                                        }}
                                                        title={resume.file_name}
                                                    >
                                                        {resume.file_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(resume.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {resume.extracted_skills && resume.extracted_skills.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, minHeight: '24px' }}>
                                                    {resume.extracted_skills.slice(0, 3).map((skill, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={skill}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                height: '20px',
                                                            }}
                                                        />
                                                    ))}
                                                    {resume.extracted_skills.length > 3 && (
                                                        <Chip
                                                            label={`+${resume.extracted_skills.length - 3}`}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                height: '20px',
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            )}

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1 }}>
                                                {resume.is_active === 1 ? (
                                                    <Chip
                                                        label="Active"
                                                        size="small"
                                                        color="success"
                                                    />
                                                ) : (
                                                    <Box />
                                                )}

                                                {/* Delete Button - Bottom Right */}
                                                <IconButton
                                                    className="delete-button"
                                                    onClick={(e) => handleDeleteResume(resume.id, resume.file_name, e)}
                                                    sx={{
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s ease',
                                                        color: '#ef4444',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#dc2626',
                                                        },
                                                    }}
                                                    size="small"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Loading Saved Resume */}
                {loading && !activeStep && selectedResumeId && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            mb: 4,
                            borderRadius: 4,
                            background: 'white',
                            border: '2px solid',
                            borderColor: 'rgba(59, 130, 246, 0.1)',
                            textAlign: 'center',
                        }}
                    >
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="h6" fontWeight="bold">
                            Loading Resume Analysis...
                        </Typography>
                    </Paper>
                )}

                {/* Processing Steps Visualization */}
                {loading && activeStep >= 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            mb: 4,
                            borderRadius: 4,
                            background: 'white',
                            border: '2px solid',
                            borderColor: 'rgba(59, 130, 246, 0.1)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <CircularProgress size={24} sx={{ mr: 2 }} />
                            <Typography variant="h6" fontWeight="bold">
                                Processing Your Resume...
                            </Typography>
                        </Box>

                        <Stepper activeStep={activeStep} orientation="vertical">
                            {processingSteps.map((step, index) => (
                                <Step key={step.label} completed={step.completed}>
                                    <StepLabel
                                        StepIconComponent={() => (
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: step.completed
                                                        ? '#10b981'
                                                        : index === activeStep
                                                            ? '#3b82f6'
                                                            : '#e5e7eb',
                                                    color: step.completed || index === activeStep ? 'white' : '#9ca3af',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                {step.completed ? (
                                                    <CheckCircleIcon />
                                                ) : (
                                                    step.icon
                                                )}
                                            </Box>
                                        )}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: index === activeStep ? 700 : 500,
                                                color: step.completed
                                                    ? '#10b981'
                                                    : index === activeStep
                                                        ? '#3b82f6'
                                                        : 'text.secondary',
                                            }}
                                        >
                                            {step.label}
                                        </Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <LinearProgress
                                            sx={{
                                                width: '200px',
                                                height: 6,
                                                borderRadius: 3,
                                                mt: 1,
                                            }}
                                        />
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>
                    </Paper>
                )}

                {/* Processing Details - Success Summary */}
                {processingDetails && !loading && (
                    <Alert
                        severity="success"
                        icon={<CheckCircleIcon fontSize="large" />}
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            py: 2,
                            '& .MuiAlert-icon': {
                                fontSize: '2rem',
                            },
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            ✨ AI Processing Complete!
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            <Chip
                                label={`${processingDetails.skills_extracted} skills extracted`}
                                size="medium"
                                sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600 }}
                            />
                            <Chip
                                label={`${processingDetails.experience_calculated}`}
                                size="medium"
                                sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}
                            />
                            <Chip
                                label={`${processingDetails.education_found} education entries`}
                                size="medium"
                                sx={{ bgcolor: '#fce7f3', color: '#9f1239', fontWeight: 600 }}
                            />
                            <Chip
                                label={`${processingDetails.projects_found} projects`}
                                size="medium"
                                sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                            />
                            <Chip
                                label={`${processingDetails.certifications_found} certifications`}
                                size="medium"
                                sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}
                            />
                        </Box>
                    </Alert>
                )}

                {/* Parsed Data Display */}
                {parsedData && (
                    <Box>
                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                                        📊 View Analysis
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Detailed extraction of your resume information powered by AI
                                        </Typography>
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label="Auto-saved to Profile"
                                            size="small"
                                            sx={{
                                                bgcolor: '#d1fae5',
                                                color: '#065f46',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': {
                                                    color: '#10b981',
                                                },
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            ['skills', 'experience', 'education', 'projects', 'certifications'].forEach(key => {
                                                localStorage.setItem(`collapsible_resume_${key}`, 'true');
                                                // Trigger event to update all CollapsibleSection components
                                                window.dispatchEvent(new CustomEvent('expandAllSections'));
                                            });
                                        }}
                                    >
                                        Expand All
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            ['skills', 'experience', 'education', 'projects', 'certifications'].forEach(key => {
                                                localStorage.setItem(`collapsible_resume_${key}`, 'false');
                                                // Trigger event to update all CollapsibleSection components
                                                window.dispatchEvent(new CustomEvent('collapseAllSections'));
                                            });
                                        }}
                                    >
                                        Collapse All
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Personal Info */}
                        {parsedData.personal_info && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        👤 Personal Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Name:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {parsedData.personal_info.name || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Email:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {parsedData.personal_info.email || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {parsedData.personal_info.phone || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {parsedData.personal_info.location || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}

                        {/* Professional Summary */}
                        {parsedData.summary && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        📝 Professional Summary
                                    </Typography>
                                    <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                                        {parsedData.summary}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {/* Skills */}
                        <CollapsibleSection
                            title="Skills"
                            icon={<CodeIcon sx={{ color: '#667eea' }} />}
                            count={parsedData.all_skills?.length || 0}
                            defaultExpanded={false}
                            sectionKey="resume_skills"
                        >
                            {/* Technical Skills */}
                            {parsedData.skills?.technical?.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Technical Skills:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {parsedData.skills.technical.map((skill) => (
                                            <Chip
                                                key={skill}
                                                label={skill}
                                                icon={<CodeIcon />}
                                                sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Soft Skills */}
                            {parsedData.skills?.soft?.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Soft Skills:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {parsedData.skills.soft.map((skill) => (
                                            <Chip
                                                key={skill}
                                                label={skill}
                                                sx={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </CollapsibleSection>

                        {/* Experience */}
                        {parsedData.experience?.length > 0 && (
                            <CollapsibleSection
                                title="Work Experience"
                                icon={<WorkIcon sx={{ color: '#667eea' }} />}
                                count={parsedData.experience.length}
                                defaultExpanded={false}
                                sectionKey="resume_experience"
                            >
                                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                                    {parsedData.total_experience_years} years total experience
                                </Typography>
                                <List>
                                    {parsedData.experience.map((exp, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem alignItems="flex-start">
                                                <ListItemIcon>
                                                    <WorkIcon color="primary" />
                                                </ListItemIcon>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {exp.role} at {exp.company}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {exp.start_date} - {exp.end_date}
                                                        {exp.duration_months && ` (${exp.duration_months} months)`}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        {exp.description}
                                                    </Typography>
                                                    {exp.key_achievements?.length > 0 && (
                                                        <Box component="div" sx={{ mt: 1 }}>
                                                            <Typography variant="caption" fontWeight="bold" component="div">
                                                                Key Achievements:
                                                            </Typography>
                                                            <Box component="ul" sx={{ margin: '4px 0', paddingLeft: '20px' }}>
                                                                {exp.key_achievements.map((achievement, i) => (
                                                                    <Box component="li" key={i}>
                                                                        <Typography variant="caption" component="span">{achievement}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </ListItem>
                                            {index < parsedData.experience.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </CollapsibleSection>
                        )}

                        {/* Education */}
                        {parsedData.education?.length > 0 && (
                            <CollapsibleSection
                                title="Education"
                                icon={<SchoolIcon sx={{ color: '#667eea' }} />}
                                count={parsedData.education.length}
                                defaultExpanded={false}
                                sectionKey="resume_education"
                            >
                                <List>
                                    {parsedData.education.map((edu, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <SchoolIcon color="primary" />
                                                </ListItemIcon>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {edu.degree} {edu.field && `in ${edu.field}`}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {edu.institution} - {edu.year}
                                                    </Typography>
                                                    {edu.grade && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Grade: {edu.grade}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </ListItem>
                                            {index < parsedData.education.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </CollapsibleSection>
                        )}

                        {/* Projects */}
                        {parsedData.projects?.length > 0 && (
                            <CollapsibleSection
                                title="Projects"
                                icon={<AutoAwesomeIcon sx={{ color: '#667eea' }} />}
                                count={parsedData.projects.length}
                                defaultExpanded={false}
                                sectionKey="resume_projects"
                            >
                                {parsedData.projects.map((project, index) => (
                                    <Box key={index} sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            {project.name}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            {project.description}
                                        </Typography>
                                        {project.technologies?.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                {project.technologies.map((tech) => (
                                                    <Chip key={tech} label={tech} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        )}
                                        {project.link && (
                                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                <a href={project.link} target="_blank" rel="noopener noreferrer">
                                                    View Project →
                                                </a>
                                            </Typography>
                                        )}
                                        {index < parsedData.projects.length - 1 && <Divider sx={{ my: 2 }} />}
                                    </Box>
                                ))}
                            </CollapsibleSection>
                        )}

                        {/* Certifications */}
                        {parsedData.certifications?.length > 0 && (
                            <CollapsibleSection
                                title="Certifications"
                                icon={<EmojiEventsIcon sx={{ color: '#667eea' }} />}
                                count={parsedData.certifications.length}
                                defaultExpanded={false}
                                sectionKey="resume_certifications"
                            >
                                <List>
                                    {parsedData.certifications.map((cert, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <EmojiEventsIcon color="warning" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={cert.name}
                                                secondary={`${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CollapsibleSection>
                        )}
                    </Box>
                )}

                {/* Empty State */}
                {!loading && !parsedData && !file && myResumes.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 8,
                            textAlign: 'center',
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
                            border: '2px dashed',
                            borderColor: 'rgba(59, 130, 246, 0.2)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.1)',
                                mb: 3,
                            }}
                        >
                            <AnalyticsIcon sx={{ fontSize: 50, color: '#3b82f6' }} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Ready to Analyze Your Resume
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
                            Upload your resume above to see our AI-powered parser extract your skills, experience, education, and more in seconds!
                        </Typography>
                    </Paper>
                )}

                {/* Empty State - Has resumes but none selected */}
                {!loading && !parsedData && !file && myResumes.length > 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
                            border: '2px dashed',
                            borderColor: 'rgba(59, 130, 246, 0.2)',
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Select a Resume to View Analysis
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
                            Click on any of your uploaded resumes above to see its AI analysis, or upload a new one!
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Layout>
    );
};

export default ResumeIntelligence;
