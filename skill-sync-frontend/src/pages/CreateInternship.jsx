import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress, Divider } from '@mui/material';
import { PostAdd as PostAddIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import DocumentUploadSection from './createInternship/DocumentUploadSection';
import SkillListEditor from './createInternship/SkillListEditor';
import PostingLogisticsFields from './createInternship/PostingLogisticsFields';

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

            // Pre-fill form with extracted data (but NOT skills - user must click Extract button)
            setFormData({
                title: extractedData.title || '',
                description: extractedData.description || '',
                required_skills: [], // Don't populate yet - wait for Extract button
                preferred_skills: [], // Don't populate yet - wait for Extract button
                location: extractedData.location || '',
                duration: extractedData.duration || '',
                stipend: extractedData.stipend || '',
            });

            const totalSkills =
                (extractedData.required_skills?.length || 0) + (extractedData.preferred_skills?.length || 0);

            setExtractionSuccess(
                `Successfully extracted internship details from "${file.name}"! Found ${totalSkills} skills in the document. Click "Extract Skills from Description" button below to populate skill fields (max 7 required + 7 preferred).`,
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
                `Extracted ${totalExtracted} skills! (${required_skills.length} required, ${preferred_skills.length} preferred). Limit: max 7+7, total max 15.`,
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

                    <DocumentUploadSection
                        fileInputRef={fileInputRef}
                        handleFileSelect={handleFileSelect}
                        uploading={uploading}
                        extracting={extracting}
                        uploadedFileName={uploadedFileName}
                    />

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
                                    background:
                                        'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    '&:hover': {
                                        borderColor: '#7c3aed',
                                        background:
                                            'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.2)',
                                    },
                                    '&:disabled': {
                                        borderColor: 'rgba(124, 58, 237, 0.3)',
                                        color: 'rgba(124, 58, 237, 0.5)',
                                    },
                                }}
                            >
                                {extracting ? 'Extracting Skills...' : 'Extract Skills from Description'}
                            </Button>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                            >
                                AI will analyze the job description and categorize skills
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <SkillListEditor
                            type="required"
                            skills={formData.required_skills}
                            input={requiredSkillInput}
                            setInput={setRequiredSkillInput}
                            loading={loading}
                            onAdd={handleAddSkill}
                            onKeyPress={handleSkillKeyPress}
                            onRemove={handleRemoveSkill}
                            onMove={handleMoveSkill}
                        />

                        <SkillListEditor
                            type="preferred"
                            skills={formData.preferred_skills}
                            input={preferredSkillInput}
                            setInput={setPreferredSkillInput}
                            loading={loading}
                            onAdd={handleAddSkill}
                            onKeyPress={handleSkillKeyPress}
                            onRemove={handleRemoveSkill}
                            onMove={handleMoveSkill}
                        />

                        <Divider sx={{ my: 3 }} />

                        <PostingLogisticsFields formData={formData} handleChange={handleChange} loading={loading} />
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
