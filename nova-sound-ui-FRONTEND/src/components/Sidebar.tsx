import { useState } from 'react';
import Icon from './common/Icon';
import type { MenuItem } from './Topbar';

interface SidebarProps {
  items: MenuItem[];
  vistaActual: string;
  openTabIds: string[];
  onSelectModule: (id: string) => void;
}

export default function Sidebar({ items, vistaActual, openTabIds, onSelectModule }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  const expanded = hovered || pinned;

  return (
    <aside
      className="ns-sidebar"
      data-expanded={expanded ? 'true' : 'false'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: pinned ? '232px' : '58px',
        minWidth: pinned ? '232px' : '58px',
        flexShrink: 0,
        backgroundColor: '#181a1f',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'visible',
        userSelect: 'none',
        zIndex: 30,
      }}
      aria-label="Módulos de planta"
    >
      {/* Panel interno limitado a 58px cuando está colapsado para no tapar el contenido */}
      <div
        style={{
          position: pinned ? 'relative' : 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: expanded ? '232px' : '58px',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          pointerEvents: expanded ? 'auto' : 'none',
          transition: 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Riel base izquierdo de 58px */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '58px',
            backgroundColor: '#181a1f',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            zIndex: 0,
          }}
        />

        {/* Cortina de 2 capas en 14 franjas horizontales */}
        <div className="ns-sidebar-curtain-bg ns-sidebar-curtain-bg--back" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="ns-sidebar-curtain-col" />
          ))}
        </div>
        <div className="ns-sidebar-curtain-bg ns-sidebar-curtain-bg--front" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="ns-sidebar-curtain-col" />
          ))}
        </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '10px 8px' }}>
        {/* Cabecera compacta de Áreas + Pin */}
        <div
          style={{
            height: '32px',
            padding: '0 11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'rgba(250, 250, 250, 0.5)',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '8px',
          }}
        >
          {expanded ? (
            <>
              <span className="ns-sidebar-row__label" style={{ animationDelay: '160ms' }}>
                ÁREAS
              </span>
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                title={pinned ? 'Desfijar barra lateral' : 'Fijar barra lateral'}
                className="ns-sidebar-row__label"
                style={{
                  animationDelay: '185ms',
                  background: 'transparent',
                  border: 'none',
                  color: pinned ? '#f5c400' : 'rgba(250, 250, 250, 0.45)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="push_pin" size={14} color={pinned ? '#f5c400' : 'rgba(250, 250, 250, 0.45)'} />
              </button>
            </>
          ) : (
            <span style={{ width: '20px', display: 'inline-flex', justifyContent: 'center' }}>
              <Icon name="apps" size={16} color="rgba(250, 250, 250, 0.55)" />
            </span>
          )}
        </div>

        {/* Lista de módulos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {items.map((item, idx) => {
            const activo = vistaActual === item.id;
            const abierto = openTabIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                title={!expanded ? `${item.code} · ${item.label}` : undefined}
                className="ns-sidebar-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: expanded ? '100%' : '42px',
                  height: '38px',
                  padding: '0 11px',
                  justifyContent: 'flex-start',
                  backgroundColor: activo ? 'rgba(255, 255, 255, 0.09)' : 'transparent',
                  color: activo ? '#ffffff' : abierto ? 'rgba(250, 250, 250, 0.85)' : 'rgba(250, 250, 250, 0.56)',
                  border: activo ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'width 0.16s ease, background-color 0.16s ease',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: activo ? 600 : 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {activo && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '2px',
                      width: '3px',
                      height: '16px',
                      borderRadius: '9999px',
                      backgroundColor: '#f5c400',
                      zIndex: 3,
                    }}
                  />
                )}

                <div
                  className="ns-sidebar-row__content"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', flexShrink: 0 }}>
                    {item.iconName && (
                      <Icon
                        name={item.iconName}
                        size={18}
                        color={activo ? '#f5c400' : abierto ? '#fafafa' : 'rgba(250, 250, 250, 0.56)'}
                      />
                    )}
                    {!expanded && typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-4px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: item.badgeAlert ? '#ef4444' : '#f5c400',
                        }}
                      />
                    )}
                  </div>

                  {expanded && (
                    <>
                      <span
                        className="ns-sidebar-row__label"
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          animationDelay: `${200 + idx * 24}ms`,
                        }}
                      >
                        {item.label}
                      </span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span
                          className="ns-sidebar-row__label"
                          style={{
                            animationDelay: `${210 + idx * 24}ms`,
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 7px',
                            borderRadius: '9999px',
                            backgroundColor: item.badgeAlert ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.10)',
                            color: item.badgeAlert ? '#fca5a5' : 'rgba(250, 250, 250, 0.85)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pie discreto del sidebar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: expanded ? '100%' : '42px',
          margin: '0 8px',
          padding: '10px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'rgba(250, 250, 250, 0.38)',
          transition: 'width 0.16s ease',
        }}
      >
        {expanded ? (
          <span className="ns-sidebar-row__label" style={{ animationDelay: '240ms' }}>
            {openTabIds.length} abiertas
          </span>
        ) : (
          <span>{openTabIds.length}</span>
        )}
      </div>
      </div>
    </aside>
  );
}
