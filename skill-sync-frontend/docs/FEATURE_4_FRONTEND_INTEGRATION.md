# Feature 4: Frontend Integration Guide

This guide shows how to integrate the Email Notification Panel into the company dashboard.

---

## 📁 Files Created

- `src/components/company/EmailNotificationPanel.jsx` - Main email notification component

---

## 🔌 Integration Steps

### 1. Import the Component

In your Company Dashboard page (e.g., `src/pages/company/Dashboard.jsx`):

```javascript
import EmailNotificationPanel from '../../components/company/EmailNotificationPanel';
```

### 2. Add to Dashboard Layout

```javascript
const CompanyDashboard = () => {
  const token = localStorage.getItem('token'); // Or from your auth context
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Company Dashboard
      </Typography>
      
      {/* Add Email Notification Panel */}
      <EmailNotificationPanel token={token} />
      
      {/* Rest of your dashboard components */}
      <Grid container spacing={3}>
        {/* Statistics cards */}
        {/* Internship list */}
        {/* etc. */}
      </Grid>
    </Box>
  );
};
```

### 3. Alternative: Add as Tab

If you have tabs in your dashboard:

```javascript
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Overview" />
  <Tab label="Internships" />
  <Tab label="Applications" />
  <Tab label="Email Notifications" /> {/* New tab */}
</Tabs>

<TabPanel value={tabValue} index={3}>
  <EmailNotificationPanel token={token} />
</TabPanel>
```

---

## 🎨 Component Features

### UI Elements:
- **Preview Daily Summary Button** - Shows email preview in modal
- **Send Daily Summary Button** - Sends email immediately
- **Email Settings Button** - Opens preferences dialog

### Functionality:
- Email preview in modal with stats
- Send confirmation with success/error messages
- Email preference toggles (daily, instant, weekly)
- Loading states during API calls
- Error handling with user-friendly messages

---

## 🔧 Configuration

### Environment Variables

Add to `.env` file in frontend:

```bash
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 📊 Component Props

```typescript
interface EmailNotificationPanelProps {
  token: string; // JWT authentication token
}
```

---

## 🎬 Usage Example

### Basic Usage:
```jsx
<EmailNotificationPanel token={authToken} />
```

### With Authentication Context:
```jsx
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { token } = useAuth();
  
  return (
    <EmailNotificationPanel token={token} />
  );
};
```

---

## 🧪 Testing

### Test Preview:
1. Login as company user
2. Navigate to dashboard
3. Click "Preview Daily Summary"
4. Verify email preview displays in modal
5. Check application count is correct

### Test Send:
1. Configure SMTP in backend `.env`
2. Click "Send Daily Summary Now"
3. Verify success message appears
4. Check email inbox for delivery

### Test Preferences:
1. Click "Email Settings"
2. Toggle preferences
3. Click "Save Preferences"
4. Verify success message
5. Reload page and verify preferences persist

---

## 🎨 Customization

### Change Button Styles:
```jsx
<Button
  variant="contained"
  color="primary"  // Change to "secondary", "success", etc.
  startIcon={<SendIcon />}
  onClick={handleSendEmail}
>
  Send Email
</Button>
```

### Adjust Modal Size:
```jsx
<Dialog
  maxWidth="lg"  // Change to "sm", "md", "lg", "xl"
  fullWidth
>
```

### Custom Color for Stats:
```jsx
<Alert severity="success">  // Change to "info", "warning", "error"
  {stats.totalApplications} new applications
</Alert>
```

---

## 📱 Responsive Design

The component is fully responsive and works on:
- ✅ Desktop (1920px+)
- ✅ Laptop (1280px)
- ✅ Tablet (768px)
- ✅ Mobile (320px+)

---

## 🐛 Troubleshooting

### Issue: "Failed to generate preview"
**Solution:** Check that:
- Backend server is running
- Token is valid and not expired
- API URL is correct in .env
- Company has active internships

### Issue: Email preview not rendering
**Solution:** 
- Check browser console for errors
- Verify HTML is properly sanitized
- Check for CSP (Content Security Policy) restrictions

### Issue: "Failed to send email"
**Solution:**
- Verify SMTP configuration in backend .env
- Check that Gmail app password is correct
- Ensure "Less secure app access" is enabled (if using Gmail)

---

## 🔐 Security Notes

- Never expose SMTP credentials in frontend
- Always use HTTPS in production
- Validate user authentication before displaying component
- Sanitize HTML content before rendering
- Implement rate limiting on email send endpoint

---

## 🚀 Production Checklist

- [ ] Configure SMTP credentials in backend
- [ ] Set REACT_APP_API_URL to production API
- [ ] Test email delivery in production
- [ ] Verify email renders in all major clients
- [ ] Set up monitoring for failed email deliveries
- [ ] Configure email rate limiting
- [ ] Add analytics tracking for email interactions
- [ ] Test unsubscribe functionality
- [ ] Verify mobile responsiveness
- [ ] Set up automated daily scheduler

---

## 📚 Related Documentation

- API Documentation: `FEATURE_4_IMPLEMENTATION_SUMMARY.md`
- Quick Reference: `FEATURE_4_QUICK_REFERENCE.md`
- Backend Service: `app/services/email_service.py`
- API Routes: `app/routes/notifications.py`

---

**Last Updated:** November 6, 2025  
**Component Status:** Ready for Integration ✅
