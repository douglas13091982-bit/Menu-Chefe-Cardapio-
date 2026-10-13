import { useEffect, useState } from "react";
import { useStore } from "../../context/StoreContext";
import {
  ADMIN_PASSWORD_KEY,
  DEFAULT_ADMIN_PASSWORD,
  formatBRL,
  readImageFileAsDataUrl,
  readStoredAdminPassword,
} from "../../utils";
import MapboxIntegration from "./MapboxIntegration";

function SettingsPanel() {
  const { config, setConfig } = useStore();
  const [formData, setFormData] = useState(config);
  // Mantém o formulário sincronizado caso a configuração seja atualizada em outro lugar.
  useEffect(() => setFormData(config), [config]);
  const [saved, setSaved] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reseta o input para permitir re-upload do mesmo arquivo
    e.target.value = "";
    if (!file) return;
    const result = await readImageFileAsDataUrl(file);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    setFormData((prev) => ({ ...prev, logoUrl: result.dataUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (currentPassword !== readStoredAdminPassword()) {
      setPasswordError("Senha atual incorreta");
      return;
    }
    // Política mínima de senha: 8+ caracteres, com letra e número.
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres, incluindo letras e números");
      return;
    }
    if (newPassword === DEFAULT_ADMIN_PASSWORD) {
      setPasswordError("A nova senha não pode ser a senha padrão de fábrica");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    try {
      localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
    } catch {
      setPasswordError("Não foi possível salvar a senha (armazenamento indisponível)");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordChange(false);
    // A sessão anterior deixa de ser válida após a troca de credencial.
    if (window.confirm("Senha alterada com sucesso. Deseja sair do painel agora?")) {
      window.location.reload();
    }
  };

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
          {/* Logo / Banner */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo da Loja (banner)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              A imagem aparecerá no lugar do nome da loja no banner do cardápio. Recomendado: PNG
              com fundo transparente.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo da loja"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">🖼️</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all">
                  {formData.logoUrl ? "Trocar logo" : "Upload logo"}
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
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                    className="text-red-500 hover:text-red-600 text-sm font-medium text-left"
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Tratto Hamburgueria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Hamburguer Artesanal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="(47) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, openTime: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, closeTime: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, isOpen: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.isOpen ? "🟢 Aberto" : "🔴 Fechado"}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de entrega padrão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))
                }
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido mínimo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minOrder: parseFloat(e.target.value) || 0 }))
                }
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
              <span>📍 {formData.address}</span>
              <span>📞 {formData.phone}</span>
              <span>
                🕐 {formData.openTime} - {formData.closeTime}
              </span>
              <span className={formData.isOpen ? "text-green-600" : "text-red-600"}>
                {formData.isOpen ? "● Aberto" : "● Fechado"}
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-700 font-medium">
                🏷️ Entrega: {formatBRL(formData.deliveryFee)}
              </span>
              <span className="text-gray-500">Pedido mín: {formatBRL(formData.minOrder)}</span>
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
          <span>🔐</span> Segurança - Senha de Acesso
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Altere a senha usada para acessar o painel administrativo.
        </p>
        {readStoredAdminPassword() === DEFAULT_ADMIN_PASSWORD && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 flex items-start gap-2 mb-4">
            <span aria-hidden="true">⚠️</span>
            <span className="text-sm font-medium">
              A senha padrão de fábrica está em uso. Defina uma senha própria imediatamente para
              proteger o painel.
            </span>
          </div>
        )}

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
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Mínimo 8 caracteres, com letras e números"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Repita a nova senha"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordError("");
                }}
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
  );
}

export default SettingsPanel;
