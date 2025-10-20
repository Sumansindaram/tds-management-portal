# TDS Azure Backend

Express.js API server that proxies requests to Supabase, allowing the frontend to work in networks where Supabase is blocked.

## Setup

### 1. Install Dependencies
```bash
cd azure-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your values:
```
SUPABASE_URL=https://ybqrysjtwynuzuqggtfs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=https://tds-des-mod-uk.azurewebsites.net
```

**IMPORTANT**: Get your `SUPABASE_SERVICE_ROLE_KEY` from:
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the `service_role` key (NOT the `anon` key)

### 3. Build
```bash
npm run build
```

### 4. Run Locally (Development)
```bash
npm run dev
```

### 5. Run Production Build
```bash
npm start
```

## Azure Deployment

### Configure Azure App Service Settings

In your Azure Web App (tds-des-mod-uk), add these Application Settings:

1. Go to Azure Portal → Your Web App → Configuration → Application settings
2. Add:
   - `SUPABASE_URL` = `https://ybqrysjtwynuzuqggtfs.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key`
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = `https://tds-des-mod-uk.azurewebsites.net`

3. Save changes

### Deployment via GitHub Actions

The `.github/workflows/main_tds-des-mod-uk.yml` workflow will:
1. Build the React frontend
2. Copy build to `azure-backend/public/`
3. Build the Node.js backend
4. Deploy everything to Azure

Push to `main` branch to trigger deployment.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Register
- `POST /api/auth/logout` - Logout

### Entries
- `GET /api/entries` - List all (admin)
- `GET /api/entries/my` - User's entries
- `GET /api/entries/:id` - Get one entry
- `POST /api/entries` - Create entry
- `PATCH /api/entries/:id/status` - Update status (admin)

### Files
- `GET /api/entries/:id/files` - List files
- `POST /api/entries/:id/files` - Upload files
- `GET /api/entries/:id/files/:bucket/:filename` - Get file URL

### Users
- `GET /api/users` - List users (super admin)
- `PATCH /api/users/:userId/role` - Update role (super admin)

## Frontend Configuration

To use the Azure API, set in frontend `.env`:
```
VITE_API_BASE_URL=https://tds-des-mod-uk.azurewebsites.net
```

Without this variable, the app uses Supabase directly.
