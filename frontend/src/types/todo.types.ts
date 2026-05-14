export interface Todo {
  id: number
  user_id: number
  category_id: number
  title: string
  description?: string
  due_date?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateTodoDto {
  title: string
  description?: string
  due_date?: string
  category_id: number
}

export interface UpdateTodoDto extends Partial<CreateTodoDto> {}

export interface TodoFilters {
  category_id?: number
  is_completed?: boolean
  overdue?: boolean
  due_date_from?: string
  due_date_to?: string
}
