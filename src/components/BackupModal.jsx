import { useState, useRef } from 'react';
import {
  Database, Download, Upload, X, CheckCircle2,
  AlertTriangle, FileJson, RefreshCw, ShieldCheck,
  Package, ShoppingCart, Truck, History, Banknote
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/format';

export default function BackupModal({ onClose }) {
  const {
    products,
    sales,
    movements,
    purchases,
    suppliers,
    cashMovements,
    downloadBackup,
    restoreBackupData,
    backendOnline,
  } = useApp();

  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'restore'
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Estados de restauración
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [fileError, setFileError] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const fileInputRef = useRef(null);

  const handleDownload = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      await downloadBackup();
      setStatusMessage({
        type: 'success',
        text: 'Copia de seguridad generada y descargada exitosamente en tu dispositivo.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Error al generar la copia de seguridad: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    setSelectedFile(null);
    setParsedBackup(null);
    setConfirmCheckbox(false);
    setStatusMessage(null);

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFileError('El archivo seleccionado debe tener extensión .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (!json || (!json.data && !json.products)) {
          setFileError('El archivo no tiene la estructura de datos válida de Dassel Sandals.');
          return;
        }

        // Normalizar estructura si viene plana o dentro de .data
        const normalized = {
          app: json.app || 'Dassel Sandals',
          version: json.version || '2.0',
          exportedAt: json.exportedAt || json.createdAt || new Date().toISOString(),
          data: json.data || {
            categories: json.categories || [],
            suppliers: json.suppliers || [],
            products: json.products || [],
            purchases: json.purchases || [],
            sales: json.sales || [],
            movements: json.movements || [],
            cashMovements: json.cashMovements || [],
          },
        };

        setSelectedFile(file);
        setParsedBackup(normalized);
      } catch {
        setFileError('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
      }
    };

    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;
    if (!confirmCheckbox) {
      alert('Debes marcar la casilla confirmando que deseas sobrescribir los datos actuales.');
      return;
    }

    setIsRestoring(true);
    setStatusMessage(null);
    try {
      await restoreBackupData(parsedBackup);
      setStatusMessage({
        type: 'success',
        text: 'Copia de seguridad restaurada correctamente. Los datos del sistema han sido actualizados.',
      });
      setSelectedFile(null);
      setParsedBackup(null);
      setConfirmCheckbox(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Error al restaurar los datos: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const summary = {
    products: products.length,
    sales: sales.length,
    movements: movements.length,
    purchases: purchases.length,
    suppliers: suppliers.length,
    cashMovements: cashMovements.length,
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* ENCABEZADO */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Copias de Seguridad (Respaldos)</h2>
              <small style={{ color: 'var(--text-muted)' }}>
                Descarga una copia completa de tus datos o restaura un respaldo previo
              </small>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* PESTAÑAS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            padding: '0 20px',
            gap: 12,
          }}
        >
          <button
            onClick={() => setActiveTab('export')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'export' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'export' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.9rem',
            }}
          >
            <Download size={16} />
            Crear Respaldo
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'restore' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'restore' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.9rem',
            }}
          >
            <Upload size={16} />
            Restaurar Respaldo
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="modal-body" style={{ padding: 24 }}>
          {/* MENSAJE DE ESTADO (ÉXITO O ERROR) */}
          {statusMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 20,
                background:
                  statusMessage.type === 'success'
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                border:
                  statusMessage.type === 'success'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.9rem',
              }}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* PESTAÑA 1: EXPORTAR / CREAR RESPALDO */}
          {activeTab === 'export' && (
            <div>
              {/* ESTADO DE CONEXIÓN */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} color="var(--success)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>
                      Base de Datos: {backendOnline ? 'Supabase PostgreSQL (En la nube)' : 'Almacenamiento Local (Offline)'}
                    </strong>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {backendOnline
                        ? 'La copia descargará la información más reciente desde el servidor de base de datos.'
                        : 'La copia se generará desde la memoria local de tu navegador.'}
                    </small>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: backendOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: backendOnline ? 'var(--success)' : 'var(--warning)',
                  }}
                >
                  {backendOnline ? 'En Línea' : 'Desconectado'}
                </span>
              </div>

              {/* TARJETAS RESUMEN DE REGISTROS A RESPALDAR */}
              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                REGISTROS ACTUALES QUE SE INCLUIRÁN EN EL RESPALDO:
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <Package size={20} color="var(--accent)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.products}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Productos</small>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <ShoppingCart size={20} color="var(--success)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.sales}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Ventas</small>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <History size={20} color="var(--info)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.movements}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Kardex</small>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <Truck size={20} color="#a855f7" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.purchases}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Compras</small>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <Banknote size={20} color="#f97316" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.cashMovements}</div>
                  <small style={{ color: 'var(--text-muted)' }}>Caja Chica</small>
                </div>
              </div>

              {/* BOTÓN PRINCIPAL DE DESCARGA */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--accent)',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <FileJson size={40} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Generar Archivo de Respaldo Completo</h3>
                <p style={{ margin: '0 auto 18px', maxWidth: 520, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Al presionar el botón se descargará un archivo <code>.json</code> con todas las tablas del sistema:
                  productos, matriz de tallas, clientes, facturas, compras, proveedores y caja. Guárdalo de forma segura.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleDownload}
                  disabled={isExporting}
                  style={{
                    padding: '12px 28px',
                    fontSize: '1rem',
                    margin: '0 auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      Generando copia...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Descargar Copia de Seguridad (.json)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: RESTAURAR RESPALDO */}
          {activeTab === 'restore' && (
            <div>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 12,
                  marginBottom: 20,
                  color: 'var(--text)',
                }}
              >
                <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--danger)', display: 'block', marginBottom: 2 }}>
                    Zona de Restauración de Datos
                  </strong>
                  Esta función reemplazará los datos actuales del sistema por los contenidos en el archivo de respaldo seleccionado.
                  Se recomienda <strong>descargar un respaldo previo</strong> antes de realizar cualquier restauración.
                </div>
              </div>

              {/* SELECTOR DE ARCHIVO */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="backup-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 12,
                  padding: 28,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  transition: 'border-color 0.2s',
                  marginBottom: 20,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <Upload size={36} color="var(--accent)" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el archivo de respaldo (.json)'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedFile
                    ? `Tamaño: ${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Formatos soportados: archivos .json exportados desde Dassel Sandals'}
                </p>
              </div>

              {fileError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: 16,
                  }}
                >
                  {fileError}
                </div>
              )}

              {/* VISTA PREVIA DEL ARCHIVO LEÍDO */}
              {parsedBackup && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Respaldo Válido Identificado</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Fecha de creación: {formatDateTime(parsedBackup.exportedAt)}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: 'var(--success)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {parsedBackup.app} v{parsedBackup.version}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: 8,
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: 16,
                    }}
                  >
                    <div><strong>{parsedBackup.data?.products?.length || 0}</strong> productos</div>
                    <div><strong>{parsedBackup.data?.sales?.length || 0}</strong> ventas</div>
                    <div><strong>{parsedBackup.data?.movements?.length || 0}</strong> mov. Kardex</div>
                    <div><strong>{parsedBackup.data?.purchases?.length || 0}</strong> compras</div>
                    <div><strong>{parsedBackup.data?.suppliers?.length || 0}</strong> proveedores</div>
                    <div><strong>{parsedBackup.data?.cashMovements?.length || 0}</strong> mov. caja</div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={confirmCheckbox}
                      onChange={(e) => setConfirmCheckbox(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Confirmo que deseo reemplazar la base de datos con los registros de este respaldo.</span>
                  </label>

                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <button
                      className="btn btn-danger"
                      onClick={handleExecuteRestore}
                      disabled={!confirmCheckbox || isRestoring}
                      style={{
                        padding: '10px 20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          Restaurando registros en BD...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Confirmar y Restaurar Datos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
