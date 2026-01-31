# Project Management App - Backend

RESTful API server for project management application built with Express.js, PostgreSQL (Neon), and Prisma ORM. Provides comprehensive workspace, project, and task management with webhook integrations.

## Tech Stack

- Node.js - Runtime Environment
- Express.js - Web Framework
- PostgreSQL (Neon) - Database
- Prisma - ORM
- Clerk - Authentication & Webhook Handler
- Inngest - Background Jobs & Event Processing
- Nodemailer - Email Service

## Features

- Clerk authentication integration
- Workspace management with multi-tenancy
- Project and task CRUD operations
- Member invitation and role management
- Automated email notifications
- Real-time sync with Clerk webhooks
- Background job processing with Inngest

## Project Structure
```
project-management-backend/
├── src/
│   ├── controllers/    # Request handlers and business logic
│   ├── inngest/        # Inngest client and background functions
│   ├── lib/            # Utilities (Prisma client, Nodemailer, etc.)
│   ├── middlewares/    # Express middlewares (auth, error handling)
│   ├── routes/         # API route definitions
│   └── server.js       # Application entry point
├── prisma/
│   └── schema.prisma   # Database schema
└── package.json
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (Neon recommended)
- pnpm

## Environment Variables

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Email (Nodemailer)
EMAIL_SENDER=your_email@gmail.com
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Server
PORT=3000
NODE_ENV=development
```

## Installation
```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm dlx prisma generate

# Run database migrations
pnpm dlx prisma migrate dev

# Seed database (optional)
pnpm dlx prisma db seed

# Start development server
pnpm dev

# Start production server
pnpm start
```

## Database Schema

The application uses Prisma with the following main models:

- User - User accounts
- Workspace - Organizations/workspaces
- WorkspaceMember - Workspace membership with roles
- Project - Projects within workspaces
- Task - Tasks within projects
- Comment - Task comments

### Prisma schema (prisma/schema.prisma)
```prisma
enum WorkspaceRole {
    ADMIN
    MEMBER
}

enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
}

enum TaskType {
    TASK
    BUG
    FEATURE
    IMPROVEMENT
    OTHER
}

enum ProjectStatus {
    ACTIVE
    PLANNING
    COMPLETED
    ON_HOLD
    CANCELLED
}

enum Priority {
    LOW
    MEDIUM
    HIGH
}

model User {
    id        String   @id
    name      String
    email     String   @unique
    image     String   @default("")
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    workspaces      WorkspaceMember[]
    projects        Project[]         @relation("ProjectOwner")
    tasks           Task[]            @relation("TaskAssignee")
    comments        Comment[]
    ownedWorkspaces Workspace[]
    ProjectMember   ProjectMember[]
}

model Workspace {
    id          String   @id
    name        String
    slug        String   @unique
    description String?
    settings    Json     @default("{}")
    ownerId     String
    createdAt   DateTime @default(now())
    image_url   String   @default("")
    updatedAt   DateTime @updatedAt

    members  WorkspaceMember[]
    projects Project[]
    owner    User              @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}

model WorkspaceMember {
    id          String        @id @default(uuid())
    userId      String
    workspaceId String
    message     String        @default("")
    role        WorkspaceRole @default(MEMBER)
    user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
    workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

    @@unique([userId, workspaceId])
}

model Project {
    id          String        @id @default(uuid())
    name        String
    description String?
    priority    Priority      @default(MEDIUM)
    status      ProjectStatus @default(ACTIVE)
    start_date  DateTime?
    end_date    DateTime?
    team_lead   String
    workspaceId String
    progress    Int           @default(0)
    createdAt   DateTime      @default(now())
    updatedAt   DateTime      @updatedAt
    members     ProjectMember[]

    owner     User      @relation("ProjectOwner", fields: [team_lead], references: [id], onDelete: Cascade)
    workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
    tasks     Task[]
}

model ProjectMember {
    id        String  @id @default(uuid())
    userId    String
    projectId String
    user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

    @@unique([userId, projectId])
}

model Task {
    id          String     @id @default(uuid())
    projectId   String
    title       String
    description String?
    status      TaskStatus @default(TODO)
    type        TaskType   @default(TASK)
    priority    Priority   @default(MEDIUM)
    assigneeId  String
    due_date    DateTime
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt

    project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
    assignee User    @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: Cascade)
    comments Comment[]
}

model Comment {
    id        String   @id @default(uuid())
    content   String
    userId    String
    taskId    String
    createdAt DateTime @default(now())

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)
    task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}
```

## Webhooks

### Clerk Webhooks
Handled via Inngest for:
- User creation/update/deletion
- Organization creation/update/deletion
- Organization membership changes

### Inngest Functions
- sync-user-from-clerk (clerk/user.created) — Upsert user on creation
- sync-user-update-from-clerk (clerk/user.updated) — Update user profile, email, and image
- sync-user-deletion-from-clerk (clerk/user.deleted) — Remove user record
- sync-workspace-from-clerk (clerk/organization.created) — Create workspace and owner membership
- sync-workspace-update-from-clerk (clerk/organization.updated) — Update workspace details
- sync-workspace-deletion-from-clerk (clerk/organization.deleted) — Delete workspace
- sync-workspace-member-from-clerk (clerk/organizationInvitation.accepted) — Upsert membership with role mapping
- send-task-assignment-email (app/task.assigned) — Send assignment email and schedule due-date reminder

## Available Scripts
```bash
pnpm dev                   # Start development server with nodemon
pnpm start                 # Start production server
pnpm migrate               # Run database migrations
pnpm seed                  # Seed database
pnpm dlx prisma studio     # Open Prisma Studio (database GUI)
```