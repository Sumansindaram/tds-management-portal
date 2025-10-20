# Azure Deployment Guide for TDS Management System

This guide explains how to deploy the TDS application to Azure with a backend that bypasses Supabase network restrictions.

## Architecture Overview

**Problem**: Your office network blocks browser → Supabase connections  
**Solution**: Browser → Azure API → Supabase (server-to-server, not blocked)

```
┌──────────┐         ┌────────────┐         ┌──────────┐
│  Browser │ ───────▶│ Azure API  │ ───────▶│ Supabase │
│ (Office) │         │   Server   │         │   (DB)   │
└──────────┘         └────────────┘         └──────────┘
   Allowed              Allowed              Allowed
```

## Prerequisites

1. **Supabase Service Role Key**
   - Go to: https://supabase.com/dashboard/project/ybqrysjtwynuzuqggtfs/settings/api
   - Copy the `service_role` key (keep it secret!)

2. **Azure Web App** (you already have `tds-des-mod-uk`)

## Step 1: Configure Azure Application Settings

1. Go to Azure Portal → `tds-des-mod-uk` → Configuration → Application settings

2. Click **+ New application setting** and add these **4 settings**:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | `https://ybqrysjtwynuzuqggtfs.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key_from_step_1` |
   | `NODE_ENV` | `production` |
   | `ALLOWED_ORIGINS` | `https://tds-des-mod-uk.azurewebsites.net` |

3. Click **Save** at the top

## Step 2: Update GitHub Workflow Secret

Your GitHub workflow already has the publish profile secret. No changes needed unless you want to use the new workflow.

**Option A**: Keep existing workflow (simpler)
- Rename `.github/workflows/main_tds-des-mod-uk.yml` to `.github/workflows/main_tds-des-mod-uk.yml.backup`
- Rename `.github/workflows/azure-deploy.yml` to `.github/workflows/main_tds-des-mod-uk.yml`

**Option B**: Create new workflow
- Keep both workflows
- Disable the old one in GitHub Actions settings

## Step 3: Deploy

Push to the `main` branch:

```bash
git add .
git commit -m "Add Azure backend for network compatibility"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Build React frontend with Azure API configuration
2. ✅ Build Node.js backend
3. ✅ Package everything together
4. ✅ Deploy to Azure Web App

## Step 4: Verify Deployment

1. **Check GitHub Actions**
   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
   - Verify the workflow completed successfully

2. **Check Azure Deployment**
   - Go to Azure Portal → `tds-des-mod-uk` → Deployment Center
   - Verify deployment status

3. **Test the App**
   - Open: https://tds-des-mod-uk.azurewebsites.net
   - Try logging in
   - Test creating a request

## Troubleshooting

### Build Fails
- Check GitHub Actions logs
- Verify Node.js version in workflow matches Azure (20.x)

### Deployment Succeeds but App Shows Errors
1. Check Azure Application Logs:
   - Azure Portal → `tds-des-mod-uk` → Log stream
   
2. Verify environment variables are set:
   - Azure Portal → `tds-des-mod-uk` → Configuration
   - Ensure all 4 settings are present

3. Check for typos in `SUPABASE_SERVICE_ROLE_KEY`

### "Cannot GET /api/..." Errors
- The backend might not be starting correctly
- Check Azure logs for Node.js errors
- Verify `package.json` scripts in azure-backend folder

### File Uploads Don't Work
- Check Supabase Storage RLS policies
- Verify service role key has storage access
- Check Azure logs for storage errors

## File Upload Behavior

Files are stored in Supabase Storage (not migrated):
- **Upload**: Browser → Azure API → Supabase Storage
- **Download**: Browser → Azure API → Supabase signed URL → Browser

This works because:
- Azure server can access Supabase (server-to-server)
- Signed URLs are temporary and work from any network

## Rollback Plan

If something goes wrong, revert to direct Supabase:

1. Remove or rename `.github/workflows/main_tds-des-mod-uk.yml`
2. Restore `.github/workflows/main_tds-des-mod-uk.yml.backup`
3. Remove `VITE_API_BASE_URL` from build environment
4. Push to trigger redeploy

The app will use Supabase directly again.

## Development vs Production

**Local Development** (uses Supabase directly):
```bash
npm run dev
# No VITE_API_BASE_URL set
```

**Production** (uses Azure API):
- VITE_API_BASE_URL is set in GitHub workflow
- Frontend automatically uses Azure backend

## Security Notes

✅ **Service role key is secure**:
- Stored in Azure Application Settings (encrypted)
- Never exposed to browser
- Only accessible by Azure server

✅ **RLS still applies**:
- Backend enforces authentication
- Supabase RLS provides additional security layer
- Users can only access their own data (unless admin)

❌ **Do not**:
- Commit service role key to Git
- Share service role key in chat/email
- Use service role key in frontend code

## Next Steps

After successful deployment:

1. **Test all features** from your office network:
   - Login/signup
   - Create request
   - Upload files
   - Admin approve/reject
   - User management

2. **Monitor Azure costs**:
   - Azure Portal → Cost Management
   - Backend adds minimal cost (same app service)

3. **Set up monitoring** (optional):
   - Azure Application Insights for error tracking
   - Set up alerts for failures

## Getting Help

If you encounter issues:

1. Check Azure logs (real-time)
2. Check GitHub Actions logs
3. Verify all environment variables
4. Test API endpoints directly: `https://tds-des-mod-uk.azurewebsites.net/api/health`

The health check should return: `{"status":"ok","timestamp":"2025-..."}`
