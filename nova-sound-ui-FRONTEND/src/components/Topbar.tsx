import React from 'react';
import type { SesionOperativa } from '../types/database';
import { NOMBRES_ROLES, usePlanta } from '../context/PlantaContext';
import Icon from './common/Icon';
import LogoBocina from './common/LogoBocina';

export interface MenuItem {
  id: string;
  label: string;
  code: string;
  iconName?: string;
  roles: number[];
  badge?: number;
  badgeAlert?: boolean;
  component: React.ReactNode;
}

interface TopbarProps {
  sesion: SesionOperativa;
  items: MenuItem[];
  openTabIds: string[];
  vistaActual: string;
  setVistaActual: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCambiarRol: (idRol: number) => void;
  onCerrarSesion?: () => void;
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function Topbar({
  sesion,
  items,
  openTabIds,
  vistaActual,
  setVistaActual,
  onCloseTab,
  onCerrarSesion,
}: TopbarProps) {
  const { modoMantenimiento, mensajeMantenimiento, cambiarLineaSesion, cambiarTurnoSesion, sincronizarAhora } = usePlanta();
  const activeItem = items.find((i) => i.id === vistaActual);
  const initials = getInitials(sesion.usuario.nombre_completo);

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* 0. BANNER DE MANTENIMIENTO */}
      {modoMantenimiento && (
        <div className="maintenance-banner tex-warn-stripes">
          <span style={{ background: '#181a1f', color: '#f5c400', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            AVISO DE MANTENIMIENTO
          </span>
          <span style={{ background: '#181a1f', color: '#fafafa', padding: '2px 8px', borderRadius: '4px' }}>
            {mensajeMantenimiento}
          </span>
        </div>
      )}

      {/* 1. BARRA PRINCIPAL BLANCA SOFT NEW-TECH */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Izquierda: Branding Nova Sound + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoBocina size={28} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-main)',
                }}
              >
                NOVA SOUND
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Control de planta
              </span>
            </div>
          </div>

          <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-default)' }} aria-hidden="true" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Producción</span>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {activeItem?.label ?? 'Inicio'}
            </span>
          </div>
        </div>

        {/* Derecha: Línea / Turno + Operador + Sync + Salir */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Selector rápido de Línea */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '3px 5px',
              borderRadius: '8px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 500, padding: '0 4px' }}>
              Línea
            </span>
            {[1, 2, 3].map((lId) => {
              const active = sesion.linea.id === lId;
              return (
                <button
                  key={lId}
                  type="button"
                  onClick={() => cambiarLineaSesion(lId)}
                  style={{
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                    border: active ? '1px solid var(--border-default)' : '1px solid transparent',
                    boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                    padding: '3px 8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  L{lId}
                </button>
              );
            })}
          </div>

          {/* Selector rápido de Turno */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '3px 5px',
              borderRadius: '8px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 500, padding: '0 4px' }}>
              Turno
            </span>
            {[1, 2, 3].map((tId) => {
              const active = sesion.turno.id === tId;
              return (
                <button
                  key={tId}
                  type="button"
                  onClick={() => cambiarTurnoSesion(tId)}
                  style={{
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                    border: active ? '1px solid var(--border-default)' : '1px solid transparent',
                    boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                    padding: '3px 8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  T{tId}
                </button>
              );
            })}
          </div>

          {/* Avatar circular + Operador */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 6px',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
            }}
            title={NOMBRES_ROLES[sesion.usuario.id_rol] ?? String(sesion.usuario.id_rol)}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
              }}
            >
              {initials}
            </span>
            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              {sesion.usuario.nombre_completo}
            </span>
          </div>

          {/* Botón Sincronizar con BD */}
          <button
            type="button"
            onClick={() => sincronizarAhora()}
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Sincronizar colas y registros con PostgreSQL"
          >
            <Icon name="sync" size={14} color="var(--text-muted)" />
            <span>Sync</span>
          </button>

          {/* Botón Cerrar Sesión */}
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Cerrar turno y salir al login"
            >
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PESTAÑAS ABIERTAS SUAVES */}
      <nav
        style={{
          display: 'flex',
          gap: '4px',
          padding: '6px 20px',
          backgroundColor: '#faf9f6',
          overflowX: 'auto',
        }}
      >
        {openTabIds
          .map((tabId) => items.find((i) => i.id === tabId))
          .filter((item): item is MenuItem => Boolean(item))
          .map((item) => {
            const activo = vistaActual === item.id;
            const puedeCerrar = openTabIds.length > 1;
            return (
              <div
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: activo ? '#ffffff' : 'transparent',
                  border: activo ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  borderRadius: '8px',
                  boxShadow: activo ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
                }}
              >
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12.5px',
                    fontWeight: activo ? 600 : 500,
                    padding: '6px 10px 6px 12px',
                    backgroundColor: 'transparent',
                    color: activo ? 'var(--text-main)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setVistaActual(item.id)}
                >
                  {item.iconName && (
                    <Icon
                      name={item.iconName}
                      size={15}
                      color={activo ? 'var(--text-main)' : 'var(--text-dim)'}
                    />
                  )}
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: item.badgeAlert ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                        color: item.badgeAlert ? '#b91c1c' : 'var(--text-muted)',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
                {puedeCerrar && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(item.id);
                    }}
                    title={`Cerrar pestaña ${item.label}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px 8px 4px 2px',
                      fontSize: '14px',
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
      </nav>
    </header>
  );
}
