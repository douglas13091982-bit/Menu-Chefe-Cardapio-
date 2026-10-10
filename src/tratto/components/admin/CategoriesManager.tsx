// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { Category } from '../../types'

function CategoriesManager() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', icon: '🍔', order: 0 })

  const resetForm = () => {
    setFormData({ name: '', icon: '🍔', order: categories.length + 1 })
    setEditingCategory(null)
    setShowForm(false)
  }

  const openEditForm = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, icon: category.icon, order: category.order })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const category: Category = {
      id: editingCategory?.id || Date.now().toString(),
      name: formData.name,
      icon: formData.icon,
      order: formData.order || categories.length + 1
    }
    if (editingCategory) {
      updateCategory(category)
    } else {
      addCategory(category)
    }
    resetForm()
  }

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  const emojiOptions = ['🍔', '🌭', '🍟', '🥤', '🍫', '🎁', '🍕', '🌮', '🥗', '🍗', '🧁', '🍰', '☕', '🍺', '🥩', '🐟']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
          <p className="text-gray-500 text-sm">{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <span>+</span> Nova Categoria
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                  <div className="grid grid-cols-8 gap-2">
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          formData.icon === emoji
                            ? 'bg-red-100 border-2 border-red-500 scale-110'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
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
                    placeholder="Ex: Hambúrgueres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm">
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {sortedCategories.map(category => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
              {category.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{category.name}</h4>
              <p className="text-xs text-gray-500">{getProductCount(category.id)} produtos • Ordem: {category.order}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditForm(category)}
                className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (getProductCount(category.id) > 0) {
                    alert('Não é possível excluir uma categoria com produtos. Mova os produtos primeiro.')
                    return
                  }
                  if (confirm('Excluir categoria?')) deleteCategory(category.id)
                }}
                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                title="Excluir"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl block mb-2">📁</span>
          <p>Nenhuma categoria cadastrada</p>
        </div>
      )}
    </div>
  )
}

export default CategoriesManager
