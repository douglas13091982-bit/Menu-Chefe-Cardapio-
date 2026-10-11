// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { supabase } from '@/integrations/supabase/client'
import { DAY_LABELS, DAY_ORDER, getWeeklyHours, getStoreStatus } from '../../hours'
import MapboxIntegration from './MapboxIntegration'

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG...)')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
    // Reseta o input para permitir re-upload do mesmo arquivo
    e.target.value = ''
  }

  // Imagem do banner: reduz para no máximo 1600 px de largura e comprime (fica leve para carregar no celular)
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG...)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 1600 / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { alert('Não foi possível processar a imagem.'); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        let dataUrl = canvas.toDataURL('image/webp', 0.8)
        if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setFormData(prev => ({ ...prev, bannerImage: dataUrl }))
      }
      img.onerror = () => alert('Não foi possível ler a imagem.')
      img.src = reader.result as string
    }
    reader.onerror = () => alert('Não foi possível ler o arquivo.')
    reader.readAsDataURL(file)
  }

  const weekly = getWeeklyHours(formData)
  const previewStatus = getStoreStatus(formData)
  const updateDay = (index: number, patch: Partial<{ open: boolean; openTime: string; closeTime: string }>) => {
    setFormData(prev => ({ ...prev, weeklyHours: getWeeklyHours(prev).map((d, i) => (i === index ? { ...d, ...patch } : d)) }))
  }
  const copyMondayToAll = () => {
    setFormData(prev => {
      const monday = getWeeklyHours(prev)[1]
      return { ...prev, weeklyHours: getWeeklyHours(prev).map(() => ({ ...monday })) }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfig({ ...formData, weeklyHours: getWeeklyHours(formData) })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setPasswordError('Sessão expirada. Saia e entre novamente.')
        return
      }
      const { error: signError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
      if (signError) {
        setPasswordError('Senha atual incorreta')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setPasswordError('Não foi possível alterar a senha: ' + updateError.message)
        return
      }
    } catch {
      setPasswordError('Não foi possível alterar a senha agora. Tente novamente.')
      return
    }
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
          <span></span>
          <span className="text-sm font-medium">Configurações salvas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span></span> Informações da Loja
          </h3>
          {/* Logo / Banner */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Loja</label>
            <p className="text-xs text-gray-400 mb-2">
              O logo aparece no centro do banner, no lugar do nome da loja. Recomendado: PNG com fundo transparente ou com fundo sólido (o banner adota a cor do fundo do logo).
            </p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo da loja" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-3xl"></span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all">
                  {formData.logoUrl ? 'Trocar logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                    className="text-red-500 hover:text-red-600 text-sm font-medium text-left"
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Banner (foto de fundo)</label>
            <p className="text-xs text-gray-400 mb-2">
              Foto ou arte que ocupa todo o banner no topo do cardápio. O logo (se houver) fica por cima, no centro. Recomendado: imagem horizontal, ex.: 1600 x 500 px.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-64 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.bannerImage ? (
                  <img src={formData.bannerImage} alt="Imagem do banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-400">Nenhuma imagem</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all text-center">
                  {formData.bannerImage ? 'Trocar imagem do banner' : 'Enviar imagem do banner'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                {formData.bannerImage && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, bannerImage: '' }))}
                    className="text-red-500 hover:text-red-600 text-sm font-medium text-left"
                  >
                    Remover imagem do banner
                  </button>
                )}
                <span className="text-xs text-gray-400">Clique em "Salvar Configurações" para publicar.</span>
              </div>
            </div>
          </div>
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
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span></span> Horário de Funcionamento
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Defina os dias e horários em que a loja atende. Para fechar depois da meia-noite, use um fechamento menor que a abertura (ex.: 18:00 às 02:00).
          </p>
          <div className="space-y-2">
            {DAY_ORDER.map(i => {
              const d = weekly[i]
              return (
                <div key={i} className="flex flex-wrap items-center gap-3 border rounded-lg px-3 py-2">
                  <label className="flex items-center gap-2 w-40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.open}
                      onChange={e => updateDay(i, { open: e.target.checked })}
                      className="w-4 h-4"
                      style={{ accentColor: '#ef4444' }}
                    />
                    <span className="text-sm font-medium text-gray-700">{DAY_LABELS[i]}</span>
                  </label>
                  {d.open ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={d.openTime}
                        onChange={e => updateDay(i, { openTime: e.target.value })}
                        className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-gray-500">às</span>
                      <input
                        type="time"
                        value={d.closeTime}
                        onChange={e => updateDay(i, { closeTime: e.target.value })}
                        className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Fechado</span>
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={copyMondayToAll}
            className="mt-3 border border-red-500 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-all"
          >
            Copiar o horário de segunda para todos os dias
          </button>

          <div className="mt-5 pt-4 border-t">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOpen}
                onChange={e => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isOpen ? ' Loja funcionando no horário acima' : ' Loja fechada agora (ignora o horário)'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Desligue para fechar a loja na hora, mesmo dentro do horário (feriado, imprevisto).</p>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span></span> Configurações de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa base de entrega (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={e => setFormData(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor por km rodado (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deliveryPerKm ?? 0}
                onChange={e => setFormData(prev => ({ ...prev, deliveryPerKm: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Use 0 para não cobrar por km (só a taxa base). O cálculo pelo Mapbox é ligado ou desligado na aba Entrega.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distância máxima de entrega (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.maxDeliveryKm ?? 0}
                onChange={e => setFormData(prev => ({ ...prev, maxDeliveryKm: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Use 0 para não limitar. Acima disso o pedido para entrega é bloqueado.</p>
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
          <p className="text-xs text-gray-500 mt-4">
            Frete = taxa base + valor por km × distância pela rota de carro (calculada pelo Mapbox a partir do endereço da loja). Requer o token do Mapbox em Integrações.
          </p>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span></span> Pré-visualização
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt={`${formData.name} logo`}
                  className="w-12 h-12 rounded-xl object-contain bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{formData.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-800">{formData.name}</h4>
                <p className="text-xs text-gray-500">{formData.subtitle}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
              <span> {formData.address}</span>
              <span> {formData.phone}</span>
              <span className={previewStatus.open ? 'text-green-600' : 'text-red-600'}>
                ● {previewStatus.text}
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-700 font-medium"> Entrega: R$ {formData.deliveryFee.toFixed(2).replace('.', ',')}</span>
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

      {/* Integrações */}
      <MapboxIntegration />

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span></span> Segurança - Senha de Acesso
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
                <span></span>
                <span className="text-sm font-medium">Senha alterada com sucesso!</span>
              </div>
            )}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
                <span></span>
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
                placeholder="Mínimo 6 caracteres"
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
