# AI Planner - Smart Study Planning

AI Planner is a Next.js application that helps college students organize their academic responsibilities by uploading syllabi and personal schedules, then generating smart, personalized study plans with calendar integration and email reminders.

## Features

### ✅ Completed (MVP)

- **User Authentication**: Google OAuth2 integration with NextAuth.js
- **File Upload**: Support for PDF, Word documents, and text files
- **AI Task Extraction**: OpenAI-powered parsing of syllabi to extract assignments, exams, and deadlines
- **Task Management**: Review, edit, and manage extracted tasks
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Database Integration**: PostgreSQL with Prisma ORM

### 🚧 In Progress

- **Calendar Integration**: Google Calendar API sync
- **Email Reminders**: SendGrid integration for task reminders
- **Dashboard**: Enhanced dashboard with analytics
- **Settings**: User preferences and account management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-3.5-turbo for content parsing
- **File Processing**: pdf-parse, mammoth (for Word docs)
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- OpenAI API key
- SendGrid API key (optional for MVP)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-planner
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_planner"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"

   # SendGrid (optional)
   SENDGRID_API_KEY="your-sendgrid-api-key"
   FROM_EMAIL="noreply@aiplanner.com"

   # Google Calendar API (optional)
   GOOGLE_CALENDAR_API_KEY="your-google-calendar-api-key"
   ```

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Create uploads directory**

   ```bash
   mkdir uploads
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai-planner/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth.js routes
│   │   │   ├── upload/        # File upload endpoint
│   │   │   └── tasks/         # Task management endpoints
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── upload/            # File upload page
│   │   └── tasks/             # Task management page
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   └── providers.tsx      # Context providers
│   └── lib/                   # Utility libraries
│       ├── auth.ts            # NextAuth configuration
│       ├── prisma.ts          # Prisma client
│       ├── openai.ts          # OpenAI integration
│       └── utils.ts           # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
├── uploads/                    # File upload directory
└── public/                     # Static assets
```

## Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **Upload**: File uploads and content
- **Task**: Extracted tasks and assignments
- **Calendar**: Calendar integrations
- **CalendarEvent**: Calendar events
- **Reminder**: Email reminders

## API Endpoints

### Authentication

- `POST /api/auth/signin/google` - Google OAuth sign-in
- `POST /api/auth/signout` - Sign out

### File Upload

- `POST /api/upload` - Upload and process files

### Tasks

- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

## How It Works

1. **Upload**: Users upload PDF or Word documents containing syllabi
2. **Parse**: AI extracts text content and identifies tasks, deadlines, and assignments
3. **Review**: Users can review, edit, and confirm extracted tasks
4. **Plan**: AI generates personalized study plans based on extracted tasks
5. **Sync**: Tasks are synced to Google Calendar (coming soon)
6. **Remind**: Email reminders are sent for upcoming tasks (coming soon)

## Development

### Running Tests

```bash
npm run test
```

### Database Management

```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@aiplanner.com or create an issue in the repository.

## Roadmap

### Phase 1 (Current MVP)

- ✅ Basic file upload and AI parsing
- ✅ Task management interface
- ✅ User authentication

### Phase 2 (Next)

- 🔄 Google Calendar integration
- 🔄 Email reminder system
- 🔄 Enhanced dashboard

### Phase 3 (Future)

- 📅 Advanced scheduling algorithms
- 📅 Mobile app
- 📅 Team collaboration features
- 📅 Integration with learning management systems
