import React from 'react';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import Layout from '../components/Layout';
import useResumeIntelligence from './resumeIntelligence/useResumeIntelligence';
import UploadPanel from './resumeIntelligence/UploadPanel';
import MyResumesList from './resumeIntelligence/MyResumesList';
import ProcessingSteps from './resumeIntelligence/ProcessingSteps';
import ProcessingSummary from './resumeIntelligence/ProcessingSummary';
import ParsedResumeView from './resumeIntelligence/ParsedResumeView';

const ResumeIntelligence = () => {
    const resume = useResumeIntelligence();
    const { file, parsedData, loading, loadingResumes, activeStep, myResumes, selectedResumeId } = resume;

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
                <UploadPanel {...resume} />

                {/* My Resumes Section */}
                <MyResumesList {...resume} />

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
                <ProcessingSteps {...resume} />

                {/* Processing Details - Success Summary */}
                <ProcessingSummary {...resume} />

                {/* Parsed Data Display */}
                <ParsedResumeView {...resume} />

                {/* Empty State */}
                {!loading && !loadingResumes && !parsedData && !file && myResumes.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 8,
                            textAlign: 'center',
                            borderRadius: 4,
                            background:
                                'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
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
                            Upload your resume above to see our AI-powered parser extract your skills, experience,
                            education, and more in seconds!
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
                            background:
                                'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
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
