import React from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/** Step-by-step progress shown while a new resume is parsed. */
const ProcessingSteps = ({ loading, activeStep, processingSteps }) => {
    return loading && activeStep >= 0 && (
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
    );
};

export default ProcessingSteps;
