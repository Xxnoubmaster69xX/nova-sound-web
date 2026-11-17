import React, { useState } from 'react';
import {
  usePlanta,
  CATALOGO_CLIENTES,
  CATALOGO_TRANSPORTISTAS,
} from '../context/PlantaContext';

export default function EmbarquesStation() {
  const {
    sesion,
    embarques,
    cajas,
    cajasAsignadasEmbarque,
    crearEmbarque,
    asignarCajaEmbarque,
    retirarCajaEmbarque,
    despacharEmbarque,
  } = usePlanta();

  const [embarqueSeleccionadoId, setEmbarqueSeleccionadoId] = useState<number>(embarques[0]?.id || 1);
  const [modalNuevo, setModalNuevo] = useState<boolean>(false);
  const [modalEditar, setModalEditar] = useState<boolean>(false);
  const [busquedaEmb, setBusquedaEmb] = useState<string>('');
  const [filtroClienteEmb, setFiltroClienteEmb] = useState<string>('Todos');
  const [filtroEstadoEmb, setFiltroEstadoEmb] = useState<string>('Todos');
  const [canceladosLocal, setCanceladosLocal] = useState<number[]>([]);
  const [edicionesLocal, setEdicionesLocal] = useState<
    Record<number, { pedido: string; cliente: string; transportista: string; fechaProg: string; obs: string }>
  >({});

  // Estado temporal del modal Editar Embarque
  const [editRef, setEditRef] = useState<string>('');
  const [editPedido, setEditPedido] = useState<string>('');
  const [editCliente, setEditCliente] = useState<string>('');
  const [editTransportista, setEditTransportista] = useState<string>('');
  const [editFechaProg, setEditFechaProg] = useState<string>('');
  const [editObs, setEditObs] = useState<string>('');

  // Formulario nuevo embarque
  const [pedido, setPedido] = useState<string>('PED-2026-001');
  const [idCliente, setIdCliente] = useState<number>(CATALOGO_CLIENTES[0].id);
  const [idTransportista, setIdTransportista] = useState<number>(CATALOGO_TRANSPORTISTAS[0].id);
  const [chofer, setChofer] = useState<string>('Ramiro Valdés');
  const [placas, setPlacas] = useState<string>('NL-884-TX');
  const [fechaProg, setFechaProg] = useState<string>('2026-11-05 14:00');
  const [obs, setObs] = useState<string>('Embarque prioritario con sello de seguridad');

  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const embarqueBase = embarques.find((e) => e.id === embarqueSeleccionadoId);
  const edicionActiva = embarqueBase ? edicionesLocal[embarqueBase.id] : undefined;
  const embarqueActual = embarqueBase
    ? {
        ...embarqueBase,
        id_pedido: edicionActiva?.pedido ?? embarqueBase.id_pedido,
        cliente_nombre: edicionActiva?.cliente ?? embarqueBase.cliente_nombre,
        transportista_nombre: edicionActiva?.transportista ?? embarqueBase.transportista_nombre,
        fecha_programada: edicionActiva?.fechaProg ?? embarqueBase.fecha_programada,
        estado: canceladosLocal.includes(embarqueBase.id) ? 'Cancelado' : embarqueBase.estado,
      }
    : undefined;

  const embarquesFiltrados = embarques.filter((e) => {
    const ed = edicionesLocal[e.id];
    const pedidoVis = ed?.pedido ?? e.id_pedido;
    const clienteVis = ed?.cliente ?? (e.cliente_nombre || '');
    const estadoVis = canceladosLocal.includes(e.id) ? 'Cancelado' : e.estado;
    const q = busquedaEmb.trim().toLowerCase();
    const matchQ =
      !q ||
      e.referencia_embarque.toLowerCase().includes(q) ||
      String(pedidoVis).toLowerCase().includes(q);
    const matchCliente = filtroClienteEmb === 'Todos' || clienteVis === filtroClienteEmb;
    const matchEstado = filtroEstadoEmb === 'Todos' || estadoVis === filtroEstadoEmb;
    return matchQ && matchCliente && matchEstado;
  });

  const abrirModalEditar = (embId: number) => {
    const target = embarques.find((x) => x.id === embId);
    if (!target) return;
    const ed = edicionesLocal[target.id];
    setEmbarqueSeleccionadoId(target.id);
    setEditRef(target.referencia_embarque);
    setEditPedido(String(ed?.pedido ?? target.id_pedido));
    setEditCliente(ed?.cliente ?? (target.cliente_nombre || CATALOGO_CLIENTES[0].nombre_cliente));
    setEditTransportista(ed?.transportista ?? (target.transportista_nombre || CATALOGO_TRANSPORTISTAS[0].nombre));
    setEditFechaProg(ed?.fechaProg ?? target.fecha_programada);
    setEditObs(ed?.obs ?? '');
    setModalEditar(true);
  };

  const handleGuardarEdicion = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!embarqueBase) return;
    setEdicionesLocal((prev) => ({
      ...prev,
      [embarqueBase.id]: {
        pedido: editPedido,
        cliente: editCliente,
        transportista: editTransportista,
        fechaProg: editFechaProg,
        obs: editObs,
      },
    }));
    setModalEditar(false);
    setMensaje({ tipo: 'ok', texto: `Cambios guardados en embarque ${editRef}` });
  };
  const cajasAsignadasIds = cajasAsignadasEmbarque[embarqueSeleccionadoId] || [];
  const cajasAsignadas = cajas.filter((c) => cajasAsignadasIds.includes(c.id));

  // Cajas cerradas disponibles SOLO para el cliente del embarque seleccionado (P-27)
  const cajasDisponibles = cajas.filter(
    (c) =>
      c.estado === 'Cerrada' &&
      c.id_cliente === embarqueActual?.id_cliente &&
      !cajasAsignadasIds.includes(c.id) &&
      (!c.id_embarque_asignado || c.id_embarque_asignado === embarqueActual?.id)
  );

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await crearEmbarque(pedido, idCliente, idTransportista, chofer, placas, fechaProg, obs);
    if (res.ok && res.embarque) {
      setEmbarqueSeleccionadoId(res.embarque.id);
      setModalNuevo(false);
      setMensaje({ tipo: 'ok', texto: `Embarque ${res.embarque.referencia_embarque} programado en sistema` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al programar embarque' });
    }
  };

  const handleAsignarCaja = async (cajaId: number) => {
    if (!embarqueActual) return;
    const res = await asignarCajaEmbarque(embarqueActual.id, cajaId);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Caja #${cajaId} vinculada al manifiesto del embarque` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al asignar caja' });
    }
  };

  const handleRetirarCaja = async (cajaId: number) => {
    if (!embarqueActual) return;
    const res = await retirarCajaEmbarque(embarqueActual.id, cajaId);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Caja #${cajaId} retirada del embarque` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al retirar caja' });
    }
  };

  const handleDespachar = async () => {
    if (!embarqueActual) return;
    const res = await despacharEmbarque(embarqueActual.id);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `¡EMBARQUE DESPACHADO! Salida confirmada y registrada en auditoría` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Bloqueo de salida' });
    }
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">06</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 06 · Despacho y Logística</span>
            <h1 className="station-title">Embarques y Salida de Producto Terminado</h1>
            <span className="station-subtitle">
              Manifiesto de carga con revalidación de Calidad en tiempo real (Incidente C)
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={() => setModalNuevo(true)} className="btn btn-yellow">
            + PROGRAMAR EMBARQUE
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

        {/* KPIs SUPERIORES DE EMBARQUE (SPEC ORIGINAL) */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">EN PREPARACIÓN</span>
            <span className="kpi-value">
              {embarques.filter((e) => e.estado !== 'Despachado' && (cajasAsignadasEmbarque[e.id]?.length || 0) === 0).length}
            </span>
            <span className="kpi-delta">[Sin cajas asignadas]</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">LISTOS PARA SALIR</span>
            <span className="kpi-value" style={{ color: 'var(--info)' }}>
              {embarques.filter((e) => e.estado !== 'Despachado' && (cajasAsignadasEmbarque[e.id]?.length || 0) > 0).length}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--info)' }}>[Con manifiesto]</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">EMBARCADOS</span>
            <span className="kpi-value" style={{ color: 'var(--ok)' }}>
              {embarques.filter((e) => e.estado === 'Despachado').length}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>[Salida confirmada]</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">CAJAS CERRADAS SIN EMBARQUE</span>
            <span className="kpi-value">
              {cajas.filter((c) => c.estado === 'Cerrada' && !c.id_embarque_asignado).length}
            </span>
            <span className="kpi-delta">[Disponibles en almacén]</span>
          </div>
        </div>

        {/* TABLA RESUMEN DE EMBARQUES (SPEC ORIGINAL PÁG. 8 ARRIBA) */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">EMBARQUES PROGRAMADOS ({embarquesFiltrados.length})</span>
            <span className="badge badge-accent">DESPACHO_LOG</span>
          </div>
          {/* BARRA DE FILTROS (BUSCAR / CLIENTE / ESTADO) */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>BUSCAR:</label>
              <input
                type="text"
                placeholder="Referencia o folio de pedido..."
                className="form-input"
                style={{ height: '2rem', fontSize: '0.8rem' }}
                value={busquedaEmb}
                onChange={(e) => setBusquedaEmb(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>CLIENTE:</label>
              <select
                className="form-select"
                style={{ height: '2rem', fontSize: '0.8rem' }}
                value={filtroClienteEmb}
                onChange={(e) => setFiltroClienteEmb(e.target.value)}
              >
                <option value="Todos">Todos</option>
                {CATALOGO_CLIENTES.map((c) => (
                  <option key={c.id} value={c.nombre_cliente}>{c.nombre_cliente}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>ESTADO:</label>
              <select
                className="form-select"
                style={{ height: '36px', fontSize: '0.82rem' }}
                value={filtroEstadoEmb}
                onChange={(e) => setFiltroEstadoEmb(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Programado">Programado</option>
                <option value="Despachado">Despachado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>REFERENCIA</th>
                    <th>PEDIDO</th>
                    <th>CLIENTE</th>
                    <th>TRANSPORTISTA</th>
                    <th>PROGRAMADA</th>
                    <th>CONTENIDO</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {embarquesFiltrados.map((e) => {
                    const countCajas = (cajasAsignadasEmbarque[e.id] || []).length;
                    const seleccionado = e.id === embarqueSeleccionadoId;
                    const ed = edicionesLocal[e.id];
                    const estadoVis = canceladosLocal.includes(e.id) ? 'Cancelado' : e.estado;
                    return (
                      <tr
                        key={e.id}
                        style={{
                          background: seleccionado ? 'rgba(255, 250, 0, 0.08)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => setEmbarqueSeleccionadoId(e.id)}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{e.referencia_embarque}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ed?.pedido ?? e.id_pedido}</td>
                        <td>{ed?.cliente ?? e.cliente_nombre}</td>
                        <td>{ed?.transportista ?? e.transportista_nombre}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ed?.fechaProg ?? e.fecha_programada}</td>
                        <td>{countCajas} Cajas</td>
                        <td>
                          <span className={`badge ${estadoVis === 'Despachado' ? 'badge-ok' : estadoVis === 'Cancelado' ? 'badge-danger' : 'badge-info'}`}>
                            {estadoVis}
                          </span>
                        </td>
                        <td onClick={(ev) => ev.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className={`btn ${seleccionado ? 'btn-yellow' : 'btn-outline'}`}
                              style={{ height: '1.8rem', padding: '0 0.55rem', fontSize: '0.65rem' }}
                              onClick={() => setEmbarqueSeleccionadoId(e.id)}
                            >
                              VER
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ height: '1.8rem', padding: '0 0.55rem', fontSize: '0.65rem' }}
                              onClick={() => abrirModalEditar(e.id)}
                            >
                              EDITAR
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DETALLE DEL EMBARQUE SELECCIONADO (SPEC ORIGINAL PÁG. 9 ARRIBA) */}
        {embarqueActual && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-title">{embarqueActual.referencia_embarque}</span>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Pedido {embarqueActual.id_pedido}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {embarqueActual.estado !== 'Despachado' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCanceladosLocal((prev) =>
                        prev.includes(embarqueActual.id) ? prev : [...prev, embarqueActual.id]
                      );
                      setMensaje({ tipo: 'err', texto: `Embarque ${embarqueActual.referencia_embarque} marcado como Cancelado` });
                    }}
                    className="btn btn-danger"
                    style={{ height: '2rem', fontSize: '0.72rem' }}
                  >
                    CANCELAR EMBARQUE
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => abrirModalEditar(embarqueActual.id)}
                  className="btn btn-outline"
                  style={{ height: '2rem', fontSize: '0.72rem' }}
                >
                  EDITAR DATOS
                </button>
                {embarqueActual.estado !== 'Despachado' && embarqueActual.estado !== 'Cancelado' && (
                  <button
                    type="button"
                    onClick={handleDespachar}
                    disabled={cajasAsignadas.length === 0}
                    className="btn btn-yellow"
                    style={{ height: '2rem', fontSize: '0.72rem' }}
                  >
                    CONFIRMAR SALIDA
                  </button>
                )}
              </div>
            </div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                {/* FICHA DATOS DEL EMBARQUE */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div className="form-label" style={{ marginBottom: '0.25rem' }}>DATOS DEL EMBARQUE</div>
                  <div><strong>Cliente:</strong> {embarqueActual.cliente_nombre}</div>
                  <div><strong>Pedido:</strong> {embarqueActual.id_pedido}</div>
                  <div><strong>Transportista:</strong> {embarqueActual.transportista_nombre}</div>
                  <div><strong>Chofer / Placas:</strong> {embarqueActual.nombre_chofer} · {embarqueActual.placas_unidad}</div>
                  <div><strong>Programada:</strong> {embarqueActual.fecha_programada}</div>
                  <div><strong>Estado:</strong> {embarqueActual.estado}</div>
                  <div><strong>Creado por:</strong> {sesion.usuario.nombre_completo}</div>
                </div>

                {/* TABLA DE CAJAS DEL EMBARQUE */}
                <div className="table-container" style={{ border: '1px solid var(--border-default)' }}>
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>CAJA</th>
                        <th>MODELO / COLOR</th>
                        <th>ESTADO</th>
                        <th>CALIDAD</th>
                        <th>PIEZAS</th>
                        <th>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cajasAsignadas.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.25rem' }}>
                            [SIN CAJAS ASIGNADAS - AGREGUE DESDE CAJAS CERRADAS ABAJO]
                          </td>
                        </tr>
                      ) : (
                        cajasAsignadas.map((c) => (
                          <tr key={c.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.codigo_caja}</td>
                            <td>{c.modelo_nombre} ({c.color_nombre})</td>
                            <td><span className="badge badge-dark">{c.estado}</span></td>
                            <td><span className="badge badge-ok">Liberada</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.piezas_actuales || 0}</td>
                            <td>
                              {embarqueActual.estado !== 'Despachado' && (
                                <button
                                  type="button"
                                  onClick={() => handleRetirarCaja(c.id)}
                                  className="btn btn-outline"
                                  style={{ height: '1.7rem', padding: '0 0.5rem', fontSize: '0.65rem' }}
                                >
                                  RETIRAR
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SELECTOR DE EMBARQUE */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">SELECCIÓN DE EMBARQUE ACTIVO (P-26..P-29)</span>
            {embarqueActual && (
              <span className={`badge ${embarqueActual.estado === 'Despachado' ? 'badge-ok' : 'badge-info'}`}>
                {embarqueActual.estado.toUpperCase()}
              </span>
            )}
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">EXPEDIENTE DE EMBARQUE</label>
                <select
                  className="form-select"
                  value={embarqueSeleccionadoId}
                  onChange={(e) => setEmbarqueSeleccionadoId(Number(e.target.value))}
                >
                  {embarques.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.referencia_embarque} - {e.cliente_nombre} [Pedido: {e.id_pedido}] - {e.estado}
                    </option>
                  ))}
                </select>
              </div>

              {embarqueActual && (
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', border: '1px solid var(--border-default)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--carbon-900)' }}>
                      Transportista: {embarqueActual.transportista_nombre}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Prog: {embarqueActual.fecha_programada}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>
                    Chofer: <strong>{embarqueActual.nombre_chofer}</strong> | Placas: <strong>{embarqueActual.placas_unidad}</strong> | Cliente: <strong>{embarqueActual.cliente_nombre}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MANIFIESTO DE CARGA Y ASIGNACIÓN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* CAJAS ASIGNADAS AL MANIFIESTO */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">MANIFIESTO DE CARGA ({cajasAsignadas.length} CAJAS)</span>
              <span className="badge badge-accent">
                TOTAL: {cajasAsignadas.reduce((sum, c) => sum + (c.piezas_actuales || 0), 0)} PIEZAS
              </span>
            </div>
            <div className="panel-body">
              {cajasAsignadas.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [SIN CAJAS ASIGNADAS AL EMBARQUE - SELECCIONE DE LA LISTA DE DISPONIBLES]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {cajasAsignadas.map((caja) => (
                    <div
                      key={caja.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        borderLeft: '4px solid var(--accent)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {caja.codigo_caja} // {caja.modelo_nombre} ({caja.color_nombre})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {caja.piezas_actuales} unidades selladas | Creador: Usuario #{caja.id_usuario_creador}
                        </div>
                      </div>

                      {embarqueActual?.estado !== 'Despachado' && (
                        <button
                          type="button"
                          onClick={() => handleRetirarCaja(caja.id)}
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

              {embarqueActual && embarqueActual.estado !== 'Despachado' && (
                <button
                  type="button"
                  onClick={handleDespachar}
                  disabled={cajasAsignadas.length === 0}
                  className="btn btn-yellow"
                  style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
                >
                  CONFIRMAR SALIDA Y DESPACHO DE ANDÉN (REVALIDAR CALIDAD)
                </button>
              )}
            </div>
          </div>

          {/* CAJAS CERRADAS DISPONIBLES DEL CLIENTE (P-27) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CAJAS CERRADAS DE {embarqueActual?.cliente_nombre?.toUpperCase()}</span>
              <span className="badge badge-accent">{cajasDisponibles.length} DISPONIBLES</span>
            </div>
            <div className="panel-body">
              {cajasDisponibles.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [NO HAY MÁS CAJAS CERRADAS PARA ESTE CLIENTE EN ALMACÉN]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cajasDisponibles.map((caja) => (
                    <div
                      key={caja.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {caja.codigo_caja}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {caja.modelo_nombre} ({caja.color_nombre}) - {caja.piezas_actuales} pzas
                        </div>
                      </div>

                      {embarqueActual?.estado !== 'Despachado' && (
                        <button
                          type="button"
                          onClick={() => handleAsignarCaja(caja.id)}
                          className="btn btn-carbon"
                          style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                        >
                          + AGREGAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR EMBARQUE (SPEC ORIGINAL PÁG. 8 ABAJO) */}
      {modalEditar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                EDITAR EMBARQUE
              </span>
              <button onClick={() => setModalEditar(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">REFERENCIA DE EMBARQUE</label>
                  <input type="text" readOnly className="form-input" value={editRef} />
                </div>
                <div className="form-group">
                  <label className="form-label">PEDIDO</label>
                  <input type="text" required className="form-input" value={editPedido} onChange={(e) => setEditPedido(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">CLIENTE</label>
                <select className="form-select" value={editCliente} onChange={(e) => setEditCliente(e.target.value)}>
                  {CATALOGO_CLIENTES.map((c) => (
                    <option key={c.id} value={c.nombre_cliente}>{c.nombre_cliente}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">TRANSPORTISTA</label>
                  <select className="form-select" value={editTransportista} onChange={(e) => setEditTransportista(e.target.value)}>
                    {CATALOGO_TRANSPORTISTAS.map((t) => (
                      <option key={t.id} value={t.nombre}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">FECHA Y HORA PROGRAMADA</label>
                  <input type="text" required className="form-input" value={editFechaProg} onChange={(e) => setEditFechaProg(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">OBSERVACIONES</label>
                <textarea rows={2} className="form-textarea" value={editObs} onChange={(e) => setEditObs(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalEditar(false)} className="btn btn-outline">
                  CANCELAR
                </button>
                <button type="submit" className="btn btn-yellow">
                  GUARDAR CAMBIOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROGRAMAR EMBARQUE */}
      {modalNuevo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                PROGRAMAR EMBARQUE (P-26)
              </span>
              <button onClick={() => setModalNuevo(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">PEDIDO / ORDEN DE COMPRA</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={pedido}
                    onChange={(e) => setPedido(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CLIENTE DESTINO</label>
                  <select className="form-select" value={idCliente} onChange={(e) => setIdCliente(Number(e.target.value))}>
                    {CATALOGO_CLIENTES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cliente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">LÍNEA TRANSPORTISTA</label>
                  <select
                    className="form-select"
                    value={idTransportista}
                    onChange={(e) => setIdTransportista(Number(e.target.value))}
                  >
                    {CATALOGO_TRANSPORTISTAS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">FECHA PROGRAMADA DE SALIDA</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={fechaProg}
                    onChange={(e) => setFechaProg(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">NOMBRE DEL CHOFER</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={chofer}
                    onChange={(e) => setChofer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PLACAS DE LA UNIDAD</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={placas}
                    onChange={(e) => setPlacas(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">OBSERVACIONES DE EMBARQUE</label>
                <input
                  type="text"
                  className="form-input"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setModalNuevo(false)} className="btn btn-outline">
                  CANCELAR
                </button>
                <button type="submit" className="btn btn-yellow">
                  PROGRAMAR EMBARQUE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
