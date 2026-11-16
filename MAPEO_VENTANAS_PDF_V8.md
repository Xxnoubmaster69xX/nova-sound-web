# Mapeo 1-a-1: `Avances de ventanas para Nova Sound.pdf` → **v8**

Documento de correspondencia exacta entre las pantallas prometidas en el entregable previo (`Avances de ventanas para Nova Sound.pdf`) y los componentes / funciones reales implementados en la rama `v8/layout-original`.

> En **v8** solo se muestran en el menú lateral/superior los módulos alineados al entregable previo (sin exponer pantallas extra fuera de alcance), manteniendo Topbar, Sidebar, estética Endfield/HMI y lógica de negocio intactas.

| # | Sección en PDF (Pág.) | Vista / Acción prometida en PDF | Archivo / Componente en v8 | Funciones que responden (`PlantaContext` / handlers) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Log In** (Pág. 1) | Acceso por usuario y contraseña (`INGRESAR`) | `src/Pages/Login.tsx` | `iniciarSesion(login, contrasena, idLinea, idTurno)` |
| 2 | **Orden de Producción** (Pág. 2) | Tabla de órdenes (izq.) + Alta de nueva orden (der.) + Asignación de línea + Carga CSV | `src/components/OrdenesStation.tsx` | `crearOrden(...)`, `asignarLineaOrden(idOrden, idLinea)`, `importarOrdenesCsv(textoCsv)` |
| 3 | **Ensamble** (Pág. 3) | Tabla de unidades ensambladas en turno (izq.) + Registrar ensamble y defectos (der.) | `src/components/EnsambleStation.tsx` | `registrarConteoEnsamble(idOrden, cantidad)`, `registrarDefectoEnsamble(idOrden, idDefecto, cantidad, obs)` |
| 4a | **Prueba Funcional** (Pág. 3) | Checklist de 4 parámetros (Encendido, Audio, Carga, BT), selección de defecto, Aprobar / Rechazar | `src/components/PruebasStation.tsx` | `evaluarPruebaFuncional(idOrden, checks, idDefecto)` |
| 4b | **Prueba Funcional — Búsqueda** (Pág. 4) | Ingresar número de serie → Buscar → Resultado de búsqueda | `src/components/TrazabilidadStation.tsx` *(y acceso directo `VER 360°` desde Pruebas/Calidad)* | `consultarTrazabilidadRemota(numeroSerie)`, `buscarTrazabilidad(numeroSerie)`, `abrirTrazabilidad(numeroSerie)` |
| 5 | **Calidad Final** (Pág. 4) | Terminal de dictamen (4 estados: Aprobada, Retrabajo, Retención, Scrap) + Bitácora reciente | `src/components/CalidadStation.tsx` | `dictaminarCalidad(numeroSerie, idEstadoCalidad, idDefecto, comentarios)` |
| 6 | **Empaque** (Págs. 5–6) | 3 sub-vistas (`01 · Crear Caja / Empacar`, `02 · Consultar Cajas`, `03 · Bitácora`) + modales | `src/components/EmpaqueStation.tsx` | `crearCaja(...)`, `empacarPorSerie(numeroSerie, idCaja)`, `cerrarCaja(idCaja)`, `solicitarReaperturaCaja(idCaja, motivo)`, `retirarUnidadCaja(idCaja, numeroSerie, motivo)` |
| 7 | **Embarque** (Págs. 7–9) | KPIs superiores + Tabla de embarques + Detalle/Manifiesto de cajas + Modal Programar/Editar + Confirmar salida | `src/components/EmbarquesStation.tsx` | `crearEmbarque(...)`, `asignarCajaEmbarque(idEmbarque, idCaja)`, `retirarCajaEmbarque(idEmbarque, idCaja)`, `despacharEmbarque(idEmbarque)` |
| 8 | **Sistema** (Págs. 9–12) | Control de usuarios/roles, Catálogos maestros, Configuración de parámetros/mantenimiento, Bitácora de auditoría | `src/components/ConfiguracionStation.tsx` | `setModoMantenimiento(activo, mensaje)` + lectura en tiempo real de `CATALOGO_MODELOS`, `CATALOGO_COLORES`, `CATALOGO_CLIENTES`, `auditoria` y roles en `PlantaContext` |
