import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    DeleteForever as DeleteIcon,
    CloudUpload as ReindexIcon,
} from '@mui/icons-material';

/** Admin dashboard cards that recompute, clear and re-index embeddings. */
const AdminToolCards = ({ isRecomputing, recomputeResult, isClearingChroma, isReindexing, setClearChromaDialog, setReindexDialog, systemStatus, handleRecomputeEmbeddings }) => (
        <>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
                            }}
                        >
                            <RefreshIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            AI Embeddings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Recompute embeddings for resumes, internships, and candidate rankings with intelligent caching.
                        </Typography>

                        {recomputeResult && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                                    Resumes: {recomputeResult.resumes.cached} cached, {recomputeResult.resumes.recomputed} recomputed
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                                    Internships: {recomputeResult.internships.cached} cached, {recomputeResult.internships.recomputed} recomputed
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                    Matches: {recomputeResult.matches.recalculated} recalculated
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleRecomputeEmbeddings}
                            disabled={isRecomputing}
                            startIcon={isRecomputing ? <CircularProgress size={20} /> : <RefreshIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isRecomputing
                                    ? 'linear-gradient(135deg, #a8b8c8 0%, #b0c0d0 100%)'
                                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
                                '&:hover': {
                                    transform: isRecomputing ? 'none' : 'translateY(-2px)',
                                    boxShadow: isRecomputing
                                        ? '0 4px 16px rgba(79, 172, 254, 0.3)'
                                        : '0 8px 24px rgba(79, 172, 254, 0.4)',
                                },
                            }}
                        >
                            {isRecomputing ? 'Processing...' : 'Recompute Embeddings'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Clear ChromaDB Card */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Clear Embeddings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Delete all student resume embeddings and match data from ChromaDB. This action is permanent!
                        </Typography>

                        {/* {systemStatus && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 2, border: '1px solid #fee' }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5, color: '#c53030' }}>
                                    📊 Current Status
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                    Total Resumes: {systemStatus.resumes?.total || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.3 }}>
                                    With Embeddings: {systemStatus.resumes?.with_embeddings || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    Total Matches: {systemStatus.matches?.total || 0}
                                </Typography>
                            </Box>  
                        )} */}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setClearChromaDialog(true)}
                            disabled={isClearingChroma}
                            startIcon={isClearingChroma ? <CircularProgress size={20} /> : <DeleteIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isClearingChroma
                                    ? 'linear-gradient(135deg, #d0a0a0 0%, #d8a8a8 100%)'
                                    : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                                '&:hover': {
                                    transform: isClearingChroma ? 'none' : 'translateY(-2px)',
                                    boxShadow: isClearingChroma
                                        ? '0 4px 16px rgba(255, 107, 107, 0.3)'
                                        : '0 8px 24px rgba(255, 107, 107, 0.4)',
                                },
                            }}
                        >
                            {isClearingChroma ? 'Clearing...' : 'Clear ChromaDB'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Reindex All Students Card */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Card
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 8px 24px rgba(255, 167, 38, 0.3)',
                            }}
                        >
                            <ReindexIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            Re-index All Students
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                            Bulk re-upload and re-process all 50 student resumes from scratch. Takes 2-5 minutes.
                        </Typography>

                        {isReindexing && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffecb3' }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#f57c00' }}>
                                    ⏳ Reindexing in progress...
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    This may take 2-5 minutes. The page will update automatically.
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setReindexDialog(true)}
                            disabled={isReindexing}
                            startIcon={isReindexing ? <CircularProgress size={20} /> : <ReindexIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: isReindexing
                                    ? 'linear-gradient(135deg, #d8b896 0%, #e0c09e 100%)'
                                    : 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 16px rgba(255, 167, 38, 0.3)',
                                '&:hover': {
                                    transform: isReindexing ? 'none' : 'translateY(-2px)',
                                    boxShadow: isReindexing
                                        ? '0 4px 16px rgba(255, 167, 38, 0.3)'
                                        : '0 8px 24px rgba(255, 167, 38, 0.4)',
                                },
                            }}
                        >
                            {isReindexing ? 'Reindexing...' : 'Re-index Resumes'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </>
);

export default AdminToolCards;
