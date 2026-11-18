/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SEED_ORDENES,
  SEED_CONTEOS_ENSAMBLE,
  SEED_DEFECTOS_ENSAMBLE,
  SEED_PRUEBAS_FUNCIONALES,
  SEED_UNIDADES,
  SEED_INSPECCIONES_CALIDAD,
  SEED_HISTORIAL_UNIDADES,
  SEED_CAJAS,
  SEED_DETALLES_CAJAS,
  SEED_EMBARQUES,
  SEED_CAJAS_ASIGNADAS_EMBARQUE,
  SEED_BITACORA,
} from '../data/seedOperacion';
import type {
  SesionOperativa,
  Usuario,
  Modelo,
  Color,
  Cliente,
  Linea,
  Turno,
  Transportista,
  CatalogoDefecto,
  CatalogoEstadoCalidad,
  ParametroSistema,
  Orden,
  ConteoEnsamble,
  DefectoEnsamble,
  PruebaFuncional,
  Unidad,
  InspeccionCalidad,
  HistorialUnidad,
  Caja,
  DetalleCaja,
  Embarque,
  CierreTurno,
  SolicitudAutorizacion,
  Bitacora,
} from '../types/database';
import { RolesEnum } from '../types/database';
import {
  IS_STATIC_REMOTE_DEMO,
  type ApiRow,
  authApi,
  healthApi,
  setApiAuthHeaders,
  ordenesApi,
  ensambleApi,
  pruebasApi,
  unidadesApi,
  cajasApi,
  embarquesApi,
  turnosApi,
  autorizacionesApi,
  adminApi,
} from '../services/apiClient';

const SESSION_STORAGE_KEY = 'nova_sound_session_v2';

// Matriz canónica de permisos por rol (alineada con auth.middleware.ts / BD-14 / RN-14)
export const PERMISOS_POR_ROL: Record<number, string[]> = {
  [RolesEnum.OPERADOR]: ['ENSAMBLE_REGISTRAR', 'PRUEBA_EVALUAR'],
  [RolesEnum.LIDER_LINEA]: ['ENSAMBLE_REGISTRAR', 'PRUEBA_EVALUAR', 'TURNO_CERRAR', 'REPORTES_CONSULTAR'],
  [RolesEnum.INSPECTOR_CALIDAD]: ['PRUEBA_EVALUAR', 'CALIDAD_DICTAMINAR', 'REPORTES_CONSULTAR'],
  [RolesEnum.ALMACEN_EMPAQUE]: ['EMPAQUE_OPERAR', 'EMPAQUE_SOLICITAR_REAPERTURA', 'EMBARQUE_OPERAR'],
  [RolesEnum.SUPERVISOR_ALMACEN]: [
    'EMPAQUE_OPERAR',
    'EMPAQUE_SOLICITAR_REAPERTURA',
    'EMPAQUE_AUTORIZAR_REAPERTURA',
    'EMBARQUE_OPERAR',
    'REPORTES_CONSULTAR',
  ],
  [RolesEnum.SUBGERENTE_PRODUCCION]: [
    'ORDENES_GESTIONAR',
    'TURNO_CERRAR',
    'TURNO_AUTORIZAR_CORRECCION',
    'REPORTES_CONSULTAR',
  ],
  [RolesEnum.GERENTE_PRODUCCION]: ['ORDENES_GESTIONAR', 'TURNO_AUTORIZAR_CORRECCION', 'REPORTES_CONSULTAR'],
  [RolesEnum.GERENTE_PLANTA]: ['REPORTES_CONSULTAR'],
  [RolesEnum.ADMINISTRADOR]: ['SISTEMAS_ADMIN', 'REPORTES_CONSULTAR'],
};

// ==============================================================================
// 1. LOS 9 USUARIOS OFICIALES DEL CASO NOVA SOUND (P-37, BD-14, RNF-01c)
// ==============================================================================
export const USUARIOS_OFICIALES: Usuario[] = [
  { id: 1, nomina: 'NS-OP-001', nombre_completo: 'Carlos Hernández', usuario_login: 'operador_ns', id_rol: RolesEnum.OPERADOR, permisos: PERMISOS_POR_ROL[RolesEnum.OPERADOR], activo: true },
  { id: 2, nomina: 'NS-LD-001', nombre_completo: 'Roberto Mendoza', usuario_login: 'lider_ns', id_rol: RolesEnum.LIDER_LINEA, permisos: PERMISOS_POR_ROL[RolesEnum.LIDER_LINEA], activo: true },
  { id: 3, nomina: 'NS-CA-001', nombre_completo: 'Juan Pérez', usuario_login: 'calidad_ns', id_rol: RolesEnum.INSPECTOR_CALIDAD, permisos: PERMISOS_POR_ROL[RolesEnum.INSPECTOR_CALIDAD], activo: true },
  { id: 4, nomina: 'NS-AL-001', nombre_completo: 'Lucía Gómez', usuario_login: 'almacen_ns', id_rol: RolesEnum.ALMACEN_EMPAQUE, permisos: PERMISOS_POR_ROL[RolesEnum.ALMACEN_EMPAQUE], activo: true },
  { id: 5, nomina: 'NS-SA-001', nombre_completo: 'Fernanda Gómez', usuario_login: 'sup_almacen_ns', id_rol: RolesEnum.SUPERVISOR_ALMACEN, permisos: PERMISOS_POR_ROL[RolesEnum.SUPERVISOR_ALMACEN], activo: true },
  { id: 6, nomina: 'NS-SP-001', nombre_completo: 'Miguel Ángel Vega', usuario_login: 'subgerente_ns', id_rol: RolesEnum.SUBGERENTE_PRODUCCION, permisos: PERMISOS_POR_ROL[RolesEnum.SUBGERENTE_PRODUCCION], activo: true },
  { id: 7, nomina: 'NS-GP-001', nombre_completo: 'Eduardo Díaz', usuario_login: 'gerente_prod_ns', id_rol: RolesEnum.GERENTE_PRODUCCION, permisos: PERMISOS_POR_ROL[RolesEnum.GERENTE_PRODUCCION], activo: true },
  { id: 8, nomina: 'NS-PL-001', nombre_completo: 'Elena Torres', usuario_login: 'gerente_planta_ns', id_rol: RolesEnum.GERENTE_PLANTA, permisos: PERMISOS_POR_ROL[RolesEnum.GERENTE_PLANTA], activo: true },
  { id: 9, nomina: 'NS-AD-001', nombre_completo: 'Marcela Juárez', usuario_login: 'admin_ns', id_rol: RolesEnum.ADMINISTRADOR, permisos: PERMISOS_POR_ROL[RolesEnum.ADMINISTRADOR], activo: true },
];

export const NOMBRES_ROLES: Record<number, string> = {
  1: 'Operador de Ensamble',
  2: 'Líder de Línea',
  3: 'Inspector de Calidad',
  4: 'Almacén / Empaque',
  5: 'Supervisor de Almacén',
  6: 'Subgerente de Producción',
  7: 'Gerente de Producción',
  8: 'Gerente de Planta',
  9: 'Administrador del Sistema',
};

// ==============================================================================
// 2. CATÁLOGOS BASE PRECARGADOS
// ==============================================================================
export const CATALOGO_MODELOS: Modelo[] = [
  { id: 1, nombre_modelo: 'NS-MINI', capacidad_caja: 12, descripcion: 'Altavoz portátil compacto (12 pzas/caja)' },
  { id: 2, nombre_modelo: 'NS-SPORT', capacidad_caja: 8, descripcion: 'Altavoz sumergible deportivo (8 pzas/caja)' },
  { id: 3, nombre_modelo: 'NS-PRO', capacidad_caja: 6, descripcion: 'Altavoz de alta fidelidad profesional (6 pzas/caja)' },
  { id: 4, nombre_modelo: 'NS-MAX', capacidad_caja: 4, descripcion: 'Altavoz industrial de máxima potencia (4 pzas/caja)' },
];

export const CATALOGO_COLORES: Color[] = [
  { id: 1, nombre_color: 'Negro' },
  { id: 2, nombre_color: 'Blanco' },
  { id: 3, nombre_color: 'Rojo' },
  { id: 4, nombre_color: 'Azul' },
  { id: 5, nombre_color: 'Verde' },
];

export const CATALOGO_CLIENTES: Cliente[] = [
  { id: 1, nombre_cliente: 'SoundCorp Retail', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: true, requisitos_empaque: 'Etiqueta especial y caja monocromática', activo: true },
  { id: 2, nombre_cliente: 'MegaAudio Distribución', tipo_cliente: 'Distribuidor', permite_mezcla_colores: true, requiere_etiqueta: false, requisitos_empaque: 'Permite mezcla de colores en la misma caja', activo: true },
  { id: 3, nombre_cliente: 'TechBeat Stores', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: true, requisitos_empaque: 'Cajas de un solo color con sello de seguridad', activo: true },
  { id: 4, nombre_cliente: 'ElectroMax Nacional', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: false, requisitos_empaque: 'Empaque estándar sin mezcla de colores', activo: true },
];

export const CATALOGO_LINEAS: Linea[] = [
  { id: 1, nombre_linea: 'L1', activa: true },
  { id: 2, nombre_linea: 'L2', activa: true },
  { id: 3, nombre_linea: 'L3', activa: true },
];

