import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import TodoListPage from '../pages/TodoListPage'
import TodoCreatePage from '../pages/TodoCreatePage'
import TodoEditPage from '../pages/TodoEditPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  if (token) return <Navigate to="/todos" replace />
  return <>{children}</>
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <PrivateRoute>
            <TodoListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/todos/create"
        element={
          <PrivateRoute>
            <TodoCreatePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/todos/:id/edit"
        element={
          <PrivateRoute>
            <TodoEditPage />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default AppRouter
