// What a student sees with no recommendations: why, and what to do next.
import { Box, Typography, Paper, Button } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';

const NoRecommendations = ({ filters, allRecommendations, navigate, fetchRecommendations, handleClearFilters }) => (
    <Paper
        elevation={0}
        sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
    >
        <Box
            sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
            }}
        >
            <WorkIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
        </Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            {allRecommendations.length === 0 ? 'No Recommendations Yet' : 'No Matching Jobs Found'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
            {allRecommendations.length === 0
                ? "We're still processing internship matches for your profile. This usually takes a few moments."
                : 'No internships match your current filter criteria. Try adjusting your filters to see more results.'}
        </Typography>
        {allRecommendations.length === 0 && (
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 600, mx: 'auto', fontStyle: 'italic' }}
            >
                If you haven't uploaded your resume yet, click the button below to get started. If you've already
                uploaded it, matches should appear shortly!
            </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {allRecommendations.length === 0 ? (
                <>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/upload-resume')}
                        sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                            },
                        }}
                    >
                        Upload Resume
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={fetchRecommendations}
                        sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 2,
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {
                                borderColor: '#1d4ed8',
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            },
                        }}
                    >
                        Refresh
                    </Button>
                </>
            ) : (
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleClearFilters}
                    sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                        },
                    }}
                >
                    Clear All Filters
                </Button>
            )}
        </Box>
    </Paper>
);

export default NoRecommendations;
