<script lang="ts">
	import { getSettings } from '../settingsContext'

	/**
	 * Auto save
	 * font-size
	 * tap-size
	 * word-wrap
	 */

	const settings = getSettings()

	console.log($settings?.editorSettings)
</script>

<div>Editor</div>
