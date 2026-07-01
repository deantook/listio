# Listio — 多用户待办系统设计规范

> 日期：2026-07-01 | 状态：Draft | 作者：AI + User

---

## 1. 概述

Listio 是一个多用户待办管理系统。每个用户拥有独立的待办空间，支持列表管理、任务管理、标签分类、优先级、截止日期、搜索过滤和看板视图。UI 基于 LINEAR 暗色设计系统（参考 `DESIGN.md`），使用 shadcn/ui 组件库。

### 核心技术选型

| 维度 | 选择 | 理由 |
|------|------|------|
| 前端框架 | Next.js 15 App Router | SSR/SSG 支持，shadcn/ui 默认推荐 |
| 认证 | NextAuth.js (Auth.js v5) | OAuth 多提供方，与 Next.js 深度集成 |
| 数据层 | Prisma + PostgreSQL | 类型安全 ORM，迁移管理 |
| API 风格 | Next.js Route Handlers (REST) | 为 CLI/移动端/桌面端等多客户端预留标准接口 |
| 客户端状态 | TanStack Query v5 | 缓存、乐观更新、后台刷新 |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable | 列表重排和看板列间拖拽 |
| UI 组件 | shadcn/ui (base 风格) | 可定制源码组件 |
| 样式 | Tailwind CSS v4 | shadcn/ui 默认样式方案 |
| 字体 | Inter + JetBrains Mono | 替代 Linear Display / Linear Mono |
| 验证 | Zod | 服务端 API 输入校验 |
| 包管理器 | pnpm | 性能优先 |

### 功能范围

- 用户注册/登录（NextAuth.js OAuth）
- 待办列表 CRUD（带颜色标记）
- 任务 CRUD（标题、备注、状态、优先级、截止日期、排序）
- 标签管理（带颜色标记，多对多关联）
- 列表视图 + 看板视图
- 拖拽排序（列表视图行重排、看板列间拖拽）
- 搜索过滤（关键词、状态、优先级、标签、截止日期）
- API Token 生成（供 CLI/移动端/桌面端调用）
- LINEAR 暗色主题（单一 dark mode，暂不做亮色模式）

---

## 2. 数据模型

### Prisma Schema

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())

  lists     List[]
  tags      Tag[]
  tokens    ApiToken[]
}

