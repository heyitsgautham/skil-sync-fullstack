// Confirms sending the candidate report email before it goes out.
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

const ConfirmSendDialog = ({
    confirmDialog,
    setConfirmDialog,
    matchFilters,
    handleSendEmail,
    getSelectedJobStats,
    getFilteredCandidateCount,
}) => (
    <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Email Send</DialogTitle>
        <DialogContent>
            <DialogContentText component="div">
                Are you sure you want to send the applicant summary email for{' '}
                <strong>{getSelectedJobStats()?.internship_title}</strong>?
                <br />
                <br />
                <strong>Selected Categories:</strong>
                <ul style={{ marginTop: '8px', marginBottom: '8px' }}>
                    {matchFilters.greatMatches && (
                        <li>Great Matches (≥80%): {getSelectedJobStats()?.great_matches || 0} candidates</li>
                    )}
                    {matchFilters.goodMatches && (
                        <li>Good Matches (60-79%): {getSelectedJobStats()?.good_matches || 0} candidates</li>
                    )}
                    {matchFilters.otherMatches && (
                        <li>Other Matches (&lt;60%): {getSelectedJobStats()?.bad_matches || 0} candidates</li>
                    )}
                </ul>
                <br />
                The email will include:
                <ul>
                    <li>CSV export of {getFilteredCandidateCount()} candidates</li>
                    <li>Excel export of {getFilteredCandidateCount()} candidates</li>
                    <li>Match statistics breakdown</li>
                </ul>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} variant="contained" autoFocus>
                Send Email
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmSendDialog;
