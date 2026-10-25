import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';

/** The student's uploaded resumes, each opening its analysis or deleting it. */
const MyResumesList = ({ myResumes, selectedResumeId, loadResumeData, handleDeleteResume }) => {
    return myResumes.length > 0 && (
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
    );
};

export default MyResumesList;
