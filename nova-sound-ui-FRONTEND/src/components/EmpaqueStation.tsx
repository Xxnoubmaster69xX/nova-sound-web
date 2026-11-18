import React, { useState } from 'react';
import {
  usePlanta,
  CATALOGO_CLIENTES,
  CATALOGO_MODELOS,
  CATALOGO_COLORES,
} from '../context/PlantaContext';

export default function EmpaqueStation() {
  const {
    cajas,
    detallesCajas,
    unidades,
    solicitudesAutorizacion,
    crearCaja,
    empacarPorSerie,
    cerrarCaja,
    solicitarReaperturaCaja,
    retirarUnidadCaja,
    tienePermiso,
  } = usePlanta();
  const puedeEmpacar = tienePermiso('EMPAQUE_OPERAR');

  const [subvista, setSubvista] = useState<'empacar' | 'consultar' | 'bitacora'>('empacar');
  const [filtroCaja, setFiltroCaja] = useState<string>('');
  const [filtroFechaCaja, setFiltroFechaCaja] = useState<string>('');
  const [filtroEstadoCaja, setFiltroEstadoCaja] = useState<string>('Todos');
  const [paginaConsultar, setPaginaConsultar] = useState<number>(1);
  const [paginaBitacora, setPaginaBitacora] = useState<number>(1);
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState<number>(cajas[0]?.id || 1);
  const [serieInput, setSerieInput] = useState<string>('');
  const [modalNuevaCaja, setModalNuevaCaja] = useState<boolean>(false);
  const [modalReapertura, setModalReapertura] = useState<boolean>(false);
  const [modalRetiro, setModalRetiro] = useState<boolean>(false);
  const [serieRetirar, setSerieRetirar] = useState<string>('');
  const [motivoReapertura, setMotivoReapertura] = useState<string>('');
  const [motivoRetiro, setMotivoRetiro] = useState<string>('');

  // Formulario nueva caja
  const [nuevoClienteId, setNuevoClienteId] = useState<number>(CATALOGO_CLIENTES[0].id);
  const [nuevoModeloId, setNuevoModeloId] = useState<number>(CATALOGO_MODELOS[0].id);
  const [nuevoColorId, setNuevoColorId] = useState<number>(CATALOGO_COLORES[0].id);

  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const cajaActual = cajas.find((c) => c.id === cajaSeleccionadaId) || cajas[0];
  const detallesDeCaja = cajaActual
    ? detallesCajas.filter((d) => d.id_caja === cajaActual.id && !d.retirada)
    : [];
  const capacidad = cajaActual?.capacidad || 6;
  const ocupacion = cajaActual ? detallesDeCaja.length || cajaActual.piezas_actuales || 0 : 0;
  const porcentaje = Math.min(100, Math.round((ocupacion / capacidad) * 100));

  const cajasFiltradas = cajas.filter((c) => {
    const q = filtroCaja.trim().toLowerCase();
    const coincideTexto =
      !q ||
      c.codigo_caja.toLowerCase().includes(q) ||
      (c.cliente_nombre || '').toLowerCase().includes(q) ||
      (c.modelo_nombre || '').toLowerCase().includes(q);
    const coincideEstado = filtroEstadoCaja === 'Todos' || c.estado === filtroEstadoCaja;
    return coincideTexto && coincideEstado;
  });

  const exportingCsv = () => {
    const headers = 'Folio,Cliente,Modelo,Color,Piezas,Capacidad,Estado\n';
    const rows = cajas
      .map(
        (c) =>
          `${c.codigo_caja},${c.cliente_nombre || ''},${c.modelo_nombre || ''},${c.color_nombre || ''},${c.piezas_actuales || 0},${c.capacidad},${c.estado}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitacora_empaque_novasound.csv';
    a.click();
    URL.revokeObjectURL(url);
    setMensaje({ tipo: 'ok', texto: 'Bitácora exportada a CSV (bitacora_empaque_novasound.csv)' });
  };

  const handleCrearCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEmpacar) {
      setMensaje({ tipo: 'err', texto: 'Su rol actual es de solo lectura en Empaque (RN-14).' });
      return;
    }
    const res = await crearCaja(nuevoClienteId, nuevoModeloId, nuevoColorId);
    if (res.ok && res.caja) {
      const cap =
        res.caja.capacidad ??
        CATALOGO_MODELOS.find((m) => m.id === nuevoModeloId)?.capacidad_caja ??
        12;
      setCajaSeleccionadaId(res.caja.id);
      setModalNuevaCaja(false);
      setMensaje({ tipo: 'ok', texto: `Caja ${res.caja.codigo_caja} abierta con capacidad de ${cap} piezas` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al abrir caja' });
    }
  };

  const handleEmpacar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEmpacar) {
      setMensaje({ tipo: 'err', texto: 'Su rol actual es de solo lectura en Empaque (RN-14).' });
      return;
    }
    if (!cajaActual) return;
    if (!serieInput.trim()) {
      setMensaje({ tipo: 'err', texto: 'Ingrese un número de serie' });
      return;
    }
    const res = await empacarPorSerie(serieInput.trim().toUpperCase(), cajaActual.id);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Unidad ${serieInput.trim()} empacada en slot ${ocupacion + 1}/${capacidad}` });
      setSerieInput('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Rechazo de empaque' });
    }
  };

  const handleCerrar = async () => {
    if (!puedeEmpacar) {
      setMensaje({ tipo: 'err', texto: 'Su rol actual es de solo lectura en Empaque (RN-14).' });
      return;
    }
    if (!cajaActual) return;
    const res = await cerrarCaja(cajaActual.id);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Caja ${cajaActual.codigo_caja} cerrada y sellada` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al cerrar caja' });
    }
  };

  const handleSolicitarReapertura = async () => {
    if (!cajaActual) return;
    const res = await solicitarReaperturaCaja(cajaActual.id, motivoReapertura);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Solicitud de reapertura enviada al supervisor de almacén` });
      setModalReapertura(false);
      setMotivoReapertura('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al enviar solicitud' });
    }
  };

  const handleRetirarUnidad = async () => {
    if (!cajaActual || !serieRetirar) return;
    const res = await retirarUnidadCaja(cajaActual.id, serieRetirar, motivoRetiro);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Unidad ${serieRetirar} retirada de la caja ${cajaActual.codigo_caja}` });
      setModalRetiro(false);
      setMotivoRetiro('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al retirar unidad' });
    }
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">05</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 05 · Formación y Sellado de Cajas</span>
            <h1 className="station-title">Empaque y Consolidación de Cajas</h1>
            <span className="station-subtitle">
              Validación por cliente/modelo (Prevención Incidente B) y sellado de seguridad
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={() => setModalNuevaCaja(true)} disabled={!puedeEmpacar} className="btn btn-yellow">
            + ABRIR NUEVA CAJA
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

        {/* 3 TARJETAS DE NAVEGACIÓN DE EMPAQUE (SPEC ORIGINAL: CREAR CAJA / CONSULTAR CAJAS / BITÁCORA) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setSubvista('empacar')}
            className={`btn ${subvista === 'empacar' ? 'btn-yellow' : 'btn-outline'}`}
            style={{ minHeight: '3.2rem', height: 'auto', justifyContent: 'space-between', padding: '0.6rem 1rem', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            <span>01 · CREAR CAJA / EMPACAR</span>
            <span className="badge badge-dark">{cajas.filter((c) => c.estado === 'Abierta').length} ABIERTAS</span>
          </button>
          <button
            type="button"
            onClick={() => setSubvista('consultar')}
            className={`btn ${subvista === 'consultar' ? 'btn-yellow' : 'btn-outline'}`}
            style={{ minHeight: '3.2rem', height: 'auto', justifyContent: 'space-between', padding: '0.6rem 1rem', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            <span>02 · CONSULTAR CAJAS</span>
            <span className="badge badge-dark">{cajas.length} TOTAL</span>
          </button>
          <button
            type="button"
            onClick={() => setSubvista('bitacora')}
            className={`btn ${subvista === 'bitacora' ? 'btn-yellow' : 'btn-outline'}`}
            style={{ minHeight: '3.2rem', height: 'auto', justifyContent: 'space-between', padding: '0.6rem 1rem', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            <span>03 · BITÁCORA</span>
            <span className="badge badge-dark">{cajas.filter((c) => c.estado === 'Cerrada').length} CERRADAS</span>
          </button>
        </div>

        {subvista === 'consultar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* PANEL IZQUIERDO DE FILTROS (SPEC ORIGINAL PÁG. 5 ABAJO) */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">CONSULTAR CAJAS · FILTROS</span>
                <span className="badge badge-accent">SEARCH</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FOLIO</label>
                  <input
                    type="text"
                    placeholder="Ej. CAJ-2026-..."
                    className="form-input"
                    value={filtroCaja}
                    onChange={(e) => setFiltroCaja(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SELECTOR FECHAS</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filtroFechaCaja}
                    onChange={(e) => setFiltroFechaCaja(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ESTADO</label>
                  <select
                    className="form-select"
                    value={filtroEstadoCaja}
                    onChange={(e) => setFiltroEstadoCaja(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setPaginaConsultar(1)}
                  className="btn btn-yellow"
                >
                  BUSCAR
                </button>
              </div>
            </div>

            {/* PANEL DERECHO: TABLA + PAGINACIÓN + SOLICITAR REAPERTURA */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">RESULTADOS ({cajasFiltradas.length} CAJAS)</span>
                <span className="badge badge-info">CONSULTA</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>FOLIO</th>
                        <th>CLIENTE</th>
                        <th>MODELO // COLOR</th>
                        <th>OCUPACIÓN</th>
                        <th>ESTADO</th>
                        <th>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cajasFiltradas.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setCajaSeleccionadaId(c.id)}
                          style={{
                            cursor: 'pointer',
                            background: c.id === cajaSeleccionadaId ? 'rgba(255, 250, 0, 0.12)' : undefined,
                          }}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.codigo_caja}</td>
                          <td>{c.cliente_nombre}</td>
                          <td>
                            {c.modelo_nombre} - {c.color_nombre}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {c.piezas_actuales || 0} / {c.capacidad}
                          </td>
                          <td>
                            <span className={`badge ${c.estado === 'Abierta' ? 'badge-ok' : 'badge-dark'}`}>
                              {c.estado}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                              onClick={() => {
                                setCajaSeleccionadaId(c.id);
                                setSubvista('empacar');
                              }}
                            >
                              ABRIR EN BANCO
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border-default)',
                    background: 'var(--bg-surface-elevated)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPaginaConsultar(p)}
                        className={`btn ${paginaConsultar === p ? 'btn-yellow' : 'btn-outline'}`}
                        style={{ height: '1.8rem', minWidth: '1.8rem', padding: '0 0.45rem', fontSize: '0.7rem' }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-carbon"
                    onClick={() => setModalReapertura(true)}
                  >
                    SOLICITAR REAPERTURA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {subvista === 'bitacora' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* COLUMNA IZQUIERDA: CONTADORES + EXPORTAR (SPEC ORIGINAL PÁG. 5 ARRIBA) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">BITÁCORA DEL DÍA</span>
                  <span className="badge badge-accent">RESUMEN</span>
                </div>
                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cajas Abiertas Hoy:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ok)' }}>
                      {cajas.filter((c) => c.estado === 'Abierta').length}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cajas Cerradas Hoy:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--info)' }}>
                      {cajas.filter((c) => c.estado === 'Cerrada').length}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Solicitudes de Reapertura:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--warn)' }}>
                      {solicitudesAutorizacion.length}
                    </strong>
                  </div>
                  <button type="button" onClick={exportingCsv} className="btn btn-yellow">
                    EXPORTAR
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: TABLA HISTÓRICA + PAGINACIÓN */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">BITÁCORA DE CAJAS Y MOVIMIENTOS</span>
                <span className="badge badge-accent">HISTORIAL</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>FOLIO</th>
                        <th>CLIENTE</th>
                        <th>MODELO // COLOR</th>
                        <th>PIEZAS</th>
                        <th>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cajas.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.codigo_caja}</td>
                          <td>{c.cliente_nombre}</td>
                          <td>{c.modelo_nombre} - {c.color_nombre}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{c.piezas_actuales || 0} / {c.capacidad}</td>
                          <td>
                            <span className={`badge ${c.estado === 'Abierta' ? 'badge-ok' : 'badge-dark'}`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.35rem',
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border-default)',
                    background: 'var(--bg-surface-elevated)',
                  }}
                >
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPaginaBitacora(p)}
                      className={`btn ${paginaBitacora === p ? 'btn-yellow' : 'btn-outline'}`}
                      style={{ height: '1.8rem', minWidth: '1.8rem', padding: '0 0.45rem', fontSize: '0.7rem' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {subvista === 'empacar' && (
        <>
        {/* BLOQUE CREAR CAJA DIRECTO (SPEC ORIGINAL PÁG. 6 ARRIBA) */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">CREAR CAJA (FOLIO AUTOGENERADO)</span>
            <span className="badge badge-accent">NEW_BOX</span>
          </div>
          <div className="panel-body">
            <form onSubmit={handleCrearCaja} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">FOLIO</label>
                <input type="text" readOnly value="Autogenerado" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">CLIENTE</label>
                <select className="form-select" value={nuevoClienteId} onChange={(e) => setNuevoClienteId(Number(e.target.value))}>
                  {CATALOGO_CLIENTES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre_cliente}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">TIPO DE CAJA (MODELO)</label>
                <select className="form-select" value={nuevoModeloId} onChange={(e) => setNuevoModeloId(Number(e.target.value))}>
                  {CATALOGO_MODELOS.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre_modelo} ({m.capacidad_caja} pzas)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">COLOR</label>
                <select className="form-select" value={nuevoColorId} onChange={(e) => setNuevoColorId(Number(e.target.value))}>
                  {CATALOGO_COLORES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre_color}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ESTADO</label>
                <input type="text" readOnly value={cajaActual?.estado || 'Abierta'} className="form-input" />
              </div>
              <div style={{ gridColumn: 'span 5', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={!puedeEmpacar} className="btn btn-yellow">
                    CREAR CAJA
                  </button>
                  <button
                    type="button"
                    onClick={handleCerrar}
                    disabled={!puedeEmpacar || !cajaActual || ocupacion === 0 || cajaActual.estado === 'Cerrada'}
                    className="btn btn-carbon"
                  >
                    CERRAR CAJA E IMPRIMIR ETIQUETA
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMensaje(null)}
                  className="btn btn-outline"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SELECTOR DE CAJA ACTIVA Y ESTADO */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">SELECCIÓN DE CAJA DE TRABAJO (P-21..P-25)</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-accent">OCUPACIÓN: {ocupacion} / {capacidad} PZAS</span>
              {cajaActual && (
                <span className={`badge ${cajaActual.estado === 'Abierta' ? 'badge-ok' : 'badge-danger'}`}>
                  CAJA {cajaActual.estado.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">CAJA EN BANCO DE EMPAQUE</label>
                <select
                  className="form-select"
                  value={cajaActual?.id || cajaSeleccionadaId}
                  onChange={(e) => setCajaSeleccionadaId(Number(e.target.value))}
                >
                  {cajas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo_caja} - {c.cliente_nombre} // {c.modelo_nombre} ({c.color_nombre}) [{c.piezas_actuales || 0}/{c.capacidad}] - {c.estado}
                    </option>
                  ))}
                </select>
              </div>

              {cajaActual && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      CLIENTE: <strong style={{ color: 'var(--text-main)' }}>{cajaActual.cliente_nombre}</strong> | MODELO:{' '}
                      <strong style={{ color: 'var(--carbon-900)' }}>{cajaActual.modelo_nombre}</strong> | COLOR:{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{cajaActual.color_nombre}</strong>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{porcentaje}% LLENA</span>
                  </div>
                  {/* BARRA INDUSTRIAL DE PROGRESO */}
                  <div style={{ height: '10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${porcentaje}%`,
                        background: porcentaje === 100 ? 'var(--ok)' : 'var(--accent)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WORK AREA: ESCANEO Y ACCIONES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* TERMINAL DE ESCANEO DE SERIE */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ESCANEO DE PIEZA A EMPACAR (RN-01, RN-05, RN-06)</span>
              <span className="badge badge-accent">BARCODE_SCAN</span>
            </div>
            <div className="panel-body">
              {cajaActual?.estado === 'Cerrada' ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--border-default)' }}>
                  <span className="badge badge-danger" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    CAJA CERRADA Y SELLADA
                  </span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    No se admiten nuevas unidades en esta caja a menos que el Supervisor de Almacén autorice su reapertura formal.
                  </p>
                  <button onClick={() => setModalReapertura(true)} className="btn btn-carbon">
                    SOLICITAR REAPERTURA DE CAJA
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmpacar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">ESCANEAR NÚMERO DE SERIE DE LA UNIDAD</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Ej. NS-2026-0001"
                        className="form-input"
                        style={{ flex: 1, fontSize: '1.1rem', fontWeight: 800 }}
                        value={serieInput}
                        onChange={(e) => setSerieInput(e.target.value.toUpperCase())}
                      />
                      <select
                        className="form-select"
                        style={{ width: '180px' }}
                        value={serieInput}
                        onChange={(e) => setSerieInput(e.target.value)}
                      >
                        <option value="">-- Rápidas libres --</option>
                        {unidades
                          .filter((u) => !u.id_caja && u.id_estado_calidad === 1)
                          .map((u) => (
                            <option key={u.id} value={u.numero_serie}>
                              {u.numero_serie} ({u.modelo} - {u.color})
                            </option>
                          ))}
                      </select>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      * El sistema valida automáticamente que la pieza esté Aprobada por Calidad y que coincida en Modelo y Color con la caja.
                    </span>
                  </div>

                  <button type="submit" disabled={!puedeEmpacar} className="btn btn-yellow" style={{ height: '3.2rem', fontSize: '0.95rem' }}>
                    EMPACAR EN CAJA ({ocupacion + 1} DE {capacidad})
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleCerrar}
                      disabled={!puedeEmpacar || ocupacion === 0}
                      className="btn btn-carbon"
                      style={{ flex: 1 }}
                    >
                      CERRAR Y SELLAR CAJA
                    </button>
                    <button
                      type="button"
                      disabled={!puedeEmpacar}
                      onClick={() => setModalReapertura(true)}
                      className="btn btn-outline"
                    >
                      REAPERTURA
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* CONTENIDO DE LA CAJA (SLOTS) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CONTENIDO DE LA CAJA ({cajaActual?.codigo_caja})</span>
              <span className="badge badge-accent">{detallesDeCaja.length} PZAS ADENTRO</span>
            </div>
            <div className="panel-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {detallesDeCaja.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [CAJA VACÍA - LISTA PARA PRIMER SLOT]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {detallesDeCaja.map((det) => (
                    <div
                      key={det.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--carbon-900)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            padding: '0.1rem 0.4rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          SLOT {det.slot}
                        </span>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
                            {det.numero_serie}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{det.fecha_empaque}</div>
                        </div>
                      </div>

                      {cajaActual?.estado === 'Abierta' && (
                        <button
                          type="button"
                          disabled={!puedeEmpacar}
                          onClick={() => {
                            setSerieRetirar(det.numero_serie);
                            setModalRetiro(true);
                          }}
                          className="btn btn-outline"
                          style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.65rem' }}
                        >
                          RETIRAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* MODAL: APERTURA DE NUEVA CAJA */}
      {modalNuevaCaja && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                APERTURA DE NUEVA CAJA (P-21)
              </span>
              <button onClick={() => setModalNuevaCaja(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={handleCrearCaja} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">CLIENTE DESTINO</label>
                <select
                  className="form-select"
                  value={nuevoClienteId}
                  onChange={(e) => setNuevoClienteId(Number(e.target.value))}
                >
                  {CATALOGO_CLIENTES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_cliente} ({c.permite_mezcla_colores ? 'Permite mezcla' : 'Sin mezcla'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">MODELO A EMPACAR</label>
                  <select
                    className="form-select"
                    value={nuevoModeloId}
                    onChange={(e) => setNuevoModeloId(Number(e.target.value))}
                  >
                    {CATALOGO_MODELOS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre_modelo} (Cap: {m.capacidad_caja} pzas)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">COLOR OFICIAL</label>
                  <select
                    className="form-select"
                    value={nuevoColorId}
                    onChange={(e) => setNuevoColorId(Number(e.target.value))}
                  >
                    {CATALOGO_COLORES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setModalNuevaCaja(false)} className="btn btn-outline">
                  CANCELAR
                </button>
                <button type="submit" disabled={!puedeEmpacar} className="btn btn-yellow">
                  ABRIR CAJA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITUD DE REAPERTURA */}
      {modalReapertura && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="station-title" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'block' }}>
              SOLICITAR REAPERTURA DE CAJA SELLADA (RN-09)
            </span>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">MOTIVO / JUSTIFICACIÓN DE AUDITORÍA</label>
              <textarea
                rows={4}
                required
                placeholder="Indique la justificación para reabrir esta caja ya sellada"
                className="form-textarea"
                value={motivoReapertura}
                onChange={(e) => setMotivoReapertura(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalReapertura(false)} className="btn btn-outline">
                CANCELAR
              </button>
              <button onClick={handleSolicitarReapertura} className="btn btn-yellow">
                ENVIAR SOLICITUD A SUPERVISOR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETIRO DE UNIDAD */}
      {modalRetiro && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="station-title" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'block' }}>
              RETIRAR UNIDAD DE LA CAJA: {serieRetirar}
            </span>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">MOTIVO DEL RETIRO DE LA UNIDAD</label>
              <textarea
                rows={3}
                required
                placeholder="Motivo formal de extracción de la pieza empacada"
                className="form-textarea"
                value={motivoRetiro}
                onChange={(e) => setMotivoRetiro(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalRetiro(false)} className="btn btn-outline">
                CANCELAR
              </button>
              <button onClick={handleRetirarUnidad} className="btn btn-danger">
                CONFIRMAR RETIRO DE SERIE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
