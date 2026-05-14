import { http, HttpResponse } from 'msw'

const BASE = ''

export const handlers = [
  http.post(`${BASE}/api/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string }
    if (body.email === 'duplicate@test.com') {
      return HttpResponse.json({ error: 'DUPLICATE_EMAIL', message: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }
    return HttpResponse.json({ id: 1, email: body.email, name: body.name, created_at: new Date().toISOString() }, { status: 201 })
  }),

  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.password === 'wrongpassword') {
      return HttpResponse.json({ error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      user: { id: 1, email: body.email, name: '테스트유저', created_at: new Date().toISOString() },
    })
  }),

  http.get(`${BASE}/api/categories`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: '업무', is_default: true },
        { id: 2, name: '개인', is_default: true },
        { id: 3, name: '쇼핑', is_default: true },
        { id: 4, name: '기타', is_default: true },
      ],
    })
  }),

  http.get(`${BASE}/api/todos`, ({ request }) => {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('category_id')
    const isCompleted = url.searchParams.get('is_completed')
    const overdue = url.searchParams.get('overdue')

    const pad = (d: Date) => d.toISOString().slice(0, 10)
    const today = new Date()
    const future = new Date(today); future.setDate(today.getDate() + 5)
    const past = new Date(today); past.setDate(today.getDate() - 5)

    let todos = [
      { id: 1, user_id: 1, category_id: 1, title: '업무 할일', description: null, due_date: pad(future), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, user_id: 1, category_id: 2, title: '개인 할일', description: null, due_date: null, is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, user_id: 1, category_id: 1, title: '기한 초과 할일', description: null, due_date: pad(past), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]

    if (categoryId) {
      todos = todos.filter(t => t.category_id === Number(categoryId))
    }
    if (isCompleted !== null) {
      todos = todos.filter(t => t.is_completed === (isCompleted === 'true'))
    }
    if (overdue === 'true') {
      const today = new Date().toISOString().slice(0, 10)
      todos = todos.filter(t => t.due_date && t.due_date < today && !t.is_completed)
    }

    return HttpResponse.json({ data: todos })
  }),

  http.post(`${BASE}/api/todos`, async ({ request }) => {
    const body = await request.json() as { title: string; category_id: number; description?: string; due_date?: string }
    return HttpResponse.json({
      id: 100, user_id: 1, category_id: body.category_id, title: body.title,
      description: body.description ?? null, due_date: body.due_date ?? null,
      is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get(`${BASE}/api/todos/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 999) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: '할일을 찾을 수 없습니다.' }, { status: 404 })
    }
    return HttpResponse.json({
      id, user_id: 1, category_id: 1, title: '수정할 할일', description: '기존 설명',
      due_date: '2030-06-01', is_completed: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
  }),

  http.put(`${BASE}/api/todos/:id`, async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as { title: string; category_id: number }
    return HttpResponse.json({
      id, user_id: 1, category_id: body.category_id, title: body.title,
      description: null, due_date: null, is_completed: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
  }),

  http.patch(`${BASE}/api/todos/:id/complete`, ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json({
      id, user_id: 1, category_id: 1, title: '업무 할일',
      description: null, due_date: null, is_completed: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/api/todos/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
