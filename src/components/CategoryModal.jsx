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
  const [newCatIcon, setNewCatIcon] = useState('👡');
  const [newCatType, setNewCatType] = useState('zapatos'); // 'zapatos' | 'joyas'
  const [newCatError, setNewCatError] = useState('');

  // Estados para editar nombre de categoría actual
  const [editingCatName, setEditingCatName] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');

  const { isShoeCategory } = useApp();
  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0];
  const shoeKeywordsRegex = /(zapato|calzado|sandalia|tacon|tacón|huarache|plataforma|flat|bota|botin|botín|stiletto|chinela|tenis|zapatilla|alpargata|mocasin|mocasín|cuña|mule)/i;
  const shoeIcons = ['👡', '👠', '👟', '👢'];

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

    const finalType = shoeKeywordsRegex.test(trimmed) ? 'zapatos' : newCatType;
    const finalIcon = newCatIcon || (finalType === 'zapatos' ? '👡' : '💎');
    const defaultSubs = finalType === 'zapatos'
      ? ['Sandalias', 'Tacones', 'Plataformas', 'Flats', 'General']
      : ['General', 'Otro'];

    addCategory({
      id: slug,
      name: trimmed,
      icon: finalIcon,
      type: finalType,
      subcategories: defaultSubs,
    });

    setSelectedCatId(slug);
    setNewCatName('');
    setNewCatIcon('👡');
    setNewCatType('zapatos');
    setShowNewCatForm(false);
    setNewCatError('');
  };

  const handleChangeCategoryType = (cat, newType) => {
    const nextIcon = newType === 'zapatos'
      ? (['💎', '💍', '📿', '✨'].includes(cat.icon) ? '👡' : (cat.icon || '👡'))
      : (shoeIcons.includes(cat.icon) ? '💎' : (cat.icon || '💎'));
    updateCategory(cat.id, { name: cat.name, icon: nextIcon, type: newType });
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
                <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Nueva Categoría</span>

                <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo de Producto:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatType('zapatos');
                      if (!shoeIcons.includes(newCatIcon)) setNewCatIcon('👡');
                    }}
                    style={{
                      padding: '6px 6px',
                      borderRadius: 6,
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      border: newCatType === 'zapatos' ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: newCatType === 'zapatos' ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                      color: newCatType === 'zapatos' ? 'var(--accent-light)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    👡 Calzado (Tallas)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatType('joyas');
                      if (shoeIcons.includes(newCatIcon)) setNewCatIcon('💎');
                    }}
                    style={{
                      padding: '6px 6px',
                      borderRadius: 6,
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      border: newCatType === 'joyas' ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: newCatType === 'joyas' ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                      color: newCatType === 'joyas' ? 'var(--accent-light)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    💎 Joya / Accesorio
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select
                    value={newCatIcon}
                    onChange={e => {
                      const val = e.target.value;
                      setNewCatIcon(val);
                      if (shoeIcons.includes(val)) setNewCatType('zapatos');
                      else if (['💎', '💍', '📿', '✨'].includes(val)) setNewCatType('joyas');
                    }}
                    style={{ width: 55, padding: '4px 6px', textAlign: 'center' }}
                  >
                    <option value="👡">👡</option>
                    <option value="👠">👠</option>
                    <option value="👟">👟</option>
                    <option value="👢">👢</option>
                    <option value="💎">💎</option>
                    <option value="💍">💍</option>
                    <option value="👜">👜</option>
                    <option value="✨">✨</option>
                    <option value="📦">📦</option>
                  </select>
                  <input
                    placeholder="Ej. Tacones, Sandalias, Joyas..."
                    value={newCatName}
                    onChange={e => {
                      const val = e.target.value;
                      setNewCatName(val);
                      if (shoeKeywordsRegex.test(val)) {
                        setNewCatType('zapatos');
                        if (!shoeIcons.includes(newCatIcon)) setNewCatIcon('👡');
                      }
                    }}
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
                const isShoe = isShoeCategory(c);
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
                      <span style={{ fontSize: '1.25rem' }}>{c.icon || (isShoe ? '👡' : '💎')}</span>
                      <div>
                        <span className="cat-name" style={{ display: 'block' }}>{c.name}</span>
                        <small style={{ fontSize: '0.68rem', color: isShoe ? '#38bdf8' : '#c084fc' }}>
                          {isShoe ? 'Calzado (Con Tallas)' : 'Joyería / Accesorios'}
                        </small>
                      </div>
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
                <div className="current-cat-header" style={{ flexWrap: 'wrap', gap: 10 }}>
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
                      <div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comportamiento:</span>
                          <button
                            type="button"
                            className={`btn btn-sm ${isShoeCategory(currentCategory) ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => handleChangeCategoryType(currentCategory, 'zapatos')}
                          >
                            👡 Calzado (Usa Tallas)
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${!isShoeCategory(currentCategory) ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => handleChangeCategoryType(currentCategory, 'joyas')}
                          >
                            💎 Joyería (Sin Tallas)
                          </button>
                        </div>
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
