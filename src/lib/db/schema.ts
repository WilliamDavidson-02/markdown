import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, integer, uuid, foreignKey } from 'drizzle-orm/pg-core'

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	githubId: integer('github_id').unique(),
	email: text('email').unique(),
	passwordHash: text('password_hash')
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
		.references(() => folderTable.id, { onDelete: 'set null' })
		.unique(),
	fileId: uuid('file_id')
		.references(() => fileTable.id, { onDelete: 'set null' })
		.unique(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow()
})
