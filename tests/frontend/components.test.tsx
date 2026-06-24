import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from '@components/Common/Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('applies variant class', () => {
    const { container } = render(<Button variant="primary">Test</Button>)
    const button = container.querySelector('.button-primary')
    expect(button).toBeInTheDocument()
  })

  it('applies size class', () => {
    const { container } = render(<Button size="large">Test</Button>)
    const button = container.querySelector('.button-large')
    expect(button).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = Button.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    const button = screen.getByRole('button')
    button.click()
    expect(handleClick).toHaveBeenCalled()
  })
})
