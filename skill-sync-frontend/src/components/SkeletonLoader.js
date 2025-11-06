import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export const InternshipCardSkeleton = () => (
    <Card
        elevation={0}
        sx={{
            height: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={60} height={60} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={24} />
                </Box>
            </Box>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={90} height={32} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="text" width={100} height={24} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Skeleton variant="rounded" width="100%" height={40} />
            </Box>
        </CardContent>
    </Card>
);

export const InternshipListSkeleton = ({ count = 6 }) => (
    <Grid container spacing={3}>
        {[...Array(count)].map((_, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <InternshipCardSkeleton />
            </Grid>
        ))}
    </Grid>
);

export const CandidateCardSkeleton = () => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            mb: 2,
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={28} />
                    <Skeleton variant="text" width="50%" height={20} />
                </Box>
            </Box>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" width={80} height={28} />
                ))}
            </Box>
        </CardContent>
    </Card>
);

export const DashboardCardSkeleton = () => (
    <Card
        elevation={0}
        sx={{
            height: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Skeleton variant="rounded" width={64} height={64} sx={{ mb: 2, borderRadius: 3 }} />
            <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width="100%" height={48} />
        </CardContent>
    </Card>
);

export default InternshipListSkeleton;
