import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 2, prefix = '', suffix = '', ...props }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(count, value, {
            duration: duration,
            ease: "easeOut",
        });

        const unsubscribe = rounded.onChange((latest) => {
            setDisplayValue(latest);
        });

        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [value, duration, count, rounded]);

    return (
        <Typography {...props}>
            {prefix}{displayValue}{suffix}
        </Typography>
    );
};

export default AnimatedCounter;
