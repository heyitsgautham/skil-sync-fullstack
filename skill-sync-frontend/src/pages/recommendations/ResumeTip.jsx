// The tip under the recommendations that a fuller resume gets better matches.
import { Box, Typography, Paper } from '@mui/material';

const ResumeTip = () => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            mt: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    flexShrink: 0,
                }}
            >
                <Typography variant="h5" sx={{ color: 'white' }}>
                    💡
                </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                <strong>Pro Tip:</strong> Keep your resume updated to get better recommendations. The more detailed your
                skills and experience, the better we can match you!
            </Typography>
        </Box>
    </Paper>
);

export default ResumeTip;