model List {
  id        String   @id @default(cuid())
  name      String
  color     String?
  sortOrder Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  list   List     @relation(fields: [listId], references: [id], onDelete: Cascade)
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

### 关系图

```
User ──< List ──< TodoItem >── TodoItemTag ──< Tag
                         │
                         ├── status (enum)
                         ├── priority (enum)
                         ├── dueDate (datetime?)
                         └── sortOrder (float)

User ──< ApiToken
```

### 关键设计决策

- **`sortOrder` 使用浮点数** — 支持任意两个 item 之间插入而不需要全量重排序（参考 Linear 的做法）
- **`status` 三态枚举** — `TODO | IN_PROGRESS | DONE`，直接映射看板 3 列
- **`priority` 五级** — `NONE | LOW | MEDIUM | HIGH | URGENT`，看板可按优先级分组
- **`color` 可选** — List 和 Tag 上的颜色字段，Hex 字符串，提升视觉区分度
- **`notes` 纯文本** — 第一版不做富文本或 Markdown 渲染
- **级联删除** — `onDelete: Cascade` 保证删除列表时自动清理关联 items 和标签关联
- **ApiToken** — SHA-256 哈希存储，`lastFour` 存储末 4 位用于 UI 展示

---

## 3. API 设计

所有端点前缀 `/api/v1`。Web 端通过 NextAuth session cookie 认证，外部客户端通过 Bearer token 认证（`Authorization: Bearer <token>`）。

### 3.1 认证

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/v1/tokens` | 列出当前用户的 API Token |
| `POST` | `/api/v1/tokens` | 生成新 Token（返回完整值一次） |
| `DELETE` | `/api/v1/tokens/:id` | 撤销 Token |

### 3.2 列表

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/v1/lists` | 获取用户所有列表（含 item 计数和完成率统计） |
| `POST` | `/api/v1/lists` | 创建列表 |
| `PATCH` | `/api/v1/lists/:id` | 更新列表（name, color, sortOrder） |
| `DELETE` | `/api/v1/lists/:id` | 删除列表（级联删除所有 items） |
| `PUT` | `/api/v1/lists/reorder` | 批量重排序 `{ ids: string[] }` |

### 3.3 任务

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/v1/lists/:id/items` | 列表下的所有 item |
| `POST` | `/api/v1/lists/:id/items` | 创建 item |
| `PATCH` | `/api/v1/items/:id` | 更新 item（所有字段） |
| `DELETE` | `/api/v1/items/:id` | 删除 item |
| `PUT` | `/api/v1/items/reorder` | 批量重排序 `{ items: { id, listId, sortOrder }[] }` |
| `PATCH` | `/api/v1/items/:id/status` | 快捷变更状态 `{ status: Status }` |
| `GET` | `/api/v1/items/:id` | 获取单个 item 详情 |

**过滤参数**（`GET /lists/:id/items`）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | `Status` | 按状态筛选 |
| `priority` | `Priority` | 按优先级筛选 |
| `tag` | `string` | 按标签 ID 筛选 |
| `q` | `string` | 关键词搜索（标题 + 备注） |

### 3.4 标签

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/v1/tags` | 用户的所有标签 |
| `POST` | `/api/v1/tags` | 创建标签 |
| `PATCH` | `/api/v1/tags/:id` | 更新标签 |
| `DELETE` | `/api/v1/tags/:id` | 删除标签（级联解绑） |
| `POST` | `/api/v1/items/:id/tags` | 给 item 绑定标签 |
| `DELETE` | `/api/v1/items/:id/tags/:tagId` | 解绑标签 |

### 3.5 搜索

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/v1/search` | 跨列表全局搜索 |

**搜索参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `q` | `string` | 关键词 |
| `status` | `Status` | 状态 |
| `priority` | `Priority` | 优先级 |
| `tag` | `string` | 标签 ID |
| `due` | `overdue \| today \| week` | 截止日期快捷筛选 |
| `listId` | `string` | 限定列表 |

### 3.6 错误响应格式

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "标题不能为空"
  }
}
```

| HTTP | code | 场景 |
|------|------|------|
| 400 | `BAD_REQUEST` | 请求格式错误 |
| 401 | `UNAUTHORIZED` | 未登录 / Token 无效 |
| 403 | `FORBIDDEN` | 访问不属于自己的资源 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 列表名重复 |
| 422 | `VALIDATION` | Zod 校验失败 |
| 429 | `RATE_LIMITED` | 频率限制 |
| 500 | `INTERNAL` | 服务端错误 |

---

## 4. 页面结构与路由

### 路由表

| 路由 | 页面 | 布局 | 认证 |
|------|------|------|------|
| `/login` | 登录页 | 独立 | 否 |
| `/app` | 重定向 → 第一个列表或空状态引导 | AppShell | 是 |
| `/app/lists/[id]` | 列表详情（列表/看板视图） | AppShell | 是 |
| `/app/tags` | 标签管理 | AppShell | 是 |
| `/app/settings` | 设置（API Token） | AppShell | 是 |

### 布局层级

```
RootLayout
├─ Providers (Session + TanStack Query + Theme)
├─ /login                              ← 独立布局
└─ AppShell                            ← 已认证固定布局
   ├─ Sidebar (固定左侧)
   └─ Main (右侧内容区，scrollable)
```

**AppShell** 使用 Next.js layout 机制，Sidebar 在路由切换时不重新渲染，避免闪烁。

### 视图切换

列表和看板共用 `/app/lists/[id]` 路由，通过 `?view=list`（默认）和 `?view=board` 切换。这样侧边栏的列表选中状态不受视图切换影响。

---

## 5. 组件树

### 5.1 Sidebar

```
Sidebar
├─ UserMenu             头像 + 用户名 + 下拉菜单
│  └─ DropdownMenu      "设置" / "生成 API Token" / "退出"
├─ Navigation           列表导航
│  ├─ NavListItem[]     每条列表（名称 + 任务数 badge + 颜色指示条）
│  └─ CreateListButton  "+ 新建列表" 按钮
└─ BottomActions        标签管理 | 设置
```

### 5.2 列表详情页 `/app/lists/[id]`

```
ListDetailPage
├─ ListHeader               列表名称（可内联编辑）+ 视图切换 Toggle
├─ TodoToolbar
│  ├─ QuickAddInput         快捷添加（placeholder + Enter 确认）
│  └─ FilterBar             按状态 | 优先级 | 标签 | 截止日期过滤
│
├─ [view === 'list']        列表视图
│  └─ TodoListView
│     └─ TodoItemRow[]      可拖拽排序
│        ├─ DragHandle      拖拽手柄（grip icon）
│        ├─ Checkbox        圆形 checked/unchecked
│        ├─ PriorityBadge   优先级色块（NONE 不显示）
│        ├─ Title           可内联编辑
│        ├─ TagBadges[]     最多显示 2 个 + "+N" 溢出
│        ├─ DueDate         截止日期（逾期标红）
│        └─ ContextMenu     ••• 菜单
│
└─ [view === 'board']       看板视图
   └─ KanbanBoard
      └─ KanbanColumn[]     TODO | IN_PROGRESS | DONE
         ├─ ColumnHeader    "待处理 · 3"
         └─ KanbanCard[]   可拖拽列间/列内移动
            └─ (精简 TodoItemRow)
```

### 5.3 标签管理页 `/app/tags`

```
TagsPage
├─ PageHeader             "标签管理"
├─ CreateTagRow           名称输入 + 颜色选择 + 创建按钮
└─ TagList
   └─ TagRow[]            色块 + 名称 + 关联任务数 + 编辑/删除按钮
```

### 5.4 设置页 `/app/settings`

```
SettingsPage
├─ PageHeader             "设置"
├─ ApiTokenSection
│  ├─ TokenList           已生成的 Token（名称 + 末4位 + 创建时间 + 删除）
│  └─ CreateTokenButton   生成按钮 → 一次性弹窗展示 token 值
└─ ThemeSection           主题（当前仅暗色，预留给未来亮色模式）
```

---

## 6. 交互规范

### 6.1 快捷添加

- `QuickAddInput` 始终在 todo 列表顶部
- 输入内容后按 Enter 立即创建 item，输入框清空但焦点不丢失，支持连续添加
- 创建中显示 loading 微调器，失败时 Toast 提示

### 6.2 内联编辑

- 列表名和任务标题支持：双击 → 进入编辑模式 → Enter/失焦提交 → Escape 放弃
- 使用 `contentEditable` 或 `input` 替换方案

### 6.3 拖拽

- `@dnd-kit` 实现
- **列表视图**：行内拖拽重排序，松手后调 `PUT /items/reorder`
- **看板视图**：卡片可列内排序和列间移动，列间移动时自动更新 status，调 `PUT /items/reorder`（含 `listId` 变了时也处理）

### 6.4 乐观更新

- TanStack Query `useMutation` + `onMutate` 实现乐观更新
- 完成状态切换（Checkbox）、拖拽排序、内联编辑均走乐观路径
- 服务端失败时回滚 + Toast 通知

### 6.5 ContextMenu

- 右键或点击 `•••` 按钮触发 DropdownMenu
- 选项：编辑 / 修改截止日 / 修改优先级 / 删除
- 删除需 AlertDialog 二次确认

### 6.6 空状态

- **无列表**："创建你的第一个列表" + CTA 按钮
- **空任务**："尚未添加任务" 提示 + 输入框引导
- **搜索无结果**："未找到匹配的任务" + 清除过滤链接

---

## 7. 暗色主题系统

### 7.1 CSS 变量映射

DESIGN.md → shadcn CSS 变量，单一暗色主题（无 light mode）：

```css
@theme inline {
  --color-background: hsl(222 20% 0.4%);    /* #010102 canvas */
  --color-foreground: hsl(225 14% 97%);     /* #f7f8f8 ink */
  --color-card: hsl(210 5% 6%);             /* #0f1011 surface-1 */
  --color-card-foreground: hsl(225 14% 97%);
  --color-popover: hsl(220 5% 10%);         /* #18191a surface-3 */
  --color-popover-foreground: hsl(225 14% 97%);
  --color-primary: hsl(234 58% 62%);        /* #5e6ad2 lavender */
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(210 5% 8%);        /* #141516 surface-2 */
  --color-secondary-foreground: hsl(225 14% 97%);
  --color-muted: hsl(210 3% 10%);
  --color-muted-foreground: hsl(220 10% 56%); /* #8a8f98 ink-subtle */
  --color-accent: hsl(234 58% 62%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 62% 50%);
  --color-destructive-foreground: hsl(0 0% 100%);
  --color-border: hsl(225 9% 16%);          /* #23252a hairline */
  --color-input: hsl(225 9% 16%);
  --color-ring: hsl(234 56% 61%);           /* #5e69d1 primary-focus */
  --radius: 0.5rem;
}
```

### 7.2 色彩使用原则

- 薰衣草蓝 `--primary` 仅用于：主按钮、focus ring、链接
- 不使用第二个强调色
- `--destructive` 仅用于删除确认
- 表面阶梯：`bg-card → bg-secondary → bg-muted`（3 级）
- 所有卡片带 1px `border-border`，无 `box-shadow`
- 不做渐变背景、不做 spotlight 高光

### 7.3 字体

```css
--font-sans: "Inter", "SF Pro Display", -apple-system, system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, monospace;
```

- Inter weight 500/600 替代 Linear Text
- `tracking-tight` 用于 headlines 近似负字间距

### 7.4 shadcn 组件变体映射

| shadcn variant | DESIGN 组件 | 效果 |
|---|---|---|
| `Button variant="default"` | `button-primary` | 薰衣草蓝底白字 |
| `Button variant="secondary"` | `button-secondary` | surface-1 底 + hairline 边框 |
| `Button variant="ghost"` | `button-tertiary` | 透明底 |
| `Button variant="outline"` | — | surface-1 底 + hairline 边框 |
| `Card` | `feature-card` | surface-1 底，rounded-lg，hairline 边框 |
| `Input` | `text-input` | surface-1 底，rounded-md |
| `Badge variant="secondary"` | `status-badge` | surface-2 底 |

---

## 8. 项目目录结构

```
listio/
├── DESIGN.md
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-01-listio-design.md    ← 本文档
│
├── listio_web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              RootLayout + Providers
│   │   │   ├── page.tsx                / → 重定向
│   │   │   ├── globals.css             shadcn 主题变量
│   │   │   ├── login/
│   │   │   │   └── page.tsx            登录页
│   │   │   ├── api/
│   │   │   │   └── v1/                 REST API Routes
│   │   │   │       ├── lists/
│   │   │   │       ├── items/
│   │   │   │       ├── tags/
│   │   │   │       ├── tokens/
│   │   │   │       └── search/
│   │   │   └── app/                    认证路由组
│   │   │       ├── layout.tsx          AppShell (Sidebar + Main)
│   │   │       ├── lists/
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx    列表详情
│   │   │       ├── tags/
│   │   │       │   └── page.tsx        标签管理
│   │   │       └── settings/
│   │   │           └── page.tsx        设置
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                     shadcn 基础组件
│   │   │   ├── sidebar.tsx
│   │   │   ├── todo-item-row.tsx
│   │   │   ├── todo-list-view.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   ├── kanban-column.tsx
│   │   │   ├── kanban-card.tsx
│   │   │   ├── quick-add.tsx
│   │   │   ├── filter-bar.tsx
│   │   │   ├── priority-badge.tsx
│   │   │   ├── tag-badge.tsx
│   │   │   ├── list-header.tsx
│   │   │   └── empty-state.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-lists.ts            TanStack Query — 列表
│   │   │   ├── use-items.ts            TanStack Query — 任务
│   │   │   ├── use-tags.ts             TanStack Query — 标签
│   │   │   └── use-reorder.ts          拖拽重排序
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                  客户端 API 封装
│   │   │   ├── auth.ts                 NextAuth 配置
│   │   │   ├── db.ts                   Prisma client 单例
│   │   │   └── utils.ts                cn() 等工具
│   │   │
│   │   └── types/
│   │       └── index.ts                共享类型
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── components.json                 shadcn 配置
│
└── listio_server/                      预留 — 空目录
```

---

## 9. 安全设计

- **行级安全** — 每个 API handler 验证 `WHERE userId = session.user.id`，确保资源归属
- **API Token** — SHA-256 哈希存储；生成时返回一次原始值，之后不可再查看
- **输入验证** — Zod schema 校验所有 PATCH/POST body
- **频率限制** — 按 IP 或用户维度限流，超频返回 429
- **CORS** — 仅允许 Web 客户端域和本地开发端口。CLI/移动端通过 Bearer token 绕过

---

## 10. 已知限制与未来规划

- **v1 不做亮色模式** — DESIGN.md 规范仅定义暗色，但 CSS 变量结构兼容未来添加
- **v1 不做分页** — 个人待办数据量级预期不高，全量返回
- **v1 不做富文本** — `notes` 字段为纯文本
- **v1 不做 WebSocket/实时同步** — 多端同时操作依赖乐观更新 + 手动刷新
- **v1 不做多语言** — 中英文混合（UI 文案后期统一）
- **listio_server 留空** — 当前 Next.js 单体架构覆盖全栈，分离后端在需要时再启动

---

## 附录 A：优先级色值映射

| Priority | 颜色 | HSL |
|----------|------|-----|
| NONE | 不显示 | — |
| LOW | 灰蓝 | `hsl(220 10% 56%)` |
| MEDIUM | 薰衣草蓝 | `hsl(234 58% 62%)` |
| HIGH | 橙黄 | `hsl(35 90% 55%)` |
| URGENT | 红 | `hsl(0 62% 50%)` |

## 附录 B：看板列分组

| 列 | Status | 语义 |
|----|--------|------|
| 待处理 | `TODO` | 默认状态 |
| 进行中 | `IN_PROGRESS` | 当前工作中 |
| 已完成 | `DONE` | 归档状态 |
