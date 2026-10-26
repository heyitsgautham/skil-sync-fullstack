import React, { useState } from 'react';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../services/apiConfig';
import { responseErrorMessage } from '../../services/apiErrors';

/**
 * State and handlers behind the admin dashboard tools: recompute embeddings,
 * clear ChromaDB, re-index resumes and the system status they report.
 */
export default function useAdminTools(role) {
    // State for recompute embeddings
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [recomputeResult, setRecomputeResult] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // State for ChromaDB management
    const [isClearingChroma, setIsClearingChroma] = useState(false);
    const [isReindexing, setIsReindexing] = useState(false);
    const [clearChromaDialog, setClearChromaDialog] = useState(false);
    const [reindexDialog, setReindexDialog] = useState(false);
    const [systemStatus, setSystemStatus] = useState(null);

    // Handler for recomputing embeddings
    const handleRecomputeEmbeddings = async () => {
        setIsRecomputing(true);
        setRecomputeResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/recompute-embeddings`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to recompute embeddings'));
            }

            const data = await response.json();
            setRecomputeResult(data);
            setSnackbar({
                open: true,
                message: `Successfully recomputed embeddings! ${data.resumes.recomputed + data.internships.recomputed} new embeddings generated.`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Error recomputing embeddings:', error);
            setSnackbar({
                open: true,
                message: `${error.message}. Please try again.`,
                severity: 'error',
            });
        } finally {
            setIsRecomputing(false);
        }
    };

    // Handler for clearing ChromaDB
    const handleClearChromaDB = async () => {
        setClearChromaDialog(false);
        setIsClearingChroma(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/clear-chromadb`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to clear ChromaDB'));
            }

            const data = await response.json();
            setSnackbar({
                open: true,
                message: `Successfully cleared ChromaDB! ${data.resumes_cleared} embeddings and ${data.matches_cleared} matches deleted.`,
                severity: 'success',
            });

            // Refresh system status
            fetchSystemStatus();
        } catch (error) {
            console.error('Error clearing ChromaDB:', error);
            setSnackbar({
                open: true,
                message: `${error.message}. Please try again.`,
                severity: 'error',
            });
        } finally {
            setIsClearingChroma(false);
        }
    };

    // Handler for reindexing all students
    const handleReindexAllStudents = async () => {
        setReindexDialog(false);
        setIsReindexing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/reindex-all-students`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, 'Failed to start reindexing'));
            }

            const data = await response.json();
            setSnackbar({
                open: true,
                message: `Started reindexing ${data.total_files} student resumes. This will take 2-5 minutes. Check back soon!`,
                severity: 'info',
            });

            // Poll system status after 30 seconds
            setTimeout(() => {
                fetchSystemStatus();
                setIsReindexing(false);
                setSnackbar({
                    open: true,
                    message: 'Reindexing completed! System status updated.',
                    severity: 'success',
                });
            }, 30000);
        } catch (error) {
            console.error('Error starting reindex:', error);
            setSnackbar({
                open: true,
                message: `${error.message}. Please try again.`,
                severity: 'error',
            });
            setIsReindexing(false);
        }
    };

    // Fetch system status
    const fetchSystemStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/system-status`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch system status');
            }

            const data = await response.json();
            setSystemStatus(data);
        } catch (error) {
            console.error('Error fetching system status:', error);
        }
    };

    // Fetch system status on mount (only for admin)
    React.useEffect(() => {
        if (role === 'admin') {
            fetchSystemStatus();
        }
    }, [role]);

    return {
        isRecomputing,
        setIsRecomputing,
        recomputeResult,
        setRecomputeResult,
        snackbar,
        setSnackbar,
        isClearingChroma,
        setIsClearingChroma,
        isReindexing,
        setIsReindexing,
        clearChromaDialog,
        setClearChromaDialog,
        reindexDialog,
        setReindexDialog,
        systemStatus,
        setSystemStatus,
        handleRecomputeEmbeddings,
        handleClearChromaDB,
        handleReindexAllStudents,
        fetchSystemStatus,
    };
}
