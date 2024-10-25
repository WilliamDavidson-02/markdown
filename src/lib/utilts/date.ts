export const getDaysDifference = (date: Date): number => {
	const now = new Date()
	const inputDate = new Date(date)
	const diffTime = Math.abs(now.getTime() - inputDate.getTime())
	return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export const formatDateWithTime = (date: Date) => {
	return date
		.toLocaleString('sv-SE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
		.replace(',', '')
}
