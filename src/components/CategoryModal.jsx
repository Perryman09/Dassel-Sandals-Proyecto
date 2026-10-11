import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Tag, Folder, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CategoryModal({ onClose }) {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    products,
  } = useApp();

  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'zapatos');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [editingSubcat, setEditingSubcat] = useState(null);
  const [editingSubcatText, setEditingSubcatText] = useState('');

  // Estados para crear nueva categoría
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✨');
  const [newCatError, setNewCatError] = useState('');

  // Estados para editar nombre de categoría actual
  const [editingCatName, setEditingCatName] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');

  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const handleAddSubcategory = (e) => {
    e.preventDefault();
    const trimmed = newSubcatName.trim();
    if (!trimmed || !currentCategory) return;

    if ((currentCategory.subcategories || []).map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      alert('Esta subcategoría ya existe.');
      return;
    }

    addSubcategory(currentCategory.id, trimmed);
    setNewSubcatName('');
  };

  const handleDeleteSubcategory = (subcat) => {
    const productsInSub = products.filter(
      p => p.category === currentCategory.id && p.subcategory === subcat
    );

    if (productsInSub.length > 0) {
      if (!window.confirm(`Hay ${productsInSub.length} producto(s) asignados a "${subcat}". ¿Deseas eliminar la subcategoría de todas formas?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Eliminar la subcategoría "${subcat}"?`)) return;
    }

    deleteSubcategory(currentCategory.id, subcat);
  };

  const handleStartEditSubcat = (subcat) => {
    setEditingSubcat(subcat);
    setEditingSubcatText(subcat);
  };

  const handleSaveEditSubcat = () => {
    if (!editingSubcatText.trim() || editingSubcatText.trim() === editingSubcat) {
      setEditingSubcat(null);
      return;
    }
    updateSubcategory(currentCategory.id, editingSubcat, editingSubcatText.trim());
    setEditingSubcat(null);
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setNewCatError('Ingresa un nombre para la categoría');
      return;
    }

    const slug = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 20);

    if (categories.some(c => c.id === slug)) {
      setNewCatError('Ya existe una categoría similar');
      return;
    }

    addCategory({
      id: slug,
      name: trimmed,
      icon: newCatIcon || '📦',
      subcategories: ['General', 'Otro'],
    });

    setSelectedCatId(slug);
    setNewCatName('');
    setShowNewCatForm(false);
    setNewCatError('');
  };

  const handleDeleteCategory = (catId) => {
    if (categories.length <= 1) {
      alert('Debe existir al menos una categoría en el sistema.');
      return;
    }

    const prods = products.filter(p => p.category === catId);
    if (prods.length > 0) {
      alert(`No se puede eliminar porque existen ${prods.length} productos en esta categoría. Reasígnalos primero.`);
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar esta categoría y sus subcategorías?')) return;

    deleteCategory(catId);
    const nextRemaining = categories.find(c => c.id !== catId);
    if (nextRemaining) setSelectedCatId(nextRemaining.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg category-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Folder size={22} color="var(--accent)" />
            <h2>Gestión de Categorías &amp; Subcategorías</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body category-modal-layout">
          {/* COLUMNA IZQUIERDA: LISTA DE CATEGORÍAS */}
          <div className="category-sidebar-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                CATEGORÍAS ({categories.length})
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewCatForm(!showNewCatForm)}
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
              >
                <Plus size={14} /> Nueva
              </button>
            </div>

            {showNewCatForm && (
              <form onSubmit={handleCreateCategory} className="new-category-mini-card">
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Nueva Categoría</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select
                    value={newCatIcon}
                    onChange={e => setNewCatIcon(e.target.value)}
                    style={{ width: 55, padding: '4px 6px', textAlign: 'center' }}
                  >
                    <option value="👡">👡</option>
                    <option value="💎">💎</option>
                    <option value="👠">👠</option>
                    <option value="👜">👜</option>
                    <option value="👗">👗</option>
                    <option value="✨">✨</option>
                    <option value="📦">📦</option>
                  </select>
                  <input
                    placeholder="Nombre (ej. Bolsos)"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>
                {newCatError && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{newCatError}</small>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowNewCatForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Crear
                  </button>
                </div>
              </form>
            )}

            <div className="category-items-list">
              {categories.map(c => {
                const count = products.filter(p => p.category === c.id).length;
                const isSelected = selectedCatId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`category-item-row ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCatId(c.id);
                      setEditingCatName(false);
                      setEditingSubcat(null);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.25rem' }}>{c.icon || '📁'}</span>
                      <span className="cat-name">{c.name}</span>
                    </div>
                    <span className="cat-badge">{count} prods</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: SUBCATEGORÍAS DE LA SELECCIONADA */}
          <div className="subcategory-detail-pane">
            {currentCategory ? (
              <>
                <div className="current-cat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <span style={{ fontSize: '1.8rem' }}>{currentCategory.icon || '📁'}</span>
                    {editingCatName ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={catNameInput}
                          onChange={e => setCatNameInput(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '1rem', fontWeight: 700 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="icon-btn"
                          title="Guardar nombre"
                          onClick={() => {
                            if (catNameInput.trim()) {
                              updateCategory(currentCategory.id, { name: catNameInput.trim() });
                            }
                            setEditingCatName(false);
                          }}
                        >
                          <Check size={18} color="var(--success)" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Cancelar"
                          onClick={() => setEditingCatName(false)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3>{currentCategory.name}</h3>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Editar nombre de categoría"
                          onClick={() => {
                            setCatNameInput(currentCategory.name);
                            setEditingCatName(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {categories.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      style={{ color: 'var(--danger)', border: '1px solid var(--danger-bg)' }}
                      onClick={() => handleDeleteCategory(currentCategory.id)}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={15} /> Eliminar Categoría
                    </button>
                  )}
                </div>

                <div className="subcat-section-title">
                  <Tag size={16} color="var(--accent)" />
                  <span>Subcategorías registradas: ({(currentCategory.subcategories || []).length})</span>
                </div>

                {/* FORMULARIO RÁPIDO PARA AGREGAR SUBCATEGORÍA */}
                <form onSubmit={handleAddSubcategory} className="add-subcat-form">
                  <input
                    placeholder={`Agregar nueva subcategoría a ${currentCategory.name}...`}
                    value={newSubcatName}
                    onChange={e => setNewSubcatName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!newSubcatName.trim()}>
                    <Plus size={16} /> Agregar
                  </button>
                </form>

                {/* LISTA DE SUBCATEGORÍAS EN CHIPS */}
                <div className="subcategories-grid">
                  {(currentCategory.subcategories || []).map(sub => {
                    const count = products.filter(
                      p => p.category === currentCategory.id && p.subcategory === sub
                    ).length;

                    if (editingSubcat === sub) {
                      return (
                        <div key={sub} className="subcat-chip-edit">
                          <input
                            value={editingSubcatText}
                            onChange={e => setEditingSubcatText(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEditSubcat();
                              if (e.key === 'Escape') setEditingSubcat(null);
                            }}
                          />
                          <button type="button" onClick={handleSaveEditSubcat} title="Guardar">
                            <Check size={14} color="var(--success)" />
                          </button>
                          <button type="button" onClick={() => setEditingSubcat(null)} title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={sub} className="subcat-chip">
                        <span className="subcat-label">{sub}</span>
                        <span className="subcat-count">{count}</span>
                        <div className="subcat-actions">
                          <button
                            type="button"
                            className="subcat-action-btn"
                            title="Editar nombre"
                            onClick={() => handleStartEditSubcat(sub)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="subcat-action-btn delete"
                            title="Eliminar"
                            onClick={() => handleDeleteSubcategory(sub)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="info-banner" style={{ marginTop: 20 }}>
                  <AlertCircle size={16} />
                  <span>
                    Las categorías y subcategorías que agregues o edites se actualizarán al instante en los selectores del Inventario y de Nuevos Productos.
                  </span>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Selecciona una categoría de la izquierda.</p>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
