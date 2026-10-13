import { useState, useRef } from 'react'
import { useStore } from '../../context/StoreContext'
import type { Product, ProductAddOn } from '../../types'
import { generateId, readImageFileAsDataUrl, formatBRL } from '../../utils'

function ProductsManager() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', image: '', categoryId: '', popular: false, available: true
  })
  const [addOns, setAddOns] = useState<ProductAddOn[]>([])

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image: '', categoryId: categories[0]?.id || '', popular: false, available: true })
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
      available: product.available
    })
    setAddOns(product.addOns ? [...product.addOns] : [])
    setShowForm(true)
  }

  const addAddOn = () => {
    setAddOns(prev => [...prev, { id: generateId('addon-'), name: '', price: 0 }])
  }

  const updateAddOn = (id: string, patch: Partial<ProductAddOn>) => {
    setAddOns(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  const removeAddOn = (id: string) => {
    setAddOns(prev => prev.filter(a => a.id !== id))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reseta o input para permitir re-upload do mesmo arquivo
    e.target.value = ''
    if (!file) return
    const result = await readImageFileAsDataUrl(file)
    if (!result.ok) {
      alert(result.error)
      return
    }
    setFormData(prev => ({ ...prev, image: result.dataUrl }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedAddOns = addOns
      .filter(a => a.name.trim())
      .map(a => ({ ...a, name: a.name.trim(), price: a.price || 0 }))
    const product: Product = {
      id: editingProduct?.id || generateId('prod-'),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      image: formData.image,
      categoryId: formData.categoryId,
      popular: formData.popular,
      available: formData.available,
    }
    // `exactOptionalPropertyTypes`: só anexa addOns quando existem itens limpos.
    if (cleanedAddOns.length > 0) product.addOns = cleanedAddOns
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
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <span>+</span> Novo Produto
        </button>
      </div>

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
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
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
                <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">✕</button>
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
                        <span className="text-gray-400 text-2xl">📷</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50"
                      >
                        {formData.image ? 'Trocar foto' : 'Upload foto'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG até 5MB</p>
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
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
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
                            🗑️
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
                    <span className="text-3xl">🍔</span>
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
                  <p className="text-xs text-gray-500 mt-0.5">{category?.icon} {category?.name}</p>
                  {product.addOns && product.addOns.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      ➕ {product.addOns.length} adicional{product.addOns.length > 1 ? 'eis' : ''}{product.addOns[0] ? ` (ex: ${product.addOns[0].name})` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-green-700 font-bold text-sm">{formatBRL(product.price)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(product)}
                      className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-xs"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir produto?')) deleteProduct(product.id) }}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 text-xs"
                      title="Excluir"
                    >
                      🗑️
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
          <span className="text-4xl block mb-2">🍔</span>
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  )
}

export default ProductsManager
