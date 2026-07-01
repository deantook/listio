# Listio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-user todo app with list/kanban views, drag-and-drop, search, tags, and dual theme (dark/light) using Next.js 15, Prisma, and shadcn/ui.

**Architecture:** Next.js App Router with REST API Routes (`/api/v1/*`). Server-side data access via Prisma + PostgreSQL. Client state via TanStack Query with optimistic updates. Drag-and-drop via @dnd-kit. Auth via NextAuth.js v5. Dual theme via next-themes + CSS variables.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, NextAuth v5, TanStack Query v5, @dnd-kit, shadcn/ui (base), Tailwind CSS v4, Zod, next-themes, pnpm.

---

## Phase 1: Project Scaffold

### Task 1: Scaffold Next.js project with shadcn/ui

**Files:**
- Create: `listio_web/` — entire project scaffold
- Modify: none

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/dean/code/listio && pnpm create next-app@latest listio_web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Expected: `listio_web/` directory created with `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`.

- [ ] **Step 2: Initialize shadcn/ui**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dlx shadcn@latest init --defaults
```

Expected: Creates `components.json` and `src/lib/utils.ts`. Installs `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.

- [ ] **Step 3: Resolve Tailwind v4 compat**

Since shadcn init with Tailwind v4 uses `@theme inline` blocks, verify `src/app/globals.css` has the shadcn base layer.

Read `src/app/globals.css` to confirm it has `@import "tailwindcss"` and `@theme inline` blocks.

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/ && git commit -m "chore: scaffold Next.js + shadcn/ui project"
```

---

### Task 2: Install project dependencies

**Files:**
- Modify: `listio_web/package.json`

- [ ] **Step 1: Install all required dependencies**

```bash
cd /Users/dean/code/listio/listio_web && pnpm add @prisma/client next-auth@beta @auth/prisma-adapter @tanstack/react-query @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities next-themes sonner zod date-fns
```

```bash
cd /Users/dean/code/listio/listio_web && pnpm add -D prisma @types/node
```

Expected: All packages added to `package.json` and `pnpm-lock.yaml`.

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/package.json listio_web/pnpm-lock.yaml && git commit -m "chore: install dependencies (Prisma, NextAuth, TanStack Query, dnd-kit, etc.)"
```

---

## Phase 2: Database & API Foundation

### Task 3: Create Prisma schema and migrate

**Files:**
- Create: `listio_web/prisma/schema.prisma`
- Create: `listio_web/.env`
- Create: `listio_web/src/lib/db.ts`

- [ ] **Step 1: Write Prisma schema**

```prisma
// listio_web/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  emailVerified DateTime?
  image     String?
  createdAt DateTime  @default(now())

  accounts  Account[]
  sessions  Session[]
  lists     List[]
  tags      Tag[]
  tokens    ApiToken[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model List {
  id        String   @id @default(cuid())
  name      String
  color     String?
  sortOrder Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId String
  user   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  TodoItem[]
}

model TodoItem {
  id        String    @id @default(cuid())
  title     String
  notes     String?
  status    Status    @default(TODO)
  priority  Priority  @default(NONE)
  dueDate   DateTime?
  sortOrder Float     @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  listId String
  list   List         @relation(fields: [listId], references: [id], onDelete: Cascade)
  tags   TodoItemTag[]
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  color     String?
  createdAt DateTime @default(now())

  userId String
  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  TodoItemTag[]

  @@unique([userId, name])
}

model TodoItemTag {
  itemId String
  tagId  String

  item TodoItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
}

model ApiToken {
  id        String   @id @default(cuid())
  name      String
  hash      String   @unique
  lastFour  String
  createdAt DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Status {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  NONE
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

- [ ] **Step 2: Set up environment variable**

```bash
# listio_web/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/listio"
AUTH_SECRET="your-auth-secret-change-in-production"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

Write the above to `listio_web/.env`.

- [ ] **Step 3: Run Prisma migration**

```bash
cd /Users/dean/code/listio/listio_web && pnpm prisma migrate dev --name init
```

Expected: Migration file created in `prisma/migrations/`, database tables created.

- [ ] **Step 4: Create Prisma client singleton**

```typescript
// listio_web/src/lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 5: Add .env to .gitignore**

```bash
echo "\n.env" >> listio_web/.gitignore
```

- [ ] **Step 6: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/prisma/ listio_web/.env listio_web/.gitignore listio_web/src/lib/db.ts && git commit -m "feat: add Prisma schema with full data model"
```

---

## Phase 3: Type System & Validation

### Task 4: Define shared types and Zod schemas

**Files:**
- Create: `listio_web/src/types/index.ts`
- Create: `listio_web/src/lib/validation.ts`

- [ ] **Step 1: Write TypeScript types**

```typescript
// listio_web/src/types/index.ts
export type ListWithCounts = {
  id: string
  name: string
  color: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  userId: string
  _count: {
    items: number
  }
  completedCount: number
}

export type TodoItemWithTags = {
  id: string
  title: string
  notes: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  listId: string
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

export type TagWithCount = {
  id: string
  name: string
  color: string | null
  createdAt: Date
  _count: { items: number }
}

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

export type ApiTokenResponse = {
  id: string
  name: string
  lastFour: string
  token: string // only returned on creation
  createdAt: Date
}

export type ApiTokenListItem = {
  id: string
  name: string
  lastFour: string
  createdAt: Date
}
```

- [ ] **Step 2: Write Zod validation schemas**

```typescript
// listio_web/src/lib/validation.ts
import { z } from "zod"

export const createListSchema = z.object({
  name: z.string().min(1, "列表名不能为空").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "无效的颜色值").nullable().optional(),
})

export const updateListSchema = createListSchema.partial().extend({
  sortOrder: z.number().optional(),
})

export const reorderListsSchema = z.object({
  ids: z.array(z.string()),
})

export const createItemSchema = z.object({
  title: z.string().min(1, "任务标题不能为空").max(500),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  sortOrder: z.number().optional(),
})

export const updateItemSchema = createItemSchema.partial()

export const updateItemStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
})

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
    listId: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  })),
})

export const createTagSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "无效的颜色值").nullable().optional(),
})

export const updateTagSchema = createTagSchema.partial()

export const createTokenSchema = z.object({
  name: z.string().min(1, "Token 名称不能为空").max(100),
})

export const bindTagSchema = z.object({
  tagId: z.string(),
})
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/types/ listio_web/src/lib/validation.ts && git commit -m "feat: add shared types and Zod validation schemas"
```

