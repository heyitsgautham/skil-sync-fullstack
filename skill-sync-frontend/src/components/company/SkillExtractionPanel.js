import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Chip,
    Stack,
    Typography,
    CircularProgress,
    Paper,
    Tooltip,
    IconButton,
    Alert,
    Divider,
} from '@mui/material';
import {
    AutoFixHigh as ExtractIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    DragIndicator as DragIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * SkillExtractionPanel Component
 * 
 * AI-powered skill extraction from job descriptions with interactive editing.
 * 
 * Features:
 * - Extract skills using Gemini AI
 * - Color-coded chips by confidence level
 * - Drag-and-drop between must-have and preferred sections
 * - Manual skill addition
 * - Highlighted description display
 * - Re-extraction capability
 * 
 * @param {string} description - Job description text
 * @param {function} onSkillsExtracted - Callback when skills are extracted: (skills) => void
 * @param {function} onChange - Callback when skills change: ({mustHave, preferred}) => void
 * @param {array} initialMustHave - Initial must-have skills
 * @param {array} initialPreferred - Initial preferred skills
 */
const SkillExtractionPanel = ({
    description,
    onSkillsExtracted,
    onChange,
    initialMustHave = [],
    initialPreferred = [],
}) => {
    const [loading, setLoading] = useState(false);
    const [extractedSkills, setExtractedSkills] = useState([]);
    const [mustHaveSkills, setMustHaveSkills] = useState(initialMustHave);
    const [preferredSkills, setPreferredSkills] = useState(initialPreferred);
    const [highlightedHtml, setHighlightedHtml] = useState('');
    const [manualSkillInput, setManualSkillInput] = useState('');
    const [error, setError] = useState('');

    // Extract skills from description using AI
    const handleExtractSkills = async () => {
        if (!description || description.trim().length < 20) {
            setError('Please provide a job description (at least 20 characters)');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await api.post('/internship/extract-skills', {
                title: '', // Optional, can be added if available
                description: description,
                num_suggestions: 15,
            });

            const { skills, suggested_must_have, suggested_preferred, highlighted_html } = response.data;

            setExtractedSkills(skills);
            setMustHaveSkills(suggested_must_have || []);
            setPreferredSkills(suggested_preferred || []);
            setHighlightedHtml(highlighted_html);

            // Notify parent component
            if (onSkillsExtracted) {
                onSkillsExtracted(skills);
            }
            if (onChange) {
                onChange({
                    mustHave: suggested_must_have || [],
                    preferred: suggested_preferred || [],
                });
            }

            toast.success(`Extracted ${skills.length} skills successfully!`);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to extract skills';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Get confidence color
    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'success'; // Green
        if (confidence >= 0.6) return 'warning'; // Yellow
        return 'default'; // Orange
    };

    // Get confidence label
    const getConfidenceLabel = (confidence) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    // Move skill from preferred to must-have
    const moveToMustHave = (skill) => {
        if (!mustHaveSkills.includes(skill)) {
            const newMustHave = [...mustHaveSkills, skill];
            const newPreferred = preferredSkills.filter((s) => s !== skill);
            setMustHaveSkills(newMustHave);
            setPreferredSkills(newPreferred);
            if (onChange) {
                onChange({ mustHave: newMustHave, preferred: newPreferred });
            }
        }
    };

    // Move skill from must-have to preferred
    const moveToPreferred = (skill) => {
        if (!preferredSkills.includes(skill)) {
            const newPreferred = [...preferredSkills, skill];
            const newMustHave = mustHaveSkills.filter((s) => s !== skill);
            setPreferredSkills(newPreferred);
            setMustHaveSkills(newMustHave);
            if (onChange) {
                onChange({ mustHave: newMustHave, preferred: newPreferred });
            }
        }
    };

    // Remove skill entirely
    const removeSkill = (skill, fromMustHave = true) => {
        if (fromMustHave) {
            const newMustHave = mustHaveSkills.filter((s) => s !== skill);
            setMustHaveSkills(newMustHave);
            if (onChange) {
                onChange({ mustHave: newMustHave, preferred: preferredSkills });
            }
        } else {
            const newPreferred = preferredSkills.filter((s) => s !== skill);
            setPreferredSkills(newPreferred);
            if (onChange) {
                onChange({ mustHave: mustHaveSkills, preferred: newPreferred });
            }
        }
    };

    // Add manual skill
    const handleAddManualSkill = () => {
        const trimmedSkill = manualSkillInput.trim();
        if (!trimmedSkill) return;

        if (mustHaveSkills.includes(trimmedSkill) || preferredSkills.includes(trimmedSkill)) {
            toast.error('Skill already exists');
            return;
        }

        // Add to must-have by default
        const newMustHave = [...mustHaveSkills, trimmedSkill];
        setMustHaveSkills(newMustHave);
        setManualSkillInput('');

        if (onChange) {
            onChange({ mustHave: newMustHave, preferred: preferredSkills });
        }

        toast.success('Skill added to must-have list');
    };

    // Get skill confidence from extracted skills
    const getSkillConfidence = (skillName) => {
        const skill = extractedSkills.find((s) => s.skill === skillName);
        return skill ? skill.confidence : null;
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Extract Button */}
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ExtractIcon />}
                    onClick={handleExtractSkills}
                    disabled={loading || !description}
                    fullWidth
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                    }}
                >
                    {loading ? 'Extracting Skills...' : 'Extract Skills with AI'}
                </Button>
                {extractedSkills.length > 0 && (
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleExtractSkills}
                        disabled={loading}
                        fullWidth
                        sx={{ mt: 1, textTransform: 'none' }}
                    >
                        Re-run Extraction
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Highlighted Description */}
            {highlightedHtml && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Highlighted Description
                    </Typography>
                    <Box
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                        sx={{
                            '& mark': {
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontWeight: 500,
                            },
                            '& mark.skill-highlight-high': {
                                backgroundColor: '#c8e6c9',
                                color: '#2e7d32',
                            },
                            '& mark.skill-highlight-medium': {
                                backgroundColor: '#fff9c4',
                                color: '#f57c00',
                            },
                            '& mark.skill-highlight-low': {
                                backgroundColor: '#ffccbc',
                                color: '#d84315',
                            },
                        }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#c8e6c9', borderRadius: 1 }} />
                            <Typography variant="caption">High Confidence (&gt;0.8)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#fff9c4', borderRadius: 1 }} />
                            <Typography variant="caption">Medium Confidence (0.6-0.8)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#ffccbc', borderRadius: 1 }} />
                            <Typography variant="caption">Low Confidence (&lt;0.6)</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Manual Skill Addition */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Add Skills Manually
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        size="small"
                        placeholder="e.g., Python, React, Docker"
                        value={manualSkillInput}
                        onChange={(e) => setManualSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddManualSkill();
                            }
                        }}
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddManualSkill}
                        disabled={!manualSkillInput.trim()}
                    >
                        Add
                    </Button>
                </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Must-Have Skills Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Must-Have Skills
                    <Chip
                        label={mustHaveSkills.length}
                        size="small"
                        color="error"
                        sx={{ ml: 1, fontWeight: 600 }}
                    />
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Critical skills required for the role. Click to move to preferred or delete.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                    {mustHaveSkills.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No must-have skills yet. Extract skills or add manually.
                        </Typography>
                    ) : (
                        mustHaveSkills.map((skill) => {
                            const confidence = getSkillConfidence(skill);
                            return (
                                <Tooltip
                                    key={skill}
                                    title={
                                        confidence
                                            ? `Confidence: ${(confidence * 100).toFixed(0)}% (${getConfidenceLabel(confidence)})`
                                            : 'Manually added'
                                    }
                                    arrow
                                >
                                    <Chip
                                        label={skill}
                                        color={confidence ? getConfidenceColor(confidence) : 'default'}
                                        onDelete={() => removeSkill(skill, true)}
                                        onClick={() => moveToPreferred(skill)}
                                        deleteIcon={<DeleteIcon />}
                                        sx={{
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                opacity: 0.8,
                                            },
                                        }}
                                    />
                                </Tooltip>
                            );
                        })
                    )}
                </Stack>
            </Box>

            {/* Preferred Skills Section */}
            <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Preferred Skills
                    <Chip
                        label={preferredSkills.length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1, fontWeight: 600 }}
                    />
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nice-to-have skills that enhance the candidate's profile. Click to move to must-have or delete.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                    {preferredSkills.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No preferred skills yet. Extract skills or add manually.
                        </Typography>
                    ) : (
                        preferredSkills.map((skill) => {
                            const confidence = getSkillConfidence(skill);
                            return (
                                <Tooltip
                                    key={skill}
                                    title={
                                        confidence
                                            ? `Confidence: ${(confidence * 100).toFixed(0)}% (${getConfidenceLabel(confidence)})`
                                            : 'Manually added'
                                    }
                                    arrow
                                >
                                    <Chip
                                        label={skill}
                                        color={confidence ? getConfidenceColor(confidence) : 'default'}
                                        variant="outlined"
                                        onDelete={() => removeSkill(skill, false)}
                                        onClick={() => moveToMustHave(skill)}
                                        deleteIcon={<DeleteIcon />}
                                        sx={{
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                opacity: 0.8,
                                            },
                                        }}
                                    />
                                </Tooltip>
                            );
                        })
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

export default SkillExtractionPanel;
