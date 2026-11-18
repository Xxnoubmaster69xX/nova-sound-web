import { useState } from 'react';
import {
  usePlanta,
  USUARIOS_OFICIALES,
  NOMBRES_ROLES,
  CATALOGO_MODELOS,
  CATALOGO_COLORES,
  CATALOGO_CLIENTES,
  CATALOGO_DEFECTOS_OFICIALES,
} from '../context/PlantaContext';

type TabSistema = 'dashboard' | 'usuarios' | 'catalogos' | 'parametros' | 'bitacora' | 'respaldos';

export default function ConfiguracionStation() {
  const {
    sesion,
    bitacora,
    modoMantenimiento,
    mensajeMantenimiento,
    setModoMantenimiento,
  } = usePlanta();

  const [pestaña, setPestaña] = useState<TabSistema>('dashboard');
  const [nuevoMensajeMantenimiento, setNuevoMensajeMantenimiento] = useState(mensajeMantenimiento);
  const [mensajeLocal, setMensajeLocal] = useState<string | null>(null);

  // Estado local Gestión de Usuarios (Pág. 11 arriba)
  const [usuariosLista, setUsuariosLista] = useState(
    USUARIOS_OFICIALES.map((u) => ({ ...u, activo: true }))
  );
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [modalUsuario, setModalUsuario] = useState(false);
  const [editUsuarioNomina, setEditUsuarioNomina] = useState<string | null>(null);
  const [formNomina, setFormNomina] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formRol, setFormRol] = useState<number>(1);
  const [formActivo, setFormActivo] = useState<boolean>(true);

  // Estado local Catálogos Maestros (Pág. 11 abajo)
  const [subTabCatalogo, setSubTabCatalogo] = useState<'modelos' | 'colores' | 'clientes' | 'defectos'>('modelos');
  const [modelosLista, setModelosLista] = useState(CATALOGO_MODELOS);
  const [busquedaModelo, setBusquedaModelo] = useState('');
  const [modalModelo, setModalModelo] = useState(false);
  const [editModeloId, setEditModeloId] = useState<number | null>(null);
  const [formModeloNombre, setFormModeloNombre] = useState('');
  const [formModeloCap, setFormModeloCap] = useState(12);
  const [formModeloDesc, setFormModeloDesc] = useState('');

  // Estado local Reglas de Empaque (Pág. 12 arriba)
  const [reglasEmpaque, setReglasEmpaque] = useState<Record<string, number>>({
    'NS-MINI': 12,
    'NS-SPORT': 8,
    'NS-PRO': 6,
    'NS-MAX': 4,
  });

  // Estado local Filtros Bitácora (Pág. 12 abajo)
  const [filtroBitFecha, setFiltroBitFecha] = useState('');
  const [filtroBitUsuario, setFiltroBitUsuario] = useState('');
  const [filtroBitModulo, setFiltroBitModulo] = useState('');

  // Estado local Respaldos Manuales (Pág. 10 arriba)
  const [respaldos, setRespaldos] = useState([
    { fecha: '01/Oct/2026 17:45', usuario: 'admin_ns', resultado: 'EXITOSO' as const },
    { fecha: '30/Sep/2026 17:30', usuario: 'admin_ns', resultado: 'EXITOSO' as const },
    { fecha: '29/Sep/2026 18:01', usuario: 'admin_ns', resultado: 'FALLIDO' as const },
  ]);

  const usuariosFiltrados = usuariosLista.filter((u) => {
    const q = busquedaUsuario.trim().toLowerCase();
    return !q || u.nomina.toLowerCase().includes(q) || u.nombre_completo.toLowerCase().includes(q);
  });

  const modelosFiltrados = modelosLista.filter((m) => {
    const q = busquedaModelo.trim().toLowerCase();
    return !q || m.nombre_modelo.toLowerCase().includes(q) || (m.descripcion || '').toLowerCase().includes(q);
  });

  const bitacoraFiltrada = bitacora.filter((b) => {
    const matchFecha = !filtroBitFecha || b.fecha.includes(filtroBitFecha);
    const matchUsr = !filtroBitUsuario || b.usuario_nombre === filtroBitUsuario;
    const matchMod = !filtroBitModulo || b.modulo === filtroBitModulo;
    return matchFecha && matchUsr && matchMod;
  });

  const abrirModalUsuario = (u?: (typeof usuariosLista)[number]) => {
    if (u) {
      setEditUsuarioNomina(u.nomina);
      setFormNomina(u.nomina);
      setFormNombre(u.nombre_completo);
      setFormLogin(u.usuario_login);
      setFormRol(u.id_rol);
      setFormActivo(u.activo);
    } else {
      setEditUsuarioNomina(null);
      setFormNomina(`NS-OP-00${usuariosLista.length + 1}`);
      setFormNombre('');
      setFormLogin('');
      setFormRol(1);
      setFormActivo(true);
    }
    setModalUsuario(true);
  };

  const guardarUsuarioModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUsuarioNomina) {
      setUsuariosLista((prev) =>
        prev.map((u) =>
          u.nomina === editUsuarioNomina
            ? { ...u, nomina: formNomina, nombre_completo: formNombre, usuario_login: formLogin, id_rol: formRol, activo: formActivo }
            : u
        )
      );
      setMensajeLocal(`Usuario ${formNomina} actualizado en vista administrativa.`);
    } else {
      setUsuariosLista((prev) => [
        ...prev,
        {
          id: prev.length + 100,
          nomina: formNomina,
          nombre_completo: formNombre,
          usuario_login: formLogin,
          id_rol: formRol,
          activo: formActivo,
        },
      ]);
      setMensajeLocal(`Usuario ${formNomina} agregado a la lista.`);
    }
    setModalUsuario(false);
  };

  const abrirModalModelo = (m?: (typeof modelosLista)[number]) => {
    if (m) {
      setEditModeloId(m.id);
      setFormModeloNombre(m.nombre_modelo);
      setFormModeloCap(m.capacidad_caja);
      setFormModeloDesc(m.descripcion || '');
    } else {
      setEditModeloId(null);
      setFormModeloNombre('');
      setFormModeloCap(10);
      setFormModeloDesc('');
    }
    setModalModelo(true);
  };

  const guardarModeloModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModeloId !== null) {
      setModelosLista((prev) =>
        prev.map((m) =>
          m.id === editModeloId
            ? { ...m, nombre_modelo: formModeloNombre, capacidad_caja: formModeloCap, descripcion: formModeloDesc }
            : m
        )
      );
      setMensajeLocal(`Modelo ${formModeloNombre} actualizado.`);
    } else {
      setModelosLista((prev) => [
        ...prev,
        { id: prev.length + 10, nombre_modelo: formModeloNombre, capacidad_caja: formModeloCap, descripcion: formModeloDesc },
      ]);
      setMensajeLocal(`Modelo ${formModeloNombre} agregado al catálogo.`);
    }
    setModalModelo(false);
  };

  const generarRespaldo = () => {
    const ahora = new Date();
    const fechaStr = `${ahora.toLocaleDateString('es-MX')} ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    setRespaldos((prev) => [
      { fecha: fechaStr, usuario: sesion.usuario.usuario_login || 'admin_ns', resultado: 'EXITOSO' },
      ...prev,
    ]);
    setMensajeLocal(`Respaldo manual generado exitosamente (${fechaStr}).`);
  };

  const handleGuardarParametros = async (e: React.FormEvent) => {
    e.preventDefault();
    await setModoMantenimiento(modoMantenimiento, nuevoMensajeMantenimiento);
    setMensajeLocal('Parámetros de planta actualizados con éxito.');
  };

  const toggleMantenimiento = async () => {
    const nuevoEstado = !modoMantenimiento;
    await setModoMantenimiento(nuevoEstado, nuevoMensajeMantenimiento);
    setMensajeLocal(
      nuevoEstado
        ? 'AVISO DE MANTENIMIENTO ACTIVADO EN TODAS LAS TERMINALES'
        : 'SISTEMA RESTAURADO A MODO PRODUCCIÓN'
    );
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">SYS</div>
          <div className="station-title-box">
            <span className="station-badge-code">Administración · Configuración del Sistema</span>
            <h1 className="station-title">Configuración, Catálogos y Parámetros</h1>
            <span className="station-subtitle">
              Administración de los 9 roles oficiales, aviso de mantenimiento y bitácora técnica
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button
            onClick={toggleMantenimiento}
            className={`btn ${modoMantenimiento ? 'btn-danger' : 'btn-yellow'}`}
          >
            {modoMantenimiento ? 'DESACTIVAR MANTENIMIENTO' : 'ACTIVAR MODO MANTENIMIENTO'}
          </button>
        </div>
      </div>

      <div className="station-body">
        {mensajeLocal && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--ok-bg)',
              color: 'var(--ok)',
              border: '1px solid var(--ok-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            [SYSTEM_OK] {mensajeLocal}
          </div>
        )}

        {/* SUBNAVEGACIÓN DE PESTAÑAS (6 VISTAS DEL MÓDULO SISTEMAS EN PDF) */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-default)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '1. Dashboard / Monitoreo' },
            { id: 'usuarios', label: '2. Gestión de Usuarios (P-37)' },
            { id: 'catalogos', label: '3. Catálogos Maestros (P-38)' },
            { id: 'parametros', label: '4. Configuración Parámetros (P-39)' },
            { id: 'bitacora', label: '5. Bitácora / Auditoría (RN-12)' },
            { id: 'respaldos', label: '6. Respaldos Manual' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPestaña(tab.id as TabSistema)}
              className={`btn ${pestaña === tab.id ? 'btn-yellow' : 'btn-dark'}`}
              style={{ height: '2.4rem', fontSize: '0.75rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO PESTAÑA: DASHBOARD / MONITOREO (PÁG. 10 ABAJO) */}
        {pestaña === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="kpi-row">
              <div className="kpi-card">
                <span className="kpi-label">USUARIOS EN LÍNEA</span>
                <span className="kpi-value">42</span>
                <span className="kpi-delta" style={{ color: 'var(--ok)' }}>[Sesiones activas]</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">ESTADO DE SERVER</span>
                <span className="kpi-value" style={{ color: 'var(--ok)' }}>OK</span>
                <span className="kpi-delta">[PostgreSQL + API activos]</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">CLICKS X MINUTO</span>
                <span className="kpi-value">845</span>
                <span className="kpi-delta">[Tráfico operativo]</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">ERRORES (FALLAS)</span>
                <span className="kpi-value" style={{ color: 'var(--danger)' }}>3</span>
                <span className="kpi-delta" style={{ color: 'var(--danger)' }}>[Últimas 24h]</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">GRÁFICA 1 (LÍNEAS): USO DE LA BASE DE DATOS Y PROGRAMA (ÚLTIMAS 24H)</span>
                  <span className="badge badge-accent">TRAFFIC_24H</span>
                </div>
                <div className="panel-body">
                  <svg viewBox="0 0 600 180" style={{ width: '100%', height: '210px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <line x1="40" y1="150" x2="580" y2="150" stroke="rgba(255,255,255,0.2)" />
                    <line x1="40" y1="20" x2="40" y2="150" stroke="rgba(255,255,255,0.2)" />
                    <polyline
                      fill="none"
                      stroke="#fffa00"
                      strokeWidth="3"
                      points="40,130 110,115 180,90 250,105 320,60 390,45 460,72 530,52 580,40"
                    />
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="5,4"
                      points="40,140 110,128 180,110 250,118 320,95 390,82 460,95 530,78 580,68"
                    />
                    <text x="50" y="34" fill="#fafafa" fontSize="11">Amarillo: Consultas BD · Azul: Peticiones App</text>
                  </svg>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">GRÁFICA 2 (BARRAS): BIEN VS ERROR</span>
                    <span className="badge badge-info">HEALTH</span>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        <span>Operaciones OK</span><strong>99.6%</strong>
                      </div>
                      <div style={{ height: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                        <div style={{ width: '99%', height: '100%', background: 'var(--ok)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        <span>Fallas / Errores</span><strong>0.4%</strong>
                      </div>
                      <div style={{ height: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                        <div style={{ width: '8%', height: '100%', background: 'var(--danger)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">GRÁFICA 3 (PASTEL): GENTE POR ÁREA</span>
                    <span className="badge badge-accent">ÁREAS</span>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'conic-gradient(var(--accent) 0% 62%, var(--ok) 62% 88%, var(--info) 88% 100%)',
                        border: '2px solid var(--border-default)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><span style={{ color: 'var(--accent)' }}>■</span> Producción: 62%</div>
                      <div><span style={{ color: 'var(--ok)' }}>■</span> Calidad: 26%</div>
                      <div><span style={{ color: 'var(--info)' }}>■</span> Almacén/Sistemas: 12%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 1: LOS 9 ROLES Y USUARIOS (PÁG. 11 ARRIBA) */}
        {pestaña === 'usuarios' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CONTROL DE ACCESOS (USUARIOS DEL SISTEMA - P-37)</span>
              <span className="badge badge-accent">SEGREGACIÓN_FUNCIONES</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface-elevated)',
              }}
            >
              <input
                type="text"
                placeholder="Buscar nómina o nombre..."
                className="form-input"
                style={{ maxWidth: '320px', height: '2.1rem', fontSize: '0.8rem' }}
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
              />
              <button
                type="button"
                onClick={() => abrirModalUsuario()}
                className="btn btn-yellow"
                style={{ height: '2.1rem', fontSize: '0.75rem' }}
              >
                + NUEVO USUARIO
              </button>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>NÓMINA</th>
                      <th>NOMBRE COMPLETO</th>
                      <th>LOGIN USUARIO</th>
                      <th>ROL (PERMISOS)</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.nomina}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--carbon-900)' }}>
                          {u.nomina}
                        </td>
                        <td style={{ fontWeight: 700 }}>{u.nombre_completo}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{u.usuario_login}</td>
                        <td>
                          <span className="badge badge-accent">
                            [ROL {u.id_rol}] {NOMBRES_ROLES[u.id_rol]}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.activo ? 'badge-ok' : 'badge-danger'}`}>
                            {u.activo ? 'ACTIVO' : 'BAJA'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => abrirModalUsuario(u)}
                            className="btn btn-outline"
                            style={{ height: '1.8rem', padding: '0 0.65rem', fontSize: '0.68rem' }}
                          >
                            EDITAR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: PARÁMETROS Y REGLAS DE EMPAQUE (PÁG. 12 ARRIBA) */}
        {pestaña === 'parametros' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">CONFIGURACIÓN DE REGLAS DE EMPAQUE</span>
                <span className="badge badge-accent">PIEZAS_X_CAJA</span>
              </div>
              <div className="panel-body">
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Aquí se define cuántas piezas van por caja según el modelo; el módulo de Empaque respeta estos valores.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'NS-MINI', label: 'MINI (básico)', desc: 'piezas x caja para el modelo básico compacto' },
                    { key: 'NS-SPORT', label: 'SPORT (deportivo)', desc: 'piezas x caja para el modelo de forro reforzado' },
                    { key: 'NS-PRO', label: 'PRO (potencia)', desc: 'piezas x caja para el modelo grande con luces' },
                    { key: 'NS-MAX', label: 'MAX / STUDIO (profesional)', desc: 'modelo más grande, menor capacidad por caja' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '220px 100px 1fr',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{item.label}</strong>
                      <input
                        type="number"
                        min={1}
                        className="form-input"
                        style={{ height: '2rem', textAlign: 'center', fontWeight: 700 }}
                        value={reglasEmpaque[item.key]}
                        onChange={(e) =>
                          setReglasEmpaque((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 1 }))
                        }
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setMensajeLocal('Reglas de piezas por caja actualizadas correctamente.')}
                    className="btn btn-yellow"
                  >
                    GUARDAR CAMBIOS
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">CONFIGURACIÓN DE MODO MANTENIMIENTO (RNF-07, P-39)</span>
                  <span className={`badge ${modoMantenimiento ? 'badge-danger' : 'badge-ok'}`}>
                    {modoMantenimiento ? 'EN MANTENIMIENTO' : 'OPERATIVO'}
                  </span>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleGuardarParametros} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: modoMantenimiento ? 'var(--danger-bg)' : 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: modoMantenimiento ? 'var(--danger)' : '#fff' }}>
                        Estado Actual: {modoMantenimiento ? 'AVISO ACTIVO EN TODAS LAS PANTALLAS' : 'OPERACIÓN NORMAL'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Al activar el aviso, se despliega una franja de advertencia en el encabezado general notificando a operadores e inspectores.
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">MENSAJE VISIBLE EN ENCABEZADO</label>
                      <input
                        type="text"
                        className="form-input"
                        value={nuevoMensajeMantenimiento}
                        onChange={(e) => setNuevoMensajeMantenimiento(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-yellow">
                      GUARDAR PARÁMETROS DEL SISTEMA
                    </button>
                  </form>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">POLÍTICAS GENERALES DE CONSERVACIÓN (RNF-08)</span>
                  <span className="badge badge-accent">RETENTION_RULES</span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
                  <p>
                    <strong>Conservación de Trazabilidad:</strong> Mínimo <strong>2 años</strong> de histórico para
                    todas las unidades, pruebas funcionales y registros de inspección según RNF-08.
                  </p>
                  <p>
                    <strong>Tiempo Meta de Cierre de Turno:</strong> Menor o igual a <strong>15 minutos</strong> al
                    finalizar el turno operacional del Líder.
                  </p>
                  <p>
                    <strong>Auditoría Inmutable:</strong> La tabla de bitácora no admite sentencias UPDATE ni DELETE
                    para salvaguardar la evidencia en controversias de garantías con clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 3: CATÁLOGOS MAESTROS (PÁG. 11 ABAJO) */}
        {pestaña === 'catalogos' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CATÁLOGOS GLOBALES (DATOS MAESTROS - P-38)</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(
                  [
                    { id: 'modelos', label: 'MODELOS (BOCINAS)' },
                    { id: 'colores', label: 'COLORES' },
                    { id: 'clientes', label: 'CLIENTES' },
                    { id: 'defectos', label: 'DEFECTOS' },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubTabCatalogo(sub.id)}
                    className={`btn ${subTabCatalogo === sub.id ? 'btn-yellow' : 'btn-outline'}`}
                    style={{ height: '1.9rem', fontSize: '0.68rem', padding: '0 0.65rem' }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {subTabCatalogo === 'modelos' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-default)',
                    background: 'var(--bg-surface-elevated)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Buscar modelo..."
                    className="form-input"
                    style={{ maxWidth: '320px', height: '2.1rem', fontSize: '0.8rem' }}
                    value={busquedaModelo}
                    onChange={(e) => setBusquedaModelo(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalModelo()}
                    className="btn btn-yellow"
                    style={{ height: '2.1rem', fontSize: '0.75rem' }}
                  >
                    + AGREGAR MODELO
                  </button>
                </div>
                <div className="panel-body" style={{ padding: 0 }}>
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>CÓDIGO / MODELO</th>
                        <th>PIEZAS X CAJA</th>
                        <th>DESCRIPCIÓN</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelosFiltrados.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{m.id}</td>
                          <td style={{ fontWeight: 700, color: 'var(--carbon-900)' }}>{m.nombre_modelo}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{m.capacidad_caja}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.descripcion}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => abrirModalModelo(m)}
                                className="btn btn-outline"
                                style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                              >
                                EDITAR
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setModelosLista((prev) => prev.filter((x) => x.id !== m.id));
                                  setMensajeLocal(`Modelo ${m.nombre_modelo} eliminado de la vista.`);
                                }}
                                className="btn btn-danger"
                                style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                              >
                                ELIMINAR
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {subTabCatalogo === 'colores' && (
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>NOMBRE DEL COLOR</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_COLORES.map((col) => (
                      <tr key={col.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.id}</td>
                        <td style={{ fontWeight: 700 }}>{col.nombre_color}</td>
                        <td><span className="badge badge-ok">ACTIVO</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTabCatalogo === 'clientes' && (
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>CLIENTE</th>
                      <th>MEZCLA DE COLORES</th>
                      <th>REQUISITO DE ETIQUETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_CLIENTES.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.nombre_cliente}</td>
                        <td>
                          {c.permite_mezcla_colores ? (
                            <span className="badge badge-ok">PERMITE MEZCLA</span>
                          ) : (
                            <span className="badge badge-danger">MONOCROMÁTICA</span>
                          )}
                        </td>
                        <td>
                          {c.requiere_etiqueta ? (
                            <span className="badge badge-warn">REQUIERE QR / ETIQUETA</span>
                          ) : (
                            <span className="badge badge-dark">ESTÁNDAR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTabCatalogo === 'defectos' && (
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>CATEGORÍA</th>
                      <th>DESCRIPCIÓN DEL DEFECTO</th>
                      <th>SEVERIDAD TÉCNICA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_DEFECTOS_OFICIALES.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</td>
                        <td>
                          <span className="badge badge-info">{d.categoria}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.descripcion}</td>
                        <td>
                          <span
                            className={`badge ${
                              d.severidad === 'Crítico'
                                ? 'badge-danger'
                                : d.severidad === 'Mayor'
                                ? 'badge-warn'
                                : 'badge-dark'
                            }`}
                          >
                            {d.severidad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA 4: BITÁCORA (PÁG. 12 ABAJO) */}
        {pestaña === 'bitacora' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">HISTORIAL DE MOVIMIENTOS (BITÁCORA - RN-12, BD-15)</span>
              <span className="badge badge-accent">{bitacoraFiltrada.length} EVENTOS</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface-elevated)',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="date"
                className="form-input"
                style={{ width: '170px', height: '2rem', fontSize: '0.8rem' }}
                value={filtroBitFecha}
                onChange={(e) => setFiltroBitFecha(e.target.value)}
              />
              <select
                className="form-select"
                style={{ width: '200px', height: '2rem', fontSize: '0.8rem' }}
                value={filtroBitUsuario}
                onChange={(e) => setFiltroBitUsuario(e.target.value)}
              >
                <option value="">-- usuario --</option>
                {Array.from(new Set(bitacora.map((b) => b.usuario_nombre))).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <select
                className="form-select"
                style={{ width: '200px', height: '2rem', fontSize: '0.8rem' }}
                value={filtroBitModulo}
                onChange={(e) => setFiltroBitModulo(e.target.value)}
              >
                <option value="">-- módulo --</option>
                {Array.from(new Set(bitacora.map((b) => b.modulo))).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setFiltroBitFecha('');
                  setFiltroBitUsuario('');
                  setFiltroBitModulo('');
                }}
                className="btn btn-outline"
                style={{ height: '2rem', fontSize: '0.72rem' }}
              >
                LIMPIAR FILTROS
              </button>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>FECHA Y HORA</th>
                      <th>USUARIO</th>
                      <th>MÓDULO</th>
                      <th>ACCIÓN REGISTRADA</th>
                      <th>DETALLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bitacoraFiltrada.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{b.fecha}</td>
                        <td style={{ fontWeight: 600 }}>{b.usuario_nombre}</td>
                        <td>
                          <span className="badge badge-dark">{b.modulo}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--carbon-900)' }}>{b.accion}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{b.motivo || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '0.6rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-default)',
                  background: 'var(--bg-surface-elevated)',
                }}
              >
                nadie puede borrar esto ni modificarlo - es de solo lectura
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 6: RESPALDOS MANUAL (PÁG. 10 ARRIBA) */}
        {pestaña === 'respaldos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">ÚLTIMO RESPALDO EXITOSO</span>
                  <span className="badge badge-ok">BACKUP_OK</span>
                </div>
                <div className="panel-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {respaldos.find((r) => r.resultado === 'EXITOSO')?.fecha || '--'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    hecho por: {respaldos.find((r) => r.resultado === 'EXITOSO')?.usuario || 'admin_ns'}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">GENERAR NUEVO RESPALDO</span>
                  <span className="badge badge-accent">MANUAL_BACKUP</span>
                </div>
                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Se guarda toda la información actual del sistema
                  </span>
                  <button type="button" onClick={generarRespaldo} className="btn btn-yellow">
                    GENERAR RESPALDO
                  </button>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">HISTORIAL DE RESPALDOS MANUALES</span>
                <span className="badge badge-info">{respaldos.length} REGISTROS</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>FECHA Y HORA</th>
                      <th>USUARIO</th>
                      <th>RESULTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {respaldos.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{r.fecha}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{r.usuario}</td>
                        <td>
                          <span className={`badge ${r.resultado === 'EXITOSO' ? 'badge-ok' : 'badge-danger'}`}>
                            {r.resultado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL USUARIO */}
      {modalUsuario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.1rem' }}>
                {editUsuarioNomina ? `EDITAR USUARIO · ${editUsuarioNomina}` : 'NUEVO USUARIO'}
              </span>
              <button onClick={() => setModalUsuario(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={guardarUsuarioModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">NÓMINA</label>
                  <input type="text" required className="form-input" value={formNomina} onChange={(e) => setFormNomina(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">LOGIN USUARIO</label>
                  <input type="text" required className="form-input" value={formLogin} onChange={(e) => setFormLogin(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">NOMBRE COMPLETO</label>
                <input type="text" required className="form-input" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">ROL (PERMISOS)</label>
                  <select className="form-select" value={formRol} onChange={(e) => setFormRol(Number(e.target.value))}>
                    {Object.entries(NOMBRES_ROLES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ESTADO</label>
                  <select className="form-select" value={formActivo ? 'ACTIVO' : 'BAJA'} onChange={(e) => setFormActivo(e.target.value === 'ACTIVO')}>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="BAJA">BAJA</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalUsuario(false)} className="btn btn-outline">CANCELAR</button>
                <button type="submit" className="btn btn-yellow">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODELO */}
      {modalModelo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.1rem' }}>
                {editModeloId !== null ? 'EDITAR MODELO' : 'AGREGAR MODELO'}
              </span>
              <button onClick={() => setModalModelo(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={guardarModeloModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">CÓDIGO / NOMBRE MODELO</label>
                  <input type="text" required className="form-input" value={formModeloNombre} onChange={(e) => setFormModeloNombre(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">PIEZAS X CAJA</label>
                  <input type="number" min={1} required className="form-input" value={formModeloCap} onChange={(e) => setFormModeloCap(Number(e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">DESCRIPCIÓN</label>
                <input type="text" required className="form-input" value={formModeloDesc} onChange={(e) => setFormModeloDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalModelo(false)} className="btn btn-outline">CANCELAR</button>
                <button type="submit" className="btn btn-yellow">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
