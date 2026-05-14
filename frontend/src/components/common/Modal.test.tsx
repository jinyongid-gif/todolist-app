import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from './Modal'

describe('Modal', () => {
  it('isOpen=false 시 렌더링 안 됨', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="테스트"><p>내용</p></Modal>)
    expect(screen.queryByText('테스트')).not.toBeInTheDocument()
  })
  it('isOpen=true 시 title과 children 표시', () => {
    render(<Modal isOpen onClose={vi.fn()} title="제목"><p>모달 내용</p></Modal>)
    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('모달 내용')).toBeInTheDocument()
  })
  it('닫기 버튼 클릭 시 onClose 호출', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="제목"><p>내용</p></Modal>)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('오버레이 클릭 시 onClose 호출', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="제목"><p>내용</p></Modal>)
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('컨테이너 클릭 시 onClose 미호출 (전파 방지)', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="제목"><p>모달 내용</p></Modal>)
    fireEvent.click(screen.getByText('모달 내용'))
    expect(onClose).not.toHaveBeenCalled()
  })
  it('ESC 키 입력 시 onClose 호출', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="제목"><p>내용</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('isOpen=false 시 ESC 키 이벤트 등록 안 됨', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={false} onClose={onClose} title="제목"><p>내용</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