---

## Phase 4: Authentication

### Task 5: Set up NextAuth.js

**Files:**
- Create: `listio_web/src/lib/auth.ts`
- Create: `listio_web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `listio_web/src/app/login/page.tsx`

- [ ] **Step 1: Write NextAuth configuration**

```typescript
// listio_web/src/lib/auth.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
```

- [ ] **Step 2: Create Auth API route handler**

```typescript
// listio_web/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 3: Write login page**

```typescript
// listio_web/src/app/login/page.tsx
import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Listio
          </h1>
          <p className="text-sm text-muted-foreground">
            登录以管理你的待办事项
          </p>
        </div>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/app" })
          }}
        >
          <Button type="submit" className="w-full" variant="secondary">
            <Github className="mr-2 size-4" />
            使用 GitHub 登录
          </Button>
        </form>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/app" })
          }}
        >
          <Button type="submit" className="w-full" variant="secondary">
            <svg className="mr-2 size-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登录
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify the login page renders**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dev
```

Open `http://localhost:3000/login` — should see login page with GitHub and Google buttons (buttons will redirect to real OAuth in production, or show error locally without credentials).

- [ ] **Step 5: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/lib/auth.ts listio_web/src/app/api/auth/ listio_web/src/app/login/ && git commit -m "feat: add NextAuth.js with GitHub/Google providers and login page"
```

---

### Task 6: Add middleware for route protection

**Files:**
- Create: `listio_web/src/middleware.ts`

- [ ] **Step 1: Write middleware**

```typescript
// listio_web/src/middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAppRoute = req.nextUrl.pathname.startsWith("/app")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/v1")
  const isLoginPage = req.nextUrl.pathname === "/login"

  if (!isLoggedIn && (isAppRoute || isApiRoute)) {
    const loginUrl = new URL("/login", req.url)
    if (isAppRoute) {
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/app/:path*", "/api/v1/:path*", "/login"],
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/middleware.ts && git commit -m "feat: add auth middleware for route protection"
```

---

## Phase 5: Theme System

### Task 7: Configure dual theme CSS and ThemeProvider

**Files:**
- Modify: `listio_web/src/app/globals.css`
- Create: `listio_web/src/components/theme-provider.tsx`
- Create: `listio_web/src/components/theme-toggle.tsx`

- [ ] **Step 1: Replace globals.css with dual-theme CSS**

Read current `listio_web/src/app/globals.css`, then replace its content with:

```css
/* listio_web/src/app/globals.css */
@import "tailwindcss";

@theme inline {
  --radius: 0.5rem;

  /* Dark theme (default) — Linear design system */
  --color-background: hsl(222 20% 0.4%);
  --color-foreground: hsl(225 14% 97%);
  --color-card: hsl(210 5% 6%);
  --color-card-foreground: hsl(225 14% 97%);
  --color-popover: hsl(220 5% 10%);
  --color-popover-foreground: hsl(225 14% 97%);
  --color-primary: hsl(234 58% 62%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(210 5% 8%);
  --color-secondary-foreground: hsl(225 14% 97%);
  --color-muted: hsl(210 3% 10%);
  --color-muted-foreground: hsl(220 10% 56%);
  --color-accent: hsl(234 58% 60%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 62% 50%);
  --color-destructive-foreground: hsl(0 0% 100%);
  --color-border: hsl(225 9% 16%);
  --color-input: hsl(225 9% 16%);
  --color-ring: hsl(234 56% 61%);

  --font-sans: "Inter", "SF Pro Display", -apple-system, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, monospace;
}

.dark {
  --color-background: hsl(222 20% 0.4%);
  --color-foreground: hsl(225 14% 97%);
  --color-card: hsl(210 5% 6%);
  --color-card-foreground: hsl(225 14% 97%);
  --color-popover: hsl(220 5% 10%);
  --color-popover-foreground: hsl(225 14% 97%);
  --color-primary: hsl(234 58% 62%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(210 5% 8%);
  --color-secondary-foreground: hsl(225 14% 97%);
  --color-muted: hsl(210 3% 10%);
  --color-muted-foreground: hsl(220 10% 56%);
  --color-accent: hsl(234 58% 60%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 62% 50%);
  --color-destructive-foreground: hsl(0 0% 100%);
  --color-border: hsl(225 9% 16%);
  --color-input: hsl(225 9% 16%);
  --color-ring: hsl(234 56% 61%);
}

.light {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 10%);
  --color-card: hsl(210 5% 96%);
  --color-card-foreground: hsl(0 0% 10%);
  --color-popover: hsl(210 20% 99%);
  --color-popover-foreground: hsl(0 0% 10%);
  --color-primary: hsl(234 58% 62%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(220 7% 97%);
  --color-secondary-foreground: hsl(0 0% 10%);
  --color-muted: hsl(220 7% 97%);
  --color-muted-foreground: hsl(220 8% 46%);
  --color-accent: hsl(234 58% 60%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 72% 51%);
  --color-destructive-foreground: hsl(0 0% 100%);
  --color-border: hsl(240 5% 89%);
  --color-input: hsl(240 5% 89%);
  --color-ring: hsl(234 56% 61%);
}
```

- [ ] **Step 2: Write ThemeProvider wrapper**

```tsx
// listio_web/src/components/theme-provider.tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 3: Write ThemeToggle button**

```tsx
// listio_web/src/components/theme-toggle.tsx
"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" />
          亮色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" />
          暗色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 size-4" />
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: Add shadcn DropdownMenu component if not installed**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dlx shadcn@latest add dropdown-menu
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/globals.css listio_web/src/components/theme-provider.tsx listio_web/src/components/theme-toggle.tsx listio_web/src/components/ui/dropdown-menu.tsx && git commit -m "feat: add dual theme (dark/light) with next-themes"
```

---

## Phase 6: Root Layout & App Shell

### Task 8: Create RootLayout with all providers

**Files:**
- Modify: `listio_web/src/app/layout.tsx`

- [ ] **Step 1: Write RootLayout**

```tsx
// listio_web/src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Listio",
  description: "多用户待办管理系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create Providers wrapper (TanStack Query)**

```tsx
// listio_web/src/components/providers.tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 3: Add sonner Toaster component**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dlx shadcn@latest add sonner
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/layout.tsx listio_web/src/components/providers.tsx listio_web/src/components/ui/sonner.tsx && git commit -m "feat: add RootLayout with ThemeProvider, TanStack Query, and Toaster"
```

---

### Task 9: Create AppShell layout (authenticated)

**Files:**
- Create: `listio_web/src/app/app/layout.tsx`
- Create: `listio_web/src/components/sidebar.tsx`
- Modify: `listio_web/src/app/page.tsx`

- [ ] **Step 1: Write AppShell layout**

```tsx
// listio_web/src/app/app/layout.tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write Sidebar component (placeholder, will be fully wired later)**

```tsx
// listio_web/src/components/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Plus, Tag, Settings, LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"
import type { ListWithCounts } from "@/types"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { User as AuthUser } from "next-auth"

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()

  const { data: lists = [] } = useQuery({
    queryKey: ["lists"],
    queryFn: () => api.get<ListWithCounts[]>("/api/v1/lists"),
  })

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* User info */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name || user.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">列表</span>
        </div>
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/app/lists/${list.id}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
              pathname.startsWith(`/app/lists/${list.id}`)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            )}
          >
            {list.color && (
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: list.color }}
              />
            )}
            <span className="flex-1 truncate">{list.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {list._count.items}
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border p-2 space-y-1">
        <Link
          href="/app/tags"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
            pathname === "/app/tags" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Tag className="size-4" />
          标签管理
        </Link>
        <Link
          href="/app/settings"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
            pathname === "/app/settings" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Settings className="size-4" />
          设置
        </Link>
        <div className="flex items-center justify-between rounded-md px-2 py-1">
          <span className="text-sm text-muted-foreground">主题</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create client API helper**

```typescript
// listio_web/src/lib/api.ts
class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: "请求失败" } }))
      throw new Error(error.error?.message || `HTTP ${res.status}`)
    }

    return res.json()
  }

  get<T>(url: string) {
    return this.request<T>(url)
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(url: string) {
    return this.request<T>(url, { method: "DELETE" })
  }
}

