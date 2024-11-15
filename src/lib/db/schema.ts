import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, integer, uuid, foreignKey, jsonb } from 'drizzle-orm/pg-core'
import { defaultEditorSettings } from '../components/settings/defaultSettings'

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	githubId: integer('github_id').unique(),
	email: text('email').unique(),
	passwordHash: text('password_hash')
})

export const settingsTable = pgTable('settings', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	settings: jsonb('settings').$type<typeof defaultEditorSettings>().default(defaultEditorSettings),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' })
})

export const keybindingTable = pgTable('keybinding', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	key: text('key').notNull(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' })
})

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
})

export const folderTable = pgTable(
	'folder',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		name: text('name').default('New Folder'),
		parentId: uuid('parent_id'),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date'
		})
			.notNull()
			.defaultNow()
	},
	(table) => {
		return {
			parentReference: foreignKey({
				columns: [table.parentId],
				foreignColumns: [table.id],
				name: 'parent_reference'
			}).onDelete('set null')
		}
	}
)

export const fileTable = pgTable('file', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	name: text('name').default('New File'),
	icon: text('icon').default('File'),
	iconColor: text('icon_color'),
	doc: text('doc'),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	folderId: uuid('folder_id').references(() => folderTable.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow()
})

export const trashTable = pgTable('trash', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	folderId: uuid('folder_id')
		.references(() => folderTable.id, { onDelete: 'cascade' })
		.unique(),
	fileId: uuid('file_id')
		.references(() => fileTable.id, { onDelete: 'cascade' })
		.unique(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow()
})

export const githubInstallationTable = pgTable('github_installation', {
	id: integer('id').primaryKey(),
	username: text('username').notNull(),
	avatarUrl: text('avatar_url').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' })
})

export const repositoryTable = pgTable('repository', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	fullName: text('full_name').notNull(),
	htmlUrl: text('html_url').notNull(),
	installationId: integer('installation_id')
		.notNull()
		.references(() => githubInstallationTable.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' })
})

export const githubFileTable = pgTable('github_file', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	sha: text('sha'),
	path: text('path'),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositoryTable.id, { onDelete: 'cascade' }),
	fileId: uuid('file_id').references(() => fileTable.id, { onDelete: 'set null' })
})

export const githubFolderTable = pgTable('github_folder', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	sha: text('sha'),
	path: text('path'),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositoryTable.id, { onDelete: 'cascade' }),
	folderId: uuid('folder_id').references(() => folderTable.id, { onDelete: 'set null' })
})
