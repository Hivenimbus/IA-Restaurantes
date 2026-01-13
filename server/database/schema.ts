import { pgTable, text, timestamp, boolean, integer, serial, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
    expires_at: timestamp('expires_at').notNull(),
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
    userId: text('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone'),
    address: text('address'),
    paymentMethod: text('payment_method'),
    status: text('status').default('Aguardando').notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    observations: text('observations'),
    userId: text('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: integer('menu_item_id').references(() => menuItems.id),
    itemName: text('item_name').notNull(),
    itemPrice: decimal('item_price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
});

export const ordersRelations = relations(orders, ({ many }) => ({
    orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
}));

export const clients = pgTable('clients', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    address: text('address'),
    userId: text('user_id').notNull().references(() => users.id),
    lastOrderId: integer('last_order_id').references(() => orders.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
    user: one(users, {
        fields: [clients.userId],
        references: [users.id],
    }),
    lastOrder: one(orders, {
        fields: [clients.lastOrderId],
        references: [orders.id],
    }),
}));

export const orderRequests = pgTable('order_requests', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id),
    requestType: text('request_type').notNull(), // 'cancellation' | 'edition'
    status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
    details: text('details'),
    webhookUrl: text('webhook_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderRequestsRelations = relations(orderRequests, ({ one }) => ({
    order: one(orders, {
        fields: [orderRequests.orderId],
        references: [orders.id],
    }),
    user: one(users, {
        fields: [orderRequests.userId],
        references: [users.id],
    }),
}));

export const menuSettings = pgTable('menu_settings', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    menuLink: text('menu_link'),
    menuFileUrl: text('menu_file_url'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const menuSettingsRelations = relations(menuSettings, ({ one }) => ({
    user: one(users, {
        fields: [menuSettings.userId],
        references: [users.id],
    }),
}));