export const api = new ApiClient()
```

- [ ] **Step 4: Update root page to redirect**

```tsx
// listio_web/src/app/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    redirect("/app")
  }
  redirect("/login")
}
```

- [ ] **Step 5: Verify the AppShell renders**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dev
```

Expected: Visiting `/` redirects to `/login` (unauthenticated) or `/app` (authenticated).

- [ ] **Step 6: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/app/ listio_web/src/app/page.tsx listio_web/src/components/sidebar.tsx listio_web/src/lib/api.ts && git commit -m "feat: add AppShell layout with sidebar navigation"
```

---

## Phase 7: REST API Routes

### Task 10: Create API error handling and auth helpers

**Files:**
- Create: `listio_web/src/lib/api-helpers.ts`

- [ ] **Step 1: Write API helper utilities**

```typescript
// listio_web/src/lib/api-helpers.ts
import { NextResponse } from "next/server"
import { auth } from "./auth"
import { ZodError } from "zod"
import { db } from "./db"

export type ApiContext = {
  params: Promise<Record<string, string>>
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError("VALIDATION", err.errors.map(e => e.message).join("; "), 422)
  }
  console.error(err)
  return apiError("INTERNAL", "服务器内部错误", 500)
}

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
  return session.user
}

export async function requireAuth() {
  const user = await getAuthUser()
  return user
}

export async function verifyTokenAuth(request: Request) {
  // Check session first
  const session = await auth()
  if (session?.user?.id) {
    return session.user
  }

  // Check Bearer token
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const { createHash } = await import("crypto")
    const hash = createHash("sha256").update(token).digest("hex")

    const apiToken = await db.apiToken.findUnique({ where: { hash } })
    if (apiToken) {
      const user = await db.user.findUnique({ where: { id: apiToken.userId } })
      if (user) {
        return { id: user.id, email: user.email, name: user.name }
      }
    }
  }

  throw new Error("UNAUTHORIZED")
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/lib/api-helpers.ts && git commit -m "feat: add API error handling and auth helpers"
```

---

### Task 11: Lists API

**Files:**
- Create: `listio_web/src/app/api/v1/lists/route.ts`
- Create: `listio_web/src/app/api/v1/lists/reorder/route.ts`
- Create: `listio_web/src/app/api/v1/lists/[id]/route.ts`

- [ ] **Step 1: GET + POST /api/v1/lists**

```typescript
// listio_web/src/app/api/v1/lists/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createListSchema } from "@/lib/validation"

