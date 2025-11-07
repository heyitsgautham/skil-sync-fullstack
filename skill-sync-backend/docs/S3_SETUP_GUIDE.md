# AWS S3 Resume Storage Setup Guide

## Overview
SkillSync stores student resumes in AWS S3 for scalable, secure cloud storage. This guide will help you set up S3 integration and migrate existing resumes.

## Why S3?
- ✅ **Scalable**: Handle unlimited resume uploads
- ✅ **Reliable**: 99.999999999% durability
- ✅ **Secure**: Encrypted storage with access controls
- ✅ **Accessible**: Generate presigned URLs for company resume viewing
- ✅ **Cost-effective**: Pay only for what you use (~$0.023 per GB/month)

## Prerequisites
1. AWS Account (create at https://aws.amazon.com)
2. IAM User with S3 access
3. S3 Bucket created in your AWS account

## Step 1: Create AWS S3 Bucket

### Option A: Using AWS Console (Recommended for beginners)

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to S3 service

2. **Create Bucket**
   - Click "Create bucket"
   - Bucket name: `skillsync-resumes` (or your preferred name)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - **Important**: Enable "ACLs disabled (recommended)"

3. **Configure Bucket Settings**
   - **Block Public Access**: Keep all BLOCKED (recommended)
   - **Bucket Versioning**: Enable (optional, for backup)
   - **Server-side encryption**: Enable (AES-256 recommended)

4. **Set CORS Policy** (Required for frontend uploads)
   - Go to Permissions tab → CORS
   - Add this configuration:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
           "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```

### Option B: Using AWS CLI

```bash
# Create bucket
aws s3 mb s3://skillsync-resumes --region us-east-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket skillsync-resumes \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Set CORS
aws s3api put-bucket-cors \
  --bucket skillsync-resumes \
  --cors-configuration file://cors-config.json
```

## Step 2: Create IAM User and Get Credentials

1. **Go to IAM Console**
   - Navigate to IAM → Users → Add user

2. **Create User**
   - User name: `skillsync-s3-user`
   - Access type: **Programmatic access** (for API access)

3. **Attach Permissions**
   - Option 1: Attach existing policy: `AmazonS3FullAccess` (easier)
   - Option 2: Create custom policy (more secure):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject",
                   "s3:ListBucket"
               ],
               "Resource": [
                   "arn:aws:s3:::skillsync-resumes",
                   "arn:aws:s3:::skillsync-resumes/*"
               ]
           }
       ]
   }
   ```

4. **Download Credentials**
   - Save the **Access Key ID** and **Secret Access Key**
   - ⚠️ **Important**: This is the only time you'll see the secret key!

## Step 3: Configure Backend Environment

1. **Edit `.env` file** in `skill-sync-backend/` directory:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=skillsync-resumes
```

2. **Verify Configuration**:
```bash
cd skill-sync-backend
python scripts/setup_s3_and_migrate.py
```

Expected output:
```
🔍 Checking S3 Configuration
======================================================================
  ✅ AWS_ACCESS_KEY_ID: AKIA****AMPLE
  ✅ AWS_SECRET_ACCESS_KEY: wJal****LEKEY
  ✅ AWS_S3_BUCKET_NAME: skillsync-resumes
  ✅ AWS_REGION: us-east-1
======================================================================

🔗 Testing S3 Connectivity
======================================================================
✅ Successfully connected to S3 bucket: skillsync-resumes
✅ Region: us-east-1
```

## Step 4: Migrate Existing Resumes to S3

If you have existing resumes stored locally, migrate them to S3:

### Check Current Status
```bash
python scripts/setup_s3_and_migrate.py
```

### Migrate Resumes
```bash
python scripts/setup_s3_and_migrate.py --migrate
```

Expected output:
```
🔄 Starting Resume Migration to S3
======================================================================
📦 Found 50 resumes to migrate

[1/50] Processing Resume ID 1
  Student ID: 1
  File: john_doe_resume.pdf
  Size: 245.32 KB
  ✅ Uploaded to S3: resumes/1/base/20251107_143022_john_doe_resume.pdf

...

======================================================================
🎉 Migration Completed!
======================================================================
  ✅ Successful uploads: 50
  ❌ Failed uploads: 0
======================================================================
```

### Verify Migration
```bash
python scripts/setup_s3_and_migrate.py --verify
```

## Step 5: Test Resume Viewing