export const CATALOGO_TURNOS: Turno[] = [
  { id: 1, nombre_turno: 'Mañana', hora_inicio: '06:00', hora_fin: '14:00' },
  { id: 2, nombre_turno: 'Tarde', hora_inicio: '14:00', hora_fin: '22:00' },
  { id: 3, nombre_turno: 'Noche', hora_inicio: '22:00', hora_fin: '06:00' },
];

export const CATALOGO_TRANSPORTISTAS: Transportista[] = [
  { id: 1, nombre: 'Transportes del Norte S.A.', rfc: 'TNO990101AAA', telefono: '8441234560', activo: true },
  { id: 2, nombre: 'Logística Rápida Bajío', rfc: 'LRB010203BBB', telefono: '8441234561', activo: true },
];

export const CATALOGO_ESTADOS_CALIDAD: CatalogoEstadoCalidad[] = [
  { id: 1, nombre_estado: 'Aprobada', permite_empaque: true },
  { id: 2, nombre_estado: 'En retrabajo', permite_empaque: false },
  { id: 3, nombre_estado: 'En retención', permite_empaque: false },
  { id: 4, nombre_estado: 'Scrap', permite_empaque: false },
];

export const CATALOGO_DEFECTOS_OFICIALES: CatalogoDefecto[] = [
  // Apariencia
  { id: 1, categoria: 'Apariencia', descripcion: 'Rayón superficial en carcasa plástica', severidad: 'Menor' },
  { id: 2, categoria: 'Apariencia', descripcion: 'Fisura visible o carcasa mal cerrada', severidad: 'Crítico' },
  { id: 3, categoria: 'Apariencia', descripcion: 'Tonalidad de color desigual o incorrecto', severidad: 'Mayor' },
  { id: 4, categoria: 'Apariencia', descripcion: 'Golpe o abolladura en rejilla frontal', severidad: 'Mayor' },
  // Funcional
  { id: 5, categoria: 'Funcional', descripcion: 'No enciende / falla en circuito de alimentación', severidad: 'Crítico' },
  { id: 6, categoria: 'Funcional', descripcion: 'Distorsión de audio o zumbido en altavoz', severidad: 'Crítico' },
  { id: 7, categoria: 'Funcional', descripcion: 'No carga / falla en puerto de carga USB', severidad: 'Mayor' },
  { id: 8, categoria: 'Funcional', descripcion: 'Falla de conexión o sincronización Bluetooth', severidad: 'Mayor' },
  { id: 9, categoria: 'Funcional', descripcion: 'Botón flojo o sin respuesta mecánica', severidad: 'Mayor' },
  // Identificación
  { id: 10, categoria: 'Identificación', descripcion: 'Etiqueta equivocada del cliente', severidad: 'Mayor' },
  { id: 11, categoria: 'Identificación', descripcion: 'Número de serie ilegible o mal impreso', severidad: 'Mayor' },
  { id: 12, categoria: 'Identificación', descripcion: 'Etiqueta de modelo incorrecto', severidad: 'Crítico' },
  // Empaque
  { id: 13, categoria: 'Empaque', descripcion: 'Accesorio o cable de carga faltante', severidad: 'Mayor' },
  { id: 14, categoria: 'Empaque', descripcion: 'Manual de usuario incorrecto o faltante', severidad: 'Menor' },
  { id: 15, categoria: 'Empaque', descripcion: 'Caja externa maltratada o sellos rotos', severidad: 'Mayor' },
];

