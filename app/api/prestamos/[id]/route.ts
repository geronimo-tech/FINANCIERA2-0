import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get prestamo
    const prestamoResult = await pool.query(`
      SELECT 
        id,
        nombre_cliente as "nombreCliente",
        telefono,
        domicilio,
        foto_ine as "fotoINE",
        fecha_solicitud as "fechaSolicitud",
        fecha_cobro as "fechaCobroInteres",
        monto_capital as "montoCapital",
        tasa_interes as "tasaInteres",
        monto_interes as "montoInteres",
        monto_total as "montoTotal",
        saldo_pendiente as "saldoPendiente",
        estado,
        notas,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM prestamos 
      WHERE id = $1
    `, [id])
    
    if (prestamoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Prestamo no encontrado' }, { status: 404 })
    }
    
    // Get abonos for this prestamo
    const abonosResult = await pool.query(`
      SELECT 
        id,
        prestamo_id as "prestamoId",
        monto,
        fecha_abono as "fechaAbono",
        tipo,
        notas,
        created_at as "createdAt"
      FROM abonos 
      WHERE prestamo_id = $1
      ORDER BY fecha_abono DESC, created_at DESC
    `, [id])
    
    const prestamo = {
      ...prestamoResult.rows[0],
      abonos: abonosResult.rows
    }
    
    return NextResponse.json(prestamo)
  } catch (error) {
    console.error('Error fetching prestamo:', error)
    return NextResponse.json({ error: 'Error al obtener prestamo' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1
    
    if (data.estado !== undefined) {
      updates.push(`estado = $${paramIndex++}`)
      values.push(data.estado)
    }
    
    if (data.saldoPendiente !== undefined) {
      updates.push(`saldo_pendiente = $${paramIndex++}`)
      values.push(data.saldoPendiente)
    }
    
    if (data.notas !== undefined) {
      updates.push(`notas = $${paramIndex++}`)
      values.push(data.notas)
    }
    
    updates.push(`updated_at = NOW()`)
    values.push(id)
    
    const result = await pool.query(`
      UPDATE prestamos 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        nombre_cliente as "nombreCliente",
        telefono,
        domicilio,
        foto_ine as "fotoINE",
        fecha_solicitud as "fechaSolicitud",
        fecha_cobro as "fechaCobroInteres",
        monto_capital as "montoCapital",
        tasa_interes as "tasaInteres",
        monto_interes as "montoInteres",
        monto_total as "montoTotal",
        saldo_pendiente as "saldoPendiente",
        estado,
        notas,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Prestamo no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating prestamo:', error)
    return NextResponse.json({ error: 'Error al actualizar prestamo' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await pool.query('DELETE FROM prestamos WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Prestamo no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting prestamo:', error)
    return NextResponse.json({ error: 'Error al eliminar prestamo' }, { status: 500 })
  }
}
