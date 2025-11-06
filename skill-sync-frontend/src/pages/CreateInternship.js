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
    FormControlLabel,
    Checkbox,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Slider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    PostAdd as PostAddIcon,
    Work as WorkIcon,
    ExpandMore as ExpandMoreIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import SkillExtractionPanel from '../components/company/SkillExtractionPanel';
import api from '../services/api';

const CreateInternship = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [responsibilities, setResponsibilities] = useState(['', '', '']);
    const [responsibilityInput, setResponsibilityInput] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skills: [],
        preferred_skills: [],
        location: '',
        duration: '',
        stipend: '',
        // New Phase 4 fields
        min_years: 0,
        preferred_years: 0,
        requires_portfolio: false,
        role_level: 'Intern',
        top_responsibilities: [],
        key_deliverable: '',
        rubric_weights: {
            semantic: 0.35,
            skills: 0.30,
            experience: 0.20,
            education: 0.10,
            projects: 0.05,
        },
        skill_weights: [],
        extracted_skills_raw: [],
        skills_extraction_confidence: {},
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
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

    // Handle skills extracted from AI
    const handleSkillsExtracted = (extractedSkills) => {
        setFormData({
            ...formData,
            extracted_skills_raw: extractedSkills,
            skills_extraction_confidence: extractedSkills.reduce((acc, skill) => {
                acc[skill.skill] = skill.confidence;
                return acc;
            }, {}),
        });
    };

    // Handle skill categorization changes
    const handleSkillsChange = ({ mustHave, preferred }) => {
        setFormData({
            ...formData,
            required_skills: mustHave,
            preferred_skills: preferred,
        });
    };

    // Handle responsibilities
    const handleAddResponsibility = () => {
        if (responsibilityInput.trim() && responsibilities.filter(r => r).length < 3) {
            const newResponsibilities = [...responsibilities];
            const emptyIndex = newResponsibilities.findIndex(r => !r);
            if (emptyIndex !== -1) {
                newResponsibilities[emptyIndex] = responsibilityInput.trim();
            } else if (newResponsibilities.length < 3) {
                newResponsibilities.push(responsibilityInput.trim());
            }
            setResponsibilities(newResponsibilities);
            setFormData({
                ...formData,
                top_responsibilities: newResponsibilities.filter(r => r),
            });
            setResponsibilityInput('');
        }
    };

    const handleRemoveResponsibility = (index) => {
        const newResponsibilities = [...responsibilities];
        newResponsibilities[index] = '';
        setResponsibilities(newResponsibilities);
        setFormData({
            ...formData,
            top_responsibilities: newResponsibilities.filter(r => r),
        });
    };

    // Handle rubric weight changes
    const handleRubricWeightChange = (component, value) => {
        const newWeights = { ...formData.rubric_weights, [component]: value / 100 };
        setFormData({
            ...formData,
            rubric_weights: newWeights,
        });
    };

    // Calculate total weight percentage
    const getTotalWeight = () => {
        const total = Object.values(formData.rubric_weights).reduce((sum, val) => sum + val, 0);
        return (total * 100).toFixed(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Title and description are required');
            return;
        }

        // Validate rubric weights sum to 1.0 (allow small tolerance)
        const totalWeight = Object.values(formData.rubric_weights).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            setError(`Rubric weights must sum to 100% (currently ${(totalWeight * 100).toFixed(0)}%)`);
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Prepare data for submission
            const submissionData = {
                ...formData,
                min_years: parseFloat(formData.min_years) || 0,
                preferred_years: parseFloat(formData.preferred_years) || 0,
            };

            await api.post('/internship/post', submissionData);
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
                        {/* Basic Information Section */}
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                            Basic Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

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

                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
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

                            <FormControl fullWidth margin="normal">
                                <InputLabel id="role-level-label">Role Level</InputLabel>
                                <Select
                                    labelId="role-level-label"
                                    id="role_level"
                                    name="role_level"
                                    value={formData.role_level}
                                    label="Role Level"
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                    }}
                                >
                                    <MenuItem value="Intern">Intern</MenuItem>
                                    <MenuItem value="Junior">Junior</MenuItem>
                                    <MenuItem value="Mid">Mid-Level</MenuItem>
                                    <MenuItem value="Senior">Senior</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Experience Requirements Section */}
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                            Experience Requirements
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                margin="normal"
                                fullWidth
                                type="number"
                                id="min_years"
                                label="Minimum Years of Experience"
                                name="min_years"
                                value={formData.min_years}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="0"
                                inputProps={{ min: 0, step: 0.5 }}
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
                                type="number"
                                id="preferred_years"
                                label="Preferred Years of Experience"
                                name="preferred_years"
                                value={formData.preferred_years}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="0"
                                inputProps={{ min: 0, step: 0.5 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                    },
                                }}
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.requires_portfolio}
                                    onChange={handleChange}
                                    name="requires_portfolio"
                                    color="primary"
                                />
                            }
                            label="Requires Portfolio / GitHub Profile"
                            sx={{ mt: 2 }}
                        />

                        {/* Skills Extraction Section */}
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                            Required Skills (AI-Powered Extraction)
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <SkillExtractionPanel
                            description={formData.description}
                            onSkillsExtracted={handleSkillsExtracted}
                            onChange={handleSkillsChange}
                            initialMustHave={formData.required_skills}
                            initialPreferred={formData.preferred_skills}
                        />

                        {/* Top Responsibilities Section */}
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                            Top 3 Responsibilities
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    size="small"
                                    placeholder="e.g., Develop and maintain web applications"
                                    value={responsibilityInput}
                                    onChange={(e) => setResponsibilityInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddResponsibility();
                                        }
                                    }}
                                    fullWidth
                                    disabled={responsibilities.filter(r => r).length >= 3}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddResponsibility}
                                    disabled={!responsibilityInput.trim() || responsibilities.filter(r => r).length >= 3}
                                >
                                    Add
                                </Button>
                            </Stack>
                        </Box>

                        <Stack spacing={1}>
                            {responsibilities.map((resp, index) => (
                                resp && (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            p: 1.5,
                                            backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 24 }}>
                                            {index + 1}.
                                        </Typography>
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                            {resp}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveResponsibility(index)}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )
                            ))}
                        </Stack>

                        {/* Key Deliverable Section */}
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                            Key Deliverable (First 3 Months)
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={3}
                            id="key_deliverable"
                            label="Key Deliverable"
                            name="key_deliverable"
                            value={formData.key_deliverable}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Describe the main project or deliverable the intern will complete in the first 3 months..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                                },
                            }}
                        />

                        {/* Advanced: Rubric Weights (Collapsible) */}
                        <Accordion sx={{ mt: 4, borderRadius: 2 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="rubric-weights-content"
                                id="rubric-weights-header"
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Advanced: Custom Rubric Weights (Optional)
                                    </Typography>
                                    <Tooltip title="Adjust how different components contribute to the overall candidate score">
                                        <InfoIcon fontSize="small" color="action" />
                                    </Tooltip>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Customize how candidates are scored. All weights must sum to 100%.
                                    Current total: <strong>{getTotalWeight()}%</strong>
                                </Alert>

                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            Semantic Similarity: {(formData.rubric_weights.semantic * 100).toFixed(0)}%
                                        </Typography>
                                        <Slider
                                            value={formData.rubric_weights.semantic * 100}
                                            onChange={(e, value) => handleRubricWeightChange('semantic', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                            marks
                                            valueLabelDisplay="auto"
                                            color="primary"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            Skills Match: {(formData.rubric_weights.skills * 100).toFixed(0)}%
                                        </Typography>
                                        <Slider
                                            value={formData.rubric_weights.skills * 100}
                                            onChange={(e, value) => handleRubricWeightChange('skills', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                            marks
                                            valueLabelDisplay="auto"
                                            color="primary"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            Experience: {(formData.rubric_weights.experience * 100).toFixed(0)}%
                                        </Typography>
                                        <Slider
                                            value={formData.rubric_weights.experience * 100}
                                            onChange={(e, value) => handleRubricWeightChange('experience', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                            marks
                                            valueLabelDisplay="auto"
                                            color="primary"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            Education: {(formData.rubric_weights.education * 100).toFixed(0)}%
                                        </Typography>
                                        <Slider
                                            value={formData.rubric_weights.education * 100}
                                            onChange={(e, value) => handleRubricWeightChange('education', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                            marks
                                            valueLabelDisplay="auto"
                                            color="primary"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            Projects: {(formData.rubric_weights.projects * 100).toFixed(0)}%
                                        </Typography>
                                        <Slider
                                            value={formData.rubric_weights.projects * 100}
                                            onChange={(e, value) => handleRubricWeightChange('projects', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                            marks
                                            valueLabelDisplay="auto"
                                            color="primary"
                                        />
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

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