export async function GET() {
  try {
    const user = await requireAuth()
    const lists = await db.list.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: true } },
        items: {
          where: { status: "DONE" },
          select: { id: true },
        },
      },
    })

    const result = lists.map(({ items, ...list }) => ({
      ...list,
      completedCount: items.length,
    }))

    return NextResponse.json(result)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createListSchema.parse(body)

    // Get max sortOrder for new list
    const lastList = await db.list.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "desc" },
    })

    const list = await db.list.create({
      data: {
        ...data,
        userId: user.id,
        sortOrder: (lastList?.sortOrder ?? 0) + 100,
      },
    })

    return NextResponse.json(list, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 2: PUT /api/v1/lists/reorder**

```typescript
// listio_web/src/app/api/v1/lists/reorder/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { reorderListsSchema } from "@/lib/validation"

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { ids } = reorderListsSchema.parse(body)

    await db.$transaction(
      ids.map((id, index) =>
        db.list.updateMany({
          where: { id, userId: user.id },
          data: { sortOrder: index * 100 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 3: PATCH + DELETE /api/v1/lists/[id]**

```typescript
// listio_web/src/app/api/v1/lists/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateListSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const data = updateListSchema.parse(body)

    const list = await db.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const updated = await db.list.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const list = await db.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    await db.list.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/api/v1/lists/ && git commit -m "feat: add Lists API (GET/POST/PATCH/DELETE/reorder)"
```

---

### Task 12: Items API

**Files:**
- Create: `listio_web/src/app/api/v1/lists/[id]/items/route.ts`
- Create: `listio_web/src/app/api/v1/items/[id]/route.ts`
- Create: `listio_web/src/app/api/v1/items/[id]/status/route.ts`
- Create: `listio_web/src/app/api/v1/items/reorder/route.ts`

- [ ] **Step 1: GET + POST /api/v1/lists/[id]/items**

```typescript
// listio_web/src/app/api/v1/lists/[id]/items/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { createItemSchema } from "@/lib/validation"

export async function GET(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: listId } = await context.params
    const { searchParams } = new URL(request.url)

    const list = await db.list.findUnique({ where: { id: listId } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const where: Record<string, unknown> = { listId }

    const status = searchParams.get("status")
    if (status) where.status = status

    const priority = searchParams.get("priority")
    if (priority) where.priority = priority

    const q = searchParams.get("q")
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    const tagFilter = searchParams.get("tag")
    if (tagFilter) {
      where.tags = { some: { tagId: tagFilter } }
    }

    const items = await db.todoItem.findMany({
      where: where as any,
      orderBy: { sortOrder: "asc" },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(items)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: listId } = await context.params
    const body = await request.json()
    const data = createItemSchema.parse(body)

    const list = await db.list.findUnique({ where: { id: listId } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const lastItem = await db.todoItem.findFirst({
      where: { listId },
      orderBy: { sortOrder: "desc" },
    })

    const item = await db.todoItem.create({
      data: {
        ...data,
        listId,
        sortOrder: data.sortOrder ?? (lastItem?.sortOrder ?? 0) + 100,
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 2: PATCH + DELETE /api/v1/items/[id]**

```typescript
// listio_web/src/app/api/v1/items/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateItemSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const data = updateItemSchema.parse(body)

    const item = await db.todoItem.findUnique({
      where: { id },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    const updated = await db.todoItem.update({
      where: { id },
      data,
      include: { tags: { include: { tag: true } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const item = await db.todoItem.findUnique({
      where: { id },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    await db.todoItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 3: PATCH /api/v1/items/[id]/status (quick status change)**

```typescript
// listio_web/src/app/api/v1/items/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateItemStatusSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const { status } = updateItemStatusSchema.parse(body)

    const item = await db.todoItem.findUnique({
      where: { id },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    const updated = await db.todoItem.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 4: PUT /api/v1/items/reorder**

```typescript
// listio_web/src/app/api/v1/items/reorder/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { reorderItemsSchema } from "@/lib/validation"

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { items } = reorderItemsSchema.parse(body)

    await db.$transaction(
      items.map(({ id, sortOrder, status, listId }) => {
        const data: Record<string, unknown> = { sortOrder }
        if (status) data.status = status
        if (listId) data.listId = listId
        return db.todoItem.updateMany({
          where: { id, list: { userId: user.id } },
          data,
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/api/v1/lists/ listio_web/src/app/api/v1/items/ && git commit -m "feat: add Items API (CRUD, status, reorder)"
```

---

### Task 13: Tags and Tokens API

**Files:**
- Create: `listio_web/src/app/api/v1/tags/route.ts`
- Create: `listio_web/src/app/api/v1/tags/[id]/route.ts`
- Create: `listio_web/src/app/api/v1/items/[id]/tags/route.ts`
- Create: `listio_web/src/app/api/v1/items/[id]/tags/[tagId]/route.ts`
- Create: `listio_web/src/app/api/v1/search/route.ts`

- [ ] **Step 1: GET + POST /api/v1/tags**

```typescript
// listio_web/src/app/api/v1/tags/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createTagSchema } from "@/lib/validation"

export async function GET() {
  try {
    const user = await requireAuth()
    const tags = await db.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    })
    return NextResponse.json(tags)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createTagSchema.parse(body)

    const existing = await db.tag.findUnique({
      where: { userId_name: { userId: user.id, name: data.name } },
    })
    if (existing) {
      return apiError("CONFLICT", "标签名已存在", 409)
    }

    const tag = await db.tag.create({
      data: { ...data, userId: user.id },
    })
    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 2: PATCH + DELETE /api/v1/tags/[id]**

```typescript
// listio_web/src/app/api/v1/tags/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateTagSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const data = updateTagSchema.parse(body)

    const tag = await db.tag.findUnique({ where: { id } })
    if (!tag || tag.userId !== user.id) {
      return apiError("NOT_FOUND", "标签不存在", 404)
    }

    const updated = await db.tag.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const tag = await db.tag.findUnique({ where: { id } })
    if (!tag || tag.userId !== user.id) {
      return apiError("NOT_FOUND", "标签不存在", 404)
    }

    await db.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 3: POST + DELETE tag bindings**

```typescript
// listio_web/src/app/api/v1/items/[id]/tags/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { bindTagSchema } from "@/lib/validation"

export async function POST(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: itemId } = await context.params
    const body = await request.json()
    const { tagId } = bindTagSchema.parse(body)

    const item = await db.todoItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    const tag = await db.tag.findUnique({ where: { id: tagId } })
    if (!tag || tag.userId !== user.id) {
      return apiError("NOT_FOUND", "标签不存在", 404)
    }

    await db.todoItemTag.create({
      data: { itemId, tagId },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

```typescript
// listio_web/src/app/api/v1/items/[id]/tags/[tagId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: itemId, tagId } = await context.params

    const item = await db.todoItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    await db.todoItemTag.delete({
      where: { itemId_tagId: { itemId, tagId } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 4: Search API + Token API**

```typescript
// listio_web/src/app/api/v1/search/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const q = searchParams.get("q") || ""
    const listId = searchParams.get("listId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const due = searchParams.get("due")

    const where: Record<string, unknown> = {
      list: { userId: user.id },
    }

    if (listId) where.listId = listId
    if (status) where.status = status
    if (priority) where.priority = priority

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    if (due) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (due === "overdue") {
        where.dueDate = { lt: now }
      } else if (due === "today") {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        where.dueDate = { gte: now, lt: tomorrow }
      } else if (due === "week") {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)
        where.dueDate = { gte: now, lt: weekEnd }
      }
    }

    const items = await db.todoItem.findMany({
      where: where as any,
      orderBy: { sortOrder: "asc" },
      include: {
        tags: { include: { tag: true } },
        list: { select: { id: true, name: true, color: true } },
      },
    })

    return NextResponse.json(items)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

```typescript
// listio_web/src/app/api/v1/tokens/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createTokenSchema } from "@/lib/validation"
import { randomBytes, createHash } from "crypto"

export async function GET() {
  try {
    const user = await requireAuth()
    const tokens = await db.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastFour: true, createdAt: true },
    })
    return NextResponse.json(tokens)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name } = createTokenSchema.parse(body)

    const rawToken = `lst_${randomBytes(32).toString("hex")}`
    const hash = createHash("sha256").update(rawToken).digest("hex")

    const token = await db.apiToken.create({
      data: {
        name,
        hash,
        lastFour: rawToken.slice(-4),
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        id: token.id,
        name: token.name,
        lastFour: token.lastFour,
        token: rawToken,
        createdAt: token.createdAt,
      },
      { status: 201 }
    )
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

```typescript
// listio_web/src/app/api/v1/tokens/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const token = await db.apiToken.findUnique({ where: { id } })
    if (!token || token.userId !== user.id) {
      return apiError("NOT_FOUND", "Token 不存在", 404)
    }

    await db.apiToken.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/api/v1/tags/ listio_web/src/app/api/v1/items/ listio_web/src/app/api/v1/search/ listio_web/src/app/api/v1/tokens/ && git commit -m "feat: add Tags, Tokens, and Search API routes"
```

---

## Phase 8: Core UI Components

### Task 14: Add required shadcn components

**Files:**
- Create: Multiple files in `listio_web/src/components/ui/`

- [ ] **Step 1: Install all needed shadcn components**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dlx shadcn@latest add button card input checkbox badge dialog alert-dialog select separator skeleton tooltip dropdown-menu
```

Expected: Components added to `src/components/ui/`.

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/ui/ && git commit -m "chore: add shadcn UI components (button, card, input, checkbox, badge, dialogs, select, skeleton, tooltip)"
```

---

### Task 15: Build TodoItemRow component

**Files:**
- Create: `listio_web/src/components/todo-item-row.tsx`
- Create: `listio_web/src/components/priority-badge.tsx`
- Create: `listio_web/src/components/tag-badge.tsx`

- [ ] **Step 1: Write PriorityBadge**

```tsx
// listio_web/src/components/priority-badge.tsx
import { Badge } from "@/components/ui/badge"
import type { Priority } from "@prisma/client"

const priorityConfig: Record<Priority, { label: string; className: string } | null> = {
  NONE: null,
  LOW: { label: "低", className: "border-muted-foreground/30 text-muted-foreground" },
  MEDIUM: { label: "中", className: "border-primary/50 text-primary" },
  HIGH: { label: "高", className: "border-amber-500/50 text-amber-400" },
  URGENT: { label: "紧急", className: "border-red-500/50 text-red-400" },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]
  if (!config) return null

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
```

- [ ] **Step 2: Write TagBadge**

```tsx
// listio_web/src/components/tag-badge.tsx
import { Badge } from "@/components/ui/badge"

export function TagBadge({
  name,
  color,
}: {
  name: string
  color: string | null
}) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {color && (
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {name}
    </Badge>
  )
}
```

- [ ] **Step 3: Write TodoItemRow**

```tsx
// listio_web/src/components/todo-item-row.tsx
"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PriorityBadge } from "./priority-badge"
import { TagBadge } from "./tag-badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TodoItemWithTags } from "@/types"

interface TodoItemRowProps {
  item: TodoItemWithTags
  onToggle: (id: string, current: string) => void
  onDelete: (id: string) => void
}

export function TodoItemRow({ item, onToggle, onDelete }: TodoItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2.5 transition-colors hover:border-border",
        isDragging && "z-50 border-border opacity-80 shadow-lg",
        item.status === "DONE" && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <Checkbox
        checked={item.status === "DONE"}
        onCheckedChange={() => onToggle(item.id, item.status)}
        className="rounded-full data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            item.status === "DONE"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {item.priority !== "NONE" && (
            <PriorityBadge priority={item.priority} />
          )}
          {item.tags.slice(0, 2).map(({ tag }) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {item.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{item.tags.length - 2}
            </span>
          )}
          {item.dueDate && (
            <span
              className={cn(
                "text-xs",
                isOverdue ? "text-red-400" : "text-muted-foreground"
              )}
            >
              {isOverdue ? "逾期: " : ""}
              {format(new Date(item.dueDate), "MM-dd")}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>修改优先级</DropdownMenuItem>
          <DropdownMenuItem>修改截止日</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(item.id)}
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/todo-item-row.tsx listio_web/src/components/priority-badge.tsx listio_web/src/components/tag-badge.tsx && git commit -m "feat: add TodoItemRow with drag handle, checkbox, priority/tag badges"
```

---

### Task 16: Build QuickAdd and FilterBar

**Files:**
- Create: `listio_web/src/components/quick-add.tsx`
- Create: `listio_web/src/components/filter-bar.tsx`

- [ ] **Step 1: Write QuickAddInput**

```tsx
// listio_web/src/components/quick-add.tsx
"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

export function QuickAdd({ listId }: { listId: string }) {
  const [title, setTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.post(`/api/v1/lists/${listId}/items`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      setTitle("")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "添加失败")
    },
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && title.trim()) {
        createMutation.mutate(title.trim())
      }
    },
    [title, createMutation]
  )

  return (
    <div className="px-4 py-3">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加任务，按 Enter 确认"
        className="bg-card"
        disabled={createMutation.isPending}
      />
    </div>
  )
}
```

- [ ] **Step 2: Write FilterBar**

```tsx
// listio_web/src/components/filter-bar.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  statusFilter: string
  priorityFilter: string
  searchQuery: string
  onStatusChange: (v: string) => void
  onPriorityChange: (v: string) => void
  onSearchChange: (v: string) => void
  onClear: () => void
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = statusFilter !== "ALL" || priorityFilter !== "ALL" || searchQuery !== ""

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索任务..."
        className="h-8 max-w-[200px] text-sm"
      />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[100px] text-sm">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">全部状态</SelectItem>
          <SelectItem value="TODO">待处理</SelectItem>
          <SelectItem value="IN_PROGRESS">进行中</SelectItem>
          <SelectItem value="DONE">已完成</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-[100px] text-sm">
          <SelectValue placeholder="优先级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">全部优先级</SelectItem>
          <SelectItem value="URGENT">紧急</SelectItem>
          <SelectItem value="HIGH">高</SelectItem>
          <SelectItem value="MEDIUM">中</SelectItem>
          <SelectItem value="LOW">低</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-xs">
          <X className="mr-1 size-3" />
          清除
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/quick-add.tsx listio_web/src/components/filter-bar.tsx && git commit -m "feat: add QuickAdd input and FilterBar components"
```

---

### Task 17: Build ListHeader and EmptyState

**Files:**
- Create: `listio_web/src/components/list-header.tsx`
- Create: `listio_web/src/components/empty-state.tsx`

- [ ] **Step 1: Write ListHeader**

```tsx
// listio_web/src/components/list-header.tsx
"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { List, LayoutKanban } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function ListHeader({ listName }: { listName: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "list"

  const handleViewChange = (value: string) => {
    if (!value) return
    const params = new URLSearchParams(searchParams)
    if (value === "list") {
      params.delete("view")
    } else {
      params.set("view", value)
    }
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <h1 className="text-lg font-semibold text-foreground">{listName}</h1>
      <ToggleGroup type="single" value={view} onValueChange={handleViewChange}>
        <ToggleGroupItem value="list" aria-label="列表视图" className="size-8 p-0">
          <List className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="board" aria-label="看板视图" className="size-8 p-0">
          <LayoutKanban className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

- [ ] **Step 2: Add ToggleGroup component**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dlx shadcn@latest add toggle-group
```

- [ ] **Step 3: Write EmptyState**

```tsx
// listio_web/src/components/empty-state.tsx
import { Button } from "@/components/ui/button"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/list-header.tsx listio_web/src/components/empty-state.tsx listio_web/src/components/ui/toggle-group.tsx listio_web/src/components/ui/toggle.tsx && git commit -m "feat: add ListHeader with list/kanban toggle and EmptyState component"
```

---

### Task 18: Build KanbanBoard

**Files:**
- Create: `listio_web/src/components/kanban-board.tsx`
- Create: `listio_web/src/components/kanban-column.tsx`
- Create: `listio_web/src/components/kanban-card.tsx`

- [ ] **Step 1: Write KanbanCard**

```tsx
// listio_web/src/components/kanban-card.tsx
"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PriorityBadge } from "./priority-badge"
import { TagBadge } from "./tag-badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TodoItemWithTags } from "@/types"

export function KanbanCard({ item }: { item: TodoItemWithTags }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { item } })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 text-sm active:cursor-grabbing",
        isDragging && "z-50 opacity-70 shadow-lg"
      )}
    >
      <p className="text-foreground">{item.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {item.priority !== "NONE" && (
          <PriorityBadge priority={item.priority} />
        )}
        {item.tags.slice(0, 2).map(({ tag }) => (
          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
        ))}
        {item.dueDate && (
          <span className={cn(
            "text-xs",
            isOverdue ? "text-red-400" : "text-muted-foreground"
          )}>
            {isOverdue ? "逾期: " : ""}
            {format(new Date(item.dueDate), "MM-dd")}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write KanbanColumn**

```tsx
// listio_web/src/components/kanban-column.tsx
"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"
import type { TodoItemWithTags } from "@/types"
import type { Status } from "@prisma/client"

const columnLabels: Record<Status, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
}

interface KanbanColumnProps {
  status: Status
  items: TodoItemWithTags[]
}

export function KanbanColumn({ status, items }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-medium text-foreground">
          {columnLabels[status]}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
```

- [ ] **Step 3: Write KanbanBoard**

```tsx
// listio_web/src/components/kanban-board.tsx
"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import type { TodoItemWithTags } from "@/types"
import type { Status } from "@prisma/client"

interface KanbanBoardProps {
  items: TodoItemWithTags[]
  onReorder: (items: { id: string; sortOrder: number; status?: string }[]) => void
}

export function KanbanBoard({ items, onReorder }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columns = {
    TODO: items.filter((i) => i.status === "TODO"),
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS"),
    DONE: items.filter((i) => i.status === "DONE"),
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine target status
    const activeItem = items.find((i) => i.id === activeId)
    const overItem = items.find((i) => i.id === overId)
    let targetStatus: Status | undefined

    if (overItem) {
      targetStatus = overItem.status
    } else {
      // Dropped on a column directly
      const statuses: Status[] = ["TODO", "IN_PROGRESS", "DONE"]
      targetStatus = statuses.find((s) => s === overId) as Status
    }

    if (!activeItem || !targetStatus) return

    const allItems = [...items]
    const activeIndex = allItems.findIndex((i) => i.id === activeId)

    // Remove active from current position
    allItems.splice(activeIndex, 1)

    // Update status
    const movedItem = { ...activeItem, status: targetStatus }

    // Find insertion point
    if (overItem) {
      const overIndex = allItems.findIndex((i) => i.id === overId)
      allItems.splice(overIndex, 0, movedItem)
    } else {
      allItems.push(movedItem)
    }

    // Assign sortOrders
    const reorderData = allItems.map((item, index) => ({
      id: item.id,
      sortOrder: index * 100,
      status: item.status,
    }))

    onReorder(reorderData)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {(["TODO", "IN_PROGRESS", "DONE"] as Status[]).map((status) => (
          <KanbanColumn key={status} status={status} items={columns[status]} />
        ))}
      </div>
    </DndContext>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/kanban-board.tsx listio_web/src/components/kanban-column.tsx listio_web/src/components/kanban-card.tsx && git commit -m "feat: add KanbanBoard with drag-and-drop columns and cards"
```

---

### Task 19: Build TodoListView

**Files:**
- Create: `listio_web/src/components/todo-list-view.tsx`

- [ ] **Step 1: Write TodoListView**

```tsx
// listio_web/src/components/todo-list-view.tsx
"use client"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { TodoItemRow } from "./todo-item-row"
import { EmptyState } from "./empty-state"
import type { TodoItemWithTags } from "@/types"

interface TodoListViewProps {
  items: TodoItemWithTags[]
  onToggle: (id: string, current: string) => void
  onDelete: (id: string) => void
  onReorder: (items: { id: string; sortOrder: number }[]) => void
}

export function TodoListView({
  items,
  onToggle,
  onDelete,
  onReorder,
}: TodoListViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const reorderData = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index * 100,
    }))

    onReorder(reorderData)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="尚无任务"
        description="在下方输入框中输入任务后按 Enter 添加"
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5 p-2">
          {items.map((item) => (
            <TodoItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/todo-list-view.tsx && git commit -m "feat: add TodoListView with drag-and-drop reordering"
```

---

## Phase 9: TanStack Query Hooks

### Task 20: Create data hooks

**Files:**
- Create: `listio_web/src/hooks/use-lists.ts`
- Create: `listio_web/src/hooks/use-items.ts`
- Create: `listio_web/src/hooks/use-tags.ts`
- Create: `listio_web/src/hooks/use-reorder.ts`

- [ ] **Step 1: Write useLists hook**

```typescript
// listio_web/src/hooks/use-lists.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { ListWithCounts } from "@/types"

export function useLists() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["lists"],
    queryFn: () => api.get<ListWithCounts[]>("/api/v1/lists"),
  })

  const createList = useMutation({
    mutationFn: (data: { name: string; color?: string | null }) =>
      api.post("/api/v1/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("列表已创建")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateList = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string | null }) =>
      api.patch(`/api/v1/lists/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  })

  const deleteList = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("列表已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  return { ...query, createList, updateList, deleteList }
}
```

- [ ] **Step 2: Write useItems hook**

```typescript
// listio_web/src/hooks/use-items.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { TodoItemWithTags } from "@/types"

export function useItems(listId: string, filters?: Record<string, string>) {
  const queryClient = useQueryClient()
  const queryKey = ["items", listId, filters]

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams(filters)
      const qs = params.toString()
      return api.get<TodoItemWithTags[]>(
        `/api/v1/lists/${listId}/items${qs ? `?${qs}` : ""}`
      )
    },
    enabled: !!listId,
  })

  const createItem = useMutation({
    mutationFn: (data: { title: string }) =>
      api.post(`/api/v1/lists/${listId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleItem = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/items/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TodoItemWithTags[]>(queryKey)
      queryClient.setQueryData<TodoItemWithTags[]>(queryKey, (old) =>
        old?.map((item) =>
          item.id === id ? { ...item, status: status as TodoItemWithTags["status"] } : item
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("状态更新失败")
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("任务已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  const reorderItems = useMutation({
    mutationFn: (items: { id: string; sortOrder: number; status?: string }[]) =>
      api.put("/api/v1/items/reorder", { items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TodoItemWithTags[]>(queryKey)
      queryClient.setQueryData<TodoItemWithTags[]>(queryKey, (old) => {
        if (!old) return old
        const updated = [...old]
        for (const reorderItem of items) {
          const idx = updated.findIndex((i) => i.id === reorderItem.id)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              sortOrder: reorderItem.sortOrder,
              ...(reorderItem.status
                ? { status: reorderItem.status as TodoItemWithTags["status"] }
                : {}),
            }
          }
        }
        updated.sort((a, b) => a.sortOrder - b.sortOrder)
        return updated
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("排序失败")
    },
  })

  return { ...query, createItem, toggleItem, deleteItem, reorderItems }
}
```

- [ ] **Step 3: Write useTags hook**

```typescript
// listio_web/src/hooks/use-tags.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { TagWithCount } from "@/types"

export function useTags() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<TagWithCount[]>("/api/v1/tags"),
  })

  const createTag = useMutation({
    mutationFn: (data: { name: string; color?: string | null }) =>
      api.post("/api/v1/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast.success("标签已创建")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateTag = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string | null }) =>
      api.patch(`/api/v1/tags/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  })

  const deleteTag = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success("标签已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  return { ...query, createTag, updateTag, deleteTag }
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/hooks/ && git commit -m "feat: add TanStack Query hooks (useLists, useItems, useTags) with optimistic updates"
```

---

## Phase 10: Pages

### Task 21: ListDetailPage (list + kanban views)

**Files:**
- Create: `listio_web/src/app/app/lists/[id]/page.tsx`

- [ ] **Step 1: Write ListDetailPage**

```tsx
// listio_web/src/app/app/lists/[id]/page.tsx
"use client"

import { use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useItems } from "@/hooks/use-items"
import { useLists } from "@/hooks/use-lists"
import { ListHeader } from "@/components/list-header"
import { QuickAdd } from "@/components/quick-add"
import { FilterBar } from "@/components/filter-bar"
import { TodoListView } from "@/components/todo-list-view"
import { KanbanBoard } from "@/components/kanban-board"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useCallback } from "react"

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "list"

  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (statusFilter !== "ALL") f.status = statusFilter
    if (priorityFilter !== "ALL") f.priority = priorityFilter
    if (searchQuery) f.q = searchQuery
    return f
  }, [statusFilter, priorityFilter, searchQuery])

  const { data: listData } = useLists()
  const {
    data: items = [],
    isLoading,
    toggleItem,
    deleteItem,
    reorderItems,
  } = useItems(id, filters)

  const list = listData?.find((l) => l.id === id)

  const handleToggle = useCallback(
    (itemId: string, currentStatus: string) => {
      const nextStatus =
        currentStatus === "DONE" ? "TODO" : "DONE"
      toggleItem.mutate({ id: itemId, status: nextStatus })
    },
    [toggleItem]
  )

  const handleReorder = useCallback(
    (reorderData: { id: string; sortOrder: number; status?: string }[]) => {
      reorderItems.mutate(reorderData)
    },
    [reorderItems]
  )

  const clearFilters = useCallback(() => {
    setStatusFilter("ALL")
    setPriorityFilter("ALL")
    setSearchQuery("")
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!list) {
    return (
      <EmptyState
        title="列表不存在"
        description="该列表可能已被删除或你没有访问权限"
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ListHeader listName={list.name} />
      <QuickAdd listId={id} />
      <FilterBar
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchQuery}
        onClear={clearFilters}
      />
      {view === "board" ? (
        <KanbanBoard items={items} onReorder={handleReorder} />
      ) : (
        <TodoListView
          items={items}
          onToggle={handleToggle}
          onDelete={(itemId) => deleteItem.mutate(itemId)}
          onReorder={handleReorder}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/app/lists/ && git commit -m "feat: add ListDetailPage with list/kanban views, filtering, and drag-and-drop"
```

---

### Task 22: TagsPage

**Files:**
- Create: `listio_web/src/app/app/tags/page.tsx`

- [ ] **Step 1: Write TagsPage**

```tsx
// listio_web/src/app/app/tags/page.tsx
"use client"

import { useState } from "react"
import { useTags } from "@/hooks/use-tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/tag-badge"
import { Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

export default function TagsPage() {
  const { data: tags = [], isLoading, createTag, deleteTag } = useTags()
  const [newName, setNewName] = useState("")

  const handleCreate = () => {
    if (!newName.trim()) return
    createTag.mutate(
      { name: newName.trim() },
      { onSuccess: () => setNewName("") }
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">标签管理</h1>
      </div>

      <div className="p-4">
        <div className="mb-6 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="新建标签名称"
            className="max-w-xs"
          />
          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || createTag.isPending}
            size="sm"
          >
            创建
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <EmptyState
            title="尚无标签"
            description="创建标签来分类你的任务"
          />
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary"
              >
                <TagBadge name={tag.name} color={tag.color} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {tag._count.items} 个任务
                </span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => deleteTag.mutate(tag.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/app/tags/ && git commit -m "feat: add TagsPage with create/list/delete"
```

---

### Task 23: SettingsPage and app redirect

**Files:**
- Create: `listio_web/src/app/app/settings/page.tsx`
- Create: `listio_web/src/app/app/page.tsx`

- [ ] **Step 1: Write SettingsPage**

```tsx
// listio_web/src/app/app/settings/page.tsx
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
import type { ApiTokenListItem, ApiTokenResponse } from "@/types"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [newToken, setNewToken] = useState<ApiTokenResponse | null>(null)
  const [tokenName, setTokenName] = useState("")

  const { data: tokens = [] } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => api.get<ApiTokenListItem[]>("/api/v1/tokens"),
  })

  const createToken = useMutation({
    mutationFn: (name: string) =>
      api.post<ApiTokenResponse>("/api/v1/tokens", { name }),
    onSuccess: (data) => {
      setNewToken(data)
      setTokenName("")
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteToken = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tokens/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
      toast.success("Token 已撤销")
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">设置</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* API Tokens */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">API Token</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            生成 Token 后可通过 CLI、移动端或桌面端调用 Listio API
          </p>

          <div className="mb-4 flex gap-2">
            <Input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token 名称"
              className="max-w-xs"
            />
            <Button
              onClick={() => createToken.mutate(tokenName)}
              disabled={!tokenName.trim() || createToken.isPending}
              size="sm"
            >
              生成 Token
            </Button>
          </div>

          {tokens.length > 0 && (
            <div className="space-y-1">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary"
                >
                  <div>
                    <p className="text-sm text-foreground">{token.name}</p>
                    <p className="text-xs text-muted-foreground">
                      lst_****{token.lastFour} ·{" "}
                      {new Date(token.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => deleteToken.mutate(token.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Token reveal dialog */}
      <Dialog open={!!newToken} onOpenChange={() => setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>你的 API Token</DialogTitle>
            <DialogDescription>
              此 Token 仅显示一次，请立即复制保存。关闭后无法再次查看。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="flex-1 break-all text-sm font-mono text-foreground">
              {newToken?.token}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => {
                if (newToken) {
                  navigator.clipboard.writeText(newToken.token)
                  toast.success("已复制到剪贴板")
                }
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Write app root redirect**

```tsx
// listio_web/src/app/app/page.tsx
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export default async function AppPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const firstList = await db.list.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  })

  if (firstList) {
    redirect(`/app/lists/${firstList.id}`)
  }

  // No lists yet — stay on this page
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          欢迎使用 Listio
        </h2>
        <p className="text-sm text-muted-foreground">
          点击侧边栏的创建按钮来添加你的第一个列表
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/app/app/settings/ listio_web/src/app/app/page.tsx && git commit -m "feat: add SettingsPage with API token management and app root redirect"
```

---

## Phase 11: Integration & Polish

### Task 24: Wire CreateList and CreateTag in Sidebar

**Files:**
- Modify: `listio_web/src/components/sidebar.tsx`

Read the current sidebar. Add a CreateList dialog triggered by a "+" button in the lists section header, and update the lists query to use the hook.

Key change — replace the static lists section with a full dialog:

```tsx
// Inside the Sidebar component, add after "Lists" header:
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useLists } from "@/hooks/use-lists"
import { useRouter } from "next/navigation"

// Add inside the component:
const { createList } = useLists()
const router = useRouter()
const [newListName, setNewListName] = useState("")
const [dialogOpen, setDialogOpen] = useState(false)

// Replace the "列表" header section with:
<div className="mb-2 flex items-center justify-between px-2">
  <span className="text-xs font-medium text-muted-foreground">列表</span>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" className="size-6">
        <Plus className="size-3.5" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新建列表</DialogTitle>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="列表名称"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newListName.trim()) {
              createList.mutate(
                { name: newListName.trim() },
                {
                  onSuccess: (data: any) => {
                    setDialogOpen(false)
                    setNewListName("")
                    router.push(`/app/lists/${data.id}`)
                  },
                }
              )
            }
          }}
        />
        <Button
          onClick={() => {
            if (newListName.trim()) {
              createList.mutate(
                { name: newListName.trim() },
                {
                  onSuccess: (data: any) => {
                    setDialogOpen(false)
                    setNewListName("")
                    router.push(`/app/lists/${data.id}`)
                  },
                }
              )
            }
          }}
          disabled={!newListName.trim()}
        >
          创建
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</div>
```

Also replace the static `const { data: lists = [] }` with `const { data: lists = [] } = useLists()`.

- [ ] **Step 2: Commit**

```bash
cd /Users/dean/code/listio && git add listio_web/src/components/sidebar.tsx && git commit -m "feat: wire CreateList dialog in sidebar"
```

---

### Task 25: Verify and fix any issues

**Files:**
- All files

- [ ] **Step 1: Start the dev server and verify**

```bash
cd /Users/dean/code/listio/listio_web && pnpm dev
```

Check:
1. Visit `http://localhost:3000/login` — login page renders with GitHub/Google buttons
2. Authentication flow works (or redirects to login properly)
3. After auth, app shell loads with sidebar
4. Can create a list
5. Can add items
6. Can toggle/drag/reorder items
7. Can switch to kanban view
8. Can filter items
9. Tags page works
10. Settings page with token generation works
11. Dark/light theme toggle works

- [ ] **Step 2: Fix any compilation errors**

Fix any TypeScript or import errors found during verification.

- [ ] **Step 3: Commit any fixes**

```bash
cd /Users/dean/code/listio && git add -A && git commit -m "fix: integration fixes and polish"
```

---

## Summary

Total: 25 tasks across 11 phases

| Phase | Tasks | Scope |
|-------|-------|-------|
| 1. Project Scaffold | Tasks 1-2 | Next.js + shadcn + deps |
| 2. Database Foundation | Task 3 | Prisma schema + client |
| 3. Types & Validation | Task 4 | TS types + Zod schemas |
| 4. Authentication | Tasks 5-6 | NextAuth + middleware |
| 5. Theme System | Task 7 | Dual theme CSS + ThemeProvider |
| 6. Root Layout & Shell | Tasks 8-9 | Providers + AppShell + Sidebar |
| 7. REST API Routes | Tasks 10-13 | All 16 API endpoints |
| 8. Core UI Components | Tasks 14-19 | All UI components |
| 9. Data Hooks | Task 20 | TanStack Query hooks |
| 10. Pages | Tasks 21-23 | List/Tags/Settings pages |
| 11. Integration | Tasks 24-25 | Polish and fixes |

**Localization note:** The entire UI is Chinese. All labels, placeholders, toasts, and error messages are in Chinese.
