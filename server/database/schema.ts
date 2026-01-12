import { pgTable, text, timestamp, boolean, integer, serial, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    role: text('role').default('user'),
    banned: boolean('banned'),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => users.id),
});

export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const verifications = pgTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const menuItems = pgTable('menu_items', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url'),
    isAvailable: boolean('is_available').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone'),
    address: text('address'),
    paymentMethod: text('payment_method'),
    status: text('status').default('Aguardando').notNull(), // Aguardando, Em preparação, Enviado, Entregue, Cancelado
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    observations: text('observations'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id),
    menuItemId: integer('menu_item_id').references(() => menuItems.id), // Nullable in case menu item is deleted? Or strict? Better to keep it nullable or restrict delete.
    itemName: text('item_name').notNull(), // Snapshot of name in case it changes
    itemPrice: decimal('item_price', { precision: 10, scale: 2 }).notNull(), // Snapshot of price
    quantity: integer('quantity').notNull().default(1),
});
