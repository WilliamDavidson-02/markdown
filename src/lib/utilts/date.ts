export const getDaysDifference = (date: Date): number => {
	const now = new Date()
	const inputDate = new Date(date)
	const diffTime = Math.abs(now.getTime() - inputDate.getTime())
	return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
