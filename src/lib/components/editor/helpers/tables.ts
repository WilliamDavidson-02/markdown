import { EditorSelection, EditorState, type SelectionRange } from '@codemirror/state'
import { EditorView, ViewUpdate } from '@codemirror/view'
import type { LineChange } from '../types'

export const tableRegex = {
	delimiter: /^\|\s*(?:(:?-+:?)\s*\|)+/,
	row: /^\|(.*?)\|/
}

export const getTableLines = (state: EditorState, range: SelectionRange): LineChange[] => {
	let lines: LineChange[] = []
	let { number } = state.doc.lineAt(range.from)

	for (let i = number; i > 0; i--) {
		const { from, to, text } = state.doc.line(i)
		if (!tableRegex.row.test(text)) break
		lines.unshift({ from, to, insert: text })
	}

	for (let i = number + 1; i <= state.doc.lines; i++) {
		const { from, to, text } = state.doc.line(i)
		if (!tableRegex.row.test(text)) break
		lines.push({ from, to, insert: text })
	}

	// Delimiter must be present on the second line
	if (lines.length > 1 && !tableRegex.delimiter.test(lines[1].insert)) {
		return []
	}

	return lines
}

const getCurrentLine = (
	lines: LineChange[],
	main: EditorSelection['main']
): LineChange | undefined => {
	const lineIndex = lines.findIndex((line) => main.from >= line.from && main.to <= line.to)
	if (lineIndex < 0) return undefined
	return lines[lineIndex]
}

/**
 * Formats the current table cell to replace white spaces with the inserted characters
 */
const formatTableCell = (lines: LineChange[], update: ViewUpdate): LineChange[] => {
	const { main } = update.state.selection
	let line = getCurrentLine(lines, main)
	if (!line) return lines

	const basedCursorPos = main.from - line.from
	const startingPipeIndex = line.insert.lastIndexOf('|', basedCursorPos)
	const closingPipeIndex = line.insert.indexOf('|', basedCursorPos)
	const charBetweenCursorAndPipe = line.insert.slice(basedCursorPos, closingPipeIndex)

	const lineChars = line.insert.split('')
	const insertedLength = update.changes.newLength - update.changes.length

	// Prevent more the one space between the starting pipe and first char for the delimiter cells
	if (tableRegex.delimiter.test(line.insert)) {
		const spacesBefore = getSpacesBeforeFirstChar(line, startingPipeIndex, closingPipeIndex)
		const firstCharIndex = spacesBefore.length + 1
		const startingCellIndex = basedCursorPos - startingPipeIndex

		if (startingCellIndex <= firstCharIndex && spacesBefore.length > 1) {
			lineChars.splice(startingPipeIndex + 1, spacesBefore.length, ' ')
			line.insert = lineChars.join('')
		}
	}

	// If there is a character between the cursor and the pipe, we should not replace a white space with the inserted characters
	if (charBetweenCursorAndPipe.trim().length > 0) return lines

	if (insertedLength > 0) {
		lineChars.splice(
			basedCursorPos,
			charBetweenCursorAndPipe.length >= insertedLength
				? insertedLength
				: charBetweenCursorAndPipe.length
		)
		line.insert = lineChars.join('')
	}

	return lines
}

const getSpacesBeforeFirstChar = (line: LineChange, startIndex: number, endIndex: number) => {
	let firstCharIndex = line.insert.slice(startIndex, endIndex).search(/[^|\s]/)
	return firstCharIndex > -1 ? line.insert.slice(startIndex + 1, startIndex + firstCharIndex) : ''
}

const getSpacesAfterLastChar = (line: LineChange, startIndex: number, endIndex: number) => {
	let lastCharIndex = -1
	const lineChars = line.insert.slice(startIndex, endIndex)
	const lastPipeIndex = lineChars.lastIndexOf('|')
	for (let i = lastPipeIndex; i >= 0; i--) {
		if (!/[|\s]/.test(lineChars[i])) {
			lastCharIndex = i
			break
		}
	}
	return lastCharIndex > -1 ? lineChars.slice(lastCharIndex + 1, endIndex - startIndex - 1) : ''
}

