import React, { useState, useRef } from 'react';
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
    CloudUpload as CloudUploadIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

const CreateInternship = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [extractionSuccess, setExtractionSuccess] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
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

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.some((ext) => fileName.endsWith(ext));

        if (!isValidType) {
            toast.error('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.');
            setError('Invalid file type. Supported formats: PDF, DOCX, DOC, TXT');
            return;
        }

        handleDocumentUpload(file);
    };

    const handleDocumentUpload = async (file) => {
        setUploading(true);
        setError('');
        setExtractionSuccess('');
        setUploadedFileName(file.name);

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const response = await api.post('/internship/parse-document', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const extractedData = response.data;
            
            // Log extracted data for debugging
            console.log('📄 Extracted data from document:', {
                title: extractedData.title,
                descriptionLength: extractedData.description?.length || 0,
                requiredSkillsCount: extractedData.required_skills?.length || 0,
                preferredSkillsCount: extractedData.preferred_skills?.length || 0,
            });

            // Pre-fill form with extracted data (but NOT skills - user must click Extract button)
            setFormData({
                title: extractedData.title || '',
                description: extractedData.description || '',
                required_skills: [],  // Don't populate yet - wait for Extract button
                preferred_skills: [],  // Don't populate yet - wait for Extract button
                location: extractedData.location || '',
                duration: extractedData.duration || '',
                stipend: extractedData.stipend || '',
            });

            const totalSkills = (extractedData.required_skills?.length || 0) + (extractedData.preferred_skills?.length || 0);
            
            setExtractionSuccess(
                `✨ Successfully extracted internship details from "${file.name}"! Found ${totalSkills} skills in the document. Click "Extract Skills from Description" button below to populate skill fields (max 7 required + 7 preferred).`
            );
            toast.success('Document parsed successfully! Click "Extract Skills from Description" to add skills.');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to parse document';
            setError(errorMessage);
            toast.error(errorMessage);
            setUploadedFileName('');
        } finally {
            setUploading(false);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleExtractSkills = async () => {
        if (!formData.description.trim()) {
            toast.error('Please enter a job description first');
            return;
        }

        console.log('🔍 Extracting skills from description. Description length:', formData.description.length);

        setExtracting(true);
        setError('');
        setExtractionSuccess('');

        try {
            const response = await api.post('/internship/extract-skills', {
                job_description: formData.description,
            });

            const { required_skills, preferred_skills } = response.data;
            
            console.log('✅ Skills extracted successfully:', {
                required: required_skills.length,
                preferred: preferred_skills.length,
            });

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
                `✨ Extracted ${totalExtracted} skills! (${required_skills.length} required, ${preferred_skills.length} preferred). Limit: max 7+7, total max 15.`
            );
            toast.success(`Skills extracted successfully! Total: ${totalExtracted}/15`);
        } catch (err) {
            console.error('❌ Error extracting skills:', err);
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

                    {/* Document Upload Section */}
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
                            <Chip
                                label={`Uploaded: ${uploadedFileName}`}
                                color="success"
                                icon={<DescriptionIcon />}
                                sx={{ mt: 1 }}
                            />
                        )}

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip label="PDF" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }} />
                            <Chip label="DOCX" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }} />
                            <Chip label="DOC" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }} />
                            <Chip label="TXT" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }} />
                        </Box>
                    </Paper>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        Or fill in the form manually below
                    </Typography>

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
