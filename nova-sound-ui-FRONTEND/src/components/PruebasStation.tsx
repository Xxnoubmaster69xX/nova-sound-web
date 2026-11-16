import React, { useState } from 'react';
import { usePlanta, CATALOGO_DEFECTOS_OFICIALES } from '../context/PlantaContext';

export default function PruebasStation() {
  const {
    sesion,
    ordenes,
    pruebasFuncionales,
    evaluarPruebaFuncional,
    abrirTrazabilidad,
    buscarTrazabilidad,
    consultarTrazabilidadRemota,
    unidades,
  } = usePlanta();

  const [ordenId, setOrdenId] = useState<number>(ordenes[0]?.id || 1);
  const [encendido, setEncendido] = useState<boolean>(true);
  const [audio, setAudio] = useState<boolean>(true);
  const [carga, setCarga] = useState<boolean>(true);
  const [bluetooth, setBluetooth] = useState<boolean>(true);
  const [defectoFallaId, setDefectoFallaId] = useState<number>(5);
  const [busquedaSerie, setBusquedaSerie] = useState<string>(unidades[0]?.numero_serie || '');
  const [resultadoSerie, setResultadoSerie] = useState<ReturnType<typeof buscarTrazabilidad> | null>(null);
  const [resultadoReciente, setResultadoReciente] = useState<{
    aprobada: boolean;
    serie?: string;
    mensaje: string;
  } | null>(null);

  const ordenActiva = ordenes.find((o) => o.id === ordenId);
  const todosChecksOk = encendido && audio && carga && bluetooth;

  const ejecutarEvaluacion = async (aprobarForzado: boolean) => {
    if (!ordenActiva) return;
    const checks = aprobarForzado
      ? { encendido: true, audio: true, carga: true, bluetooth: true }
      : { encendido, audio: todosChecksOk ? false : audio, carga, bluetooth };

    if (aprobarForzado && !todosChecksOk) {
      setEncendido(true);
      setAudio(true);
      setCarga(true);
      setBluetooth(true);
    }

    const res = await evaluarPruebaFuncional(
      ordenActiva.id,
      checks,
      aprobarForzado ? undefined : defectoFallaId
    );

    if (res.ok) {
      if (res.serieGenerada) {
        setResultadoReciente({
          aprobada: true,
          serie: res.serieGenerada,
          mensaje: `PRUEBA APROBADA - SERIE OFICIAL GENERADA: ${res.serieGenerada}`,
        });
      } else {
        setResultadoReciente({
          aprobada: false,
          mensaje: `PRUEBA RECHAZADA - DEFECTO REGISTRADO SIN ASIGNAR SERIE (RN-04)`,
        });
      }
    } else {
      setResultadoReciente({
        aprobada: false,
        mensaje: res.error || 'Error al evaluar prueba funcional',
      });
    }
  };

  const handleEvaluar = async (e: React.FormEvent) => {
    e.preventDefault();
    await ejecutarEvaluacion(todosChecksOk);
  };

  const handleBuscarSerie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaSerie.trim()) return;
    const res = await consultarTrazabilidadRemota(busquedaSerie.trim());
    setResultadoSerie(res || buscarTrazabilidad(busquedaSerie.trim()));
  };

  const pruebasAprobadas = pruebasFuncionales.filter((p) => p.aprobada).length;
  const pruebasRechazadas = pruebasFuncionales.filter((p) => !p.aprobada).length;

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">03</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 03 · Pruebas Funcionales y Serie</span>
            <h1 className="station-title">Prueba Funcional Acústica y Eléctrica</h1>
            <span className="station-subtitle">
              Orden: {ordenActiva?.folio || '--'} | Modelo: {ordenActiva?.modelo_nombre || '--'} | Línea: {sesion.linea.nombre_linea} | Operario: {sesion.usuario.nombre_completo}
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--carbon-900)', textTransform: 'uppercase' }}>
              SERIES EMITIDAS HOY:
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {pruebasAprobadas} UNIDADES
            </div>
          </div>
        </div>
      </div>

      <div className="station-body">
        {resultadoReciente && (
          <div
            style={{
              padding: '1rem 1.5rem',
              background: resultadoReciente.aprobada ? 'var(--ok-bg)' : 'var(--danger-bg)',
              color: resultadoReciente.aprobada ? 'var(--ok)' : 'var(--danger)',
              border: `2px solid ${resultadoReciente.aprobada ? 'var(--ok)' : 'var(--danger)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            <div>
              <span style={{ fontSize: '1rem', textTransform: 'uppercase' }}>
                [{resultadoReciente.aprobada ? 'PASS' : 'FAIL'}] {resultadoReciente.mensaje}
              </span>
              {resultadoReciente.serie && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  Unidad liberada para inspección visual en Estación 03 Calidad.
                </div>
              )}
            </div>
            {resultadoReciente.serie && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--carbon-900)',
                    padding: '0.3rem 0.8rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  {resultadoReciente.serie}
                </span>
                <button
                  type="button"
                  onClick={() => abrirTrazabilidad(resultadoReciente.serie!)}
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                >
                  VER 360°
                </button>
              </div>
            )}
          </div>
        )}

        {/* INDICADORES CLAVE */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">TOTAL EVALUADAS</span>
            <span className="kpi-value">{pruebasFuncionales.length}</span>
            <span className="kpi-delta" style={{ color: 'var(--info)' }}>
              [Línea {sesion.linea.nombre_linea}]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">PRUEBAS APROBADAS</span>
            <span className="kpi-value" style={{ color: 'var(--ok)' }}>
              {pruebasAprobadas}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Series nacidas]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">PRUEBAS FALLIDAS</span>
            <span className="kpi-value" style={{ color: 'var(--danger)' }}>
              {pruebasRechazadas}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--danger)' }}>
              [Sin serie / Retrabajo]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">TASA DE FIRST PASS YIELD</span>
            <span className="kpi-value">
              {pruebasFuncionales.length > 0
                ? `${Math.round((pruebasAprobadas / pruebasFuncionales.length) * 100)}%`
                : '100%'}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--carbon-900)' }}>
              [Rendimiento de prueba]
            </span>
          </div>
        </div>

        {/* WORKSTATION: LOS 4 CHECKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* BANCO DE PRUEBAS */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">BANCO DE MEDICIÓN FUNCIONAL (F-04, P-41)</span>
              <span className="badge badge-accent">TEST_FIXTURE_01</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleEvaluar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">ORDEN DE PRODUCCIÓN EN EVALUACIÓN</label>
                  <select className="form-select" value={ordenId} onChange={(e) => setOrdenId(Number(e.target.value))}>
                    {ordenes.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.folio} - {ord.modelo_nombre} ({ord.color_nombre}) [{ord.cliente_nombre}]
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label className="form-label">LOS 4 PARÁMETROS TÉCNICOS OBLIGATORIOS (RN-04):</label>

                  {/* CHECK 1: ENCENDIDO */}
                  <div
                    className={`tech-check-card ${encendido ? 'checked' : ''}`}
                    onClick={() => setEncendido(!encendido)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        1. Encendido y Circuito de Alimentación
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Voltaje nominal correcto y consumo en standby dentro de tolerancia.
                      </div>
                    </div>
                    <div className="tech-check-indicator">{encendido ? 'OK' : '--'}</div>
                  </div>

                  {/* CHECK 2: AUDIO */}
                  <div
                    className={`tech-check-card ${audio ? 'checked' : ''}`}
                    onClick={() => setAudio(!audio)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        2. Respuesta Acústica y Distorsión THD
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Barrer de 20Hz a 20kHz sin zumbido ni armónicos espurios.
                      </div>
                    </div>
                    <div className="tech-check-indicator">{audio ? 'OK' : '--'}</div>
                  </div>

                  {/* CHECK 3: CARGA */}
                  <div
                    className={`tech-check-card ${carga ? 'checked' : ''}`}
                    onClick={() => setCarga(!carga)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        3. Puerto USB y Ciclo de Carga Rápida
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Detección de conector Type-C y corriente mayor a 1.5A continua.
                      </div>
                    </div>
                    <div className="tech-check-indicator">{carga ? 'OK' : '--'}</div>
                  </div>

                  {/* CHECK 4: BLUETOOTH */}
                  <div
                    className={`tech-check-card ${bluetooth ? 'checked' : ''}`}
                    onClick={() => setBluetooth(!bluetooth)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        4. Conectividad Bluetooth 5.3 y Emparejamiento
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        RSSI superior a -60dBm y handshake con terminal de pruebas.
                      </div>
                    </div>
                    <div className="tech-check-indicator">{bluetooth ? 'OK' : '--'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => ejecutarEvaluacion(true)}
                    className="btn btn-yellow"
                    style={{ height: '3.2rem', fontSize: '0.9rem' }}
                  >
                    APROBAR UNIDAD
                  </button>
                  <button
                    type="button"
                    onClick={() => ejecutarEvaluacion(false)}
                    className="btn btn-danger"
                    style={{ height: '3.2rem', fontSize: '0.9rem' }}
                  >
                    RECHAZAR UNIDAD
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA: SELECCIONAR DEFECTO + REGLAS + SIMULADOR (SPEC ORIGINAL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">SELECCIONAR DEFECTO</span>
                <span className="badge badge-warn">DEFECT_CATALOG</span>
              </div>
              <div className="panel-body">
                <div className="form-group">
                  <label className="form-label">CATÁLOGO DE DEFECTOS FUNCIONALES (RN-04)</label>
                  <select
                    className="form-select"
                    value={defectoFallaId}
                    onChange={(e) => setDefectoFallaId(Number(e.target.value))}
                  >
                    {CATALOGO_DEFECTOS_OFICIALES.filter((d) => d.categoria === 'Funcional').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.descripcion} ({d.severidad})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">REGLAS DE OPERACIÓN (RN-04)</span>
                <span className="badge badge-accent">SPECIFICATION</span>
              </div>
              <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: 'var(--carbon-900)' }}>Nacimiento de Serie:</strong> Una unidad sólo obtiene
                  su identificador único (ej. <code>NS-2026-XXXX</code>) al pasar satisfactoriamente los 4 checks de
                  esta estación.
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: 'var(--danger)' }}>Piezas Rechazadas:</strong> Si alguno de los checks
                  falla, la unidad NO recibe serie y se canaliza inmediatamente a diagnóstico con el defecto del
                  catálogo registrado.
                </p>
                <p>
                  <strong style={{ color: 'var(--ok)' }}>Paso a Calidad:</strong> La serie generada viaja a la
                  Estación 03 de Calidad para verificación cosmética final y dictamen formal de liberación.
                </p>
              </div>
            </div>

            {/* BOTONES DE PRUEBA RÁPIDA */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">SIMULADOR DE RESPUESTA DE HARDWARE</span>
                <span className="badge badge-dark">FIXTURE_CMD</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEncendido(true);
                    setAudio(true);
                    setCarga(true);
                    setBluetooth(true);
                  }}
                  className="btn btn-carbon"
                >
                  SIMULAR FIXTURE ALL PASS (100% OK)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEncendido(true);
                    setAudio(false);
                    setCarga(true);
                    setBluetooth(true);
                  }}
                  className="btn btn-outline"
                >
                  SIMULAR FALLA EN AUDIO (DISTORSIÓN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEncendido(false);
                    setAudio(false);
                    setCarga(false);
                    setBluetooth(false);
                  }}
                  className="btn btn-outline"
                >
                  SIMULAR UNIDAD MUERTA (NO ENCIENDE)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DE BÚSQUEDA POR NÚMERO DE SERIE (SPEC ORIGINAL PÁG. 4 ARRIBA) */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">BÚSQUEDA DE UNIDAD POR NÚMERO DE SERIE</span>
            <span className="badge badge-accent">SERIAL_LOOKUP</span>
          </div>
          <div className="panel-body">
            <form onSubmit={handleBuscarSerie} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                INGRESAR NÚMERO DE SERIE:
              </label>
              <input
                type="text"
                placeholder="Ej. NS-2026-0001"
                className="form-input"
                style={{ flex: 1 }}
                value={busquedaSerie}
                onChange={(e) => setBusquedaSerie(e.target.value.toUpperCase())}
              />
              <button type="submit" className="btn btn-carbon" style={{ minWidth: '120px' }}>
                BUSCAR
              </button>
            </form>
            <div
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface-elevated)',
                padding: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <div className="form-label" style={{ marginBottom: '0.5rem' }}>
                RESULTADO DE LA BÚSQUEDA
              </div>
              {!resultadoSerie || !resultadoSerie.unidad ? (
                <div style={{ color: 'var(--text-muted)' }}>
                  [INGRESE UN NÚMERO DE SERIE Y PRESIONE BUSCAR PARA VER SU ESTADO]
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong>{resultadoSerie.unidad.numero_serie}</strong> · {resultadoSerie.unidad.modelo} ({resultadoSerie.unidad.color}) · Cliente: {resultadoSerie.unidad.cliente} · Estado:{' '}
                    <span className="badge badge-info">{resultadoSerie.unidad.estado_calidad_nombre}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ height: '2rem', fontSize: '0.75rem' }}
                    onClick={() => abrirTrazabilidad(resultadoSerie.unidad!.numero_serie)}
                  >
                    ABRIR FICHA 360°
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE ÚLTIMAS PRUEBAS */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">REGISTRO DE EVALUACIONES FUNCIONALES RECIENTES</span>
            <span className="badge badge-accent">HISTORICAL_LOG</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>HORA</th>
                    <th>ORDEN</th>
                    <th>CHECKS (PWR/AUD/CHG/BT)</th>
                    <th>DICTAMEN</th>
                    <th>NÚMERO DE SERIE EMITIDO</th>
                    <th>DEFECTO REGISTRADO</th>
                  </tr>
                </thead>
                <tbody>
                  {pruebasFuncionales.map((p) => {
                    const ord = ordenes.find((o) => o.id === p.id_orden);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.fecha_hora}</td>
                        <td style={{ fontWeight: 700, color: 'var(--carbon-900)' }}>{ord?.folio}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: p.valida_encendido ? 'var(--ok)' : 'var(--danger)' }}>
                            {p.valida_encendido ? '[PWR]' : '[!PWR]'}
                          </span>{' '}
                          <span style={{ color: p.valida_audio ? 'var(--ok)' : 'var(--danger)' }}>
                            {p.valida_audio ? '[AUD]' : '[!AUD]'}
                          </span>{' '}
                          <span style={{ color: p.valida_carga ? 'var(--ok)' : 'var(--danger)' }}>
                            {p.valida_carga ? '[CHG]' : '[!CHG]'}
                          </span>{' '}
                          <span style={{ color: p.valida_bluetooth ? 'var(--ok)' : 'var(--danger)' }}>
                            {p.valida_bluetooth ? '[BT]' : '[!BT]'}
                          </span>
                        </td>
                        <td>
                          {p.aprobada ? (
                            <span className="badge badge-ok">APROBADA</span>
                          ) : (
                            <span className="badge badge-danger">RECHAZADA</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {p.numero_serie ? (
                            <span style={{ color: 'var(--carbon-900)' }}>{p.numero_serie}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>[SIN SERIE]</span>
                          )}
                        </td>
                        <td>{p.defecto_falla || '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
