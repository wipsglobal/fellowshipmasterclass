# Fellowship Masterclass Management System

A comprehensive web application for managing fellowship applications, payments, document uploads, and administrative workflows for the IBAKM Fellowship Masterclass program.

## Features

### For Applicants
- User registration and authentication
- Multi-step application form with validation
- Document upload to Cloudinary
- Secure payment processing via Paystack
- Real-time application status tracking
- Email notifications for application updates
- Document viewing and downloading

### For Administrators
- Admin dashboard with application overview
- Application review and approval workflow
- Document verification interface
- Payment management and verification
- Cohort and track management
- Fee configuration
- Email notifications to applicants
- Comprehensive search and filtering

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **tRPC** for type-safe API calls
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **tRPC** for API routing
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **JWT** for authentication

### Services & Integrations
- **Cloudinary** - File storage and management
- **Paystack** - Payment processing
- **Nodemailer** - Email notifications
- **Custom SMTP** - Domain email sending

## Project Structure

```
fellowship_masterclass/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts (Theme, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and configurations
│   └── public/              # Static assets
├── server/                   # Backend application
│   ├── _core/               # Core server utilities
│   ├── services/            # External service integrations
│   │   ├── cloudinary.ts   # File upload service
│   │   ├── email.ts        # Email notification service
│   │   └── paystack.ts     # Payment service
│   ├── db.ts                # Database operations
│   └── routers.ts           # API route definitions
├── drizzle/                 # Database schema and migrations
│   ├── schema.ts           # Database schema definition
│   └── migrations/         # Migration files
├── shared/                  # Shared types and constants
└── .env.local              # Environment configuration

```

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- Cloudinary account
- Paystack account
- SMTP email server

### Installation

1. **Clone the repository**
   ```bash
   cd fellowship_masterclass
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create or update `.env.local` with:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # Authentication
   JWT_SECRET=your-secure-jwt-secret

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Paystack
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_SECRET_KEY=sk_test_xxxxx

   # Email (SMTP)
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=465
   SMTP_USER=your-email@domain.com
   SMTP_PASSWORD=your-password
   EMAIL_FROM=your-email@domain.com
   ```

4. **Setup database**
   ```bash
   pnpm db:push
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Usage

### For Users
1. Navigate to the homepage
2. Sign up for an account
3. Complete the application form
4. Upload required documents
5. Make payment via Paystack
6. Track application status from dashboard

### For Admins
1. Login at `/admin/login`
2. Review submitted applications
3. Verify documents and payments
4. Approve or decline applications
5. Manage cohorts and tracks

## Key Files

### Configuration
- `drizzle.config.ts` - Database configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables

### Core Application Files
- `server/routers.ts` - API endpoints
- `server/db.ts` - Database operations
- `drizzle/schema.ts` - Database schema
- `client/src/App.tsx` - Main app component

### Services
- `server/services/cloudinary.ts` - File uploads
- `server/services/paystack.ts` - Payment processing
- `server/services/email.ts` - Email notifications

## Database Schema

Main tables:
- `users` - User accounts (applicants and admins)
- `applications` - Fellowship applications
- `cohorts` - Program cohorts
- `tracks` - Fellowship tracks
- `supporting_documents` - Uploaded documents
- `payments` - Payment records
- `fee_configuration` - Fee settings

## API Routes

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Applications
- `POST /applications/create` - Create application
- `GET /applications/list` - List user applications
- `GET /applications/details/:id` - Get application details
- `POST /applications/submit` - Submit application

### Admin
- `GET /applications/adminList` - List all applications
- `POST /applications/review` - Review application
- `POST /applications/updateStatus` - Update status

### Payments
- `POST /payments/initialize` - Initialize payment
- `GET /payments/verify/:reference` - Verify payment

## Email Notifications

The system sends automated emails for:
- Application submission confirmation
- Application under review
- Application approved (with cohort details)
- Application rejected
- Payment confirmation

All emails use professional HTML templates with the IBAKM logo and branding.

## File Management

Documents are stored on Cloudinary with:
- Automatic file type detection
- Secure URL generation
- Download with `fl_attachment` flag
- Organized in `fellowship-applications/` folder

## Security Features

- JWT-based authentication
- Role-based access control (user/admin)
- Password hashing
- Protected routes
- Secure payment processing
- File upload validation

## Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio

### Code Style
- TypeScript for type safety
- ESLint and Prettier for formatting
- Component-based architecture
- tRPC for end-to-end type safety

## Documentation

- `QUICK_START.md` - Quick setup guide
- `ADMIN_GUIDE.md` - Admin panel documentation
- `ADMIN_FEATURES.md` - Admin features overview
- `userGuide.md` - User guide for applicants

## Support

For technical issues or questions, please contact the fellowship office.

## License

Proprietary - IBAKM Global