### From Backend
Test the resume viewing endpoint:
```bash
# Get a student ID from your database
curl -X GET "http://localhost:8000/api/recommendations/resume/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
    "resume_id": 1,
    "file_name": "john_doe_resume.pdf",
    "url": "https://skillsync-resumes.s3.us-east-1.amazonaws.com/resumes/1/base/20251107_143022_john_doe_resume.pdf",
    "storage_type": "s3",
    "expires_in": 3600,
    "message": "URL expires in 1 hour"
}
```

### From Frontend
1. Login as a company user
2. Go to "AI Candidate Ranking"
3. Select an internship
4. Click "Rank Candidates"
5. Click "View Resume" on any candidate
6. Resume should open in a new tab from S3

## Troubleshooting

### Issue: "S3 upload failed"

**Possible causes:**
1. Incorrect AWS credentials
2. Bucket doesn't exist
3. Insufficient permissions
4. Network connectivity issues

**Solutions:**
```bash
# Test AWS credentials
aws s3 ls s3://skillsync-resumes

# Verify bucket exists
aws s3api head-bucket --bucket skillsync-resumes

# Check IAM permissions
aws iam get-user-policy --user-name skillsync-s3-user --policy-name S3Access
```

### Issue: "Resume not found" when viewing

**Possible causes:**
1. Resume not migrated to S3
2. S3 key not saved in database
3. File was deleted from S3

**Solutions:**
```bash
# Check migration status
python scripts/setup_s3_and_migrate.py

# Re-migrate specific resume
python scripts/setup_s3_and_migrate.py --force

# Verify S3 access
python scripts/setup_s3_and_migrate.py --verify
```

### Issue: CORS errors in browser console

**Solution:**
Update CORS configuration in S3 bucket (see Step 1)

### Issue: "Access Denied" errors

**Possible causes:**
1. Bucket policy blocking access
2. IAM user lacks permissions
3. Wrong region configuration

**Solutions:**
1. Check bucket policy in AWS Console
2. Verify IAM user permissions
3. Ensure `AWS_REGION` matches bucket region

## File Organization in S3

Resumes are organized with this structure:
```
skillsync-resumes/
├── resumes/
│   ├── {student_id}/
│   │   ├── base/
│   │   │   └── {timestamp}_{filename}
│   │   └── tailored/
│   │       └── {internship_id}/
│   │           └── {timestamp}_{filename}
```

Example:
```
skillsync-resumes/
├── resumes/
│   ├── 1/
│   │   ├── base/
│   │   │   └── 20251107_143022_john_doe_resume.pdf
│   │   └── tailored/
│   │       └── 5/
│   │           └── 20251107_150000_john_doe_tailored.pdf
```

## Cost Estimation

### Storage Costs
- **Standard Storage**: $0.023 per GB/month
- **1,000 resumes** (avg 200KB each): ~200MB = **$0.0046/month**
- **10,000 resumes**: ~2GB = **$0.046/month**

### Request Costs
- **PUT/POST**: $0.005 per 1,000 requests
- **GET**: $0.0004 per 1,000 requests
- **1,000 uploads + 10,000 views/month**: **~$0.01/month**

**Total estimated cost for 1,000 students**: **~$0.02/month** 🎉

## Security Best Practices

1. ✅ **Never commit AWS credentials** to version control
2. ✅ **Use environment variables** for all sensitive data
3. ✅ **Enable bucket encryption** (AES-256 or KMS)
4. ✅ **Use IAM users** with minimal required permissions
5. ✅ **Enable bucket versioning** for backup/recovery
6. ✅ **Monitor S3 access logs** for security auditing
7. ✅ **Set bucket policies** to restrict public access
8. ✅ **Use presigned URLs** with short expiration times (1 hour)

## Maintenance

### Regular Tasks
- **Weekly**: Check migration status for new resumes
- **Monthly**: Review S3 costs and optimize if needed
- **Quarterly**: Audit IAM permissions and access logs

### Backup Strategy
- Local files are kept as backup after S3 upload
- Consider enabling S3 versioning for additional protection
- Set up S3 lifecycle policies to archive old resumes to Glacier

## Next Steps

After successful setup:
1. ✅ All new resume uploads automatically go to S3
2. ✅ Companies can view resumes via "View Resume" button
3. ✅ Resumes are accessible from anywhere
4. ✅ System is ready for production deployment

## Support

For issues or questions:
- Check application logs: `skill-sync-backend/logs/`
- Run diagnostics: `python scripts/setup_s3_and_migrate.py --verify`
- Review AWS CloudWatch for S3 metrics
- Contact AWS Support for account/billing issues

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
