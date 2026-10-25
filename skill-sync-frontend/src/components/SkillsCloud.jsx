import React from 'react';
import { Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';

const SkillsCloud = ({ skills, matchedSkills = [], variant = 'default' }) => {
    if (!skills || skills.length === 0) return null;

    const isMatched = (skill) => {
        return matchedSkills.some(ms =>
            ms.toLowerCase() === skill.toLowerCase()
        );
    };

    const getSkillColor = (skill) => {
        if (isMatched(skill)) {
            return {
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
            };
        }
        return {
            bg: 'rgba(102, 126, 234, 0.1)',
            color: '#667eea',
            border: '1px solid rgba(102, 126, 234, 0.3)',
        };
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: 'center',
            }}
        >
            {skills.map((skill, index) => {
                const colors = getSkillColor(skill);
                return (
                    <motion.div
                        key={`${skill}-${index}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            delay: index * 0.05,
                        }}
                        whileHover={{
                            scale: 1.1,
                            rotate: [0, -5, 5, -5, 0],
                            transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Chip
                            label={skill}
                            sx={{
                                background: colors.bg,
                                color: colors.color,
                                border: colors.border,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                padding: '20px 8px',
                                cursor: 'pointer',
                                boxShadow: isMatched(skill)
                                    ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                                },
                            }}
                        />
                    </motion.div>
                );
            })}
        </Box>
    );
};

export default SkillsCloud;
