import React, { useState, useRef } from 'react';
import { usePlanta, CATALOGO_DEFECTOS_OFICIALES } from '../context/PlantaContext';

export default function EnsambleStation() {
  const {
    sesion,
    ordenes,
    conteosEnsamble,
    defectosEnsamble,
    registrarConteoEnsamble,
    registrarDefectoEnsamble,
  } = usePlanta();

  // Filtrar órdenes asignadas a la línea activa de la sesión
  const ordenesLinea = ordenes.filter((o) => o.id_linea_asignada === sesion.linea.id);
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number>(ordenesLinea[0]?.id || ordenes[0]?.id || 1);
  const [cantidadPiezas, setCantidadPiezas] = useState<number>(10);
  const [turnoForm, setTurnoForm] = useState<string>(sesion.turno.nombre_turno || 'Turno A');
  const [marcarConDefecto, setMarcarConDefecto] = useState<boolean>(false);
  const [defectoId, setDefectoId] = useState<number>(1);
  const [cantidadDefectos, setCantidadDefectos] = useState<number>(1);
  const [obsDefecto, setObsDefecto] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [registroSeleccionadoId, setRegistroSeleccionadoId] = useState<number | null>(conteosEnsamble[0]?.id ?? null);
  const [registrosOcultosLocal, setRegistrosOcultosLocal] = useState<number[]>([]);
  const [modalDetalle, setModalDetalle] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);

  const ordenActiva = ordenes.find((o) => o.id === ordenSeleccionadaId);

  // Totales de la línea y turno actuales
  const totalPiezasTurno = conteosEnsamble
    .filter((c) => c.id_linea === sesion.linea.id && c.id_turno === sesion.turno.id)
    .reduce((sum, c) => sum + c.cantidad, 0);

  const totalDefectosTurno = defectosEnsamble
    .filter((d) => d.id_linea === sesion.linea.id && d.id_turno === sesion.turno.id)
    .reduce((sum, d) => sum + d.cantidad, 0);

  const conteosFiltrados = conteosEnsamble
    .filter((c) => !registrosOcultosLocal.includes(c.id))
    .map((c) => {
      const ord = ordenes.find((o) => o.id === c.id_orden);
      const tieneDefecto = defectosEnsamble.some((d) => d.id_orden === c.id_orden && d.id_turno === c.id_turno);
      return {
        ...c,
        folio: ord?.folio || `ORD-${c.id_orden}`,
        modelo: ord?.modelo_nombre || '--',
        estadoLabel: tieneDefecto ? 'Con defecto' : 'Ensamblada',
      };
    })
    .filter((item) => {
      const q = busqueda.trim().toLowerCase();
      const matchTexto = !q || item.folio.toLowerCase().includes(q) || item.modelo.toLowerCase().includes(q);
      const matchEstado = filtroEstado === 'Todos' || item.estadoLabel === filtroEstado;
      return matchTexto && matchEstado;
    });

  const registroSeleccionado =
    conteosFiltrados.find((c) => c.id === registroSeleccionadoId) || conteosFiltrados[0] || null;

  const limpiarFormulario = () => {
    setCantidadPiezas(10);
    setMarcarConDefecto(false);
    setCantidadDefectos(1);
    setObsDefecto('');
  };

  const handleGuardarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenActiva) {
      setMensaje({ tipo: 'err', texto: 'Seleccione una orden válida' });
      return;
    }
    const res = await registrarConteoEnsamble(ordenActiva.id, cantidadPiezas);
    if (!res.ok) {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al registrar conteo' });
      return;
    }
    if (marcarConDefecto) {
      const resDef = await registrarDefectoEnsamble(ordenActiva.id, defectoId, cantidadDefectos, obsDefecto);
      if (!resDef.ok) {
        setMensaje({ tipo: 'err', texto: resDef.error || 'Conteo guardado, pero falló registro de defecto' });
        return;
      }
      setMensaje({
        tipo: 'ok',
        texto: `Registro guardado (+${cantidadPiezas} pzas y ${cantidadDefectos} defecto(s) en ${ordenActiva.folio})`,
      });
      setObsDefecto('');
      setMarcarConDefecto(false);
    } else {
      setMensaje({ tipo: 'ok', texto: `Conteo registrado: +${cantidadPiezas} piezas en orden ${ordenActiva.folio}` });
    }
  };

  const handleRegistrarDefectoSolo = async () => {
    if (!ordenActiva) return;
    const res = await registrarDefectoEnsamble(ordenActiva.id, defectoId, cantidadDefectos, obsDefecto);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Defecto de ensamble registrado correctamente en ${ordenActiva.folio}` });
      setObsDefecto('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al registrar defecto' });
    }
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">02</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 02 · Conteo de Línea</span>
            <h1 className="station-title">Ensamble Mecánico y Estructural</h1>
            <span className="station-subtitle">
              Línea activa: {sesion.linea.nombre_linea} | Turno: {sesion.turno.nombre_turno} | Operador: {sesion.usuario.nombre_completo}
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--carbon-900)', textTransform: 'uppercase' }}>
              OBJETIVO DEL TURNO:
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {totalPiezasTurno} / 100 PZAS
            </div>
          </div>
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

        {/* INDICADORES CLAVE */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">ENSAMBLADAS HOY</span>
            <span className="kpi-value">{totalPiezasTurno}</span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Línea {sesion.linea.nombre_linea}]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">DEFECTOS DE ENSAMBLE</span>
            <span className="kpi-value">{totalDefectosTurno}</span>
            <span className="kpi-delta" style={{ color: totalDefectosTurno > 0 ? 'var(--warn)' : 'var(--ok)' }}>
              [Fallas mecánicas]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">ORDEN EN TRABAJO</span>
            <span className="kpi-value" style={{ fontSize: '1.4rem' }}>
              {ordenActiva?.folio || 'N/A'}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--carbon-900)' }}>
              {ordenActiva?.modelo_nombre} - {ordenActiva?.color_nombre}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">AVANCE DE ORDEN</span>
            <span className="kpi-value" style={{ fontSize: '1.4rem' }}>
              {ordenActiva ? `${ordenActiva.piezas_ensambladas || 0} / ${ordenActiva.cantidad}` : '0 / 0'}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--text-muted)' }}>
              Destino: {ordenActiva?.cliente_nombre || 'N/A'}
            </span>
          </div>
        </div>

        {/* WORK AREA: TABLA IZQ (PDF ORIGINAL) + REGISTRO DER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* TABLA DE UNIDADES ENSAMBLADAS */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">UNIDADES ENSAMBLADAS · {sesion.turno.nombre_turno.toUpperCase()}</span>
              <span className="badge badge-accent">
                {totalPiezasTurno} ENSAMBLADAS · OBJ: 100 · {totalDefectosTurno} CON DEFECTO · SEMANA 39
              </span>
            </div>
            {/* BARRA DE FILTROS (SPEC ORIGINAL) */}
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
              <input
                type="text"
                placeholder="Buscar por orden o modelo..."
                className="form-input"
                style={{ flex: 1, minWidth: '180px', height: '2rem', fontSize: '0.8rem' }}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select
                className="form-select"
                style={{ height: '2rem', fontSize: '0.8rem', minWidth: '130px' }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Ensamblada">Ensamblada</option>
                <option value="Con defecto">Con defecto</option>
              </select>
              <button
                type="button"
                className="btn btn-yellow"
                style={{ height: '2rem', padding: '0 0.85rem', fontSize: '0.75rem' }}
                onClick={() => cantidadInputRef.current?.focus()}
              >
                + REGISTRAR
              </button>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>ORDEN</th>
                      <th>MODELO</th>
                      <th>TURNO</th>
                      <th>OPERADOR</th>
                      <th>CANT.</th>
                      <th>HORA</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conteosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          [SIN REGISTROS EN EL TURNO CON ESE FILTRO]
                        </td>
                      </tr>
                    ) : (
                      conteosFiltrados.map((c) => {
                        const sel = registroSeleccionado?.id === c.id;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setRegistroSeleccionadoId(c.id)}
                            style={{
                              cursor: 'pointer',
                              background: sel ? 'rgba(255, 250, 0, 0.12)' : undefined,
                            }}
                          >
                            <td style={{ fontWeight: 700, color: 'var(--carbon-900)', fontFamily: 'var(--font-mono)' }}>
                              {c.folio}
                            </td>
                            <td>{c.modelo}</td>
                            <td>L{c.id_linea} / T{c.id_turno}</td>
                            <td>{sesion.usuario.nombre_completo}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>+{c.cantidad}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{c.fecha_hora}</td>
                            <td>
                              <span className={`badge ${c.estadoLabel === 'Con defecto' ? 'badge-warn' : 'badge-ok'}`}>
                                {c.estadoLabel}
                              </span>
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
                  Seleccionada: <strong>{registroSeleccionado ? registroSeleccionado.folio : 'Ninguna'}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    type="button"
                    disabled={!registroSeleccionado}
                    onClick={() => setModalDetalle(true)}
                    className="btn btn-outline"
                    style={{ height: '1.9rem', padding: '0 0.65rem', fontSize: '0.7rem' }}
                  >
                    VER DETALLE
                  </button>
                  <button
                    type="button"
                    disabled={!registroSeleccionado}
                    onClick={() => {
                      if (registroSeleccionado) {
                        setOrdenSeleccionadaId(registroSeleccionado.id_orden);
                      }
                      setMarcarConDefecto(true);
                    }}
                    className="btn btn-outline"
                    style={{ height: '1.9rem', padding: '0 0.65rem', fontSize: '0.7rem' }}
                  >
                    MARCAR DEFECTO
                  </button>
                  <button
                    type="button"
                    disabled={!registroSeleccionado}
                    onClick={() => {
                      if (!registroSeleccionado) return;
                      setRegistrosOcultosLocal((prev) => [...prev, registroSeleccionado.id]);
                      setMensaje({ tipo: 'ok', texto: `Registro #${registroSeleccionado.id} retirado de vista` });
                    }}
                    className="btn btn-danger"
                    style={{ height: '1.9rem', padding: '0 0.65rem', fontSize: '0.7rem' }}
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: REGISTRAR ENSAMBLE (SPEC ORIGINAL) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">REGISTRAR ENSAMBLE (P-11, P-14, F-03)</span>
              <span className="badge badge-accent">BATCH_COUNT</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleGuardarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ORDEN DE PRODUCCIÓN</label>
                  <select
                    className="form-select"
                    value={ordenSeleccionadaId}
                    onChange={(e) => setOrdenSeleccionadaId(Number(e.target.value))}
                  >
                    {ordenes.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.folio} - {ord.modelo_nombre} ({ord.color_nombre}) [{ord.cliente_nombre}] {ord.id_linea_asignada ? `(L${ord.id_linea_asignada})` : '(Sin línea)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">MODELO</label>
                    <input
                      type="text"
                      readOnly
                      className="form-input"
                      value={ordenActiva?.modelo_nombre || '--'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">OPERADOR</label>
                    <input
                      type="text"
                      readOnly
                      className="form-input"
                      value={sesion.usuario.nombre_completo}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">TURNO</label>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', paddingTop: '0.15rem' }}>
                    {['Turno A', 'Turno B', 'Turno C'].map((t) => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="turno_ensamble_form"
                          checked={turnoForm === t}
                          onChange={() => setTurnoForm(t)}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">CANTIDAD ENSAMBLADA (PIEZAS)</label>
                  <input
                    ref={cantidadInputRef}
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={cantidadPiezas}
                    onChange={(e) => setCantidadPiezas(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[1, 5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCantidadPiezas(num)}
                        className="btn btn-dark"
                        style={{ height: '1.9rem', flex: 1, fontSize: '0.7rem' }}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHECKBOX DEFECTO (SPEC ORIGINAL) */}
                <div style={{ border: '1px solid var(--border-default)', padding: '0.75rem', background: 'var(--bg-surface-elevated)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={marcarConDefecto}
                      onChange={(e) => setMarcarConDefecto(e.target.checked)}
                    />
                    Marcar pieza(s) con defecto
                  </label>
                  {marcarConDefecto && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">CATÁLOGO DE DEFECTO OFICIAL</label>
                        <select
                          className="form-select"
                          value={defectoId}
                          onChange={(e) => setDefectoId(Number(e.target.value))}
                        >
                          {CATALOGO_DEFECTOS_OFICIALES.filter((d) => d.categoria === 'Apariencia' || d.categoria === 'Ensamble' || d.categoria === 'Funcional').map((d) => (
                            <option key={d.id} value={d.id}>
                              [{d.categoria.toUpperCase()}] {d.descripcion} ({d.severidad})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">CANTIDAD AFECTADA</label>
                          <input
                            type="number"
                            min={1}
                            className="form-input"
                            value={cantidadDefectos}
                            onChange={(e) => setCantidadDefectos(Number(e.target.value))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRegistrarDefectoSolo}
                          className="btn btn-danger"
                          style={{ height: '2.4rem', fontSize: '0.72rem' }}
                        >
                          SOLO DEFECTO
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROGRESO DEL TURNO (SPEC ORIGINAL) */}
                <div style={{ border: '1px solid var(--border-default)', padding: '0.75rem', background: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      UNIDADES ENSAMBLADAS · {turnoForm.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem' }}>
                      {totalPiezasTurno} / 100
                    </span>
                  </div>
                  <div style={{ height: '10px', background: '#191919', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, totalPiezasTurno)}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">OBSERVACIONES</label>
                  <textarea
                    rows={2}
                    placeholder="Notas de línea, torque o causa raíz..."
                    className="form-textarea"
                    value={obsDefecto}
                    onChange={(e) => setObsDefecto(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={limpiarFormulario} className="btn btn-outline" style={{ flex: 1 }}>
                    CANCELAR
                  </button>
                  <button type="submit" className="btn btn-yellow" style={{ flex: 1.5 }}>
                    GUARDAR REGISTRO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE REGISTRO ENSAMBLE */}
      {modalDetalle && registroSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.15rem' }}>
                DETALLE DE ENSAMBLE · {registroSeleccionado.folio}
              </span>
              <button onClick={() => setModalDetalle(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Modelo:</strong> {registroSeleccionado.modelo}</div>
              <div><strong>Estado:</strong> {registroSeleccionado.estadoLabel}</div>
              <div><strong>Cantidad:</strong> +{registroSeleccionado.cantidad} piezas</div>
              <div><strong>Línea / Turno:</strong> Línea {registroSeleccionado.id_linea} / Turno {registroSeleccionado.id_turno}</div>
              <div><strong>Hora registro:</strong> {registroSeleccionado.fecha_hora}</div>
              <div><strong>Operador:</strong> {sesion.usuario.nombre_completo}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
