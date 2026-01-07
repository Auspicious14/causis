# Vercel Deployment Guide

## Important Notes for Serverless Deployment

### Database Considerations

⚠️ **SQLite is not suitable for Vercel serverless deployments** because:

- Vercel's filesystem is read-only and ephemeral
- Each serverless function invocation may run on a different instance
- Data will be lost between deployments

### Recommended Solutions:

1. **Vercel Postgres** (Recommended for production)

   ```bash
   npm install @vercel/postgres
   ```

   Update `app.module.ts` to use Vercel Postgres instead of SQLite.

2. **PlanetScale** (MySQL-compatible serverless database)

   ```bash
   npm install mysql2
   ```

   Update TypeORM config to use MySQL.

3. **Supabase** (PostgreSQL with additional features)

   ```bash
   npm install pg
   ```

   Update TypeORM config to use PostgreSQL.

4. **MongoDB Atlas** (NoSQL option)
   ```bash
   npm install @nestjs/mongoose mongoose
   ```
   Switch from TypeORM to Mongoose.

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Set Environment Variables in Vercel

Go to your Vercel project settings and add:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `NODE_ENV`: production
- Database connection variables (depending on your choice above)

### 5. Deploy to Vercel

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

## Configuration Files

- **vercel.json**: Vercel deployment configuration
- **api/serverless.ts**: Serverless function handler that wraps the NestJS app
- **.vercelignore**: Files to exclude from deployment

## Local Development

Continue using the standard NestJS development workflow:

```bash
npm run start:dev
```

## API Routes

After deployment, your API will be available at:

```
https://your-project.vercel.app/api/analysis
```

All routes will be prefixed with `/api` as configured in `vercel.json`.

## CORS Configuration

The application is configured to allow all origins in production. If you need to restrict this, update the CORS configuration in `src/main.ts`.

## Troubleshooting

### Cold Starts

Serverless functions may experience cold starts. The serverless handler includes caching to minimize this impact.

### File Uploads

If your application handles file uploads, consider using:

- Vercel Blob Storage
- AWS S3
- Cloudinary
- Other cloud storage services

### Database Connection Pooling

Ensure your database solution supports connection pooling for serverless environments to avoid connection exhaustion.
