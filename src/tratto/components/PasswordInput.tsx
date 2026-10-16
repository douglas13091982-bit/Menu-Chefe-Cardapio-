import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Campo de senha com o "olho" para mostrar/ocultar o que está sendo digitado. */
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'block' }}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={{ ...(props.style || {}), paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={show}
        title={show ? 'Ocultar senha' : 'Mostrar senha'}
        style={{
          position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
          width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', borderRadius: '8px',
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  )
}
