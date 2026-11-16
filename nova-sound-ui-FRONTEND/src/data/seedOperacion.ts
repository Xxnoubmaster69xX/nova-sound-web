import {
  EstadosCalidadEnum,
  type Orden,
  type ConteoEnsamble,
  type DefectoEnsamble,
  type PruebaFuncional,
  type Unidad,
  type InspeccionCalidad,
  type HistorialUnidad,
  type Caja,
  type DetalleCaja,
  type Embarque,
  type Bitacora,
} from '../types/database';

const CLIENTES = [
  { id: 1, nombre: 'SoundCorp Retail' },
  { id: 2, nombre: 'MegaAudio Distribución' },
  { id: 3, nombre: 'TechBeat Stores' },
  { id: 4, nombre: 'AudioMax Mayoreo' },
];

const MODELOS = [
  { id: 1, nombre: 'NS-MINI', cap: 12 },
  { id: 2, nombre: 'NS-SPORT', cap: 8 },
  { id: 3, nombre: 'NS-PRO', cap: 6 },
  { id: 4, nombre: 'NS-MAX', cap: 4 },
];

const COLORES = [
  { id: 1, nombre: 'Negro' },
  { id: 2, nombre: 'Blanco' },
  { id: 3, nombre: 'Rojo' },
  { id: 4, nombre: 'Azul' },
  { id: 5, nombre: 'Verde' },
];

const TRANSPORTISTAS = [
  { id: 1, nombre: 'Transportes del Norte S.A.', chofer: 'Ramiro Valdés', placas: 'NL-884-TX' },
  { id: 2, nombre: 'Logística Express Bajío', chofer: 'Héctor Salgado', placas: 'GTO-412-KM' },
  { id: 3, nombre: 'Fletes Industriales Coahuila', chofer: 'Martín Esquivel', placas: 'COAH-709-LP' },
];

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

// 1. 18 ÓRDENES DE PRODUCCIÓN
export const SEED_ORDENES: Orden[] = Array.from({ length: 18 }, (_, i) => {
  const idx = i + 1;
  const cli = CLIENTES[i % CLIENTES.length];
  const mod = MODELOS[i % MODELOS.length];
  const col = COLORES[i % COLORES.length];
  const lineaId = idx > 15 ? null : ((i % 3) + 1);
  const estado =
    idx <= 5
      ? 'Completada'
      : idx <= 11
      ? 'En Producción'
      : idx <= 15
      ? 'Asignada'
      : 'Pendiente';
  const cantidad = [120, 80, 240, 150, 100, 180][i % 6];
  const ensambladas =
    estado === 'Completada'
      ? cantidad
      : estado === 'En Producción'
      ? Math.round(cantidad * 0.6)
      : estado === 'Asignada'
      ? Math.round(cantidad * 0.25)
      : 0;
  const aprobadas = Math.max(0, ensambladas - (ensambladas > 10 ? 4 : 0));

  return {
    id: idx,
    folio: `ORD-2026-${100 + idx}`,
    id_cliente: cli.id,
    cliente_nombre: cli.nombre,
    id_modelo: mod.id,
    modelo_nombre: mod.nombre,
    id_color: col.id,
    color_nombre: col.nombre,
    cantidad,
    fecha_compromiso: `2026-11-${pad(10 + (i % 18))}`,
    fecha_recepcion: `2026-11-${pad(1 + (i % 9))}`,
    id_usuario_registro: 9,
    estado,
    id_linea_asignada: lineaId,
    linea_nombre: lineaId ? `L${lineaId}` : null,
    id_usuario_asigno: lineaId ? 6 : null,
    fecha_asignacion: lineaId ? `2026-11-${pad(2 + (i % 8))} 08:${pad((i * 7) % 60)}` : null,
    piezas_ensambladas: ensambladas,
    piezas_aprobadas: aprobadas,
  };
});

