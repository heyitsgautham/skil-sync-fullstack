// The company profile fields, read-only until the company clicks Edit.
import { TextField, Grid, Switch, FormControlLabel } from '@mui/material';
import {
    Business as BusinessIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
} from '@mui/icons-material';

const CompanyProfileFields = ({ editing, formData, setFormData }) => (
    <Grid container spacing={3}>
        {/* Company Name */}
        <Grid size={{ xs: 12 }}>
            <TextField
                fullWidth
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                disabled={!editing}
                InputProps={{
                    startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
            />
        </Grid>

        {/* HR Contact Name */}
        <Grid size={{ xs: 12 }}>
            <TextField
                fullWidth
                label="HR Contact Name"
                value={formData.hr_contact_name}
                onChange={(e) => setFormData({ ...formData, hr_contact_name: e.target.value })}
                disabled={!editing}
                InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
            />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12 }}>
            <TextField
                fullWidth
                label="Company Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editing}
                InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
            />
        </Grid>

        {/* Mailing Email */}
        <Grid size={{ xs: 12 }}>
            <TextField
                fullWidth
                label="Mailing Email"
                value={formData.mailing_email}
                onChange={(e) => setFormData({ ...formData, mailing_email: e.target.value })}
                disabled={!editing}
                placeholder="Email for receiving applicant notifications"
                helperText="This email will be used to send job applicant summaries"
                InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
            />
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                placeholder="+1-555-0123"
                InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
            />
        </Grid>

        {/* Phone Visibility Toggle */}
        <Grid size={{ xs: 12, sm: 4 }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={formData.phone_visible}
                        onChange={(e) => setFormData({ ...formData, phone_visible: e.target.checked })}
                        disabled={!editing}
                        color="primary"
                    />
                }
                label="Phone Visible to Students"
                labelPlacement="top"
            />
        </Grid>
    </Grid>
);

export default CompanyProfileFields;
