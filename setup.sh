#!/bin/bash

echo "Setting up AI Planner for local development..."

# Create uploads directory
mkdir -p uploads

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up Google OAuth credentials:"
echo "   - Go to https://console.developers.google.com/"
echo "   - Create a new project or select existing"
echo "   - Enable Google+ API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add http://localhost:3000/api/auth/callback/google to authorized redirect URIs"
echo "   - Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"
echo ""
echo "2. (Optional) Set up OpenAI API key:"
echo "   - Get API key from https://platform.openai.com/api-keys"
echo "   - Update OPENAI_API_KEY in .env.local"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
