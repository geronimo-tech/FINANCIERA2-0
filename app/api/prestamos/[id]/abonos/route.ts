import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await pool.query(`
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
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching abonos:', error)
    return NextResponse.json({ error: 'Error al obtener abonos' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const { id } = await params
    const data = await request.json()
    
    await client.query('BEGIN')
    
    // Insert the abono
    const abonoResult = await client.query(`
      INSERT INTO abonos (prestamo_id, monto, fecha_abono, tipo, notas)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        prestamo_id as "prestamoId",
        monto,
        fecha_abono as "fechaAbono",
        tipo,
        notas,
        created_at as "createdAt"
    `, [id, data.monto, data.fechaAbono, data.tipo || 'efectivo', data.notas || null])
    
    // Update saldo_pendiente in prestamos
    const updateResult = await client.query(`
      UPDATE prestamos 
      SET 
        saldo_pendiente = saldo_pendiente - $1,
        estado = CASE 
          WHEN saldo_pendiente - $1 <= 0 THEN 'pagado'
          ELSE estado 
        END,
        updated_at = NOW()
      WHERE id = $2
      RETURNING saldo_pendiente as "saldoPendiente", estado
    `, [data.monto, id])
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Prestamo no encontrado' }, { status: 404 })
    }
    
    await client.query('COMMIT')
    
    return NextResponse.json({
      abono: abonoResult.rows[0],
      saldoPendiente: updateResult.rows[0].saldoPendiente,
      estado: updateResult.rows[0].estado
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating abono:', error)
    return NextResponse.json({ error: 'Error al registrar abono' }, { status: 500 })
  } finally {
    client.release()
  }
}
