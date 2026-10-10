import { useState } from 'react'
import { useStore } from '../../context/StoreContext'

function SettingsPanel() {
  const { config, setConfig } = useStore()
  const [formData, setFormData] = useState(config)
  const [saved, setSaved] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfig(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    const ADMIN_PASSWORD_KEY = 'admin_password'
    const currentStoredPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123'
    
    if (currentPassword !== currentStoredPassword) {
      setPasswordError('Senha atual incorreta')
      return
    }
    if (newPassword.length < 4) {
      setPasswordError('A nova senha deve ter pelo menos 4 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }
    
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword)
    setPasswordSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => {
      setPasswordSaved(false)
      setShowPasswordChange(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500 text-sm">Configure as informações do seu restaurante</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
          <span>✅</span>
          <span className="text-sm font-medium">Configurações salvas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏪</span> Informações da Loja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Restaurante *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Tratto Hamburgueria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Hamburguer Artesanal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="(47) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🕐</span> Horário de Funcionamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
              <input
                type="time"
                value={formData.openTime}
                onChange={e => setFormData(prev => ({ ...prev, openTime: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={e => setFormData(prev => ({ ...prev, closeTime: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center gap-3 h-[42px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOpen}
                    onChange={e => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🛵</span> Configurações de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de entrega padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={e => setFormData(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrder}
                onChange={e => setFormData(prev => ({ ...prev, minOrder: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>👁️</span> Pré-visualização
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{formData.name.charAt(0)}</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{formData.name}</h4>
                <p className="text-xs text-gray-500">{formData.subtitle}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
              <span>📍 {formData.address}</span>
              <span>📞 {formData.phone}</span>
              <span>🕐 {formData.openTime} - {formData.closeTime}</span>
              <span className={formData.isOpen ? 'text-green-600' : 'text-red-600'}>
                {formData.isOpen ? '● Aberto' : '● Fechado'}
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-700 font-medium">🏷️ Entrega: R$ {formData.deliveryFee.toFixed(2).replace('.', ',')}</span>
              <span className="text-gray-500">Pedido mín: R$ {formData.minOrder.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-all"
        >
          Salvar Configurações
        </button>
      </form>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔐</span> Segurança - Senha de Acesso
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Altere a senha usada para acessar o painel administrativo.
        </p>
        
        {!showPasswordChange ? (
          <button
            type="button"
            onClick={() => setShowPasswordChange(true)}
            className="border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
          >
            Alterar Senha
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSaved && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
                <span>✅</span>
                <span className="text-sm font-medium">Senha alterada com sucesso!</span>
              </div>
            )}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
                <span>⚠️</span>
                <span className="text-sm font-medium">{passwordError}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Digite a senha atual"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Repita a nova senha"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowPasswordChange(false); setPasswordError('') }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm"
              >
                Confirmar Alteração
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
