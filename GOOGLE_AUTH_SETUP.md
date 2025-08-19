# Google Authentication Setup Instructions

## Step 1: Create .env.local file

Create a `.env.local` file in the project root with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OpenAI Configuration (if not already set)
OPENAI_API_KEY=your-openai-api-key-here
```

## Step 2: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project
3. Enable the Google+ API or Google Identity API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen:
   - Choose "Internal" if this is for AES organization only
   - Fill in the required fields
   - Add your domain (@aes.ac.in) to authorized domains
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Empathy Interview Bot
   - Authorized redirect URIs: `http://localhost:3002/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

## Step 3: Copy Credentials

Copy the **Client ID** and **Client Secret** from Google Cloud Console and paste them into your `.env.local` file.

## Step 4: Generate NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Replace `your-secret-key-here-change-this-in-production` with the generated secret.

## Domain Restriction

The application is configured to only allow users with `@aes.ac.in` email addresses. This is enforced in:

- `src/app/api/auth/[...nextauth]/route.ts` - Server-side validation
- `src/app/page.tsx` - Client-side verification

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3002`
3. You should be redirected to the sign-in page
4. Click "Continue with Google"
5. Only @aes.ac.in emails will be allowed to access the application

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets in production
- Consider using Google Cloud IAM for additional security
- For production, set up proper domain verification with Google