const getColumnBoundaries = (line: LineChange) => {
	return line.insert.split('').reduce((boundaries, char, index) => {
		if (char === '|') boundaries.push(index)
		return boundaries
	}, [] as number[])
}

const formatColumnWidth = (lines: LineChange[], update: ViewUpdate): LineChange[] => {
	const { main } = update.state.selection
	const line = getCurrentLine(lines, main)
	if (!line) return lines

	const columnCount = line.insert.split('').reduce((count, char) => {
		if (char === '|') count++
		return count
	}, -1)

	const basedCursorPos = main.from - line.from

	for (let i = 0; i < columnCount; i++) {
		const columnBoundaries = getColumnBoundaries(line)
		const currentCellStartIndex = columnBoundaries[i]
		const currentCellEndIndex = columnBoundaries[i + 1] + 1
		const currentCell = line.insert.slice(currentCellStartIndex, currentCellEndIndex)
		const spacesBeforeFirstChar = getSpacesBeforeFirstChar(
			line,
			currentCellStartIndex,
			currentCellEndIndex
		)
		const spacesAfterLastChar = getSpacesAfterLastChar(
			line,
			currentCellStartIndex,
			currentCellEndIndex
		)

		// add spaces before the first character of the cell
		lines = lines.map((row): LineChange => {
			const columnBoundaries = getColumnBoundaries(row)
			const startIndex = columnBoundaries[i]
			const endIndex = columnBoundaries[i + 1]
			const rowChars = row.insert.split('')
			const isRowDelimiter = tableRegex.delimiter.test(row.insert)
			if (startIndex < basedCursorPos && row.from !== line.from) {
				const currentSpaces = getSpacesBeforeFirstChar(row, startIndex, endIndex)
				const spacesToAdd = spacesBeforeFirstChar.length - currentSpaces.length
				const totalSpaces = currentSpaces.length + spacesToAdd
				if (spacesToAdd > 0) {
					rowChars.splice(
						startIndex + 1,
						currentSpaces.length,
						currentSpaces +
							' '.repeat(
								isRowDelimiter ? (totalSpaces > 1 && currentSpaces.length > 0 ? 0 : 1) : spacesToAdd
							)
					)
				} else if (spacesToAdd < 0) {
					rowChars.splice(startIndex + 1, currentSpaces.length, currentSpaces.slice(0, spacesToAdd))
				}
			}

			return { ...row, insert: rowChars.join('') }
		})

		let widestCell = lines.reduce(
			(widest, row) => {
				const columnBoundaries = getColumnBoundaries(row)
				const startIndex = columnBoundaries[i]
				const endIndex = columnBoundaries[i + 1] + 1
				const cell = row.insert.slice(startIndex, endIndex)
				const spaces = getSpacesAfterLastChar(row, startIndex, endIndex)

				if (tableRegex.delimiter.test(cell)) return widest

				if (row.from !== line.from) {
					const currentCellContent = cell.length - spaces.length
					const widestCellContent = widest.insert.length - widest.spaces.length

					if (currentCellContent > widestCellContent && currentCell.length < currentCellContent) {
						return { insert: cell, from: row.from, spaces }
					}
				}

				if (cell.length > widest.insert.length) {
					return { insert: cell, from: row.from, spaces }
				}

				return widest
			},
			{ insert: currentCell, from: line.from, spaces: spacesAfterLastChar }
		)

		/**
		 * Current cell is less then widest cell
		 * as long as the current cell is not shorter then the widest cell minus the spaces after the widest last char
		 */
		if (
			currentCell.length <= widestCell.insert.length &&
			currentCell.length >= widestCell.insert.length - widestCell.spaces.length
		) {
			widestCell = {
				insert: currentCell,
				from: line.from,
				spaces: widestCell.spaces
			}
		}

		// add spaces after the last character of the cell
		lines = lines.map((row): LineChange => {
			const columnBoundaries = getColumnBoundaries(row)
			const startIndex = columnBoundaries[i]
			const endIndex = columnBoundaries[i + 1] + 1
			const rowChars = row.insert.split('')
			const isDelimiter = tableRegex.delimiter.test(row.insert)
			if (startIndex < basedCursorPos) {
				const currentSpaces = getSpacesAfterLastChar(row, startIndex, endIndex)
				// For delimiter
				const spacesBefore = getSpacesBeforeFirstChar(row, startIndex, endIndex)
				const startingPipeIndex = row.insert.indexOf('|', startIndex)
				const endingPipeIndex = row.insert.lastIndexOf('|', endIndex)
				const hasLeftAlignment = row.insert.slice(startIndex, endIndex).includes(':-')
				const hasRightAlignment = row.insert.slice(startIndex, endIndex).includes('-:')
				const firstCharIndex =
					startingPipeIndex + 1 + spacesBefore.length + (hasLeftAlignment ? 1 : 0) // to skip : alignment
				const lastCharIndex =
					endingPipeIndex - startingPipeIndex - currentSpaces.length - (hasRightAlignment ? 2 : 0) // to skip : alignment

				let spacesToAdd = widestCell.insert.length - row.insert.slice(startIndex, endIndex).length

				// If the widest cell is the delimiter spaces to add will be 0 but the spacing between
				// last char and ending pipe can be more then 1, that is why need to replace the extra spacing with "-"
				if (isDelimiter) {
					spacesToAdd = currentSpaces.length > 1 ? currentSpaces.length - 1 : spacesToAdd
				}

				if (spacesToAdd > 0) {
					if (isDelimiter) {
						if (currentSpaces.length > 1) {
							rowChars.splice(
								startingPipeIndex + lastCharIndex + (hasRightAlignment ? 2 : 1),
								currentSpaces.length - 1
							)
						}
						rowChars[firstCharIndex] = '-'.repeat(spacesToAdd + 1)
					} else {
						rowChars.splice(
							endIndex - 1 - currentSpaces.length,
							currentSpaces.length,
							currentSpaces + ' '.repeat(spacesToAdd)
						)
					}
				} else if (spacesToAdd < 0) {
					if (isDelimiter) {
						spacesToAdd = spacesToAdd > lastCharIndex - firstCharIndex ? 0 : spacesToAdd
						rowChars.splice(firstCharIndex, Math.abs(spacesToAdd))
					} else {
						rowChars.splice(
							endIndex - 1 - currentSpaces.length,
							currentSpaces.length,
							currentSpaces.slice(0, spacesToAdd)
						)
					}
				}
			}

			return { ...row, insert: rowChars.join('') }
		})
	}

	return lines
}

