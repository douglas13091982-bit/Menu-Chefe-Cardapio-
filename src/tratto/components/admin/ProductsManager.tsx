// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState, useRef } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { Product, ProductAddOn } from '../../types'
import CatalogImport from './CatalogImport'
import { money } from '../../format'
import { compressImageToWebP, isImageFile } from '@/lib/image-compress'

const DELIVERY_DAYS = [
  { value: 1, label: 'Segunda' }, { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' }, { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' }, { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

function ProductsManager() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', image: '', categoryId: '', popular: false, available: true, deliveryDays: [] as number[]
  })
  const [addOns, setAddOns] = useState<ProductAddOn[]>([])

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image: '', categoryId: categories[0]?.id || '', popular: false, available: true, deliveryDays: [] })
    setAddOns([])
    setEditingProduct(null)
    setShowForm(false)
  }

  const openEditForm = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      categoryId: product.categoryId,
      popular: product.popular || false,
      available: product.available,
      deliveryDays: Array.isArray(product.deliveryDays) ? [...product.deliveryDays] : []
    })
    setAddOns(product.addOns ? [...product.addOns] : [])
    setShowForm(true)
  }

  const addAddOn = () => {
    setAddOns(prev => [...prev, { id: Date.now().toString(), name: '', price: 0 }])
  }

  const updateAddOn = (id: string, patch: Partial<ProductAddOn>) => {
    setAddOns(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  const removeAddOn = (id: string) => {
    setAddOns(prev => prev.filter(a => a.id !== id))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!isImageFile(file)) {
      alert('Por favor, selecione um arquivo de imagem (JPG, PNG, WebP...).')
      return
    }
    setUploadingImage(true)
    try {
      // Produtos: max 1200px, qualidade 0.8 → leve no cardápio mobile
      const result = await compressImageToWebP(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      })
      setFormData(prev => ({ ...prev, image: result.dataUrl! }))
    } catch (err: any) {
      alert(err?.message || 'Não foi possível processar a imagem.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedAddOns = addOns
      .filter(a => a.name.trim())
      .map(a => ({ ...a, name: a.name.trim(), price: a.price || 0 }))
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      image: formData.image,
      categoryId: formData.categoryId,
      popular: formData.popular,
      available: formData.available,
      addOns: cleanedAddOns.length > 0 ? cleanedAddOns : undefined,
      deliveryDays: formData.deliveryDays
    }
    if (editingProduct) {
      updateProduct(product)
    } else {
      addProduct(product)
    }
    resetForm()
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || p.categoryId === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-500 text-sm">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm"
        >
          Importar catálogo
        </button>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <span>+</span> Novo Produto
        </button>
        </div>
      </div>
      {showImport && <CatalogImport onClose={() => setShowImport(false)} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Todas categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">Sem foto</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                      >
                        {uploadingImage ? 'Comprimindo…' : formData.image ? 'Trocar foto' : 'Upload foto'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG ou WebP — convertida automaticamente para WebP</p>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="text-xs text-red-500 mt-1 hover:underline"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: Tratto Duplo Cheddar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none"
                    placeholder="Descreva os ingredientes..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Selecione</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={e => setFormData(prev => ({ ...prev, popular: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Produto popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={e => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Disponível</span>
                  </label>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 text-sm font-semibold text-gray-800">Dias de entrega deste produto</div>
                  <p className="mb-3 text-xs text-gray-500">Opcional. Selecione os dias em que este produto pode ser entregue. Sem seleção, não há restrição. Quando houver restrição, o cliente precisará agendar uma data compatível.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DELIVERY_DAYS.map(day => (
                      <label key={day.value} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.deliveryDays.includes(day.value)}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            deliveryDays: e.target.checked
                              ? [...prev.deliveryDays, day.value]
                              : prev.deliveryDays.filter(value => value !== day.value)
                          }))}
                          className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Adicionais */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Adicionais (opcionais)</label>
                    <button
                      type="button"
                      onClick={addAddOn}
                      className="border border-green-600 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-50 flex items-center gap-1"
                    >
                      <span>+</span> Adicionar item
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Ex: Borda recheada + R$ 5,00. O cliente poderá escolher no cardápio.
                  </p>
                  {addOns.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center text-xs text-gray-400 bg-gray-50">
                      Nenhum adicional cadastrado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addOns.map(addOn => (
                        <div key={addOn.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={addOn.name}
                            onChange={e => updateAddOn(addOn.id, { name: e.target.value })}
                            placeholder="Nome do adicional (ex: Borda recheada)"
                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={addOn.price || ''}
                              onChange={e => updateAddOn(addOn.id, { price: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-24 border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddOn(addOn.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 text-xs flex-shrink-0"
                            title="Remover adicional"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm"
                  >
                    {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map(product => {
          const category = categories.find(c => c.id === product.categoryId)
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
              <div className="w-24 h-24 flex-shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <span className="text-3xl"></span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
                    {!product.available && (
                      <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded">Indisponível</span>
                    )}
                    {product.popular && (
                      <span className="bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded">Popular</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{category?.name}</p>
                  {product.addOns && product.addOns.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                       {product.addOns.length} adicional{product.addOns.length > 1 ? 'eis' : ''} (ex: {product.addOns[0].name})
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-green-700 font-bold text-sm">{money(product.price)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(product)}
                      className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-xs"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir produto?')) deleteProduct(product.id) }}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 text-xs"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl block mb-2"></span>
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  )
}

export default ProductsManager
