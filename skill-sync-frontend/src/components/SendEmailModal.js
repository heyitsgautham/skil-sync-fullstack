import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const SendEmailModal = ({ open, onClose, selectedCandidates, internshipTitle, internshipId, onSendComplete }) => {
    const [subject, setSubject] = useState(`Congratulations! Next Round - ${internshipTitle}`);
    const [message, setMessage] = useState(
        `We are pleased to inform you that you have been selected for the next round of our recruitment process.\n\nWe were impressed with your profile and believe you would be a great fit for this position. We will reach out to you shortly with further details about the next steps.\n\nLooking forward to meeting you!\n\nBest regards`
    );
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    const handleSend = async () => {
        setSending(true);
        setSendResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/candidate-emails/send-to-candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    internship_id: internshipId,
                    candidate_ids: selectedCandidates.map(c => c.student_id),
                    subject: subject,
                    message: message
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSendResult({
                    success: true,
                    data: data
                });
                
                // Call the callback after successful send
                if (onSendComplete) {
                    setTimeout(() => {
                        onSendComplete(data);
                    }, 2000);
                }
            } else {
                setSendResult({
                    success: false,
                    error: data.detail || 'Failed to send emails'
                });
            }
        } catch (error) {
            console.error('Error sending emails:', error);
            setSendResult({
                success: false,
                error: 'Network error: Failed to send emails'
            });
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        if (!sending) {
            setSubject(`Congratulations! Next Round - ${internshipTitle}`);
            setMessage(`We are pleased to inform you that you have been selected for the next round of our recruitment process.\n\nWe were impressed with your profile and believe you would be a great fit for this position. We will reach out to you shortly with further details about the next steps.\n\nLooking forward to meeting you!\n\nBest regards`);
            setSendResult(null);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SendIcon />
                    <Typography variant="h6" fontWeight="bold">
                        Send Email to Selected Candidates
                    </Typography>
                </Box>
                <Chip 
                    label={`${selectedCandidates.length} Selected`}
                    sx={{ 
                        backgroundColor: 'white',
                        color: '#667eea',
                        fontWeight: 'bold'
                    }}
                />
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {/* Selected Candidates List */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Recipients:
                    </Typography>
                    <List dense sx={{ 
                        maxHeight: 150, 
                        overflow: 'auto',
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        p: 1
                    }}>
                        {selectedCandidates.map((candidate) => (
                            <ListItem key={candidate.candidate_id}>
                                <ListItemText
                                    primary={candidate.candidate_name}
                                    secondary={`ID: ${candidate.candidate_id} • Score: ${candidate.match_score.toFixed(1)}%`}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Email Subject */}
                <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending}
                    sx={{ mb: 2 }}
                    required
                />

                {/* Email Message */}
                <TextField
                    fullWidth
                    label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    rows={8}
                    disabled={sending}
                    required
                    helperText="Personalized emails will be sent to each candidate individually"
                />

                {/* Send Result */}
                {sendResult && (
                    <Alert 
                        severity={sendResult.success ? "success" : "error"}
                        icon={sendResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                        sx={{ mt: 2 }}
                    >
                        {sendResult.success ? (
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    ✅ Successfully sent {sendResult.data.emails_sent} email(s)!
                                </Typography>
                                {sendResult.data.failed_emails > 0 && (
                                    <Typography variant="caption" color="error">
                                        ⚠️ {sendResult.data.failed_emails} email(s) failed to send
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Typography variant="body2">
                                ❌ {sendResult.error}
                            </Typography>
                        )}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    onClick={handleClose}
                    disabled={sending}
                    startIcon={<CloseIcon />}
                >
                    {sendResult?.success ? 'Close' : 'Cancel'}
                </Button>
                {!sendResult?.success && (
                    <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={sending || !subject.trim() || !message.trim()}
                        startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                            }
                        }}
                    >
                        {sending ? 'Sending...' : `Send to ${selectedCandidates.length} Candidate${selectedCandidates.length > 1 ? 's' : ''}`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SendEmailModal;
