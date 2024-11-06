export type SelectedItem = {
	id: string
	name: string
	type: 'file' | 'folder'
	childIds?: string[]
}
