# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open Prisma Studio GUI

# Scripts
npm run migrate-comments # Run comment migration script
```

## Architecture Overview

This is a **Next.js 15 CRM application** using App Router with the following stack:
- **Next.js 15.1.7** with TypeScript and Turbopack
- **Prisma ORM** with PostgreSQL (via Supabase)
- **Supabase** for auth and file storage
- **TanStack Query** for data fetching/caching
- **shadcn/ui + Radix UI** for components
- **Tailwind CSS** for styling

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── admin/         # Admin management (products, roles, countries)
│   │   ├── dashboard/     # Main dashboard
│   │   ├── leads/         # Lead management
│   │   ├── sales/         # Sales tracking
│   │   ├── reports/       # Analytics and reporting
│   │   └── tasks/         # Task management
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and hooks
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── supabase/         # Supabase client setup
└── types/                # TypeScript type definitions
```

### Key Architectural Patterns

1. **Authentication Flow**: Supabase Auth with middleware protection at `/src/middleware.ts`. The middleware checks user sessions, permissions, and enforces role-based access control.

2. **Data Fetching**: All data operations use TanStack Query hooks (e.g., `useLeads`, `useTasks`, `useProducts`) defined in `/src/lib/hooks/`. These hooks manage caching, invalidation, and optimistic updates.

3. **API Structure**: RESTful API routes under `/src/app/api/` follow a consistent pattern:
   - Standard response format: `{ success: boolean, data?: T, error?: string }`
   - Prisma for database operations
   - Session validation via `@/lib/server-auth`

4. **Permission System**: Hierarchical permission model with roles and user-specific permissions. The system supports:
   - Role-based permissions (stored in `roles` table)
   - User-specific overrides (stored in `user_permissions` table)
   - Scope-based access (own/team/all)

5. **CRM Entity Relationships**:
   - **Lead** → User (assignedTo), Product, LeadStatus, LeadSource
   - **Lead** → Quotation → Reservation → Sale (sales pipeline)
   - **Task** → Lead, User (task assignment)
   - **Product** → Brand, Model, BusinessType, Country

## Development Guidelines

### Component Development
- **Check existing components first** in `/src/components` before creating new ones
- Use **shadcn/ui** components as base, customize as needed
- Follow atomic design: atoms → molecules → organisms
- Prefer **React Server Components** where possible

### State Management
- Use **TanStack Query** for server state
- Use **Zustand** for client state (see `/src/store/userStore.ts`)
- Implement **optimistic updates** for better UX

### Form Handling
- Use **react-hook-form** with **Zod** validation
- Implement auto-save for complex forms
- Show immediate feedback (toasts, loading states)

### Error Handling
- Always return structured API responses
- Use user-friendly error messages
- Implement graceful degradation
- Add proper loading/skeleton states

### Database Operations
- Use **Prisma transactions** for multi-table operations
- Include audit fields (updatedAt, updatedBy)
- Validate entity relationships
- Maintain referential integrity

### File Uploads
- Use **Supabase Storage**
- Path structure: `{bucket}/{entityType}/{entityId}/{filename}`
- Validate file types and sizes

## Environment Variables

Required environment variables:
```
DATABASE_URL=           # PostgreSQL connection string
DIRECT_URL=            # Direct database URL (for migrations)
NEXTAUTH_URL=          # NextAuth URL
NEXTAUTH_SECRET=       # NextAuth secret
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
```

## Testing & Validation

Before committing changes:
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure production build works
3. Test the feature locally with different user roles
4. Verify database migrations if schema changed