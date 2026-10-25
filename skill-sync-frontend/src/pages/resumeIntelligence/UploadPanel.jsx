import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/** Drag-and-drop upload area with the Parse Resume with AI button. */
const UploadPanel = ({ file, setFile, setParsedData, loading, setProcessingDetails, dragActive, handleFileUpload, handleDrag, handleDrop, handleParseResume }) => (
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
);

export default UploadPanel;
