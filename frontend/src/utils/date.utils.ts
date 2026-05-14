export function isOverdue(dueDate: string | null | undefined, isCompleted: boolean = false): boolean {
  if (!dueDate || isCompleted) return false
  return dueDate < new Date().toISOString().slice(0, 10)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR')
}
