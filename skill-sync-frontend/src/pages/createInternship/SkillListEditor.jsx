// One skill list on the post-internship form: the chips already added and an input to add more.
// The required and preferred lists differ only in wording, colors and which way a skill moves.
import { Box, Typography, Button, Chip, Stack, IconButton, TextField, Tooltip } from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
} from '@mui/icons-material';

export const SKILL_LISTS = {
    required: {
        title: 'Required Skills',
        symbol: '✓',
        accent: '#ef4444',
        strong: '#dc2626',
        tint: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
        border: 'rgba(239, 68, 68, 0.3)',
        inputBackground: 'rgba(239, 68, 68, 0.05)',
        moveTitle: 'Move to preferred',
        MoveIcon: ArrowDownwardIcon,
    },
    preferred: {
        title: 'Preferred Skills',
        symbol: '★',
        accent: '#3b82f6',
        strong: '#2563eb',
        tint: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
        border: 'rgba(59, 130, 246, 0.3)',
        inputBackground: 'rgba(59, 130, 246, 0.05)',
        moveTitle: 'Move to required',
        MoveIcon: ArrowUpwardIcon,
    },
};

const SkillListEditor = ({ type, skills, input, setInput, loading, onAdd, onKeyPress, onRemove, onMove }) => {
    const list = SKILL_LISTS[type];
    const { MoveIcon } = list;
    const gradient = `linear-gradient(135deg, ${list.accent} 0%, ${list.strong} 100%)`;

    return (
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
                <span style={{ color: list.accent }}>{list.symbol}</span>
                {` ${list.title}`}
                <Chip
                    label={skills.length}
                    size="small"
                    sx={{
                        background: gradient,
                        color: 'white',
                        fontWeight: 600,
                    }}
                />
            </Typography>

            {skills.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {skills.map((skill, index) => (
                        <Chip
                            key={index}
                            label={skill}
                            onDelete={() => onRemove(skill, type)}
                            deleteIcon={
                                <Tooltip title="Remove skill">
                                    <CloseIcon />
                                </Tooltip>
                            }
                            icon={
                                <Tooltip title={list.moveTitle}>
                                    <IconButton size="small" onClick={() => onMove(skill, type)} sx={{ padding: 0 }}>
                                        <MoveIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{
                                background: list.tint,
                                border: `2px solid ${list.border}`,
                                color: list.strong,
                                fontWeight: 600,
                                mb: 1,
                                '& .MuiChip-icon': {
                                    color: list.strong,
                                    marginLeft: '8px',
                                },
                                '& .MuiChip-deleteIcon': {
                                    color: list.strong,
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
                    id={`${type}SkillInput`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => onKeyPress(e, type)}
                    disabled={loading}
                    placeholder={`Type a ${type} skill...`}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: list.inputBackground,
                        },
                    }}
                />
                <Button
                    variant="contained"
                    onClick={() => onAdd(type)}
                    disabled={loading || !input.trim()}
                    startIcon={<AddIcon />}
                    sx={{
                        borderRadius: 2,
                        background: gradient,
                        textTransform: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Add
                </Button>
            </Box>
        </Box>
    );
};

export default SkillListEditor;
