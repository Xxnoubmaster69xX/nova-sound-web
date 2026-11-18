import { pool } from '../config/db.js';
import type { Orden } from '../types/index.js';

export class OrdenesRepository {
  // RF-03: Avance de cada orden y faltante contra pedido_detalle
  async getAll(idLinea?: number): Promise<Orden[]> {
    let query = `
      SELECT o.*, 
             c.nombre_cliente, 
             m.nombre_modelo, 
             col.nombre_color, 
             l.nombre_linea,
             COALESCE(pd.cantidad_solicitada, o.cantidad) as cantidad_solicitada_pedido,
             COALESCE(ens_sum.total_ensambladas, 0) as cantidad_ensamblada,
             COUNT(CASE WHEN u.id_estado_calidad = 1 THEN 1 END) as cantidad_aprobada,
             COUNT(CASE WHEN u.id_estado_calidad = 4 THEN 1 END) as cantidad_scrap,
             GREATEST(
               COALESCE(pd.cantidad_solicitada, o.cantidad) - COUNT(CASE WHEN u.id_estado_calidad = 1 THEN 1 END),
               0
             ) as faltante_pedido
      FROM ordenes o
      LEFT JOIN clientes c ON o.id_cliente = c.id
      LEFT JOIN modelos m ON o.id_modelo = m.id
      LEFT JOIN colores col ON o.id_color = col.id
      LEFT JOIN lineas l ON o.id_linea_asignada = l.id
      LEFT JOIN pedido_detalle pd ON o.id_pedido = pd.id_pedido AND o.id_modelo = pd.id_modelo AND o.id_color = pd.id_color
      LEFT JOIN (
        SELECT id_orden, SUM(cantidad) as total_ensambladas
        FROM ensamble
        GROUP BY id_orden
      ) ens_sum ON o.id = ens_sum.id_orden
      LEFT JOIN unidades u ON o.id = u.id_orden
    `;

    const params: any[] = [];
    if (idLinea) {
      query += ` WHERE o.id_linea_asignada = $1 `;
      params.push(idLinea);
    }

    query += `
      GROUP BY o.id, c.nombre_cliente, m.nombre_modelo, col.nombre_color, l.nombre_linea, pd.cantidad_solicitada, ens_sum.total_ensambladas
      ORDER BY o.id ASC;
    `;

    const res = await pool.query(query, params);
    return res.rows;
  }

