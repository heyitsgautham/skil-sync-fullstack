import React from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CollapsibleSection from '../../components/CollapsibleSection';

/** The parsed resume, one collapsible section per area. */
const ParsedResumeView = ({ parsedData }) => {
    return (
        parsedData && (
            <Box>
                <Divider sx={{ my: 4 }} />

                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                📊 View Analysis
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Detailed extraction of your resume information powered by AI
                                </Typography>
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Auto-saved to Profile"
                                    size="small"
                                    sx={{
                                        bgcolor: '#d1fae5',
                                        color: '#065f46',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': {
                                            color: '#10b981',
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    ['skills', 'experience', 'education', 'projects', 'certifications'].forEach(
                                        (key) => {
                                            localStorage.setItem(`collapsible_resume_${key}`, 'true');
                                            // Trigger event to update all CollapsibleSection components
                                            window.dispatchEvent(new CustomEvent('expandAllSections'));
                                        },
                                    );
                                }}
                            >
                                Expand All
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    ['skills', 'experience', 'education', 'projects', 'certifications'].forEach(
                                        (key) => {
                                            localStorage.setItem(`collapsible_resume_${key}`, 'false');
                                            // Trigger event to update all CollapsibleSection components
                                            window.dispatchEvent(new CustomEvent('collapseAllSections'));
                                        },
                                    );
                                }}
                            >
                                Collapse All
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Personal Info */}
                {parsedData.personal_info && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                👤 Personal Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Name:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {parsedData.personal_info.name || 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {parsedData.personal_info.email || 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Phone:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {parsedData.personal_info.phone || 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Location:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {parsedData.personal_info.location || 'Not provided'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Professional Summary */}
                {parsedData.summary && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                📝 Professional Summary
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                                {parsedData.summary}
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Skills */}
                <CollapsibleSection
                    title="Skills"
                    icon={<CodeIcon sx={{ color: '#667eea' }} />}
                    count={parsedData.all_skills?.length || 0}
                    defaultExpanded={false}
                    sectionKey="resume_skills"
                >
                    {/* Technical Skills */}
                    {parsedData.skills?.technical?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Technical Skills:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {parsedData.skills.technical.map((skill) => (
                                    <Chip
                                        key={skill}
                                        label={skill}
                                        icon={<CodeIcon />}
                                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Soft Skills */}
                    {parsedData.skills?.soft?.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Soft Skills:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {parsedData.skills.soft.map((skill) => (
                                    <Chip
                                        key={skill}
                                        label={skill}
                                        sx={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </CollapsibleSection>

                {/* Experience */}
                {parsedData.experience?.length > 0 && (
                    <CollapsibleSection
                        title="Work Experience"
                        icon={<WorkIcon sx={{ color: '#667eea' }} />}
                        count={parsedData.experience.length}
                        defaultExpanded={false}
                        sectionKey="resume_experience"
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                            {parsedData.total_experience_years} years total experience
                        </Typography>
                        <List>
                            {parsedData.experience.map((exp, index) => (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemIcon>
                                            <WorkIcon color="primary" />
                                        </ListItemIcon>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {exp.role} at {exp.company}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {exp.start_date} - {exp.end_date}
                                                {exp.duration_months && ` (${exp.duration_months} months)`}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {exp.description}
                                            </Typography>
                                            {exp.key_achievements?.length > 0 && (
                                                <Box component="div" sx={{ mt: 1 }}>
                                                    <Typography variant="caption" fontWeight="bold" component="div">
                                                        Key Achievements:
                                                    </Typography>
                                                    <Box component="ul" sx={{ margin: '4px 0', paddingLeft: '20px' }}>
                                                        {exp.key_achievements.map((achievement, i) => (
                                                            <Box component="li" key={i}>
                                                                <Typography variant="caption" component="span">
                                                                    {achievement}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < parsedData.experience.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CollapsibleSection>
                )}

                {/* Education */}
                {parsedData.education?.length > 0 && (
                    <CollapsibleSection
                        title="Education"
                        icon={<SchoolIcon sx={{ color: '#667eea' }} />}
                        count={parsedData.education.length}
                        defaultExpanded={false}
                        sectionKey="resume_education"
                    >
                        <List>
                            {parsedData.education.map((edu, index) => (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <SchoolIcon color="primary" />
                                        </ListItemIcon>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {edu.degree} {edu.field && `in ${edu.field}`}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {edu.institution} - {edu.year}
                                            </Typography>
                                            {edu.grade && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Grade: {edu.grade}
                                                </Typography>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < parsedData.education.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CollapsibleSection>
                )}

                {/* Projects */}
                {parsedData.projects?.length > 0 && (
                    <CollapsibleSection
                        title="Projects"
                        icon={<AutoAwesomeIcon sx={{ color: '#667eea' }} />}
                        count={parsedData.projects.length}
                        defaultExpanded={false}
                        sectionKey="resume_projects"
                    >
                        {parsedData.projects.map((project, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    {project.name}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    {project.description}
                                </Typography>
                                {project.technologies?.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                        {project.technologies.map((tech) => (
                                            <Chip key={tech} label={tech} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                )}
                                {project.link && (
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        <a href={project.link} target="_blank" rel="noopener noreferrer">
                                            View Project →
                                        </a>
                                    </Typography>
                                )}
                                {index < parsedData.projects.length - 1 && <Divider sx={{ my: 2 }} />}
                            </Box>
                        ))}
                    </CollapsibleSection>
                )}

                {/* Certifications */}
                {parsedData.certifications?.length > 0 && (
                    <CollapsibleSection
                        title="Certifications"
                        icon={<EmojiEventsIcon sx={{ color: '#667eea' }} />}
                        count={parsedData.certifications.length}
                        defaultExpanded={false}
                        sectionKey="resume_certifications"
                    >
                        <List>
                            {parsedData.certifications.map((cert, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        <EmojiEventsIcon color="warning" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={cert.name}
                                        secondary={`${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CollapsibleSection>
                )}
            </Box>
        )
    );
};

export default ParsedResumeView;
