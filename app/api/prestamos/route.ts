import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
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
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching prestamos:', error)
    return NextResponse.json({ error: 'Error al obtener prestamos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const montoInteres = data.montoCapital * data.tasaInteres
    const montoTotal = data.montoCapital + montoInteres
    
    const result = await pool.query(`
      INSERT INTO prestamos (
        nombre_cliente, telefono, domicilio, foto_ine,
        fecha_solicitud, fecha_cobro, monto_capital,
        tasa_interes, monto_interes, monto_total, saldo_pendiente,
        estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
    `, [
      data.nombreCliente,
      data.telefono,
      data.domicilio,
      data.fotoINE,
      data.fechaSolicitud,
      data.fechaCobroInteres,
      data.montoCapital,
      data.tasaInteres,
      montoInteres,
      montoTotal,
      montoTotal, // saldo_pendiente initial = montoTotal
      'activo',
      data.notas || null
    ])
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating prestamo:', error)
    return NextResponse.json({ error: 'Error al crear prestamo' }, { status: 500 })
  }
}
