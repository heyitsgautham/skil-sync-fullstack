import React, { useEffect, useState } from 'react';
import { Box, Chip } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

const AnimatedMatchScore = ({ score, size = 120, showLabel = true }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDisplayScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    const getColor = (score) => {
        if (score >= 80) return '#4caf50';
        if (score >= 60) return '#2196f3';
        if (score >= 40) return '#ff9800';
        return '#f44336';
    };

    const getLabel = (score) => {
        if (score >= 80) return 'Excellent Match';
        if (score >= 60) return 'Good Match';
        if (score >= 40) return 'Fair Match';
        return 'Potential Match';
    };

    const color = getColor(score);

    return (
        <Box sx={{ textAlign: 'center' }}>
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                style={{ width: size, height: size, margin: '0 auto' }}
            >
                <CircularProgressbar
                    value={displayScore}
                    text={`${Math.round(displayScore)}%`}
                    styles={buildStyles({
                        textSize: '24px',
                        pathColor: color,
                        textColor: color,
                        trailColor: '#e0e0e0',
                        pathTransitionDuration: 1.5,
                    })}
                />
            </motion.div>
            {showLabel && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Chip
                        label={getLabel(score)}
                        sx={{
                            mt: 2,
                            fontWeight: 700,
                            backgroundColor: `${color}20`,
                            color: color,
                            border: `2px solid ${color}`,
                            fontSize: '0.85rem',
                            padding: '4px 8px',
                        }}
                    />
                </motion.div>
            )}
        </Box>
    );
};

export default AnimatedMatchScore;