// ==============================================================================
// INTERFAZ GLOBAL DEL CONTEXTO
// ==============================================================================
export interface PlantaContextType {
  // Sesión y Auth
  sesion: SesionOperativa;
  setSesion: React.Dispatch<React.SetStateAction<SesionOperativa>>;
  estaAutenticado: boolean;
  backendOnline: boolean;
  modoMantenimiento: boolean;
  mensajeMantenimiento: string;
  vistaActual: string;
  setVistaActual: React.Dispatch<React.SetStateAction<string>>;
  serieTrazabilidad: string | null;
  abrirTrazabilidad: (numeroSerie: string) => void;
  sincronizarAhora: () => Promise<void>;
  consultarTrazabilidadRemota: (numeroSerie: string) => Promise<ReturnType<PlantaContextType['buscarTrazabilidad']>>;
  tienePermiso: (codigoPermiso: string) => boolean;
  iniciarSesion: (login: string, contrasena: string, idLinea?: number, idTurno?: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
  cambiarUsuarioSimulado: (idRol: number) => void;
  cambiarLineaSesion: (idLinea: number) => void;
  cambiarTurnoSesion: (idTurno: number) => void;

  // Órdenes de Producción (P-40)
  ordenes: Orden[];
  crearOrden: (
    folio: string,
    idCliente: number,
    idModelo: number,
    idColor: number,
    cantidad: number,
    fechaCompromiso: string,
    idLineaAsignada?: number
  ) => Promise<{ ok: boolean; error?: string }>;
  actualizarOrden: (
    idOrden: number,
    payload: {
      folio: string;
      id_cliente: number;
      id_modelo: number;
      id_color: number;
      cantidad: number;
      fecha_compromiso: string;
      id_linea_asignada?: number | null;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  importarOrdenesCsv: (textoCsv: string) => Promise<{ ok: boolean; importadas: number; error?: string }>;
  asignarLineaOrden: (idOrden: number, idLinea: number) => Promise<{ ok: boolean; error?: string }>;

  // Ensamble (F-03, P-11..P-15)
  conteosEnsamble: ConteoEnsamble[];
  defectosEnsamble: DefectoEnsamble[];
  registrarConteoEnsamble: (idOrden: number, cantidad: number) => Promise<{ ok: boolean; error?: string }>;
  registrarDefectoEnsamble: (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => Promise<{ ok: boolean; error?: string }>;

  // Pruebas Funcionales (F-04, P-41: Nacimiento oficial de la Serie)
  pruebasFuncionales: PruebaFuncional[];
  evaluarPruebaFuncional: (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => Promise<{ ok: boolean; serieGenerada?: string; error?: string }>;

  // Calidad (F-05, F-06, P-16..P-20)
  unidades: Unidad[];
  inspeccionesCalidad: InspeccionCalidad[];
  historialUnidades: HistorialUnidad[];
  dictaminarCalidad: (
    numeroSerie: string,
    idEstadoCalidad: number,
    idDefecto?: number,
    comentarios?: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Empaque y Cajas (F-08, F-09, P-21..P-25, Incidente B)
  cajas: Caja[];
  detallesCajas: DetalleCaja[];
  crearCaja: (idCliente: number, idModelo: number, idColor: number) => Promise<{ ok: boolean; caja?: Caja; error?: string }>;
  empacarPorSerie: (numeroSerie: string, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarCaja: (idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  solicitarReaperturaCaja: (idCaja: number, motivo: string) => Promise<{ ok: boolean; error?: string }>;
  retirarUnidadCaja: (idCaja: number, numeroSerie: string, motivo: string) => Promise<{ ok: boolean; error?: string }>;

  // Logística y Embarques (F-10, F-11, P-26..P-29, Incidente C)
  embarques: Embarque[];
  cajasAsignadasEmbarque: Record<number, number[]>; // idEmbarque -> [idCaja1, idCaja2]
  crearEmbarque: (
    idPedido: string,
    idCliente: number,
    idTransportista: number,
    nombreChofer: string,
    placasUnidad: string,
    fechaProgramada: string,
    observaciones?: string
  ) => Promise<{ ok: boolean; embarque?: Embarque; error?: string }>;
  asignarCajaEmbarque: (idEmbarque: number, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  retirarCajaEmbarque: (idEmbarque: number, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  despacharEmbarque: (idEmbarque: number) => Promise<{ ok: boolean; error?: string }>;

  // Trazabilidad 360° (P-42)
  buscarTrazabilidad: (numeroSerie: string) => {
    unidad?: Unidad;
    orden?: Orden;
    prueba?: PruebaFuncional;
    inspecciones: InspeccionCalidad[];
    historial: HistorialUnidad[];
    caja?: Caja;
    embarque?: Embarque;
  } | null;

  // Cierres de Turno y Balance (F-12, P-35, P-43, INC-A, INC-D)
  cierresTurno: CierreTurno[];
  consolidarCierreTurno: (observaciones?: string) => Promise<{ ok: boolean; cierre?: CierreTurno; error?: string }>;
  solicitarCorreccionCierre: (idCierre: number, motivo: string) => Promise<{ ok: boolean; error?: string }>;
  solicitudesAutorizacion: SolicitudAutorizacion[];
  resolverAutorizacion: (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => Promise<{ ok: boolean; error?: string }>;

  // Configuración & Sistemas (P-36..P-39)
  parametros: ParametroSistema[];
  setModoMantenimiento: (activo: boolean, mensaje?: string) => Promise<void>;
  bitacora: Bitacora[];
  registrarBitacora: (modulo: string, accion: string, motivo?: string) => void;
}

const PlantaContext = createContext<PlantaContextType | undefined>(undefined);

// ==============================================================================
// PROVIDER DE PLANTA
// ==============================================================================
export const PlantaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. SESIÓN OPERATIVA INICIAL (solo se restaura si existe en localStorage)
  const initialSessionState = (() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SesionOperativa;
        if (parsed?.usuario?.id && parsed?.usuario?.id_rol && parsed?.linea && parsed?.turno) {
          setApiAuthHeaders(parsed.usuario.id, parsed.usuario.id_rol);
          return { sesion: parsed, autenticado: true };
        }
      }
    } catch {
      /* ignore */
    }
    return {
      sesion: {
        usuario: USUARIOS_OFICIALES[8],
        linea: CATALOGO_LINEAS[0],
        turno: CATALOGO_TURNOS[0],
      },
      autenticado: false,
    };
  })();

  const [sesion, setSesion] = useState<SesionOperativa>(initialSessionState.sesion);
  const [estaAutenticado, setEstaAutenticado] = useState<boolean>(initialSessionState.autenticado);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [modoMantenimiento, setModoMantenimientoState] = useState<boolean>(false);
  const [mensajeMantenimiento, setMensajeMantenimiento] = useState<string>('Operación estándar de planta activa');
  const [vistaActual, setVistaActual] = useState<string>('ordenes');
  const [serieTrazabilidad, setSerieTrazabilidad] = useState<string | null>(null);

  const abrirTrazabilidad = (numeroSerie: string) => {
    setSerieTrazabilidad(numeroSerie.trim().toUpperCase());
    setVistaActual('trazabilidad');
  };

  // 2. ESTADO DE ÓRDENES (solo se carga seed en modo demo estático remoto sin backend)
  const [ordenes, setOrdenes] = useState<Orden[]>(IS_STATIC_REMOTE_DEMO ? SEED_ORDENES : []);

  // 3. ENSAMBLE & DEFECTOS
  const [conteosEnsamble, setConteosEnsamble] = useState<ConteoEnsamble[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_CONTEOS_ENSAMBLE : []
  );

  const [defectosEnsamble, setDefectosEnsamble] = useState<DefectoEnsamble[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_DEFECTOS_ENSAMBLE : []
  );

  // 4. PRUEBAS FUNCIONALES (Nacimiento de serie)
  const [pruebasFuncionales, setPruebasFuncionales] = useState<PruebaFuncional[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_PRUEBAS_FUNCIONALES : []
  );

  // 5. UNIDADES & CALIDAD
  const [unidades, setUnidades] = useState<Unidad[]>(IS_STATIC_REMOTE_DEMO ? SEED_UNIDADES : []);

  const [inspeccionesCalidad, setInspeccionesCalidad] = useState<InspeccionCalidad[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_INSPECCIONES_CALIDAD : []
  );

  const [historialUnidades, setHistorialUnidades] = useState<HistorialUnidad[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_HISTORIAL_UNIDADES : []
  );

  // 6. CAJAS Y DETALLES DE EMPAQUE (P-21..P-25)
  const [cajas, setCajas] = useState<Caja[]>(IS_STATIC_REMOTE_DEMO ? SEED_CAJAS : []);

  const [detallesCajas, setDetallesCajas] = useState<DetalleCaja[]>(
    IS_STATIC_REMOTE_DEMO ? SEED_DETALLES_CAJAS : []
  );

  // 7. EMBARQUES (P-26..P-29)
  const [embarques, setEmbarques] = useState<Embarque[]>(IS_STATIC_REMOTE_DEMO ? SEED_EMBARQUES : []);

  const [cajasAsignadasEmbarque, setCajasAsignadasEmbarque] = useState<Record<number, number[]>>(
    IS_STATIC_REMOTE_DEMO ? SEED_CAJAS_ASIGNADAS_EMBARQUE : {}
  );

  // 8. CIERRES DE TURNO Y GOBERNANZA (P-35, P-43, INC-A, INC-D)
  const [cierresTurno, setCierresTurno] = useState<CierreTurno[]>(
    IS_STATIC_REMOTE_DEMO
      ? [
          {
            id: 1,
            fecha: '2026-11-03',
            id_turno: 1,
            turno_nombre: 'Mañana',
            id_linea: 1,
            linea_nombre: 'L1',
            id_lider_linea: 2,
            lider_nombre: 'Roberto Mendoza',
            piezas_ensambladas: 102,
            piezas_probadas: 98,
            piezas_aprobadas_calidad: 95,
            piezas_retrabajo: 2,
            piezas_retencion: 1,
            piezas_scrap: 2,
            piezas_empacadas: 90,
            piezas_embarcadas: 90,
            diferencia_balance: 0,
            objetivo_turno: 100,
            cumplimiento_pct: 102,
            estado: 'Cerrado',
            observaciones: 'Turno operó con rendimiento nominal',
            fecha_cierre: '2026-11-03 14:12:00',
          },
        ]
      : []
  );

  const [solicitudesAutorizacion, setSolicitudesAutorizacion] = useState<SolicitudAutorizacion[]>(
    IS_STATIC_REMOTE_DEMO
      ? [
          {
            id: 1,
            tipo: 'REAPERTURA_CAJA',
            id_entidad: 2,
            descripcion_entidad: 'Caja BX-2026-002',
            motivo: 'Verificación de accesorio de cable de carga solicitado por auditoría',
            id_usuario_solicita: 4,
            usuario_solicita_nombre: 'Lucía Gómez (Almacén)',
            estado: 'PENDIENTE',
            fecha_solicitud: '2026-11-04 09:30',
          },
        ]
      : []
  );

  // 9. PARÁMETROS Y BITÁCORA
  const [parametros, setParametros] = useState<ParametroSistema[]>([
    { id: 1, clave: 'SISTEMA_MODO_MANTENIMIENTO', valor: false, tipo_dato: 'BOOLEAN', descripcion: 'Activa aviso de mantenimiento en toda la planta' },
    { id: 2, clave: 'MENSAJE_MANTENIMIENTO', valor: 'Operación estándar de planta activa', tipo_dato: 'STRING', descripcion: 'Mensaje visible en encabezados' },
    { id: 3, clave: 'POLITICA_RETENCION_ANOS', valor: 2, tipo_dato: 'INT', descripcion: 'Años mínimos de conservación de trazabilidad e histórico' },
  ]);

  const [bitacora, setBitacora] = useState<Bitacora[]>(IS_STATIC_REMOTE_DEMO ? SEED_BITACORA : []);

  const cargarDatosDemoOffline = () => {
    setOrdenes(SEED_ORDENES);
    setConteosEnsamble(SEED_CONTEOS_ENSAMBLE);
    setDefectosEnsamble(SEED_DEFECTOS_ENSAMBLE);
    setPruebasFuncionales(SEED_PRUEBAS_FUNCIONALES);
    setUnidades(SEED_UNIDADES);
    setInspeccionesCalidad(SEED_INSPECCIONES_CALIDAD);
    setHistorialUnidades(SEED_HISTORIAL_UNIDADES);
    setCajas(SEED_CAJAS);
    setDetallesCajas(SEED_DETALLES_CAJAS);
    setEmbarques(SEED_EMBARQUES);
    setCajasAsignadasEmbarque(SEED_CAJAS_ASIGNADAS_EMBARQUE);
    setBitacora(SEED_BITACORA);
  };

  // Sincronizar sesión con LocalStorage y headers RBAC
  useEffect(() => {
    if (!estaAutenticado) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
      setApiAuthHeaders(sesion.usuario.id, sesion.usuario.id_rol);
    } catch {
      /* ignore */
    }
  }, [sesion, estaAutenticado]);

  // Consultar estado real del backend (/api/health) y modo mantenimiento
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      const res = await healthApi.getStatus();
      if (!mounted) return;
      if (res.ok) {
        setBackendOnline(true);
        setModoMantenimientoState(Boolean(res.data.modo_mantenimiento));
        if (res.data.mensaje_mantenimiento) {
          setMensajeMantenimiento(res.data.mensaje_mantenimiento);
        }
      } else {
        setBackendOnline(false);
      }
    };
    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  // Sincronización integral de módulos con PostgreSQL
  const cargarOperacionCore = async () => {
    const [
      ordRes,
      ensRes,
      defRes,
      pruRes,
      uniRes,
      insRes,
      histRes,
      cajRes,
      embRes,
      cieRes,
      autRes,
      parRes,
      bitRes,
    ] = await Promise.all([
      ordenesApi.getAll(),
      ensambleApi.getRecientes(),
      ensambleApi.getDefectos(),
      pruebasApi.getRecientes(50),
      unidadesApi.getRecientes(100),
      unidadesApi.getInspecciones(100),
      unidadesApi.getHistorial(100),
      cajasApi.getAll(),
      embarquesApi.getAll(),
      turnosApi.getCierres(20),
      autorizacionesApi.getAll(),
      adminApi.getParametros(),
      adminApi.getBitacora(),
    ]);

    let ordenesMapeadas: Orden[] = [];
    if (ordRes.ok && Array.isArray(ordRes.data)) {
      ordenesMapeadas = ordRes.data.map((o: ApiRow) => ({
        id: Number(o.id),
        folio: String(o.folio || ''),
        id_cliente: Number(o.id_cliente),
        cliente_nombre: String(
          o.cliente_nombre ||
            o.nombre_cliente ||
            CATALOGO_CLIENTES.find((c) => c.id === Number(o.id_cliente))?.nombre_cliente ||
            'Cliente'
        ),
        id_modelo: Number(o.id_modelo),
        modelo_nombre: String(
          o.modelo_nombre ||
            o.nombre_modelo ||
            CATALOGO_MODELOS.find((m) => m.id === Number(o.id_modelo))?.nombre_modelo ||
            'Modelo'
        ),
        id_color: Number(o.id_color),
        color_nombre: String(
          o.color_nombre ||
            o.nombre_color ||
            CATALOGO_COLORES.find((c) => c.id === Number(o.id_color))?.nombre_color ||
            'Color'
        ),
        cantidad: Number(o.cantidad),
        fecha_compromiso: String(o.fecha_compromiso || '').substring(0, 10),
        fecha_recepcion: String(o.fecha_recepcion || '').substring(0, 10),
        id_usuario_registro: Number(o.id_usuario_registro || 1),
        estado: String(o.estado || 'Programada'),
        id_linea_asignada: o.id_linea_asignada ? Number(o.id_linea_asignada) : null,
        linea_nombre:
          (o.linea_nombre ? String(o.linea_nombre) : null) ||
          (o.nombre_linea ? String(o.nombre_linea) : null) ||
          CATALOGO_LINEAS.find((l) => l.id === Number(o.id_linea_asignada))?.nombre_linea ||
          null,
        id_usuario_asigno: o.id_usuario_asigno ? Number(o.id_usuario_asigno) : null,
        fecha_asignacion: o.fecha_asignacion ? String(o.fecha_asignacion) : null,
        piezas_ensambladas: Number(o.piezas_ensambladas ?? o.cantidad_ensamblada ?? 0),
        piezas_aprobadas: Number(o.piezas_aprobadas ?? o.cantidad_aprobada ?? 0),
      }));
      setOrdenes(ordenesMapeadas);
    }

    if (ensRes.ok && Array.isArray(ensRes.data)) {
      setConteosEnsamble(
        ensRes.data.map((c: ApiRow) => ({
          id: Number(c.id),
          id_orden: Number(c.id_orden),
          id_linea: Number(c.id_linea),
          id_turno: Number(c.id_turno),
          id_operador: Number(c.id_operador),
          cantidad: Number(c.cantidad),
          fecha_hora: String(c.fecha_hora || c.fecha_registro || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (defRes.ok && Array.isArray(defRes.data)) {
      setDefectosEnsamble(
        defRes.data.map((d: ApiRow) => ({
          id: Number(d.id),
          id_orden: Number(d.id_orden),
          id_linea: Number(d.id_linea),
          id_turno: Number(d.id_turno),
          id_operador: Number(d.id_operador || 1),
          id_defecto: Number(d.id_defecto),
          defecto_descripcion: d.defecto_descripcion ? String(d.defecto_descripcion) : undefined,
          cantidad: Number(d.cantidad || 1),
          observaciones: d.observaciones ? String(d.observaciones) : undefined,
          fecha_hora: String(d.fecha_hora || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (pruRes.ok && Array.isArray(pruRes.data)) {
      setPruebasFuncionales(
        pruRes.data.map((p: ApiRow) => ({
          id: Number(p.id),
          id_orden: Number(p.id_orden),
          id_linea: Number(p.id_linea),
          id_turno: Number(p.id_turno),
          id_usuario: Number(p.id_usuario || p.id_operador || 1),
          valida_encendido: Boolean(p.valida_encendido),
          valida_audio: Boolean(p.valida_audio),
          valida_carga: Boolean(p.valida_carga),
          valida_bluetooth: Boolean(p.valida_bluetooth),
          aprobada: Boolean(
            p.aprobada ??
              (Boolean(p.valida_encendido) &&
                Boolean(p.valida_audio) &&
                Boolean(p.valida_carga) &&
                Boolean(p.valida_bluetooth))
          ),
          numero_serie: p.numero_serie ? String(p.numero_serie) : null,
          id_defecto_falla: p.id_defecto_falla ? Number(p.id_defecto_falla) : null,
          defecto_falla: p.defecto_falla
            ? String(p.defecto_falla)
            : p.descripcion_defecto
            ? String(p.descripcion_defecto)
            : null,
          fecha_hora: String(p.fecha_hora || p.fecha_prueba || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (uniRes.ok && Array.isArray(uniRes.data)) {
      setUnidades(
        uniRes.data.map((u: ApiRow) => {
          const rawEstado = u.id_estado_calidad;
          const idEstadoCalidad =
            rawEstado === null || rawEstado === undefined || Number(rawEstado) === 0 ? 0 : Number(rawEstado);
          const estadoNombre =
            idEstadoCalidad === 0
              ? 'Pendiente de Calidad'
              : String(
                  u.estado_calidad_nombre ||
                    u.nombre_estado ||
                    CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === idEstadoCalidad)?.nombre_estado ||
                    'Pendiente de Calidad'
                );
          const ordenDelMapa = ordenesMapeadas.find((o) => o.id === Number(u.id_orden));
          return {
            id: Number(u.id),
            id_orden: Number(u.id_orden),
            id_linea: Number(u.id_linea),
            id_turno: Number(u.id_turno),
            numero_serie: String(u.numero_serie || ''),
            id_estado_calidad: idEstadoCalidad,
            estado_calidad_nombre: estadoNombre,
            id_caja: u.id_caja ? Number(u.id_caja) : null,
            fecha_ensamble: String(u.fecha_ensamble || u.fecha_creacion || '').replace('T', ' ').substring(0, 16),
            modelo: String(u.modelo || u.nombre_modelo || ordenDelMapa?.modelo_nombre || 'NS-PRO'),
            color: String(u.color || u.nombre_color || ordenDelMapa?.color_nombre || 'Negro'),
            cliente: String(u.cliente || u.nombre_cliente || ordenDelMapa?.cliente_nombre || ''),
            id_prueba_funcional: u.id_prueba_funcional ? Number(u.id_prueba_funcional) : undefined,
          };
        })
      );
    }

    if (insRes.ok && Array.isArray(insRes.data)) {
      setInspeccionesCalidad(
        insRes.data.map((i: ApiRow) => ({
          id: Number(i.id),
          id_unidad: Number(i.id_unidad),
          numero_serie: i.numero_serie ? String(i.numero_serie) : '',
          id_inspector: Number(i.id_inspector || 1),
          inspector_nombre: String(i.inspector_nombre || 'Inspector'),
          id_estado_resultado: Number(i.id_estado_resultado || 1),
          estado_resultado_nombre: String(
            i.estado_resultado_nombre ||
              CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === Number(i.id_estado_resultado))?.nombre_estado ||
              'Aprobada'
          ),
          id_defecto: i.id_defecto ? Number(i.id_defecto) : null,
          defecto_descripcion: i.defecto_descripcion ? String(i.defecto_descripcion) : null,
          comentarios: i.comentarios ? String(i.comentarios) : null,
          fecha_inspeccion: String(i.fecha_inspeccion || '').replace('T', ' ').substring(0, 16),
        }))
      );
    }

    if (histRes.ok && Array.isArray(histRes.data)) {
      setHistorialUnidades(
        histRes.data.map((h: ApiRow) => ({
          id: Number(h.id),
          id_unidad: Number(h.id_unidad),
          numero_serie: String(h.numero_serie || ''),
          id_usuario: Number(h.id_usuario || 1),
          usuario_nombre: String(h.usuario_nombre || h.nombre_completo || 'Usuario'),
          estado_anterior: String(h.estado_anterior || '-'),
          estado_nuevo: String(h.estado_nuevo || '-'),
          motivo: String(h.motivo || ''),
          fecha_hora: String(h.fecha_hora || '').replace('T', ' ').substring(0, 16),
        }))
      );
    }

    if (cajRes.ok && Array.isArray(cajRes.data)) {
      const detallesAcumulados: DetalleCaja[] = [];
      setCajas(
        cajRes.data.map((c: ApiRow) => {
          const rawDetalles = Array.isArray(c.detalles) ? (c.detalles as ApiRow[]) : [];
          rawDetalles.forEach((d, idx) => {
            detallesAcumulados.push({
              id: Number(d.id),
              id_caja: Number(c.id),
              id_unidad: Number(d.id_unidad),
              numero_serie: String(d.numero_serie || ''),
              slot: Number(d.slot || idx + 1),
              fecha_empaque: String(d.fecha_empaque || '').replace('T', ' ').substring(0, 16),
              id_usuario_empaco: Number(d.id_usuario_empaco || 1),
              retirada: Boolean(d.retirada),
              fecha_retiro: d.fecha_retiro ? String(d.fecha_retiro).replace('T', ' ').substring(0, 16) : null,
              motivo_retiro: d.motivo_retiro ? String(d.motivo_retiro) : null,
              id_usuario_retiro: d.id_usuario_retiro ? Number(d.id_usuario_retiro) : null,
            });
          });
          return {
            id: Number(c.id),
            codigo_caja: String(c.codigo_caja || ''),
            id_cliente: Number(c.id_cliente),
            cliente_nombre: String(
              c.cliente_nombre ||
                c.nombre_cliente ||
                CATALOGO_CLIENTES.find((cl) => cl.id === Number(c.id_cliente))?.nombre_cliente ||
                'Cliente'
            ),
            id_modelo: Number(c.id_modelo),
            modelo_nombre: String(
              c.modelo_nombre ||
                c.nombre_modelo ||
                CATALOGO_MODELOS.find((m) => m.id === Number(c.id_modelo))?.nombre_modelo ||
                'Modelo'
            ),
            id_color: c.id_color ? Number(c.id_color) : 1,
            color_nombre: String(
              c.color_nombre ||
                c.nombre_color ||
                CATALOGO_COLORES.find((co) => co.id === Number(c.id_color))?.nombre_color ||
                'Negro'
            ),
            capacidad: Number(
              c.capacidad ??
                c.capacidad_maxima ??
                CATALOGO_MODELOS.find((m) => m.id === Number(c.id_modelo))?.capacidad_caja ??
                12
            ),
            piezas_actuales: Number(c.piezas_actuales ?? c.total_unidades ?? 0),
            fecha_creacion: String(c.fecha_creacion || '').replace('T', ' ').substring(0, 19),
            fecha_cierre: c.fecha_cierre ? String(c.fecha_cierre).replace('T', ' ').substring(0, 19) : null,
            estado: (c.estado === 'Cerrada' ? 'Cerrada' : 'Abierta') as 'Abierta' | 'Cerrada',
            id_usuario_creador: Number(c.id_usuario_creador || 1),
            id_usuario_cerro: c.id_usuario_cerro ? Number(c.id_usuario_cerro) : null,
            id_embarque_asignado: c.id_embarque_asignado ? Number(c.id_embarque_asignado) : null,
          };
        })
      );
      setDetallesCajas(detallesAcumulados);
    }

    if (embRes.ok && Array.isArray(embRes.data)) {
      const mapaCajas: Record<number, number[]> = {};
      setEmbarques(
        embRes.data.map((e: ApiRow) => {
          const embId = Number(e.id);
          const rawCajas = Array.isArray(e.cajas) ? e.cajas : [];
          mapaCajas[embId] = rawCajas.map((c) =>
            Number(typeof c === 'object' && c !== null ? (c as ApiRow).id : c)
          );
          return {
            id: embId,
            referencia_embarque: String(e.referencia_embarque || ''),
            id_pedido: String(e.folio_pedido || e.id_pedido || ''),
            id_cliente: Number(e.id_cliente),
            cliente_nombre: String(
              e.cliente_nombre ||
                e.nombre_cliente ||
                CATALOGO_CLIENTES.find((cl) => cl.id === Number(e.id_cliente))?.nombre_cliente ||
                'Cliente'
            ),
            id_transportista: Number(e.id_transportista),
            transportista_nombre: String(
              e.transportista_nombre ||
                CATALOGO_TRANSPORTISTAS.find((t) => t.id === Number(e.id_transportista))?.nombre ||
                'Transportista'
            ),
            nombre_chofer: String(e.nombre_chofer || ''),
            placas_unidad: String(e.placas_unidad || ''),
            fecha_programada: String(e.fecha_programada || '').replace('T', ' ').substring(0, 16),
            fecha_salida: e.fecha_salida ? String(e.fecha_salida).replace('T', ' ').substring(0, 16) : null,
            estado: String(e.estado || 'Programado'),
            observaciones: e.observaciones ? String(e.observaciones) : null,
            id_usuario_creo: Number(e.id_usuario_creo || 1),
            id_usuario_confirmo: e.id_usuario_confirmo ? Number(e.id_usuario_confirmo) : null,
            fecha_creacion: String(e.fecha_creacion || '').replace('T', ' ').substring(0, 16),
            total_cajas: Number(e.total_cajas ?? rawCajas.length ?? 0),
            total_piezas: Number(e.total_piezas ?? 0),
          };
        })
      );
      setCajasAsignadasEmbarque(mapaCajas);
    }

    if (cieRes.ok && Array.isArray(cieRes.data)) {
      setCierresTurno(
        cieRes.data.map((c: ApiRow) => ({
          id: Number(c.id),
          fecha: String(c.fecha || '').substring(0, 10),
          id_turno: Number(c.id_turno),
          turno_nombre: String(
            c.turno_nombre ||
              c.nombre_turno ||
              CATALOGO_TURNOS.find((t) => t.id === Number(c.id_turno))?.nombre_turno ||
              'Mañana'
          ),
          id_linea: Number(c.id_linea),
          linea_nombre: String(
            c.linea_nombre ||
              c.nombre_linea ||
              CATALOGO_LINEAS.find((l) => l.id === Number(c.id_linea))?.nombre_linea ||
              'L1'
          ),
          id_lider_linea: Number(c.id_lider_linea || c.id_lider || 1),
          lider_nombre: String(c.lider_nombre || c.nombre_lider || 'Líder de Línea'),
          piezas_ensambladas: Number(c.piezas_ensambladas ?? 0),
          piezas_probadas: Number(c.piezas_probadas ?? 0),
          piezas_aprobadas_calidad: Number(c.piezas_aprobadas_calidad ?? c.piezas_liberadas ?? 0),
          piezas_retrabajo: Number(c.piezas_retrabajo ?? 0),
          piezas_retencion: Number(c.piezas_retencion ?? 0),
          piezas_scrap: Number(c.piezas_scrap ?? 0),
          piezas_empacadas: Number(c.piezas_empacadas ?? 0),
          piezas_embarcadas: Number(c.piezas_embarcadas ?? 0),
          diferencia_balance: Number(c.diferencia_balance ?? 0),
          objetivo_turno: Number(c.objetivo_turno ?? 100),
          cumplimiento_pct: Number(c.cumplimiento_pct ?? 0),
          estado: String(c.estado || 'Cerrado') as CierreTurno['estado'],
          observaciones: String(c.observaciones || ''),
          fecha_cierre: String(c.fecha_cierre || c.fecha_hora_cierre || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (autRes.ok && Array.isArray(autRes.data)) {
      setSolicitudesAutorizacion(
        autRes.data.map((s: ApiRow) => ({
          id: Number(s.id),
          tipo: s.tipo as SolicitudAutorizacion['tipo'],
          id_entidad: Number(s.id_entidad ?? s.id_referencia ?? 0),
          descripcion_entidad: String(s.descripcion_entidad || `${s.tipo} #${s.id_referencia ?? s.id_entidad ?? ''}`),
          motivo: String(s.motivo || ''),
          id_usuario_solicita: Number(s.id_usuario_solicita || 1),
          usuario_solicita_nombre: String(s.usuario_solicita_nombre || s.nombre_solicitante || 'Usuario'),
          estado: String(s.estado || 'PENDIENTE') as SolicitudAutorizacion['estado'],
          fecha_solicitud: String(s.fecha_solicitud || '').replace('T', ' ').substring(0, 16),
          id_usuario_autoriza: s.id_usuario_autoriza ? Number(s.id_usuario_autoriza) : undefined,
          usuario_autoriza_nombre:
            s.usuario_autoriza_nombre || s.nombre_autorizador
              ? String(s.usuario_autoriza_nombre || s.nombre_autorizador)
              : undefined,
          fecha_resolucion: s.fecha_resolucion ? String(s.fecha_resolucion).replace('T', ' ').substring(0, 16) : undefined,
          comentarios_resolucion:
            s.comentarios_resolucion || s.comentario_resolucion
              ? String(s.comentarios_resolucion || s.comentario_resolucion)
              : undefined,
        }))
      );
    }

    if (parRes.ok && Array.isArray(parRes.data)) {
      setParametros(
        parRes.data.map((p: ApiRow) => ({
          id: Number(p.id),
          clave: String(p.clave || ''),
          valor: p.valor as ParametroSistema['valor'],
          tipo_dato: p.tipo_dato ? String(p.tipo_dato) : undefined,
          descripcion: p.descripcion ? String(p.descripcion) : null,
        }))
      );
    }

    if (bitRes.ok && Array.isArray(bitRes.data)) {
      setBitacora(
        bitRes.data.map((b: ApiRow) => ({
          id: Number(b.id),
          fecha: String(b.fecha || b.fecha_hora || '').replace('T', ' ').substring(0, 19),
          id_usuario: Number(b.id_usuario || 1),
          usuario_nombre: String(b.usuario_nombre || b.nombre_completo || 'Usuario'),
          modulo: String(b.modulo || 'SISTEMA'),
          accion: String(b.accion || ''),
          motivo: b.motivo ? String(b.motivo) : undefined,
        }))
      );
    }
  };

  useEffect(() => {
    if (!estaAutenticado) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void cargarOperacionCore();
      }
    });
    return () => {
      active = false;
    };
  }, [estaAutenticado]);

  const tienePermiso = (codigoPermiso: string): boolean => {
    const permisos = sesion.usuario.permisos;
    if (Array.isArray(permisos) && permisos.length > 0) {
      return permisos.includes(codigoPermiso);
    }
    return (PERMISOS_POR_ROL[sesion.usuario.id_rol] || []).includes(codigoPermiso);
  };

  // MÉTODOS DE AUTENTICACIÓN Y SESIÓN (conectado a POST /api/auth/login + fallback demo offline)
  const iniciarSesion = async (login: string, contrasena: string, idLinea = 1, idTurno = 1) => {
    const res = await authApi.login(login, contrasena);
    const lineaObj = CATALOGO_LINEAS.find((l) => l.id === idLinea) || CATALOGO_LINEAS[0];
    const turnoObj = CATALOGO_TURNOS.find((t) => t.id === idTurno) || CATALOGO_TURNOS[0];

    if (!res.ok) {
      if (res.status === 0) {
        setBackendOnline(false);
        const usuarioDemo = USUARIOS_OFICIALES.find(
          (u) =>
            u.usuario_login.toLowerCase() === login.trim().toLowerCase() ||
            u.nomina.toLowerCase() === login.trim().toLowerCase()
        );
        if (usuarioDemo && contrasena === '123456') {
          cargarDatosDemoOffline();
          const nuevaSesion: SesionOperativa = {
            usuario: usuarioDemo,
            linea: lineaObj,
            turno: turnoObj,
          };
          setApiAuthHeaders(usuarioDemo.id, usuarioDemo.id_rol);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nuevaSesion));
          } catch {
            /* ignore */
          }
          setSesion(nuevaSesion);
          setEstaAutenticado(true);
          registrarBitacora('AUTH', `LOGIN_DEMO: ${usuarioDemo.nombre_completo}`);
          return { ok: true };
        }
        return { ok: false, error: 'Credenciales inválidas (en modo demo usa pass: 123456)' };
      }
      return { ok: false, error: res.error };
    }

    setBackendOnline(true);

    const usuarioAutenticado: Usuario = {
      id: res.data.usuario.id,
      nomina: res.data.usuario.nomina,
      nombre_completo: res.data.usuario.nombre_completo,
      usuario_login: res.data.usuario.usuario_login,
      id_rol: res.data.usuario.id_rol,
      nombre_rol: res.data.usuario.nombre_rol,
      permisos: res.data.usuario.permisos || [],
      activo: res.data.usuario.activo,
    };

    const nuevaSesion: SesionOperativa = {
      usuario: usuarioAutenticado,
      linea: lineaObj,
      turno: turnoObj,
    };

    setApiAuthHeaders(usuarioAutenticado.id, usuarioAutenticado.id_rol);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nuevaSesion));
    } catch {
      /* ignore */
    }
    setSesion(nuevaSesion);
    setEstaAutenticado(true);
    registrarBitacora('AUTH', `LOGIN_EXITOSO: ${usuarioAutenticado.nombre_completo}`);
    return { ok: true };
  };

  const cerrarSesion = () => {
    setEstaAutenticado(false);
    setApiAuthHeaders(null, null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const cambiarUsuarioSimulado = (idRol: number) => {
    const usuario = USUARIOS_OFICIALES.find((u) => u.id_rol === idRol) || USUARIOS_OFICIALES[0];
    setSesion((prev) => ({
      ...prev,
      usuario,
    }));
    registrarBitacora('SIMULACION', `CAMBIO_ROL: ${usuario.nombre_completo} [Rol ${idRol}]`);
  };

  const cambiarLineaSesion = (idLinea: number) => {
    const linea = CATALOGO_LINEAS.find((l) => l.id === idLinea) || CATALOGO_LINEAS[0];
    setSesion((prev) => ({ ...prev, linea }));
  };

  const cambiarTurnoSesion = (idTurno: number) => {
    const turno = CATALOGO_TURNOS.find((t) => t.id === idTurno) || CATALOGO_TURNOS[0];
    setSesion((prev) => ({ ...prev, turno }));
  };

  const setModoMantenimiento = async (activo: boolean, mensaje?: string) => {
    setModoMantenimientoState(activo);
    if (mensaje) setMensajeMantenimiento(mensaje);

    const paramMant = parametros.find((p) => p.clave === 'SISTEMA_MODO_MANTENIMIENTO');
    const paramMsg = parametros.find((p) => p.clave === 'MENSAJE_MANTENIMIENTO');

    if (paramMant) {
      await adminApi.updateParametro(paramMant.id, String(activo));
    }
    if (paramMsg && mensaje !== undefined) {
      await adminApi.updateParametro(paramMsg.id, mensaje);
    }

    setParametros((prev) =>
      prev.map((p) =>
        p.clave === 'SISTEMA_MODO_MANTENIMIENTO'
          ? { ...p, valor: activo }
          : p.clave === 'MENSAJE_MANTENIMIENTO' && mensaje
          ? { ...p, valor: mensaje }
          : p
      )
    );
    registrarBitacora('SISTEMA', activo ? 'MODO_MANTENIMIENTO_ACTIVADO' : 'MODO_MANTENIMIENTO_DESACTIVADO', mensaje);
  };

  const registrarBitacora = (modulo: string, accion: string, motivo?: string) => {
    const nuevaEntrada: Bitacora = {
      id: bitacora.length + 1,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      id_usuario: sesion.usuario.id,
      usuario_nombre: sesion.usuario.nombre_completo,
      modulo,
      accion,
      motivo,
    };
    setBitacora((prev) => [nuevaEntrada, ...prev]);
  };

  // ==============================================================================
  // MÓDULO 1: ÓRDENES DE PRODUCCIÓN (P-40, F-01, F-02)
  // ==============================================================================
  const crearOrden = async (
    folio: string,
    idCliente: number,
    idModelo: number,
    idColor: number,
    cantidad: number,
    fechaCompromiso: string,
    idLineaAsignada?: number
  ) => {
    if (!folio || cantidad <= 0) return { ok: false, error: 'Folio y cantidad mayor a cero requeridos' };

    const res = await ordenesApi.create({
      folio,
      id_cliente: idCliente,
      id_modelo: idModelo,
      id_color: idColor,
      cantidad,
      fecha_compromiso: fechaCompromiso || '2026-11-20',
      id_usuario_registro: sesion.usuario.id,
      id_linea_asignada: idLineaAsignada || undefined,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ORDENES', `CREAR_ORDEN: Folio ${folio} (${cantidad} pzas)`);
    return { ok: true };
  };

  const actualizarOrden = async (
    idOrden: number,
    payload: {
      folio: string;
      id_cliente: number;
      id_modelo: number;
      id_color: number;
      cantidad: number;
      fecha_compromiso: string;
      id_linea_asignada?: number | null;
    }
  ) => {
    if (!payload.folio || payload.cantidad <= 0) {
      return { ok: false, error: 'Folio y cantidad mayor a cero requeridos' };
    }

    const res = await ordenesApi.update(idOrden, {
      ...payload,
      id_usuario: sesion.usuario.id,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ORDENES', `ACTUALIZAR_ORDEN: Folio ${payload.folio} (${payload.cantidad} pzas)`);
    return { ok: true };
  };

  const importarOrdenesCsv = async (textoCsv: string) => {
    try {
      const lineas = textoCsv.trim().split(/\r?\n/);
      const items: ApiRow[] = [];

      for (const line of lineas) {
        if (!line || line.toLowerCase().startsWith('folio')) continue;
        const [folio, modeloNombre, colorNombre, clienteNombre, cantStr, compromiso] = line.split(',').map((s) => s.trim());
        if (!folio || !cantStr) continue;

        const modelo =
          CATALOGO_MODELOS.find((m) => m.nombre_modelo.toLowerCase() === (modeloNombre || '').toLowerCase()) ||
          CATALOGO_MODELOS[0];
        const color =
          CATALOGO_COLORES.find((c) => c.nombre_color.toLowerCase() === (colorNombre || '').toLowerCase()) ||
          CATALOGO_COLORES[0];
        const cliente =
          CATALOGO_CLIENTES.find((c) => c.nombre_cliente.toLowerCase().includes((clienteNombre || '').toLowerCase())) ||
          CATALOGO_CLIENTES[0];

        items.push({
          folio,
          id_cliente: cliente.id,
          id_modelo: modelo.id,
          id_color: color.id,
          cantidad: parseInt(cantStr, 10) || 50,
          fecha_compromiso: compromiso || '2026-11-30',
        });
      }

      if (items.length === 0) {
        return { ok: false, importadas: 0, error: 'No se encontraron filas válidas en el CSV' };
      }

      const res = await ordenesApi.importar({ ordenes: items, id_usuario: sesion.usuario.id });
      if (!res.ok) return { ok: false, importadas: 0, error: res.error };

      await cargarOperacionCore();
      const total = res.data.total_importadas ?? items.length;
      registrarBitacora('ORDENES', `IMPORTAR_CSV: ${total} órdenes cargadas masivamente`);
      return { ok: true, importadas: total };
    } catch {
      return { ok: false, importadas: 0, error: 'Error al procesar el archivo CSV' };
    }
  };

  const asignarLineaOrden = async (idOrden: number, idLinea: number) => {
    const linea = CATALOGO_LINEAS.find((l) => l.id === idLinea);
    if (!linea) return { ok: false, error: 'Línea no válida' };

    const res = await ordenesApi.asignarLinea(idOrden, idLinea, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ORDENES', `ASIGNAR_LINEA: Orden #${idOrden} -> Línea ${linea.nombre_linea}`);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 2: ENSAMBLE (F-03, P-11..P-14: Conteo sin serie)
  // ==============================================================================
  const registrarConteoEnsamble = async (idOrden: number, cantidad: number) => {
    if (cantidad <= 0) return { ok: false, error: 'Cantidad inválida para registro de ensamble' };
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no encontrada' };

    const res = await ensambleApi.registrarConteo({
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      cantidad,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ENSAMBLE', `CONTEO_REGISTRADO: +${cantidad} pzas en Orden ${orden.folio} (Línea ${sesion.linea.nombre_linea})`);
    return { ok: true };
  };

  const registrarDefectoEnsamble = async (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => {
    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);
    const conteoRelacionado = conteosEnsamble.find((c) => c.id_orden === idOrden) || conteosEnsamble[0];
    if (!conteoRelacionado) {
      return { ok: false, error: 'Registra primero un conteo de ensamble para asociar el defecto (BD-06).' };
    }

    const res = await ensambleApi.registrarDefecto({
      id_ensamble: conteoRelacionado.id,
      id_defecto: idDefecto,
      cantidad,
      motivo: (observaciones && observaciones.trim().length >= 3) ? observaciones.trim() : (def?.descripcion || 'Defecto en ensamble'),
      id_usuario: sesion.usuario.id,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    if (!backendOnline || IS_STATIC_REMOTE_DEMO) {
      const nuevoDefecto: DefectoEnsamble = {
        id: Number(res.data?.data?.id || defectosEnsamble.length + 1),
        id_orden: idOrden,
        id_linea: sesion.linea.id,
        id_turno: sesion.turno.id,
        id_operador: sesion.usuario.id,
        id_defecto: idDefecto,
        defecto_descripcion: def?.descripcion || 'Defecto de Ensamble',
        cantidad,
        observaciones,
        fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      setDefectosEnsamble((prev) => [nuevoDefecto, ...prev]);
    }
    registrarBitacora('ENSAMBLE', `DEFECTO_LINEA: ${def?.descripcion} (x${cantidad})`, observaciones);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 3: PRUEBA FUNCIONAL (F-04, P-41: Nacimiento de Serie Oficial)
  // ==============================================================================
  const evaluarPruebaFuncional = async (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => {
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no seleccionada para prueba funcional' };

    const todasAprobadas = checks.encendido && checks.audio && checks.carga && checks.bluetooth;
    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefectoFalla);

    const res = await pruebasApi.evaluar({
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      valida_encendido: checks.encendido,
      valida_audio: checks.audio,
      valida_carga: checks.carga,
      valida_bluetooth: checks.bluetooth,
      ...(!todasAprobadas && idDefectoFalla ? { id_defecto: idDefectoFalla, descripcion_defecto: def?.descripcion } : {}),
    });

    if (!res.ok) return { ok: false, error: res.error };

    const rawSerie = res.data.numero_serie ?? res.data.unidad?.numero_serie;
    const serieGenerada = rawSerie ? String(rawSerie) : undefined;
    await cargarOperacionCore();

    registrarBitacora(
      'PRUEBAS_FUNCIONALES',
      todasAprobadas ? `APROBADA_SERIE_EMITIDA: ${serieGenerada}` : `RECHAZADA_SIN_SERIE: ${def?.descripcion || 'Falla checks'}`,
      `Orden ${orden.folio}`
    );

    return { ok: true, serieGenerada };
  };

  // ==============================================================================
  // MÓDULO 4: CALIDAD Y DISPOSICIÓN (F-05, F-06, P-16..P-20)
  // ==============================================================================
  const dictaminarCalidad = async (numeroSerie: string, idEstadoCalidad: number, idDefecto?: number, comentarios?: string) => {
    const estadoObj = CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === idEstadoCalidad);
    const defectoObj = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);

    const res = await unidadesApi.dictaminar({
      numero_serie: numeroSerie,
      id_estado_calidad: idEstadoCalidad,
      id_usuario: sesion.usuario.id,
      id_defectos: idDefecto ? [idDefecto] : undefined,
      comentarios: comentarios || undefined,
      motivo: comentarios || defectoObj?.descripcion || 'Dictamen de calidad registrado',
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();

    if (!backendOnline || IS_STATIC_REMOTE_DEMO) {
      const unidadRef = unidades.find((u) => u.numero_serie === numeroSerie);
      const nuevaInspeccion: InspeccionCalidad = {
        id: inspeccionesCalidad.length + 1,
        id_unidad: unidadRef?.id || 0,
        numero_serie: numeroSerie,
        id_inspector: sesion.usuario.id,
        inspector_nombre: sesion.usuario.nombre_completo,
        id_estado_resultado: idEstadoCalidad,
        estado_resultado_nombre: estadoObj?.nombre_estado || 'Aprobada',
        id_defecto: idDefecto || null,
        defecto_descripcion: defectoObj?.descripcion || null,
        comentarios: comentarios || null,
        fecha_inspeccion: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setInspeccionesCalidad((prev) => [nuevaInspeccion, ...prev]);
    }

    registrarBitacora('CALIDAD', `DICTAMEN: Serie ${numeroSerie} -> ${estadoObj?.nombre_estado}`, comentarios);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 5: EMPAQUE Y CAJAS (F-08, F-09, P-21..P-25, Incidente B)
  // ==============================================================================
  const crearCaja = async (idCliente: number, idModelo: number, idColor: number) => {
    const res = await cajasApi.create({
      id_cliente: idCliente,
      id_modelo: idModelo,
      id_color: idColor,
      id_usuario_creador: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    const rawCaja = (res.data.data || {}) as ApiRow;
    const cap = Number(
      rawCaja.capacidad ??
        rawCaja.capacidad_maxima ??
        CATALOGO_MODELOS.find((m) => m.id === idModelo)?.capacidad_caja ??
        12
    );
    const cajaCreada: Caja = {
      id: Number(rawCaja.id),
      codigo_caja: String(rawCaja.codigo_caja || ''),
      id_cliente: Number(rawCaja.id_cliente ?? idCliente),
      id_modelo: Number(rawCaja.id_modelo ?? idModelo),
      id_color: Number(rawCaja.id_color ?? idColor),
      capacidad: cap,
      piezas_actuales: Number(rawCaja.piezas_actuales ?? 0),
      fecha_creacion: String(rawCaja.fecha_creacion || ''),
      fecha_cierre: rawCaja.fecha_cierre ? String(rawCaja.fecha_cierre) : null,
      estado: rawCaja.estado === 'Cerrada' ? 'Cerrada' : 'Abierta',
      id_usuario_creador: Number(rawCaja.id_usuario_creador ?? sesion.usuario.id),
    };
    registrarBitacora('EMPAQUE', `APERTURA_CAJA: ${cajaCreada.codigo_caja || 'Nueva caja'}`);
    return { ok: true, caja: cajaCreada };
  };

  const empacarPorSerie = async (numeroSerie: string, idCaja: number) => {
    const res = await cajasApi.empacarPorSerie({
      id_caja: idCaja,
      numero_serie: numeroSerie,
      id_usuario: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `UNIDAD_EMPACADA: ${numeroSerie} -> Caja #${idCaja}`);
    return { ok: true };
  };

  const cerrarCaja = async (idCaja: number) => {
    const res = await cajasApi.cerrar(idCaja, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `CAJA_CERRADA_SELLADA: Caja #${idCaja}`);
    return { ok: true };
  };

  const solicitarReaperturaCaja = async (idCaja: number, motivo: string) => {
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo para solicitar reapertura de caja' };

    const res = await autorizacionesApi.solicitar({
      tipo: 'REAPERTURA_CAJA',
      id_referencia: idCaja,
      id_usuario_solicita: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `SOLICITUD_REAPERTURA_CAJA: Caja #${idCaja}`, motivo);
    return { ok: true };
  };

  const retirarUnidadCaja = async (idCaja: number, numeroSerie: string, motivo: string) => {
    if (!motivo) return { ok: false, error: 'El retiro de una unidad empacada requiere justificación obligatoria' };
    const unidad = unidades.find((u) => u.numero_serie.toUpperCase() === numeroSerie.trim().toUpperCase());
    if (!unidad) return { ok: false, error: `Unidad ${numeroSerie} no encontrada` };

    const res = await cajasApi.retirarUnidad(idCaja, {
      id_unidad: unidad.id,
      id_usuario: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `RETIRO_UNIDAD: Serie ${numeroSerie} retirada de Caja #${idCaja}`, motivo);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 6: EMBARQUES (F-10, F-11, P-26..P-29, Incidente C)
  // ==============================================================================
  const crearEmbarque = async (
    idPedido: string,
    idCliente: number,
    idTransportista: number,
    nombreChofer: string,
    placasUnidad: string,
    fechaProgramada: string,
    observaciones?: string
  ) => {
    const res = await embarquesApi.create({
      id_pedido: idPedido || `PED-${Date.now().toString().slice(-4)}`,
      id_cliente: idCliente,
      id_transportista: idTransportista,
      nombre_chofer: nombreChofer || 'Chofer Asignado',
      placas_unidad: placasUnidad || 'PL-000-XX',
      fecha_programada: fechaProgramada || '2026-11-05 10:00',
      observaciones: observaciones || undefined,
      id_usuario_creo: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    const rawEmb = (res.data || {}) as ApiRow;
    const embarqueCreado: Embarque = {
      id: Number(rawEmb.id),
      referencia_embarque: String(rawEmb.referencia_embarque || ''),
      id_pedido: String(rawEmb.folio_pedido || rawEmb.id_pedido || idPedido),
      id_cliente: Number(rawEmb.id_cliente ?? idCliente),
      id_transportista: Number(rawEmb.id_transportista ?? idTransportista),
      nombre_chofer: String(rawEmb.nombre_chofer || nombreChofer),
      placas_unidad: String(rawEmb.placas_unidad || placasUnidad),
      fecha_programada: String(rawEmb.fecha_programada || fechaProgramada).substring(0, 16),
      fecha_salida: rawEmb.fecha_salida ? String(rawEmb.fecha_salida).substring(0, 16) : null,
      estado: String(rawEmb.estado || 'Programado'),
      observaciones: rawEmb.observaciones ? String(rawEmb.observaciones) : null,
      id_usuario_creo: Number(rawEmb.id_usuario_creo ?? sesion.usuario.id),
      id_usuario_confirmo: rawEmb.id_usuario_confirmo ? Number(rawEmb.id_usuario_confirmo) : null,
      fecha_creacion: String(rawEmb.fecha_creacion || '').substring(0, 16),
      total_cajas: 0,
      total_piezas: 0,
    };
    registrarBitacora('EMBARQUES', `PROGRAMAR_EMBARQUE: ${embarqueCreado.referencia_embarque || idPedido}`);
    return { ok: true, embarque: embarqueCreado };
  };

  const asignarCajaEmbarque = async (idEmbarque: number, idCaja: number) => {
    const res = await embarquesApi.asignarCaja({
      id_embarque: idEmbarque,
      id_caja: idCaja,
      id_usuario: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    setCajasAsignadasEmbarque((prev) => {
      const actuales = prev[idEmbarque] || [];
      return actuales.includes(idCaja) ? prev : { ...prev, [idEmbarque]: [...actuales, idCaja] };
    });
    await cargarOperacionCore();
    registrarBitacora('EMBARQUES', `ASIGNAR_CAJA: Caja #${idCaja} -> Embarque #${idEmbarque}`);
    return { ok: true };
  };

  const retirarCajaEmbarque = async (idEmbarque: number, idCaja: number) => {
    const res = await embarquesApi.retirarCaja({
      id_embarque: idEmbarque,
      id_caja: idCaja,
      id_usuario: sesion.usuario.id,
      motivo: 'Retiro de andén desde estación de embarques',
    });
    if (!res.ok) return { ok: false, error: res.error };

    setCajasAsignadasEmbarque((prev) => ({
      ...prev,
      [idEmbarque]: (prev[idEmbarque] || []).filter((id) => id !== idCaja),
    }));
    await cargarOperacionCore();
    return { ok: true };
  };

  const despacharEmbarque = async (idEmbarque: number) => {
    const res = await embarquesApi.despachar(idEmbarque, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMBARQUES', `EMBARQUE_DESPACHADO: Embarque #${idEmbarque}`);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 7: TRAZABILIDAD 360° (P-42)
  // ==============================================================================
  const buscarTrazabilidad = (numeroSerie: string) => {
    const q = numeroSerie.trim().toUpperCase();
    const unidad = unidades.find((u) => u.numero_serie.toUpperCase() === q);
    if (!unidad) return null;

    const orden = ordenes.find((o) => o.id === unidad.id_orden);
    const prueba = pruebasFuncionales.find((p) => p.numero_serie === unidad.numero_serie);
    const inspecciones = inspeccionesCalidad.filter((i) => i.numero_serie === unidad.numero_serie);
    const historial = historialUnidades.filter((h) => h.numero_serie === unidad.numero_serie);
    const caja = unidad.id_caja ? cajas.find((c) => c.id === unidad.id_caja) : undefined;
    const embarque = caja?.id_embarque_asignado ? embarques.find((e) => e.id === caja.id_embarque_asignado) : undefined;

    return {
      unidad,
      orden,
      prueba,
      inspecciones,
      historial,
      caja,
      embarque,
    };
  };

  // ==============================================================================
  // MÓDULO 8: CIERRE DE TURNO Y GOBERNANZA (P-35, P-43, INC-A, INC-D)
  // ==============================================================================
  const consolidarCierreTurno = async (observaciones?: string) => {
    const res = await turnosApi.consolidarCierre({
      fecha: new Date().toISOString().substring(0, 10),
      id_turno: sesion.turno.id,
      id_linea: sesion.linea.id,
      id_lider: sesion.usuario.id,
      observaciones: observaciones || 'Cierre formal de turno consolidado por Líder de Línea',
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('TURNOS', `CIERRE_FORMAL_TURNO: ${sesion.linea.nombre_linea} - Turno ${sesion.turno.nombre_turno}`);
    const rawCierre = (res.data?.data ?? res.data) as unknown as CierreTurno;
    return { ok: true, cierre: rawCierre };
  };

  const solicitarCorreccionCierre = async (idCierre: number, motivo: string) => {
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo del ajuste del cierre' };
    const res = await autorizacionesApi.solicitar({
      tipo: 'AJUSTE_CIERRE',
      id_referencia: idCierre,
      id_usuario_solicita: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `SOLICITUD_CORRECCION_CIERRE: Cierre #${idCierre}`, motivo);
    return { ok: true };
  };

  const resolverAutorizacion = async (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => {
    const res = await autorizacionesApi.resolver(idSolicitud, {
      estado: accion,
      id_usuario_autoriza: sesion.usuario.id,
      comentario_resolucion: comentarios || 'Resolución desde estación de gobernanza',
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `RESOLUCION_AUTORIZACION: Solicitud #${idSolicitud} -> ${accion}`, comentarios);
    return { ok: true };
  };

  const consultarTrazabilidadRemota = async (numeroSerie: string) => {
    const local = buscarTrazabilidad(numeroSerie);
    if (local) return local;
    const res = await unidadesApi.getTrazabilidad(numeroSerie.trim().toUpperCase());
    if (!res.ok || !res.data?.unidad) return null;
    const d = res.data;
    const rawU = d.unidad as ApiRow;
    const unidadMapeada: Unidad = {
      id: Number(rawU.id || 0),
      id_orden: Number(rawU.id_orden || 0),
      id_linea: Number(rawU.id_linea || 1),
      id_turno: Number(rawU.id_turno || 1),
      numero_serie: String(rawU.numero_serie || ''),
      id_estado_calidad: rawU.id_estado_calidad ? Number(rawU.id_estado_calidad) : 0,
      estado_calidad_nombre: String(
        rawU.estado_calidad_nombre || rawU.estado_calidad_actual || 'Pendiente de Calidad'
      ),
      id_caja: rawU.id_caja ? Number(rawU.id_caja) : null,
      fecha_ensamble: String(rawU.fecha_ensamble || rawU.fecha_creacion || '').replace('T', ' ').substring(0, 16),
      modelo: String(rawU.modelo || rawU.nombre_modelo || ''),
      color: String(rawU.color || rawU.nombre_color || ''),
      cliente: String(rawU.cliente || rawU.nombre_cliente || ''),
    };
    const rawInspecciones = Array.isArray(d.inspecciones)
      ? d.inspecciones
      : Array.isArray(d.inspecciones_calidad)
      ? d.inspecciones_calidad
      : [];
    return {
      unidad: unidadMapeada,
      orden: (d.orden as unknown as Orden) || undefined,
      prueba: (d.prueba_funcional as unknown as PruebaFuncional) || undefined,
      inspecciones: rawInspecciones as unknown as InspeccionCalidad[],
      historial: Array.isArray(d.historial) ? (d.historial as unknown as HistorialUnidad[]) : [],
      caja: (d.caja as unknown as Caja) || undefined,
      embarque: (d.embarque as unknown as Embarque) || undefined,
    };
  };

  const value: PlantaContextType = {
    sesion,
    setSesion,
    estaAutenticado,
    backendOnline,
    modoMantenimiento,
    mensajeMantenimiento,
    vistaActual,
    setVistaActual,
    serieTrazabilidad,
    abrirTrazabilidad,
    sincronizarAhora: cargarOperacionCore,
    consultarTrazabilidadRemota,
    tienePermiso,
    iniciarSesion,
    cerrarSesion,
    cambiarUsuarioSimulado,
    cambiarLineaSesion,
    cambiarTurnoSesion,
    ordenes,
    crearOrden,
    actualizarOrden,
    importarOrdenesCsv,
    asignarLineaOrden,
    conteosEnsamble,
    defectosEnsamble,
    registrarConteoEnsamble,
    registrarDefectoEnsamble,
    pruebasFuncionales,
    evaluarPruebaFuncional,
    unidades,
    inspeccionesCalidad,
    historialUnidades,
    dictaminarCalidad,
    cajas,
    detallesCajas,
    crearCaja,
    empacarPorSerie,
    cerrarCaja,
    solicitarReaperturaCaja,
    retirarUnidadCaja,
    embarques,
    cajasAsignadasEmbarque,
    crearEmbarque,
    asignarCajaEmbarque,
    retirarCajaEmbarque,
    despacharEmbarque,
    buscarTrazabilidad,
    cierresTurno,
    consolidarCierreTurno,
    solicitarCorreccionCierre,
    solicitudesAutorizacion,
    resolverAutorizacion,
    parametros,
    setModoMantenimiento,
    bitacora,
    registrarBitacora,
  };

  return <PlantaContext.Provider value={value}>{children}</PlantaContext.Provider>;
};

export const usePlanta = (): PlantaContextType => {
  const context = useContext(PlantaContext);
  if (!context) {
    throw new Error('usePlanta debe usarse dentro de un PlantaProvider');
  }
  return context;
};
