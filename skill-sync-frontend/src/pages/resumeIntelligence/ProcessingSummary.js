import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/** Counts of what the AI extracted from the resume. */
const ProcessingSummary = ({ loading, processingDetails }) => {
    return processingDetails && !loading && (
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
    );
};

export default ProcessingSummary;
