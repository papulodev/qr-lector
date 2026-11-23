import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toDataURL } from 'qrcode'
import App from './App'

vi.mock('qrcode', () => ({ toDataURL: vi.fn() }))

const mockedToDataURL = vi.mocked(toDataURL)

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, writable: true })

describe('QR generator tab', () => {
  let container: HTMLDivElement
  let root: Root
  let clickSpy: ReturnType<typeof vi.spyOn>

  const render = () => {
    act(() => {
      root.render(<App />)
    })
  }

  const click = async (element: Element) => {
    await act(async () => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }

  const setValue = async (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set
      setter?.call(element, value)
      element.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  const setSelect = async (element: HTMLSelectElement, value: string) => {
    await act(async () => {
      element.value = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }

  beforeEach(() => {
    mockedToDataURL.mockResolvedValue('data:image/png;base64,AAA')
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      void this
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    clickSpy.mockRestore()
    container.remove()
  })

  it('exposes both tabs and starts on the scanner', () => {
    render()

    const tabs = Array.from(container.querySelectorAll('[role="tab"]'))
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Escanear QR', 'Generar QR'])
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(container.querySelector('#out')).not.toBeNull()
  })

  it('renders all six formats and a live preview after switching to Generar QR', async () => {
    render()
    const tabs = container.querySelectorAll('[role="tab"]')
    await click(tabs[1])

    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(container.querySelector('#out')).toBeNull()

    const format = container.querySelector('#qr-format') as HTMLSelectElement
    expect(Array.from(format.options).map((option) => option.textContent)).toEqual([
      'URL',
      'Texto',
      'Wi-Fi',
      'Contacto (vCard)',
      'Correo',
      'Teléfono',
    ])

    await setValue(container.querySelector('#qr-url') as HTMLInputElement, 'example.com')
    await act(async () => {
      await Promise.resolve()
    })

    const preview = container.querySelector('.qr-preview') as HTMLImageElement
    expect(preview.getAttribute('src')).toBe('data:image/png;base64,AAA')
    expect(mockedToDataURL).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ type: 'image/png' }),
    )
  })

  it('shows contact fields and downloads a JPG for the selected payload', async () => {
    render()
    await click(container.querySelectorAll('[role="tab"]')[1])

    await setSelect(container.querySelector('#qr-format') as HTMLSelectElement, 'vcard')
    expect(container.querySelector('#qr-vcard-name')).not.toBeNull()

    await setSelect(container.querySelector('#qr-format') as HTMLSelectElement, 'url')
    await setValue(container.querySelector('#qr-url') as HTMLInputElement, 'https://example.com')
    await act(async () => {
      await Promise.resolve()
    })

    const jpgButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Descargar JPG',
    ) as HTMLButtonElement
    await click(jpgButton)

    expect(clickSpy).toHaveBeenCalledOnce()
    expect((clickSpy.mock.instances[0] as HTMLAnchorElement).download).toBe('qr-code.jpg')
    expect(mockedToDataURL).toHaveBeenLastCalledWith(
      'https://example.com',
      expect.objectContaining({ type: 'image/jpeg' }),
    )
  })
})
