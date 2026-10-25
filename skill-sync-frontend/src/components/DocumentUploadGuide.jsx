import React from 'react';
import { Box, Typography, Paper, Alert, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon,
    AutoAwesome as AutoAwesomeIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';

/**
 * DocumentUploadGuide Component
 * 
 * Informational component explaining the document upload feature
 * for creating internships. Can be displayed as a tooltip, modal,
 * or inline help section.
 */
const DocumentUploadGuide = () => {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(124, 58, 237, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 32, color: '#7c3aed', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                    AI-Powered Document Upload
                </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Upload your job description document and let AI extract all the details automatically!
            </Alert>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                How it works:
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <DescriptionIcon sx={{ color: '#7c3aed' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="1. Upload Document"
                        secondary="Upload your job description in PDF, DOCX, DOC, or TXT format"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <AutoAwesomeIcon sx={{ color: '#7c3aed' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="2. AI Extraction"
                        secondary="Google Gemini AI analyzes and extracts all internship details"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <CheckCircleIcon sx={{ color: '#7c3aed' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="3. Review & Edit"
                        secondary="Review the auto-filled form and make any necessary edits"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <SpeedIcon sx={{ color: '#7c3aed' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="4. Post Instantly"
                        secondary="Submit your internship posting in seconds!"
                    />
                </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                What gets extracted:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Job title and description
                <br />
                • Required and preferred skills
                <br />
                • Location, duration, and stipend
                <br />
                • Experience and education requirements
                <br />
                • Start date and application deadline
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary">
                💡 <strong>Tip:</strong> The more detailed your job description document, the better the AI extraction results!
            </Typography>
        </Paper>
    );
};

export default DocumentUploadGuide;