const getNewCursorPosition = (lines: LineChange[], range: SelectionRange, state: EditorState) => {
	let lengthChangeBefore = lines[0].from

	for (const line of lines) {
		const isAllBefore = line.to <= range.from
		const isPartiallyBefore = line.from <= range.from && line.to >= range.from
		if (isAllBefore) {
			lengthChangeBefore += line.insert.length + 1
		} else if (isPartiallyBefore) {
			const originalLine = state.doc.lineAt(line.from)
			const beforeCursor = originalLine.text.slice(0, range.from - originalLine.from)
			lengthChangeBefore += beforeCursor.length
		}
	}

	return lengthChangeBefore
}

let resized = false

/**
 * Resizes all table cells to fit the content of the widest cell
 */
export const resizeTable = EditorView.updateListener.of((update: ViewUpdate) => {
	if (!update.docChanged) return
	if (resized) {
		resized = false
		return
	}

	const changes = update.state.changeByRange((range) => {
		let lines = getTableLines(update.state, range)

		if (lines.length < 1) return { range }
		lines = formatTableCell(lines, update)

		lines = formatColumnWidth(lines, update)

		const newCursorPos = getNewCursorPosition(lines, range, update.state)

		resized = true
		return { range: EditorSelection.cursor(newCursorPos), changes: lines }
	})

	if (!changes.changes.empty) {
		update.view.dispatch(changes)
	}
})
