import { useState } from 'react';
import { RolesEnum, EstadosCalidadEnum } from '../types/database';
import { usePlanta, NOMBRES_ROLES } from '../context/PlantaContext';

import Topbar from '../components/Topbar';
import type { MenuItem } from '../components/Topbar';
import Sidebar from '../components/Sidebar';

import Inicio from './Areas/Inicio';
import Ordenes from './Areas/Ordenes';
import Ensamble from './Areas/Ensamble';
import Pruebas from './Areas/Pruebas';
import Calidad from './Areas/Calidad';
import Empaque from './Areas/Empaque';
import Embarques from './Areas/Embarques';
import Trazabilidad from './Areas/Trazabilidad';
import Turnos from './Areas/Turnos';
import Reportes from './Areas/Reportes';
import Configuracion from './Areas/Configuracion';

const PERMISO_ESCRITURA_ESTACION: Record<string, string> = {
  ordenes: 'ORDENES_GESTIONAR',
  ensamble: 'ENSAMBLE_REGISTRAR',
  pruebas: 'PRUEBA_EVALUAR',
  calidad: 'CALIDAD_DICTAMINAR',
  empaque: 'EMPAQUE_OPERAR',
  embarques: 'EMBARQUE_OPERAR',
};

export default function Main() {
  const {
    sesion,
    cambiarUsuarioSimulado,
    cerrarSesion,
    vistaActual,
    setVistaActual,
    tienePermiso,
    ordenes,
    unidades,
    cajas,
    solicitudesAutorizacion,
  } = usePlanta();

  // Contadores de colas operativas para el workflow de planta
  const ordenesActivas = ordenes.filter((o) => o.estado !== 'Completada' && o.estado !== 'Cancelada').length;
  const calidadEnEspera = unidades.filter(
    (u) =>
      u.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO ||
      u.id_estado_calidad === EstadosCalidadEnum.EN_RETENCION
  ).length;
  const sueltasParaEmpaque = unidades.filter(
    (u) => u.id_estado_calidad === EstadosCalidadEnum.APROBADA && !u.id_caja
  ).length;
  const cajasListasEmbarque = cajas.filter((c) => c.estado === 'Cerrada' && !c.id_embarque_asignado).length;
  const autorizacionesPendientes = solicitudesAutorizacion.filter((s) => s.estado === 'PENDIENTE').length;

  // Menú completo con los 11 módulos documentados en README.md
  const menuItems: MenuItem[] = [
    {
      id: 'inicio',
      code: '00',
      label: 'Telemetría',
      iconName: 'dashboard',
      roles: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      component: <Inicio />,
    },
    {
      id: 'ordenes',
      code: '01',
      label: 'Órdenes',
      iconName: 'assignment',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      badge: ordenesActivas,
      component: <Ordenes />,
    },
    {
      id: 'ensamble',
      code: '02',
      label: 'Ensamble',
      iconName: 'precision_manufacturing',
      roles: [RolesEnum.OPERADOR, RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.ADMINISTRADOR],
      component: <Ensamble />,
    },
    {
      id: 'pruebas',
      code: '03',
      label: 'Pruebas',
      iconName: 'graphic_eq',
      roles: [RolesEnum.OPERADOR, RolesEnum.LIDER_LINEA, RolesEnum.INSPECTOR_CALIDAD, RolesEnum.ADMINISTRADOR],
      component: <Pruebas />,
    },
    {
      id: 'calidad',
      code: '04',
      label: 'Calidad',
      iconName: 'fact_check',
      roles: [RolesEnum.INSPECTOR_CALIDAD, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      badge: calidadEnEspera,
      badgeAlert: calidadEnEspera > 0,
      component: <Calidad />,
    },
    {
      id: 'empaque',
      code: '05',
      label: 'Empaque',
      iconName: 'inventory_2',
      roles: [RolesEnum.ALMACEN_EMPAQUE, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.ADMINISTRADOR],
      badge: sueltasParaEmpaque,
      component: <Empaque />,
    },
    {
      id: 'embarques',
      code: '06',
      label: 'Embarques',
      iconName: 'local_shipping',
      roles: [RolesEnum.ALMACEN_EMPAQUE, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      badge: cajasListasEmbarque,
      component: <Embarques />,
    },
    {
      id: 'trazabilidad',
      code: '360',
      label: 'Búsqueda Serie / 360°',
      iconName: 'qr_code_scanner',
      roles: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      component: <Trazabilidad />,
    },
    {
      id: 'turnos',
      code: '07',
      label: 'Cierre de Turno',
      iconName: 'schedule',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      badge: autorizacionesPendientes,
      badgeAlert: autorizacionesPendientes > 0,
      component: <Turnos />,
    },
    {
      id: 'reportes',
      code: '08',
      label: 'Reportes & Pareto',
      iconName: 'analytics',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Reportes />,
    },
    {
      id: 'config',
      code: 'SYS',
      label: 'Sistema',
      iconName: 'settings',
      roles: [RolesEnum.ADMINISTRADOR],
      component: <Configuracion />,
    },
  ];

  const [openTabIds, setOpenTabIds] = useState<string[]>(['ordenes']);

  // Si el usuario es Administrador (rol 9), tiene acceso total a todas las estaciones (en modo solo lectura si no es puesto operativo).
  // De lo contrario se filtran por su rol.
  const itemsPermitidos =
    sesion.usuario.id_rol === RolesEnum.ADMINISTRADOR
      ? menuItems
      : menuItems.filter((item) => (item.roles as readonly number[]).includes(sesion.usuario.id_rol));

  const vistaActivaItem = itemsPermitidos.find((i) => i.id === vistaActual) || itemsPermitidos[0];
  const vistaEfectiva = vistaActivaItem?.id || vistaActual;
  const idsPermitidos = new Set(itemsPermitidos.map((i) => i.id));
  const openTabsPermitidos = openTabIds.filter((id) => idsPermitidos.has(id));
  const activeOpenTabIds = openTabsPermitidos.includes(vistaEfectiva)
    ? openTabsPermitidos
    : [...openTabsPermitidos, vistaEfectiva];

  const handleSelectModule = (id: string) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setVistaActual(id);
  };

  const handleCloseTab = (id: string) => {
    if (activeOpenTabIds.length <= 1) return;
    const next = activeOpenTabIds.filter((t) => t !== id);
    setOpenTabIds(next);
    if (vistaEfectiva === id) {
      setVistaActual(next[next.length - 1]);
    }
  };

  const permisoRequerido = PERMISO_ESCRITURA_ESTACION[vistaEfectiva];
  const esSoloLectura = Boolean(permisoRequerido && !tienePermiso(permisoRequerido));
  const nombreRolActual =
    NOMBRES_ROLES[sesion.usuario.id_rol] || sesion.usuario.nombre_rol || `Rol ${sesion.usuario.id_rol}`;

  return (
    <div
      className="app-container"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}
    >
      {/* Topbar Soft New-Tech con pestañas suaves */}
      <Topbar
        sesion={sesion}
        items={itemsPermitidos}
        openTabIds={activeOpenTabIds}
        vistaActual={vistaEfectiva}
        setVistaActual={setVistaActual}
        onCloseTab={handleCloseTab}
        onCambiarRol={cambiarUsuarioSimulado}
        onCerrarSesion={cerrarSesion}
      />

      {/* Contenedor principal: Sidebar de módulos (hover/expandible) + Estación activa */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
        <Sidebar
          items={itemsPermitidos}
          vistaActual={vistaEfectiva}
          openTabIds={activeOpenTabIds}
          onSelectModule={handleSelectModule}
        />

        <main className="main-content tex-grid" style={{ flex: 1, minWidth: 0, position: 'relative', overflowX: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            {esSoloLectura && (
              <div
                className="alert-banner alert-banner-warn"
                style={{ marginBottom: '14px' }}
                role="status"
              >
                <span>
                  Modo solo lectura: Tu perfil ({nombreRolActual}) solo tiene acceso de consulta en esta estación y no puede guardar ni modificar datos.
                </span>
              </div>
            )}
            {vistaActivaItem?.component}
          </div>
        </main>
      </div>

      {/* Ticker discreto de telemetría de planta */}
      <footer
        style={{
          height: '26px',
          backgroundColor: '#181a1f',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          color: 'rgba(250, 250, 250, 0.72)',
          fontFamily: 'var(--font-sans)',
          fontSize: '11.5px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          zIndex: 25,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#f5c400',
            fontWeight: 600,
            padding: '0 12px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            fontSize: '11px',
            letterSpacing: '0.3px',
          }}
        >
          <span>Estado de planta</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', paddingLeft: '14px' }}>
          <div className="ef-ticker-track">
            {[0, 1].map((dup) => (
              <span key={dup} style={{ display: 'inline-flex', gap: '24px', alignItems: 'center' }}>
                <span>Línea: <strong style={{ color: '#fafafa' }}>{sesion.linea.nombre_linea}</strong></span>
                <span>Turno: <strong style={{ color: '#fafafa' }}>{sesion.turno.nombre_turno}</strong></span>
                <span>Órdenes activas: <strong style={{ color: '#f5c400' }}>{ordenesActivas}</strong></span>
                <span>Listas empaque: <strong style={{ color: '#fafafa' }}>{sueltasParaEmpaque}</strong></span>
                <span>Cajas embarque: <strong style={{ color: '#fafafa' }}>{cajasListasEmbarque}</strong></span>
                <span>Calidad pendiente: <strong style={{ color: calidadEnEspera > 0 ? '#fca5a5' : '#fafafa' }}>{calidadEnEspera}</strong></span>
                <span>Autorizaciones: <strong style={{ color: autorizacionesPendientes > 0 ? '#f5c400' : '#fafafa' }}>{autorizacionesPendientes}</strong></span>
                <span style={{ color: 'rgba(250,250,250,0.42)' }}>Nova Sound · Control de Producción y Trazabilidad</span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
