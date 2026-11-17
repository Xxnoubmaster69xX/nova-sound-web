import { useState, useEffect } from 'react';
import { RolesEnum, EstadosCalidadEnum } from '../types/database';
import { usePlanta } from '../context/PlantaContext';

import Topbar from '../components/Topbar';
import type { MenuItem } from '../components/Topbar';
import Sidebar from '../components/Sidebar';

import Ordenes from './Areas/Ordenes';
import Ensamble from './Areas/Ensamble';
import Pruebas from './Areas/Pruebas';
import Calidad from './Areas/Calidad';
import Empaque from './Areas/Empaque';
import Embarques from './Areas/Embarques';
import Trazabilidad from './Areas/Trazabilidad';
import Configuracion from './Areas/Configuracion';

export default function Main() {
  const {
    sesion,
    cambiarUsuarioSimulado,
    cerrarSesion,
    vistaActual,
    setVistaActual,
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

  // Menú alineado estrictamente con las ventanas prometidas en Avances de ventanas para Nova Sound.pdf
  const menuItems: MenuItem[] = [
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
      id: 'config',
      code: 'SYS',
      label: 'Sistema',
      iconName: 'settings',
      roles: [RolesEnum.ADMINISTRADOR],
      component: <Configuracion />,
    },
  ];

  const [openTabIds, setOpenTabIds] = useState<string[]>(['ordenes']);

  // Si se navega a una estación desde un acceso directo (ej. VER 360°), abrir su pestaña automáticamente
  useEffect(() => {
    setOpenTabIds((prev) => (prev.includes(vistaActual) ? prev : [...prev, vistaActual]));
  }, [vistaActual]);

  const handleSelectModule = (id: string) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setVistaActual(id);
  };

  const handleCloseTab = (id: string) => {
    setOpenTabIds((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t !== id);
      if (vistaActual === id) {
        setVistaActual(next[next.length - 1]);
      }
      return next;
    });
  };

  // Si el usuario es Administrador (rol 9), tiene acceso total a todas las estaciones.
  // De lo contrario se filtran por su rol.
  const itemsPermitidos =
    sesion.usuario.id_rol === RolesEnum.ADMINISTRADOR
      ? menuItems
      : menuItems.filter((item) => (item.roles as readonly number[]).includes(sesion.usuario.id_rol));

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Topbar Soft New-Tech con pestañas suaves */}
      <Topbar
        sesion={sesion}
        items={itemsPermitidos}
        openTabIds={openTabIds}
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        onCloseTab={handleCloseTab}
        onCambiarRol={cambiarUsuarioSimulado}
        onCerrarSesion={cerrarSesion}
      />

      {/* Contenedor principal: Sidebar de módulos (hover/expandible) + Estación activa */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          items={itemsPermitidos}
          vistaActual={vistaActual}
          openTabIds={openTabIds}
          onSelectModule={handleSelectModule}
        />

        <main className="main-content tex-grid" style={{ flex: 1, minWidth: 0, position: 'relative', overflowX: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            {itemsPermitidos.find((i) => i.id === vistaActual)?.component || itemsPermitidos[0]?.component}
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
