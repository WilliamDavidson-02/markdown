export type GithubTreeItem = {
	path: string
	mode: string
	type: string
	sha: string
	size?: number
	url: string
}

export type GithubTree = {
	sha: string
	url: string
	tree: GithubTreeItem[]
	truncated: boolean
}

export type GithubBlob = {
	sha: string
	node_id: string
	size: number
	url: string
	content: string
	encoding: string
}

export type GithubFolder = {
	id: string
	name: string
	parentId: string
	path?: string
}

export type GithubFolderData = {
	id?: string
	sha: string
	path: string
}

export type GithubFile = {
	sha: string
	path: string
	content: string
	name: string
}

export type GithubFormatedFile = {
	id: string
	name: string
	icon: string
	doc: string
	folderId: string | undefined
}

export type GithubShaItem = {
	id: string
	sha: string
	path: string | null | undefined
}

export type GithubShaItemUpdate = GithubShaItem & {
	name: string
}

export type GithubFileUpdate = GithubFile & {
	id: string
	newSha: string
}

export type GithubCommitListItem = {
	sha: string
	url: string
}

export type GithubProtectionListItem = {
	required_status_checks: {
		enforcement_level: string
		contexts: string[]
	}
}

export type GithubBranchListItem = {
	name: string
	commit: GithubCommitListItem
	protected: boolean
	protection: GithubProtectionListItem
	protection_url: string
}

export type CreateOrUpdateGithubFileContent = {
	name: string
	path: string
	sha: string
	size: number
	url: string
	html_url: string
	git_url: string
	download_url: string
	type: string
	_links: {
		self: string
		git: string
		html: string
	}
}

export type CreateOrUpdateGithubFileCommitParent = {
	url: string
	html_url: string
	sha: string
}

export type CreateOrUpdateGithubFileCommit = {
	sha: string
	node_id: string
	url: string
	html_url: string
	author: {
		name: string
		email: string
		date: string
	}
	committer: {
		name: string
		email: string
		date: string
	}
	tree: {
		sha: string
		url: string
	}
	message: string
	parents: CreateOrUpdateGithubFileCommitParent[]
	verification: {
		verified: boolean
		reason: string
		signature: string
		payload: string
	}
}

export type CreateOrUpdateGithubFile = {
	content: CreateOrUpdateGithubFileContent
	commit: CreateOrUpdateGithubFileCommit
}

export type GithubUser = {
	login: string
	id: number
	node_id: string
	avatar_url: string
	gravatar_id: string | null
	url: string
	html_url: string
	followers_url: string
	following_url: string
	gists_url: string
	starred_url: string
	subscriptions_url: string
	organizations_url: string
	repos_url: string
	events_url: string
	received_events_url: string
	type: 'User' | 'Organization'
	site_admin: boolean
}

export type GithubLicense = {
	key: string
	name: string
	spdx_id: string
	url: string
	node_id: string
	html_url?: string
}

export type GithubSecurityAnalysis = {
	advanced_security: {
		status: 'enabled' | 'disabled'
	}
	secret_scanning: {
		status: 'enabled' | 'disabled'
	}
	secret_scanning_push_protection: {
		status: 'enabled' | 'disabled'
	}
	secret_scanning_non_provider_patterns?: {
		status: 'enabled' | 'disabled'
	}
}

export type GithubRepositoryPermissions = {
	admin: boolean
	push: boolean
	pull: boolean
}

export type GithubRepository = {
	id: number
	node_id: string
	name: string
	full_name: string
	owner: GithubUser
	private: boolean
	html_url: string
	description: string | null
	fork: boolean
	url: string
	archive_url: string
	assignees_url: string
	blobs_url: string
	branches_url: string
	collaborators_url: string
	comments_url: string
	commits_url: string
	compare_url: string
	contents_url: string
	contributors_url: string
	deployments_url: string
	downloads_url: string
	events_url: string
	forks_url: string
	git_commits_url: string
	git_refs_url: string
	git_tags_url: string
	git_url: string
	issue_comment_url: string
	issue_events_url: string
	issues_url: string
	keys_url: string
	labels_url: string
	languages_url: string
	merges_url: string
	milestones_url: string
	notifications_url: string
	pulls_url: string
	releases_url: string
	ssh_url: string
	stargazers_url: string
	statuses_url: string
	subscribers_url: string
	subscription_url: string
	tags_url: string
	teams_url: string
	trees_url: string
	clone_url: string
	mirror_url: string
	hooks_url: string
	svn_url: string
	homepage: string | null
	forks_count: number
	forks: number
	stargazers_count: number
	watchers_count: number
	watchers: number
	size: number
	default_branch: string
	open_issues_count: number
	open_issues: number
	is_template: boolean
	topics: string[]
	has_issues: boolean
	has_projects: boolean
	has_wiki: boolean
	has_pages: boolean
	has_downloads: boolean
	has_discussions: boolean
	archived: boolean
	disabled: boolean
	visibility: 'public' | 'private' | 'internal'
	pushed_at: string
	created_at: string
	updated_at: string
	permissions: GithubRepositoryPermissions
	allow_rebase_merge: boolean
	template_repository: GithubRepository | null
	temp_clone_token: string | null
	allow_squash_merge: boolean
	allow_auto_merge: boolean
	delete_branch_on_merge: boolean
	allow_merge_commit: boolean
	allow_forking: boolean
	subscribers_count: number
	network_count: number
	license: GithubLicense | null
	organization?: GithubUser
	parent?: GithubRepository
	source?: GithubRepository & {
		security_and_analysis?: GithubSecurityAnalysis
	}
}

export type GithubRepositoryContent = {
	type: string
	encoding?: string
	size: number
	name: string
	path: string
	content?: string
	sha: string
	url: string
	git_url: string
	html_url: string
	download_url: string
	_links: {
		git: string
		self: string
		html: string
	}
}
