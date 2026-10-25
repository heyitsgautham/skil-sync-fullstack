import { useState, useEffect } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../services/apiConfig';

/** Resume list, upload, AI parsing and profile sync state for the resume intelligence page. */
export default function useResumeIntelligence() {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [processingDetails, setProcessingDetails] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);
    const [myResumes, setMyResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [processingSteps, setProcessingSteps] = useState([
        { label: 'Uploading file to server', completed: false, icon: <CloudUploadIcon /> },
        { label: 'Extracting text from PDF using PyPDF2', completed: false, icon: <TextFieldsIcon /> },
        { label: 'Analyzing skills section with AI', completed: false, icon: <CodeIcon /> },
        { label: 'Extracting work experience details', completed: false, icon: <WorkIcon /> },
        { label: 'Identifying education background', completed: false, icon: <SchoolIcon /> },
        { label: 'Processing certifications and projects', completed: false, icon: <EmojiEventsIcon /> },
        { label: 'Finalizing AI analysis', completed: false, icon: <AutoAwesomeIcon /> },
    ]);

    // Fetch user's resumes on component mount
    useEffect(() => {
        fetchMyResumes();
    }, []);

    // Fetch all resumes for current user
    const fetchMyResumes = async () => {
        setLoadingResumes(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/resume/my-resumes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyResumes(response.data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            toast.error('Failed to load your resumes');
        } finally {
            setLoadingResumes(false);
        }
    };

    // Load parsed data for a specific resume and automatically save to profile
    const loadResumeData = async (resumeId) => {
        setLoading(true);
        setSelectedResumeId(resumeId);
        try {
            const token = localStorage.getItem('token');

            console.log('Loading resume data for ID:', resumeId);

            // First, update the UI immediately for instant feedback
            setMyResumes(prevResumes =>
                prevResumes.map(resume => ({
                    ...resume,
                    is_active: resume.id === resumeId ? 1 : 0
                }))
            );

            // Then, activate the resume in the database
            try {
                await axios.put(
                    `${API_BASE_URL}/resume/${resumeId}/activate`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log('Resume activated successfully');
            } catch (activateError) {
                console.error('Error activating resume:', activateError);
                // Revert the optimistic update if activation failed
                await fetchMyResumes();
                // Continue anyway to load the data
            }

            // Then, get parsed data
            const response = await axios.get(
                `${API_BASE_URL}/resume/${resumeId}/parsed-data`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const structuredData = response.data.structured_data;
            setParsedData(structuredData);
            setProcessingDetails(response.data.processing_details);

            // Automatically save to profile
            if (structuredData && structuredData.all_skills) {
                try {
                    await axios.put(
                        `${API_BASE_URL}/students/profile`,
                        {
                            skills: structuredData.all_skills,
                            total_experience_years: structuredData.total_experience_years || 0,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    toast.success('✅ Resume activated and profile updated!');
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                    toast.success('Resume activated successfully!');
                    // Don't show error to user, just log it
                }
            } else {
                toast.success('Resume activated successfully!');
            }
        } catch (error) {
            console.error('Error loading resume:', error);
            toast.error(error.response?.data?.detail || 'Failed to load resume data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        if (!e.target.files || !e.target.files[0]) return;

        const selectedFile = e.target.files[0];
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Please upload a PDF, DOCX, DOC, or TXT file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setParsedData(null);
        setProcessingDetails(null);
        setSelectedResumeId(null);
        // Reset processing steps
        setActiveStep(-1);
        setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
        toast.success(`Selected: ${selectedFile.name}`);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const validTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain'
            ];

            if (!validTypes.includes(droppedFile.type)) {
                toast.error('Please upload a PDF, DOCX, DOC, or TXT file');
                return;
            }

            if (droppedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }

            setFile(droppedFile);
            setParsedData(null);
            setProcessingDetails(null);
            setActiveStep(-1);
            setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
            toast.success(`Selected: ${droppedFile.name}`);
        }
    };

    // Delete resume handler
    const handleDeleteResume = async (resumeId, resumeName, event) => {
        // Stop event propagation to prevent card click
        event.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete "${resumeName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/resume/${resumeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Resume deleted successfully');

            // If the deleted resume was being viewed, clear the view
            if (selectedResumeId === resumeId) {
                setParsedData(null);
                setProcessingDetails(null);
                setSelectedResumeId(null);
            }

            // Refresh the resumes list
            fetchMyResumes();
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete resume');
        }
    };

    // Simulate processing steps for demo
    const simulateProcessingSteps = async () => {
        const stepDurations = [800, 1200, 1500, 1300, 1000, 900, 700]; // milliseconds for each step

        for (let i = 0; i < processingSteps.length; i++) {
            setActiveStep(i);
            await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
            setProcessingSteps(prev => {
                const updated = [...prev];
                updated[i].completed = true;
                return updated;
            });
        }
    };

    const handleParseResume = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setLoading(true);
        setParsedData(null);
        setProcessingDetails(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Start simulating processing steps
            const simulationPromise = simulateProcessingSteps();

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/filter/parse-resume`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Wait for simulation to complete
            await simulationPromise;

            const structuredData = response.data.structured_data;
            setParsedData(structuredData);
            setProcessingDetails(response.data.processing_details);
            setActiveStep(-1); // Hide stepper after completion
            setFile(null); // Clear file selection

            // Automatically save to profile
            if (structuredData && structuredData.all_skills) {
                try {
                    await axios.put(
                        `${API_BASE_URL}/students/profile`,
                        {
                            skills: structuredData.all_skills,
                            total_experience_years: structuredData.total_experience_years || 0,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    toast.success('✨ Resume parsed and profile updated successfully!');
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                    toast.success('✨ Resume parsed successfully with AI!');
                }
            } else {
                toast.success('✨ Resume parsed successfully with AI!');
            }

            // Refresh resumes list
            fetchMyResumes();
        } catch (error) {
            console.error('Error parsing resume:', error);
            setActiveStep(-1);
            setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
            toast.error(error.response?.data?.detail || 'Failed to parse resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        file,
        setFile,
        parsedData,
        setParsedData,
        loading,
        setLoading,
        loadingResumes,
        setLoadingResumes,
        processingDetails,
        setProcessingDetails,
        dragActive,
        setDragActive,
        activeStep,
        setActiveStep,
        myResumes,
        setMyResumes,
        selectedResumeId,
        setSelectedResumeId,
        processingSteps,
        setProcessingSteps,
        fetchMyResumes,
        loadResumeData,
        handleFileUpload,
        handleDrag,
        handleDrop,
        handleDeleteResume,
        simulateProcessingSteps,
        handleParseResume,
    };
}