// 2. 45 CONTEOS DE ENSAMBLE
export const SEED_CONTEOS_ENSAMBLE: ConteoEnsamble[] = Array.from({ length: 45 }, (_, i) => {
  const orden = SEED_ORDENES[i % 15];
  const dia = pad(4 + (i % 12));
  const hora = pad(7 + (i % 10));
  const min = pad((i * 13) % 60);
  return {
    id: i + 1,
    id_orden: orden.id,
    id_linea: orden.id_linea_asignada || ((i % 3) + 1),
    id_turno: (i % 3) + 1,
    id_operador: 1,
    cantidad: [10, 15, 20, 25, 30][i % 5],
    fecha_hora: `2026-11-${dia} ${hora}:${min}:00`,
  };
});

// 3. 15 DEFECTOS DE ENSAMBLE
const DEFECTOS_ENSAMBLE_TXT = [
  { id: 1, desc: 'Rayón superficial en carcasa plástica', obs: 'Fricción en banda de ensamble' },
  { id: 2, desc: 'Tornillo de chasis mal ajustado / trasroscado', obs: 'Calibración de torque requerida' },
  { id: 3, desc: 'Rebaba o exceso de pegamento en rejilla', obs: 'Ajuste de dosificador en estación 2' },
];

export const SEED_DEFECTOS_ENSAMBLE: DefectoEnsamble[] = Array.from({ length: 15 }, (_, i) => {
  const def = DEFECTOS_ENSAMBLE_TXT[i % DEFECTOS_ENSAMBLE_TXT.length];
  const orden = SEED_ORDENES[i % 12];
  return {
    id: i + 1,
    id_orden: orden.id,
    id_linea: orden.id_linea_asignada || 1,
    id_turno: (i % 3) + 1,
    id_operador: 1,
    id_defecto: def.id,
    defecto_descripcion: def.desc,
    cantidad: (i % 3) + 1,
    observaciones: def.obs,
    fecha_hora: `2026-11-${pad(4 + (i % 12))} ${pad(8 + (i % 8))}:${pad((i * 11) % 60)}:00`,
  };
});

// 4. 140 PRUEBAS FUNCIONALES (120 APROBADAS CON SERIE + 20 RECHAZADAS)
export const SEED_PRUEBAS_FUNCIONALES: PruebaFuncional[] = Array.from({ length: 140 }, (_, i) => {
  const idx = i + 1;
  const orden = SEED_ORDENES[i % 12];
  const aprobada = idx <= 120;
  const serie = aprobada ? `NS-2026-${pad(idx, 4)}` : null;
  const dia = pad(4 + (i % 12));
  const hora = pad(8 + (i % 10));
  const min = pad((i * 3) % 60);
  const seg = pad((i * 7) % 60);

  return {
    id: idx,
    id_orden: orden.id,
    id_linea: orden.id_linea_asignada || 1,
    id_turno: (i % 3) + 1,
    id_usuario: 1,
    valida_encendido: aprobada || i % 4 !== 0,
    valida_audio: aprobada || i % 4 !== 1,
    valida_carga: aprobada || i % 4 !== 2,
    valida_bluetooth: aprobada || i % 4 !== 3,
    aprobada,
    numero_serie: serie,
    id_defecto_falla: aprobada ? undefined : [5, 6, 7, 8][i % 4],
    defecto_falla: aprobada
      ? undefined
      : [
          'Unidad no enciende / falla eléctrica',
          'Distorsión de audio o zumbido en altavoz',
          'Puerto de carga USB defectuoso',
          'Falla de emparejamiento Bluetooth',
        ][i % 4],
    fecha_hora: `2026-11-${dia} ${hora}:${min}:${seg}`,
  };
});

