// Upload a job description document to fill the form, or see which file filled it.
import { Box, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import { Description as DescriptionIcon } from '@mui/icons-material';

const DocumentUploadSection = ({ fileInputRef, handleFileSelect, uploading, extracting, uploadedFileName }) => (
    <Paper
        elevation={0}
        sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '2px dashed rgba(124, 58, 237, 0.3)',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
                borderColor: 'rgba(124, 58, 237, 0.6)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            },
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
    >
        <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
        />

        <Box
            sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
            }}
        >
            {uploading ? (
                <CircularProgress size={32} sx={{ color: 'white' }} />
            ) : (
                <DescriptionIcon sx={{ fontSize: 36, color: 'white' }} />
            )}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#7c3aed', mb: 1 }}>
            {uploading ? 'Uploading & Parsing Document...' : 'Upload Job Description Document'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {uploading
                ? 'AI is extracting all internship details...'
                : 'Drop your PDF, DOCX, DOC, or TXT file here, or click to browse'}
        </Typography>

        {uploadedFileName && !uploading && (
            <Chip label={`Uploaded: ${uploadedFileName}`} color="success" icon={<DescriptionIcon />} sx={{ mt: 1 }} />
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="PDF" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }} />
            <Chip label="DOCX" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }} />
            <Chip label="DOC" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }} />
            <Chip label="TXT" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }} />
        </Box>
    </Paper>
);

export default DocumentUploadSection;
