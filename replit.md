# Briefly - Project Brief Management Platform

## Overview

Briefly is an MVP marketplace platform for managing project briefs and freelancer offers. The application enables clients to create project specifications (ТЗ), generate shareable public links, and receive proposals from freelancers. Freelancers can access project briefs via public tokens and submit their offers without requiring authentication.

**Core Features:**
- Simple username-based authentication (no password required for MVP)
- Project creation with detailed specifications (title, description, budget, deadline, criteria)
- Public shareable links for projects via unique tokens
- Offer submission system for freelancers
- Dashboard for viewing projects and received offers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state and caching
- **Forms:** React Hook Form with Zod validation via @hookform/resolvers
- **UI Components:** Shadcn/UI component library (New York style) with Radix UI primitives
- **Styling:** Tailwind CSS with CSS custom properties for theming
- **Build Tool:** Vite with React plugin

### Backend Architecture
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript with tsx for development execution
- **API Design:** RESTful endpoints defined in shared route contracts (`shared/routes.ts`)
- **Session Management:** express-session with MemoryStore (development) or connect-pg-simple (production)
- **Validation:** Zod schemas shared between client and server

### Data Storage
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location:** `shared/schema.ts` contains all table definitions
- **Migrations:** Drizzle Kit with `db:push` command for schema synchronization

### Authentication
- Username-only authentication flow (MVP simplification - no password)
- Session-based authentication stored in cookies
- Protected routes middleware checks `req.session.userId`
- Public project access via unique tokens without authentication

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks (auth, projects, offers)
│       ├── pages/        # Route page components
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API contract definitions
└── migrations/       # Database migrations
```

### Key Design Patterns
- **Shared API Contracts:** Route definitions with input/output schemas in `shared/routes.ts` ensure type safety across client and server
- **Storage Interface:** `IStorage` interface abstracts database operations, implemented by `DatabaseStorage` class
- **Path Aliasing:** TypeScript paths configured for clean imports (`@/` for client, `@shared/` for shared)

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling with node-postgres (`pg`)

### Third-Party Packages
- **nanoid:** Generates unique public tokens for shareable project links
- **date-fns:** Date formatting for user-friendly timestamps
- **class-variance-authority:** Component variant management for Shadcn/UI

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (defaults to "dev-secret" in development)

### Development Tools
- Vite dev server with HMR
- Replit-specific plugins for development overlay and cartographer
- esbuild for production server bundling