import React, { useState, useEffect } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Chip,
    Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Reusable CollapsibleSection Component
 * Provides a consistent, animated accordion-style collapsible section
 * with optional count badge and persistence of expand/collapse state
 * 
 * @param {string} title - Section title
 * @param {number} count - Optional count badge to display next to title
 * @param {React.ReactNode} icon - Optional icon to display before title
 * @param {React.ReactNode} children - Content to display when expanded
 * @param {boolean} defaultExpanded - Whether section starts expanded (default: false)
 * @param {string} sectionKey - Unique key for persisting state in localStorage
 * @param {object} sx - Additional Material-UI sx props for customization
 */
const CollapsibleSection = ({
    title,
    count,
    icon,
    children,
    defaultExpanded = false,
    sectionKey,
    sx = {},
}) => {
    // Load expanded state from localStorage if sectionKey is provided
    const getInitialExpandedState = () => {
        if (sectionKey) {
            const saved = localStorage.getItem(`collapsible_${sectionKey}`);
            return saved !== null ? saved === 'true' : defaultExpanded;
        }
        return defaultExpanded;
    };

    const [expanded, setExpanded] = useState(getInitialExpandedState);

    // Save expanded state to localStorage when it changes
    useEffect(() => {
        if (sectionKey) {
            localStorage.setItem(`collapsible_${sectionKey}`, expanded.toString());
        }
    }, [expanded, sectionKey]);

    // Listen for expand/collapse all events
    useEffect(() => {
        const handleExpandAll = () => {
            if (sectionKey) {
                const stored = localStorage.getItem(`collapsible_${sectionKey}`);
                if (stored === 'true') {
                    setExpanded(true);
                }
            }
        };

        const handleCollapseAll = () => {
            if (sectionKey) {
                const stored = localStorage.getItem(`collapsible_${sectionKey}`);
                if (stored === 'false') {
                    setExpanded(false);
                }
            }
        };

        window.addEventListener('expandAllSections', handleExpandAll);
        window.addEventListener('collapseAllSections', handleCollapseAll);

        return () => {
            window.removeEventListener('expandAllSections', handleExpandAll);
            window.removeEventListener('collapseAllSections', handleCollapseAll);
        };
    }, [sectionKey]);

    const handleChange = (event, isExpanded) => {
        setExpanded(isExpanded);
    };

    return (
        <Accordion
            expanded={expanded}
            onChange={handleChange}
            sx={{
                mb: 3,
                borderRadius: '8px !important',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: '0 0 24px 0',
                },
                ...sx,
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 1,
                    },
                    transition: 'background-color 300ms ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    {icon && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {icon}
                        </Box>
                    )}
                    <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                        {title}
                    </Typography>
                    {count !== undefined && count !== null && (
                        <Chip
                            label={count}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                backgroundColor: expanded ? '#667eea' : '#e0e7ff',
                                color: expanded ? 'white' : '#4338ca',
                                minWidth: 32,
                                height: 24,
                                transition: 'all 300ms ease',
                            }}
                        />
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails
                sx={{
                    pt: 2,
                    pb: 3,
                }}
            >
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

export default CollapsibleSection;