  async getById(id: number): Promise<Orden | null> {
    const query = `
      SELECT o.*, 
             c.nombre_cliente, 
             m.nombre_modelo, 
             col.nombre_color, 
             l.nombre_linea
      FROM ordenes o
      LEFT JOIN clientes c ON o.id_cliente = c.id
      LEFT JOIN modelos m ON o.id_modelo = m.id
      LEFT JOIN colores col ON o.id_color = col.id
      LEFT JOIN lineas l ON o.id_linea_asignada = l.id
      WHERE o.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async create(data: {
    folio: string;
    id_pedido?: number;
    id_cliente: number;
    id_modelo: number;
    id_color: number;
    cantidad: number;
    fecha_compromiso: string;
    id_usuario_registro: number;
    id_linea_asignada?: number;
  }): Promise<Orden> {
    const estadoInicial = data.id_linea_asignada ? 'En Proceso' : 'Programada';
    const query = `
      INSERT INTO ordenes (
        folio, id_pedido, id_cliente, id_modelo, id_color,
        cantidad, fecha_compromiso, id_usuario_registro,
        estado, id_linea_asignada, id_usuario_asigno, fecha_asignacion
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10::int, 
        CASE WHEN $10::int IS NOT NULL THEN $8::int ELSE NULL END,
        CASE WHEN $10::int IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING *;
    `;
    const values = [
      data.folio,
      data.id_pedido || null,
      data.id_cliente,
      data.id_modelo,
      data.id_color,
      data.cantidad,
      data.fecha_compromiso,
      data.id_usuario_registro,
      estadoInicial,
      data.id_linea_asignada || null,
    ];
    const res = await pool.query(query, values);
    const nueva = res.rows[0];

    await pool.query(
      `INSERT INTO historial_ordenes (id_orden, id_usuario, accion, estado_anterior, estado_nuevo, comentario)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nueva.id, data.id_usuario_registro, 'Registro de Orden', null, estadoInicial, `Orden ${nueva.folio} registrada`]
    );

    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id_usuario_registro,
        'Órdenes',
        `Creación de orden ${nueva.folio}`,
        'ordenes',
        nueva.id,
        JSON.stringify({ folio: nueva.folio, cantidad: nueva.cantidad, estado: estadoInicial }),
        'Captura de orden de producción',
      ]
    );

    return nueva;
  }

  // RF-01: Importación masiva de órdenes de trabajo (JSON o CSV)
  async importarMasivo(
    ordenes: Array<{
      folio: string;
      id_pedido?: number;
      id_cliente: number;
      id_modelo: number;
      id_color: number;
      cantidad: number;
      fecha_compromiso: string;
      id_linea_asignada?: number;
    }>,
    idUsuarioRegistro: number
  ): Promise<Orden[]> {
    const creadas: Orden[] = [];
    for (const item of ordenes) {
      const orden = await this.create({
        ...item,
        id_usuario_registro: idUsuarioRegistro,
      });
      creadas.push(orden);
    }
    return creadas;
  }

  async asignarLinea(idOrden: number, idLinea: number, idUsuario: number): Promise<Orden | null> {
    const prev = await this.getById(idOrden);
    if (!prev) return null;

    const query = `
      UPDATE ordenes
      SET id_linea_asignada = $1,
          id_usuario_asigno = $2,
          fecha_asignacion = CURRENT_TIMESTAMP,
          estado = 'En Proceso'
      WHERE id = $3
      RETURNING *;
    `;
    const res = await pool.query(query, [idLinea, idUsuario, idOrden]);
    const actualizada = res.rows[0] || null;

    if (actualizada) {
      await pool.query(
        `INSERT INTO historial_ordenes (id_orden, id_usuario, accion, estado_anterior, estado_nuevo, comentario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [idOrden, idUsuario, 'Asignación de Línea', prev.estado, 'En Proceso', `Asignada a línea ID ${idLinea}`]
      );

      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          idUsuario,
          'Órdenes',
          `Asignación de orden ${actualizada.folio} a línea ID ${idLinea}`,
          'ordenes',
          idOrden,
          JSON.stringify({ id_linea_asignada: prev.id_linea_asignada, estado: prev.estado }),
          JSON.stringify({ id_linea_asignada: idLinea, estado: 'En Proceso' }),
          'Asignación formal de línea de producción (F-02)',
        ]
      );
    }

    return actualizada;
  }

  async update(
    idOrden: number,
    data: {
      folio?: string;
      id_cliente?: number;
      id_modelo?: number;
      id_color?: number;
      cantidad?: number;
      fecha_compromiso?: string;
      id_linea_asignada?: number | null;
      estado?: string;
      id_usuario: number;
    }
  ): Promise<Orden | null> {
    const prev = await this.getById(idOrden);
    if (!prev) return null;

    const idLinea = data.id_linea_asignada !== undefined ? data.id_linea_asignada : prev.id_linea_asignada;
    const estado = data.estado || (idLinea && prev.estado === 'Programada' ? 'En Proceso' : prev.estado);
    const fechaPrev =
      (prev.fecha_compromiso as unknown) instanceof Date
        ? (prev.fecha_compromiso as unknown as Date).toISOString().slice(0, 10)
        : String(prev.fecha_compromiso).slice(0, 10);
    const fechaCompromiso = data.fecha_compromiso ? String(data.fecha_compromiso).slice(0, 10) : fechaPrev;

    const query = `
      UPDATE ordenes
      SET folio = $1,
          id_cliente = $2,
          id_modelo = $3,
          id_color = $4,
          cantidad = $5,
          fecha_compromiso = $6,
          id_linea_asignada = $7::int,
          estado = $8,
          id_usuario_asigno = CASE WHEN $7::int IS NOT NULL THEN $9::int ELSE id_usuario_asigno END,
          fecha_asignacion = CASE WHEN $7::int IS NOT NULL AND fecha_asignacion IS NULL THEN CURRENT_TIMESTAMP ELSE fecha_asignacion END
      WHERE id = $10
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.folio ?? prev.folio,
      data.id_cliente ?? prev.id_cliente,
      data.id_modelo ?? prev.id_modelo,
      data.id_color ?? prev.id_color,
      data.cantidad ?? prev.cantidad,
      fechaCompromiso,
      idLinea ?? null,
      estado,
      data.id_usuario,
      idOrden,
    ]);
    const actualizada = res.rows[0] || null;

    if (actualizada) {
      await pool.query(
        `INSERT INTO historial_ordenes (id_orden, id_usuario, accion, estado_anterior, estado_nuevo, comentario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [idOrden, data.id_usuario, 'Edición de Orden', prev.estado, estado, `Orden ${actualizada.folio} actualizada`]
      );

      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          data.id_usuario,
          'Órdenes',
          `Edición de orden ${actualizada.folio}`,
          'ordenes',
          idOrden,
          JSON.stringify({
            folio: prev.folio,
            cantidad: prev.cantidad,
            id_linea_asignada: prev.id_linea_asignada,
            estado: prev.estado,
          }),
          JSON.stringify({
            folio: actualizada.folio,
            cantidad: actualizada.cantidad,
            id_linea_asignada: actualizada.id_linea_asignada,
            estado: actualizada.estado,
          }),
          'Actualización de orden de producción',
        ]
      );
    }

    return actualizada;
  }
}
