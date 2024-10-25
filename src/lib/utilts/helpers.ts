export const getWordCount = (value: string) => {
	const wordBoundaries = value.match(/\b\w+\b/g)
	return wordBoundaries ? wordBoundaries.length : 0
}

export const getCharacterCount = (value: string) => {
	return value.replace(/\s/g, '').length
}
