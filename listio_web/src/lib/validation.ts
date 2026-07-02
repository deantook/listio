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

export const bindEmailSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
})

export const setPasswordSchema = z.object({
  password: z.string().min(8, "密码至少需要8个字符").max(128, "密码不能超过128个字符"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(8, "密码至少需要8个字符").max(128, "密码不能超过128个字符"),
})

export const loginSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  password: z.string().min(1, "请输入密码"),
})
