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
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    PostAdd as PostAddIcon,
    AutoAwesome as AutoAwesomeIcon,
    Add as AddIcon,
    Close as CloseIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

const CreateInternship = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState('');
    const [extractionSuccess, setExtractionSuccess] = useState('');
    const [requiredSkillInput, setRequiredSkillInput] = useState('');
    const [preferredSkillInput, setPreferredSkillInput] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skills: [],
        preferred_skills: [],
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
        if (extractionSuccess) setExtractionSuccess('');
    };

    const handleExtractSkills = async () => {
        if (!formData.description.trim()) {
            toast.error('Please enter a job description first');
            return;
        }

        setExtracting(true);
        setError('');
        setExtractionSuccess('');

        try {
            const response = await api.post('/internship/extract-skills', {
                job_description: formData.description,
            });

            const { required_skills, preferred_skills } = response.data;

            // Merge with existing skills (avoiding duplicates)
            const newRequiredSkills = [...new Set([...formData.required_skills, ...required_skills])];
            const newPreferredSkills = [...new Set([...formData.preferred_skills, ...preferred_skills])];

            setFormData({
                ...formData,
                required_skills: newRequiredSkills,
                preferred_skills: newPreferredSkills,
            });

            const totalExtracted = required_skills.length + preferred_skills.length;
            setExtractionSuccess(
                `✨ Extracted ${totalExtracted} skills! (${required_skills.length} required, ${preferred_skills.length} preferred)`
            );
            toast.success('Skills extracted successfully!');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to extract skills';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setExtracting(false);
        }
    };

    const handleAddSkill = (type) => {
        const input = type === 'required' ? requiredSkillInput : preferredSkillInput;
        const skillArray = type === 'required' ? formData.required_skills : formData.preferred_skills;

        if (input.trim() && !skillArray.includes(input.trim())) {
            setFormData({
                ...formData,
                [type === 'required' ? 'required_skills' : 'preferred_skills']: [...skillArray, input.trim()],
            });
            if (type === 'required') {
                setRequiredSkillInput('');
            } else {
                setPreferredSkillInput('');
            }
        }
    };

    const handleSkillKeyPress = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill(type);
        }
    };

    const handleRemoveSkill = (skillToRemove, type) => {
        const field = type === 'required' ? 'required_skills' : 'preferred_skills';
        setFormData({
            ...formData,
            [field]: formData[field].filter((skill) => skill !== skillToRemove),
        });
    };

    const handleMoveSkill = (skill, from) => {
        const fromField = from === 'required' ? 'required_skills' : 'preferred_skills';
        const toField = from === 'required' ? 'preferred_skills' : 'required_skills';

        setFormData({
            ...formData,
            [fromField]: formData[fromField].filter((s) => s !== skill),
            [toField]: [...formData[toField], skill],
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

                    {extractionSuccess && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                            {extractionSuccess}
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

                        {/* AI Extract Skills Button */}
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleExtractSkills}
                                disabled={loading || extracting || !formData.description.trim()}
                                startIcon={extracting ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    borderColor: '#7c3aed',
                                    color: '#7c3aed',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    '&:hover': {
                                        borderColor: '#7c3aed',
                                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.2)',
                                    },
                                    '&:disabled': {
                                        borderColor: 'rgba(124, 58, 237, 0.3)',
                                        color: 'rgba(124, 58, 237, 0.5)',
                                    },
                                }}
                            >
                                {extracting ? 'Extracting Skills...' : '✨ Extract Skills from Description'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                AI will analyze the job description and categorize skills
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Required Skills Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1a1a1a',
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <span style={{ color: '#ef4444' }}>✓</span> Required Skills
                                <Chip
                                    label={formData.required_skills.length}
                                    size="small"
                                    sx={{
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                    }}
                                />
                            </Typography>

                            {formData.required_skills.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                    {formData.required_skills.map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            onDelete={() => handleRemoveSkill(skill, 'required')}
                                            deleteIcon={
                                                <Tooltip title="Remove skill">
                                                    <CloseIcon />
                                                </Tooltip>
                                            }
                                            icon={
                                                <Tooltip title="Move to preferred">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMoveSkill(skill, 'required')}
                                                        sx={{ padding: 0 }}
                                                    >
                                                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                            sx={{
                                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                                                border: '2px solid rgba(239, 68, 68, 0.3)',
                                                color: '#dc2626',
                                                fontWeight: 600,
                                                mb: 1,
                                                '& .MuiChip-icon': {
                                                    color: '#dc2626',
                                                    marginLeft: '8px',
                                                },
                                                '& .MuiChip-deleteIcon': {
                                                    color: '#dc2626',
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    id="requiredSkillInput"
                                    value={requiredSkillInput}
                                    onChange={(e) => setRequiredSkillInput(e.target.value)}
                                    onKeyPress={(e) => handleSkillKeyPress(e, 'required')}
                                    disabled={loading}
                                    placeholder="Type a required skill..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => handleAddSkill('required')}
                                    disabled={loading || !requiredSkillInput.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>

                        {/* Preferred Skills Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1a1a1a',
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <span style={{ color: '#3b82f6' }}>★</span> Preferred Skills
                                <Chip
                                    label={formData.preferred_skills.length}
                                    size="small"
                                    sx={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                    }}
                                />
                            </Typography>

                            {formData.preferred_skills.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                    {formData.preferred_skills.map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            onDelete={() => handleRemoveSkill(skill, 'preferred')}
                                            deleteIcon={
                                                <Tooltip title="Remove skill">
                                                    <CloseIcon />
                                                </Tooltip>
                                            }
                                            icon={
                                                <Tooltip title="Move to required">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMoveSkill(skill, 'preferred')}
                                                        sx={{ padding: 0 }}
                                                    >
                                                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                            sx={{
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                                color: '#2563eb',
                                                fontWeight: 600,
                                                mb: 1,
                                                '& .MuiChip-icon': {
                                                    color: '#2563eb',
                                                    marginLeft: '8px',
                                                },
                                                '& .MuiChip-deleteIcon': {
                                                    color: '#2563eb',
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    id="preferredSkillInput"
                                    value={preferredSkillInput}
                                    onChange={(e) => setPreferredSkillInput(e.target.value)}
                                    onKeyPress={(e) => handleSkillKeyPress(e, 'preferred')}
                                    disabled={loading}
                                    placeholder="Type a preferred skill..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => handleAddSkill('preferred')}
                                    disabled={loading || !preferredSkillInput.trim()}
                                    startIcon={<AddIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

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
