import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Chip,
    Stack,
} from '@mui/material';
import {
    PostAdd as PostAddIcon,
    Work as WorkIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

const CreateInternship = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skills: [],
        location: '',
        duration: '',
        stipend: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const handleSkillKeyPress = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!formData.required_skills.includes(skillInput.trim())) {
                setFormData({
                    ...formData,
                    required_skills: [...formData.required_skills, skillInput.trim()],
                });
            }
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData({
            ...formData,
            required_skills: formData.required_skills.filter((skill) => skill !== skillToRemove),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Title and description are required');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.post('/internship/post', formData);
            toast.success('Internship posted successfully!');
            navigate('/internships');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to post internship';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Container maxWidth="md">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.3)',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(17, 153, 142, 0.3)',
                            }}
                        >
                            <PostAddIcon sx={{ fontSize: 48, color: 'white' }} />
                        </Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: '#1a1a1a',
                                mb: 1,
                                letterSpacing: '-0.5px',
                            }}
                        >
                            Post New Internship
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Create an internship opportunity for students
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="title"
                            label="Internship Title"
                            name="title"
                            autoFocus
                            value={formData.title}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="e.g., Software Engineer Intern"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            multiline
                            rows={6}
                            id="description"
                            label="Job Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Describe the internship role, responsibilities, and what you're looking for..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            id="skillInput"
                            label="Required Skills"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={handleSkillKeyPress}
                            disabled={loading}
                            placeholder="Type a skill and press Enter"
                            helperText="Press Enter to add each skill"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        {formData.required_skills.length > 0 && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {formData.required_skills.map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            onDelete={() => handleRemoveSkill(skill)}
                                            sx={{
                                                background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%)',
                                                border: '1px solid rgba(17, 153, 142, 0.3)',
                                                color: '#11998e',
                                                fontWeight: 600,
                                                mb: 1,
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <TextField
                            margin="normal"
                            fullWidth
                            id="location"
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="e.g., Remote, New York, Hybrid"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            id="duration"
                            label="Duration"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="e.g., 3 months, 6 months"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            id="stipend"
                            label="Stipend"
                            name="stipend"
                            value={formData.stipend}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="e.g., $2000/month, Unpaid"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    boxShadow: '0 8px 24px rgba(17, 153, 142, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 32px rgba(17, 153, 142, 0.4)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Post Internship'}
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => navigate('/internships')}
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    borderColor: '#11998e',
                                    color: '#11998e',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    '&:hover': {
                                        borderColor: '#11998e',
                                        backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Layout>
    );
};

export default CreateInternship;
