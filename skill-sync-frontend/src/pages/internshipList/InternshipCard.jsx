// One internship in the list, with apply, view, edit and delete actions depending on the role.
import { Box, Typography, Card, CardContent, CardActions, Button, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import PaymentsIcon from '@mui/icons-material/Payments';
import WorkIcon from '@mui/icons-material/Work';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const InternshipCard = ({
    internship,
    userRole,
    handleApply,
    hasApplied = false,
    handleViewDetails,
    handleEditClick,
    handleDeleteClick,
}) => (
    <Card
        elevation={0}
        sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(211, 10, 10, 0.08)',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            },
        }}
    >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background:
                            userRole === 'admin'
                                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                                : 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        boxShadow:
                            userRole === 'admin'
                                ? '0 4px 12px rgba(244, 67, 54, 0.3)'
                                : '0 4px 12px rgba(76, 175, 80, 0.3)',
                    }}
                >
                    <WorkIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 700,
                            color: '#1a1a1a',
                            mb: 0.5,
                        }}
                    >
                        {internship.title}
                    </Typography>
                    {/* Company Name */}
                    {internship.company_name && (
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: '#667eea',
                            }}
                        >
                            {internship.company_name}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                }}
            >
                {internship.description}
            </Typography>

            {/* Location */}
            {internship.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        {internship.location}
                    </Typography>
                </Box>
            )}

            {/* Duration */}
            {internship.duration && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        {internship.duration}
                    </Typography>
                </Box>
            )}

            {/* Stipend */}
            {internship.stipend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PaymentsIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        {internship.stipend}
                    </Typography>
                </Box>
            )}

            {/* Required Skills */}
            {internship.required_skills && internship.required_skills.length > 0 && (
                <Box>
                    <Typography
                        variant="caption"
                        sx={{
                            mb: 1,
                            display: 'block',
                            color: '#666',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Required Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {internship.required_skills.map((skill, idx) => (
                            <Chip
                                key={idx}
                                label={skill}
                                size="small"
                                sx={{
                                    background:
                                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                    color: '#667eea',
                                    fontWeight: 600,
                                    '&:hover': {
                                        background:
                                            'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0 }}>
            {userRole === 'admin' ? (
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<EditIcon />}
                        onClick={() => handleEditClick(internship)}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            borderColor: '#667eea',
                            color: '#667eea',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: '#667eea',
                                background: 'rgba(102, 126, 234, 0.1)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(internship)}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            borderColor: '#f5576c',
                            color: '#f5576c',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: '#f5576c',
                                background: 'rgba(245, 87, 108, 0.1)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        Delete
                    </Button>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    fullWidth
                    disabled={hasApplied}
                    startIcon={hasApplied ? <CheckCircleIcon /> : null}
                    onClick={() => (userRole === 'company' ? handleViewDetails(internship) : handleApply(internship))}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
                            background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                        },
                        '&.Mui-disabled': {
                            background: 'rgba(76, 175, 80, 0.12)',
                            color: '#2e7d32',
                            boxShadow: 'none',
                        },
                    }}
                >
                    {userRole === 'company' ? 'View Details' : hasApplied ? 'Applied' : 'Apply Now'}
                </Button>
            )}
        </CardActions>
    </Card>
);

export default InternshipCard;
