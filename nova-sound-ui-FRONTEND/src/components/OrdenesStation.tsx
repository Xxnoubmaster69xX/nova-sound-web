import React, { useState, useRef } from 'react';
import { usePlanta, CATALOGO_CLIENTES, CATALOGO_MODELOS, CATALOGO_COLORES, CATALOGO_LINEAS } from '../context/PlantaContext';
import type { Orden } from '../types/database';

function generarSiguienteFolio(lista: Orden[]): string {
  let maxNum = 100;
  for (const o of lista) {
    const match = String(o.folio || '').match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `ORD-2026-${String(maxNum + 1).padStart(3, '0')}`;
}

export default function OrdenesStation() {
  const { ordenes, crearOrden, actualizarOrden, importarOrdenesCsv, asignarLineaOrden, tienePermiso } = usePlanta();
  const puedeGestionar = tienePermiso('ORDENES_GESTIONAR');

  const [folio, setFolio] = useState(() => generarSiguienteFolio(ordenes));
  const [folioManual, setFolioManual] = useState(false);
  const [ordenEditandoId, setOrdenEditandoId] = useState<number | null>(null);
  const [idCliente, setIdCliente] = useState(CATALOGO_CLIENTES[0].id);
  const [idModelo, setIdModelo] = useState(CATALOGO_MODELOS[0].id);
  const [idColor, setIdColor] = useState(CATALOGO_COLORES[0].id);
  const [cantidad, setCantidad] = useState(100);
  const [fechaInicio, setFechaInicio] = useState('2026-11-16');
  const [fechaCompromiso, setFechaCompromiso] = useState('2026-11-20');
  const [lineaFormId, setLineaFormId] = useState<number>(CATALOGO_LINEAS[0].id);
  const [prioridad, setPrioridad] = useState<'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [observacionesForm, setObservacionesForm] = useState('');
  const [ordenesCanceladasLocal, setOrdenesCanceladasLocal] = useState<number[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number | null>(ordenes[0]?.id ?? null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const folioInputRef = useRef<HTMLInputElement>(null);
  const [textoCsv, setTextoCsv] = useState(
    'folio,modelo,color,cliente,cantidad,compromiso\nORD-2026-201,NS-PRO,Negro,SoundCorp Retail,120,2026-11-25\nORD-2026-202,NS-SPORT,Azul,MegaAudio Distribución,80,2026-11-28\nORD-2026-203,NS-MINI,Blanco,TechBeat Stores,200,2026-11-30'
  );
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const folioMostrado = folioManual || ordenEditandoId !== null ? folio : generarSiguienteFolio(ordenes);
  const cantidadSegura = Math.max(0, Math.min(10000, Number(cantidad) || 0));

  const estadosDisponibles = Array.from(new Set(ordenes.map((o) => o.estado)));
  const ordenesFiltradas = ordenes.filter((ord) => {
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      ord.folio.toLowerCase().includes(q) ||
      (ord.modelo_nombre || '').toLowerCase().includes(q) ||
      (ord.cliente_nombre || '').toLowerCase().includes(q);
    const estadoVisible = ordenesCanceladasLocal.includes(ord.id) ? 'Cancelada' : ord.estado;
    const coincideEstado = filtroEstado === 'Todos' || estadoVisible === filtroEstado;
    return coincideTexto && coincideEstado;
  });
  const ordenSeleccionada = ordenes.find((o) => o.id === ordenSeleccionadaId) || ordenesFiltradas[0] || null;

  const enProceso = ordenes.filter(
    (o) =>
      !ordenesCanceladasLocal.includes(o.id) &&
      (o.estado === 'En Proceso' || o.estado === 'En Producción' || o.estado === 'Asignada')
  ).length;
  const terminadas = ordenes.filter(
    (o) => !ordenesCanceladasLocal.includes(o.id) && (o.estado === 'Completada' || o.estado === 'Terminada')
  ).length;
  const pendientes = ordenes.filter(
    (o) =>
      !ordenesCanceladasLocal.includes(o.id) &&
      o.estado !== 'En Proceso' &&
      o.estado !== 'En Producción' &&
      o.estado !== 'Asignada' &&
      o.estado !== 'Completada' &&
      o.estado !== 'Terminada' &&
      o.estado !== 'Cancelada'
  ).length;

  const limpiarFormulario = () => {
    setOrdenEditandoId(null);
    setFolioManual(false);
    setFolio(generarSiguienteFolio(ordenes));
    setIdCliente(CATALOGO_CLIENTES[0].id);
    setIdModelo(CATALOGO_MODELOS[0].id);
    setIdColor(CATALOGO_COLORES[0].id);
    setCantidad(100);
    setFechaInicio('2026-11-16');
    setFechaCompromiso('2026-11-20');
    setLineaFormId(CATALOGO_LINEAS[0].id);
    setPrioridad('Normal');
    setObservacionesForm('');
  };

  const cargarOrdenEnFormulario = () => {
    if (!ordenSeleccionada || !puedeGestionar) return;
    setOrdenEditandoId(ordenSeleccionada.id);
    setFolioManual(true);
    setFolio(ordenSeleccionada.folio);
    setIdCliente(ordenSeleccionada.id_cliente);
    setIdModelo(ordenSeleccionada.id_modelo);
    setIdColor(ordenSeleccionada.id_color);
    setCantidad(ordenSeleccionada.cantidad);
    setFechaCompromiso(ordenSeleccionada.fecha_compromiso || '2026-11-20');
    setLineaFormId(ordenSeleccionada.id_linea_asignada || CATALOGO_LINEAS[0].id);
    folioInputRef.current?.focus();
    setMensaje({ tipo: 'ok', texto: `Orden ${ordenSeleccionada.folio} cargada en el panel para edición` });
  };

  const handleCancelarOrden = () => {
    if (!ordenSeleccionada || !puedeGestionar) return;
    setOrdenesCanceladasLocal((prev) =>
      prev.includes(ordenSeleccionada.id) ? prev : [...prev, ordenSeleccionada.id]
    );
    setMensaje({ tipo: 'err', texto: `Orden ${ordenSeleccionada.folio} marcada como Cancelada en vista operativa` });
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar) {
      setMensaje({ tipo: 'err', texto: 'Su rol actual es de solo lectura en Órdenes (RN-14).' });
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10000) {
      setMensaje({ tipo: 'err', texto: 'La cantidad debe ser un número entero entre 1 y 10,000 piezas.' });
      return;
    }
    const folioFinal = folioMostrado.trim() || generarSiguienteFolio(ordenes);

    if (ordenEditandoId !== null) {
      const res = await actualizarOrden(ordenEditandoId, {
        folio: folioFinal,
        id_cliente: idCliente,
        id_modelo: idModelo,
        id_color: idColor,
        cantidad,
        fecha_compromiso: fechaCompromiso,
        id_linea_asignada: lineaFormId,
      });
      if (!res.ok) {
        setMensaje({ tipo: 'err', texto: res.error || 'Error al actualizar la orden' });
      } else {
        setMensaje({ tipo: 'ok', texto: `Orden ${folioFinal} actualizada correctamente` });
        limpiarFormulario();
      }
      return;
    }

    const res = await crearOrden(folioFinal, idCliente, idModelo, idColor, cantidad, fechaCompromiso, lineaFormId);
    if (!res.ok) {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al crear la orden' });
    } else {
      setMensaje({ tipo: 'ok', texto: `Orden ${folioFinal} registrada en sistema` });
      limpiarFormulario();
    }
  };

  const handleImportar = async () => {
    if (!puedeGestionar) return;
    const res = await importarOrdenesCsv(textoCsv);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Importación exitosa: ${res.importadas} órdenes cargadas` });
      setModalImportar(false);
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error en importación' });
    }
  };

  return (
    <div className="station-container">
      {/* CABECERA INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">01</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 01 · Gestión de Producción</span>
            <h1 className="station-title">Órdenes de Producción y Asignación</h1>
            <span className="station-subtitle">Alta, programación e importación de pedidos para líneas L1, L2 y L3</span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={() => setModalImportar(true)} disabled={!puedeGestionar} className="btn btn-carbon">
            IMPORTAR CSV
          </button>
        </div>
      </div>

      <div className="station-body">
        {mensaje && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: mensaje.tipo === 'ok' ? 'var(--ok-bg)' : 'var(--danger-bg)',
              color: mensaje.tipo === 'ok' ? 'var(--ok)' : 'var(--danger)',
              border: `1px solid ${mensaje.tipo === 'ok' ? 'var(--ok-border)' : 'var(--danger-border)'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            [{mensaje.tipo === 'ok' ? 'SUCCESS' : 'ERROR'}] {mensaje.texto}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(360px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* LISTA DE ÓRDENES Y ASIGNACIÓN A LÍNEAS */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ÓRDENES DE PRODUCCIÓN ({ordenesFiltradas.length})</span>
              <span className="badge badge-info">
                {enProceso} EN PROCESO · {pendientes} PENDIENTES · {terminadas} TERMINADAS
              </span>
            </div>
            {/* BARRA DE BÚSQUEDA Y FILTROS (SPEC ORIGINAL) */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface-elevated)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
                <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  BUSCAR:
                </label>
                <input
                  type="text"
                  placeholder="Folio o modelo..."
                  className="form-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  ESTADO:
                </label>
                <select
                  className="form-select"
                  style={{ height: '36px', fontSize: '0.82rem', minWidth: '140px' }}
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  {estadosDisponibles.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!puedeGestionar}
                className="btn btn-primary"
                style={{ height: '36px', padding: '0 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                onClick={() => {
                  limpiarFormulario();
                  folioInputRef.current?.focus();
                }}
              >
                + Nueva orden
              </button>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table tech-table-compact">
                  <thead>
                    <tr>
                      <th>FOLIO</th>
                      <th>CLIENTE</th>
                      <th>MODELO // COLOR</th>
                      <th>CANTIDAD</th>
                      <th>LÍNEA</th>
                      <th>ENTREGA</th>
                      <th>ESTADO</th>
                      <th>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          [SIN ÓRDENES QUE COINCIDAN CON EL FILTRO]
                        </td>
                      </tr>
                    ) : (
                      ordenesFiltradas.map((ord) => {
                        const seleccionada = ordenSeleccionada?.id === ord.id;
                        return (
                          <tr
                            key={ord.id}
                            onClick={() => setOrdenSeleccionadaId(ord.id)}
                            style={{
                              cursor: 'pointer',
                              background: seleccionada ? 'rgba(245, 196, 0, 0.08)' : undefined,
                            }}
                          >
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--carbon-900)', whiteSpace: 'nowrap' }}>
                              {ord.folio}
                            </td>
                            <td>{ord.cliente_nombre}</td>
                            <td>
                              <span style={{ fontWeight: 700 }}>{ord.modelo_nombre}</span> - {ord.color_nombre}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                              {ord.piezas_ensambladas || 0} / {ord.cantidad} pzas
                            </td>
                            <td>
                              {ord.id_linea_asignada ? (
                                <span className="badge badge-ok">LÍNEA {ord.linea_nombre}</span>
                              ) : (
                                <span className="badge badge-warn">SIN ASIGNAR</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {ord.fecha_compromiso || '--'}
                            </td>
                            <td>
                              {(() => {
                                const estadoVisible = ordenesCanceladasLocal.includes(ord.id) ? 'Cancelada' : ord.estado;
                                return (
                                  <span
                                    className={`badge ${
                                      estadoVisible === 'Cancelada'
                                        ? 'badge-danger'
                                        : estadoVisible === 'En Proceso' || estadoVisible === 'En Producción'
                                        ? 'badge-accent'
                                        : estadoVisible === 'Asignada'
                                        ? 'badge-info'
                                        : estadoVisible === 'Completada' || estadoVisible === 'Terminada'
                                        ? 'badge-ok'
                                        : 'badge-dark'
                                    }`}
                                  >
                                    {estadoVisible}
                                  </span>
                                );
                              })()}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {CATALOGO_LINEAS.map((linea) => (
                                  <button
                                    key={linea.id}
                                    disabled={!puedeGestionar}
                                    onClick={async () => {
                                      const res = await asignarLineaOrden(ord.id, linea.id);
                                      if (!res.ok) {
                                        setMensaje({ tipo: 'err', texto: res.error || 'Error al asignar línea' });
                                      } else {
                                        setMensaje({ tipo: 'ok', texto: `Orden ${ord.folio} asignada a ${linea.nombre_linea}` });
                                      }
                                    }}
                                    className="btn btn-outline"
                                    style={{
                                      height: '1.8rem',
                                      padding: '0 0.5rem',
                                      fontSize: '0.65rem',
                                      backgroundColor: ord.id_linea_asignada === linea.id ? 'var(--accent)' : undefined,
                                      color: ord.id_linea_asignada === linea.id ? 'var(--carbon-900)' : undefined,
                                      borderColor: ord.id_linea_asignada === linea.id ? 'var(--accent)' : undefined,
                                    }}
                                    title={`Asignar a Línea ${linea.nombre_linea}`}
                                  >
                                    {linea.nombre_linea}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* PIE DE SELECCIÓN (SPEC ORIGINAL) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 1rem',
                  borderTop: '1px solid var(--border-default)',
                  background: 'var(--bg-surface-elevated)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}
              >
                <span>
                  Seleccionada: <strong>{ordenSeleccionada ? ordenSeleccionada.folio : 'Ninguna'}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    disabled={!ordenSeleccionada}
                    onClick={() => setModalDetalle(true)}
                    className="btn btn-outline"
                    style={{ height: '1.9rem', padding: '0 0.75rem', fontSize: '0.7rem' }}
                  >
                    VER DETALLE
                  </button>
                  <button
                    type="button"
                    disabled={!ordenSeleccionada || !puedeGestionar}
                    onClick={cargarOrdenEnFormulario}
                    className="btn btn-outline"
                    style={{ height: '1.9rem', padding: '0 0.75rem', fontSize: '0.7rem' }}
                  >
                    EDITAR
                  </button>
                  <button
                    type="button"
                    disabled={!ordenSeleccionada || !puedeGestionar}
                    onClick={handleCancelarOrden}
                    className="btn btn-danger"
                    style={{ height: '1.9rem', padding: '0 0.75rem', fontSize: '0.7rem' }}
                  >
                    CANCELAR ORDEN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO DE CAPTURA MANUAL */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                {ordenEditandoId !== null ? `EDITAR ORDEN · ${folioMostrado}` : 'ALTA DE NUEVA ORDEN'}
              </span>
              <span className="badge badge-accent">
                {ordenEditandoId !== null ? 'EDIT_MODE' : 'MANUAL_ENTRY'}
              </span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FOLIO DE LA ORDEN</label>
                  <input
                    ref={folioInputRef}
                    type="text"
                    required
                    placeholder="Ej. ORD-2026-105"
                    className="form-input"
                    value={folioMostrado}
                    onChange={(e) => {
                      setFolioManual(true);
                      setFolio(e.target.value.toUpperCase());
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CLIENTE DESTINO</label>
                  <select className="form-select" value={idCliente} onChange={(e) => setIdCliente(Number(e.target.value))}>
                    {CATALOGO_CLIENTES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cliente} ({c.tipo_cliente})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.85fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">MODELO</label>
                    <select className="form-select" value={idModelo} onChange={(e) => setIdModelo(Number(e.target.value))}>
                      {CATALOGO_MODELOS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre_modelo} ({m.capacidad_caja}/caja)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">COLOR</label>
                    <select className="form-select" value={idColor} onChange={(e) => setIdColor(Number(e.target.value))}>
                      {CATALOGO_COLORES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre_color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">CANTIDAD (PIEZAS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      className="form-input"
                      value={cantidad}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        setCantidad(raw > 10000 ? 10000 : raw);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FECHA DE INICIO</label>
                    <input
                      type="date"
                      className="form-input"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">FECHA DE ENTREGA (COMPROMISO)</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={fechaCompromiso}
                    onChange={(e) => setFechaCompromiso(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">LÍNEA DE ENSAMBLE</label>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', paddingTop: '0.2rem' }}>
                    {CATALOGO_LINEAS.map((l) => (
                      <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="linea_ensamble_form"
                          checked={lineaFormId === l.id}
                          onChange={() => setLineaFormId(l.id)}
                        />
                        Línea {l.nombre_linea}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PRIORIDAD</label>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', paddingTop: '0.2rem' }}>
                    {(['Normal', 'Alta', 'Urgente'] as const).map((p) => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="prioridad_form"
                          checked={prioridad === p}
                          onChange={() => setPrioridad(p)}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">MATERIALES REQUERIDOS</label>
                  <div className="table-container" style={{ border: '1px solid var(--border-default)' }}>
                    <table className="tech-table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>COMPONENTE</th>
                          <th>POR PZA</th>
                          <th>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Driver 40mm</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>2</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cantidadSegura * 2}</td>
                        </tr>
                        <tr>
                          <td>Módulo Bluetooth</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>1</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cantidadSegura}</td>
                        </tr>
                        <tr>
                          <td>Batería 2000mAh</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>1</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cantidadSegura}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">OBSERVACIONES</label>
                  <textarea
                    rows={2}
                    placeholder="Pedido para cliente mayorista..."
                    className="form-textarea"
                    value={observacionesForm}
                    onChange={(e) => setObservacionesForm(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={limpiarFormulario} className="btn btn-outline" style={{ flex: 1 }}>
                    CANCELAR
                  </button>
                  <button type="submit" disabled={!puedeGestionar} className="btn btn-yellow" style={{ flex: 1.5 }}>
                    {ordenEditandoId !== null ? 'GUARDAR CAMBIOS' : 'GUARDAR ORDEN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE DE ORDEN (SOLO LECTURA) */}
      {modalDetalle && ordenSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.15rem' }}>
                DETALLE DE ORDEN · {ordenSeleccionada.folio}
              </span>
              <button onClick={() => setModalDetalle(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Cliente:</strong> {ordenSeleccionada.cliente_nombre}</div>
              <div><strong>Estado:</strong> {ordenSeleccionada.estado}</div>
              <div><strong>Modelo:</strong> {ordenSeleccionada.modelo_nombre}</div>
              <div><strong>Color:</strong> {ordenSeleccionada.color_nombre}</div>
              <div><strong>Avance:</strong> {ordenSeleccionada.piezas_ensambladas || 0} / {ordenSeleccionada.cantidad} pzas</div>
              <div><strong>Línea:</strong> {ordenSeleccionada.linea_nombre ? `Línea ${ordenSeleccionada.linea_nombre}` : 'Sin asignar'}</div>
              <div><strong>Fecha compromiso:</strong> {ordenSeleccionada.fecha_compromiso || '--'}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN CSV */}
      {modalImportar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                IMPORTACIÓN MASIVA DE ÓRDENES (CSV)
              </span>
              <button onClick={() => setModalImportar(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Formato esperado por línea: <code>folio,modelo,color,cliente,cantidad,compromiso</code>
            </p>
            <textarea
              className="form-textarea"
              rows={8}
              value={textoCsv}
              onChange={(e) => setTextoCsv(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalImportar(false)} className="btn btn-outline">
                CANCELAR
              </button>
              <button onClick={handleImportar} className="btn btn-yellow">
                PROCESAR IMPORTACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