// 5. 24 CAJAS DE EMPAQUE
export const SEED_CAJAS: Caja[] = Array.from({ length: 24 }, (_, i) => {
  const idx = i + 1;
  const cli = CLIENTES[i % CLIENTES.length];
  const mod = MODELOS[i % MODELOS.length];
  const col = COLORES[i % COLORES.length];
  const abierta = idx <= 4;
  const embarqueId = !abierta && idx <= 18 ? ((idx - 5) % 8) + 1 : null;

  return {
    id: idx,
    codigo_caja: `BX-2026-${pad(idx, 3)}`,
    id_cliente: cli.id,
    cliente_nombre: cli.nombre,
    id_modelo: mod.id,
    modelo_nombre: mod.nombre,
    id_color: col.id,
    color_nombre: col.nombre,
    capacidad: mod.cap,
    piezas_actuales: abierta ? Math.max(1, mod.cap - 3) : mod.cap,
    fecha_creacion: `2026-11-${pad(4 + (i % 10))} 08:${pad((i * 5) % 60)}:00`,
    fecha_cierre: abierta ? null : `2026-11-${pad(4 + (i % 10))} 16:${pad((i * 9) % 60)}:00`,
    estado: abierta ? 'Abierta' : 'Cerrada',
    id_usuario_creador: 4,
    id_usuario_cerro: abierta ? null : 4,
    id_embarque_asignado: embarqueId,
  };
});

// 6. 120 UNIDADES + 120 INSPECCIONES + 120 HISTORIALES
export const SEED_UNIDADES: Unidad[] = Array.from({ length: 120 }, (_, i) => {
  const idx = i + 1;
  const orden = SEED_ORDENES[i % 12];
  let idEstado: number = EstadosCalidadEnum.APROBADA;
  let nombreEstado = 'Aprobada';
  if (idx % 15 === 0) {
    idEstado = EstadosCalidadEnum.EN_RETRABAJO;
    nombreEstado = 'En retrabajo';
  } else if (idx % 19 === 0) {
    idEstado = EstadosCalidadEnum.EN_RETENCION;
    nombreEstado = 'En retención';
  } else if (idx % 29 === 0) {
    idEstado = EstadosCalidadEnum.SCRAP;
    nombreEstado = 'Scrap';
  }

  const empacada = idEstado === EstadosCalidadEnum.APROBADA && idx <= 80;
  const cajaId = empacada ? ((idx - 1) % 24) + 1 : null;

  return {
    id: idx,
    id_orden: orden.id,
    id_linea: orden.id_linea_asignada || 1,
    id_turno: (i % 3) + 1,
    numero_serie: `NS-2026-${pad(idx, 4)}`,
    id_estado_calidad: idEstado,
    estado_calidad_nombre: nombreEstado,
    id_caja: cajaId,
    fecha_ensamble: `2026-11-${pad(4 + (i % 12))} ${pad(8 + (i % 9))}:${pad((i * 4) % 60)}`,
    modelo: orden.modelo_nombre || 'NS-PRO',
    color: orden.color_nombre || 'Negro',
    cliente: orden.cliente_nombre || 'SoundCorp Retail',
    id_prueba_funcional: idx,
  };
});

export const SEED_INSPECCIONES_CALIDAD: InspeccionCalidad[] = SEED_UNIDADES.map((u, i) => ({
  id: i + 1,
  id_unidad: u.id,
  numero_serie: u.numero_serie,
  id_inspector: 3,
  inspector_nombre: 'Juan Pérez',
  id_estado_resultado: u.id_estado_calidad,
  estado_resultado_nombre: u.estado_calidad_nombre || 'Aprobada',
  id_defecto: u.id_estado_calidad === EstadosCalidadEnum.APROBADA ? undefined : 4,
  defecto_descripcion:
    u.id_estado_calidad === EstadosCalidadEnum.APROBADA ? undefined : 'Golpe o abolladura en rejilla frontal',
  comentarios:
    u.id_estado_calidad === EstadosCalidadEnum.APROBADA
      ? 'Inspección cosmética y acústica conforme'
      : 'Canalizada según protocolo de disposición técnica',
  fecha_inspeccion: `${u.fecha_ensamble.slice(0, 10)} ${pad(9 + (i % 9))}:${pad((i * 5) % 60)}`,
}));

