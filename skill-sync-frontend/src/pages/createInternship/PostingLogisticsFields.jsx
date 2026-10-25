// The location, duration and stipend fields of the post-internship form.
import { TextField } from '@mui/material';

const PostingLogisticsFields = ({ formData, handleChange, loading }) => (
    <>
        <TextField
            margin="normal"
            fullWidth
            id="location"
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={loading}
            placeholder="e.g., Remote, New York, Hybrid"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                },
            }}
        />

        <TextField
            margin="normal"
            fullWidth
            id="duration"
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            disabled={loading}
            placeholder="e.g., 3 months, 6 months"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                },
            }}
        />

        <TextField
            margin="normal"
            fullWidth
            id="stipend"
            label="Stipend"
            name="stipend"
            value={formData.stipend}
            onChange={handleChange}
            disabled={loading}
            placeholder="e.g., $2000/month, Unpaid"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(17, 153, 142, 0.05)',
                },
            }}
        />
    </>
);

export default PostingLogisticsFields;