export const SEED_HISTORIAL_UNIDADES: HistorialUnidad[] = SEED_UNIDADES.map((u, i) => ({
  id: i + 1,
  id_unidad: u.id,
  numero_serie: u.numero_serie,
  id_usuario: 3,
  usuario_nombre: 'Juan Pérez',
  estado_anterior: 'Pendiente',
  estado_nuevo: u.estado_calidad_nombre || 'Aprobada',
  motivo:
    u.id_estado_calidad === EstadosCalidadEnum.APROBADA
      ? 'Inspección de calidad aprobada'
      : `Dictamen ${u.estado_calidad_nombre} registrado en estación`,
  fecha_hora: `${u.fecha_ensamble.slice(0, 10)} ${pad(9 + (i % 9))}:${pad((i * 5) % 60)}`,
}));

// 7. 80 DETALLES DE CAJA
export const SEED_DETALLES_CAJAS: DetalleCaja[] = SEED_UNIDADES.filter((u) => u.id_caja !== null).map((u, idx) => ({
  id: idx + 1,
  id_caja: u.id_caja!,
  id_unidad: u.id,
  numero_serie: u.numero_serie,
  slot: (idx % 6) + 1,
  fecha_empaque: `${u.fecha_ensamble.slice(0, 10)} 11:${pad((idx * 3) % 60)}`,
  id_usuario_empaco: 4,
  retirada: false,
}));

// 8. 10 EMBARQUES + MAPA DE CAJAS ASIGNADAS
export const SEED_EMBARQUES: Embarque[] = Array.from({ length: 10 }, (_, i) => {
  const idx = i + 1;
  const cli = CLIENTES[i % CLIENTES.length];
  const transp = TRANSPORTISTAS[i % TRANSPORTISTAS.length];
  const despachado = idx <= 5;
  const cajasAsig = SEED_CAJAS.filter((c) => c.id_embarque_asignado === idx);

  return {
    id: idx,
    referencia_embarque: `EMB-2026-${88 + idx}`,
    id_pedido: `PED-NS-${900 + idx}`,
    id_cliente: cli.id,
    cliente_nombre: cli.nombre,
    id_transportista: transp.id,
    transportista_nombre: transp.nombre,
    nombre_chofer: transp.chofer,
    placas_unidad: transp.placas,
    fecha_programada: `2026-11-${pad(4 + idx)} ${pad(10 + (idx % 6))}:00`,
    fecha_salida: despachado ? `2026-11-${pad(4 + idx)} ${pad(12 + (idx % 5))}:30` : null,
    estado: despachado ? 'Despachado' : 'Programado',
    observaciones: despachado ? 'Salida confirmada con manifiesto firmado' : 'En andén de carga con sello de seguridad',
    id_usuario_creo: 4,
    id_usuario_confirmo: despachado ? 5 : null,
    fecha_creacion: `2026-11-${pad(3 + idx)} 09:00`,
    total_cajas: cajasAsig.length,
    total_piezas: cajasAsig.reduce((s, c) => s + (c.piezas_actuales || 0), 0),
  };
});

export const SEED_CAJAS_ASIGNADAS_EMBARQUE: Record<number, number[]> = SEED_EMBARQUES.reduce(
  (acc, emb) => {
    acc[emb.id] = SEED_CAJAS.filter((c) => c.id_embarque_asignado === emb.id).map((c) => c.id);
    return acc;
  },
  {} as Record<number, number[]>
);

// 9. 30 EVENTOS DE BITÁCORA
const MODULOS_BIT = ['ORDENES', 'ENSAMBLE', 'PRUEBAS_FUNCIONALES', 'CALIDAD', 'EMPAQUE', 'EMBARQUES', 'SISTEMA'];
export const SEED_BITACORA: Bitacora[] = Array.from({ length: 30 }, (_, i) => {
  const mod = MODULOS_BIT[i % MODULOS_BIT.length];
  return {
    id: i + 1,
    fecha: `2026-11-${pad(4 + (i % 12))} ${pad(7 + (i % 11))}:${pad((i * 9) % 60)}:00`,
    id_usuario: (i % 5) + 1,
    usuario_nombre: ['Carlos Hernández', 'Roberto Mendoza', 'Juan Pérez', 'Lucía Gómez', 'Marcela Juárez'][i % 5],
    modulo: mod,
    accion: `${mod}_EVENTO_${pad(i + 1, 3)}`,
    motivo: `Operación registrada en flujo de planta (${mod})`,
  };
});
