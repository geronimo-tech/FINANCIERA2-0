'use client'

import type { Prestamo, PrestamoFormData, PagoMensual, ConfiguracionRecordatorio } from './types'

const STORAGE_KEY = 'sofin_prestamos'
const RECORDATORIO_KEY = 'sofin_recordatorio'

export function getPrestamos(): Prestamo[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function savePrestamos(prestamos: Prestamo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prestamos))
}

// Helper function to get the last day of a month
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Generar fechas de cobro mensuales a partir de la fecha de solicitud
function generarPagosMensuales(fechaSolicitud: string, montoInteresMensual: number, meses: number = 12): PagoMensual[] {
  const pagos: PagoMensual[] = []
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = fechaSolicitud.split('-').map(Number)
  const diaOriginal = day // Preserve the original day
  
  for (let i = 1; i <= meses; i++) {
    // Calculate the target month and year
    let targetMonth = month - 1 + i // month is 1-indexed, JS months are 0-indexed
    let targetYear = year
    
    // Handle year overflow
    while (targetMonth > 11) {
      targetMonth -= 12
      targetYear++
    }
    
    // Get the last day of the target month
    const lastDayOfMonth = getLastDayOfMonth(targetYear, targetMonth)
    
    // Use the original day, or the last day of the month if it doesn't exist
    const targetDay = Math.min(diaOriginal, lastDayOfMonth)
    
    // Format as YYYY-MM-DD
    const yyyy = targetYear
    const mm = String(targetMonth + 1).padStart(2, '0')
    const dd = String(targetDay).padStart(2, '0')
    
    pagos.push({
      id: crypto.randomUUID(),
      mes: i,
      fechaCobro: `${yyyy}-${mm}-${dd}`,
      montoCobro: montoInteresMensual,
      pagado: false,
      fechaPago: null,
      notas: null,
    })
  }
  
  return pagos
}

export function createPrestamo(formData: PrestamoFormData): Prestamo {
  // Calcular interes mensual (tasa viene como porcentaje, ej: 20 = 20%)
  const tasaDecimal = formData.tasaInteres / 100
  const montoInteresMensual = formData.montoCapital * tasaDecimal

  const prestamo: Prestamo = {
    id: crypto.randomUUID(),
    nombreCliente: formData.nombreCliente,
    fechaSolicitud: formData.fechaSolicitud,
    montoCapital: formData.montoCapital,
    tasaInteres: formData.tasaInteres,
    montoInteresMensual,
    fotoINE: formData.fotoINE,
    domicilio: formData.domicilio,
    telefono: formData.telefono,
    estado: 'activo',
    pagosMensuales: generarPagosMensuales(formData.fechaSolicitud, montoInteresMensual),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const prestamos = getPrestamos()
  prestamos.unshift(prestamo)
  savePrestamos(prestamos)

  return prestamo
}

export function updatePrestamo(id: string, updates: Partial<Prestamo>): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === id)

  if (index === -1) return null

  const updatedPrestamo = {
    ...prestamos[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  // Recalcular interes mensual si cambia el capital o la tasa
  if (updates.montoCapital !== undefined || updates.tasaInteres !== undefined) {
    const capital = updates.montoCapital ?? prestamos[index].montoCapital
    const tasa = updates.tasaInteres ?? prestamos[index].tasaInteres
    const nuevoInteresMensual = capital * (tasa / 100)
    updatedPrestamo.montoInteresMensual = nuevoInteresMensual
    updatedPrestamo.montoCapital = capital
    updatedPrestamo.tasaInteres = tasa
    
    // Actualizar todos los pagos pendientes con el nuevo monto de interes
    updatedPrestamo.pagosMensuales = updatedPrestamo.pagosMensuales.map((pago) => {
      if (!pago.pagado) {
        return {
          ...pago,
          montoCobro: nuevoInteresMensual,
        }
      }
      return pago
    })
  }

  prestamos[index] = updatedPrestamo
  savePrestamos(prestamos)

  return updatedPrestamo
}

export function deletePrestamo(id: string): boolean {
  const prestamos = getPrestamos()
  const filtered = prestamos.filter((p) => p.id !== id)

  if (filtered.length === prestamos.length) return false

  savePrestamos(filtered)
  return true
}

export function getPrestamoById(id: string): Prestamo | null {
  const prestamos = getPrestamos()
  return prestamos.find((p) => p.id === id) ?? null
}

export function getEstadisticas() {
  const prestamos = getPrestamos()

  const totalCapital = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((sum, p) => sum + p.montoCapital, 0)

  const totalInteresesMensuales = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((sum, p) => sum + p.montoInteresMensual, 0)

  // Calcular pagos pendientes del mes actual
  const hoy = new Date()
  const mesActual = hoy.getMonth()
  const anioActual = hoy.getFullYear()
  
  let pagosPendientesEsteMes = 0
  let pagosCompletadosEsteMes = 0
  
  prestamos.filter((p) => p.estado === 'activo').forEach((p) => {
    p.pagosMensuales.forEach((pago) => {
      // Parse date as local time to avoid timezone issues
      const [year, month, day] = pago.fechaCobro.split('-').map(Number)
      const fechaCobro = new Date(year, month - 1, day)
      if (fechaCobro.getMonth() === mesActual && fechaCobro.getFullYear() === anioActual) {
        if (pago.pagado) {
          pagosCompletadosEsteMes++
        } else {
          pagosPendientesEsteMes++
        }
      }
    })
  })

  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo').length
  const prestamosPagados = prestamos.filter((p) => p.estado === 'pagado').length

  return {
    totalCapital,
    totalInteresesMensuales,
    pagosPendientesEsteMes,
    pagosCompletadosEsteMes,
    prestamosActivos,
    prestamosPagados,
    totalPrestamos: prestamos.length,
  }
}

// Marcar pago mensual como pagado o pendiente
export function marcarPagoMensual(prestamoId: string, pagoId: string, pagado: boolean, notas?: string): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const pagoIndex = prestamo.pagosMensuales.findIndex((p) => p.id === pagoId)
  
  if (pagoIndex === -1) return null

  prestamo.pagosMensuales[pagoIndex] = {
    ...prestamo.pagosMensuales[pagoIndex],
    pagado,
    fechaPago: pagado ? new Date().toISOString().split('T')[0] : null,
    notas: notas || prestamo.pagosMensuales[pagoIndex].notas,
  }

  // Verificar si todos los pagos estan completos y el capital fue devuelto
  const todosPagados = prestamo.pagosMensuales.every((p) => p.pagado)
  if (todosPagados) {
    prestamo.estado = 'pagado'
  }

  prestamo.updatedAt = new Date().toISOString()
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Agregar mas meses de pago
export function agregarMesesPago(prestamoId: string, meses: number): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)
  
  if (index === -1) return null
  
  const prestamo = prestamos[index]
  const ultimoPago = prestamo.pagosMensuales[prestamo.pagosMensuales.length - 1]
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = ultimoPago.fechaCobro.split('-').map(Number)
  
  // Get the original day from the first payment to maintain consistency
  const primerPago = prestamo.pagosMensuales[0]
  const [, , diaOriginal] = primerPago.fechaCobro.split('-').map(Number)
  
  const ultimoMes = ultimoPago.mes
  
  for (let i = 1; i <= meses; i++) {
    // Calculate the target month and year from the last payment
    let targetMonth = month - 1 + i // month is 1-indexed, JS months are 0-indexed
    let targetYear = year
    
    // Handle year overflow
    while (targetMonth > 11) {
      targetMonth -= 12
      targetYear++
    }
    
    // Get the last day of the target month
    const lastDayOfMonth = getLastDayOfMonth(targetYear, targetMonth)
    
    // Use the original day, or the last day of the month if it doesn't exist
    const targetDay = Math.min(diaOriginal, lastDayOfMonth)
    
    // Format as YYYY-MM-DD
    const yyyy = targetYear
    const mm = String(targetMonth + 1).padStart(2, '0')
    const dd = String(targetDay).padStart(2, '0')
  
  prestamo.pagosMensuales.push({
  id: crypto.randomUUID(),
  mes: ultimoMes + i,
  fechaCobro: `${yyyy}-${mm}-${dd}`,
      montoCobro: prestamo.montoInteresMensual,
      pagado: false,
      fechaPago: null,
      notas: null,
    })
  }

  prestamo.updatedAt = new Date().toISOString()
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Modificar monto de un pago especifico (para atrasos, cargos extra, etc)
export function modificarMontoPago(prestamoId: string, pagoId: string, nuevoMonto: number): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const pagoIndex = prestamo.pagosMensuales.findIndex((p) => p.id === pagoId)
  
  if (pagoIndex === -1) return null

  prestamo.pagosMensuales[pagoIndex].montoCobro = nuevoMonto
  prestamo.updatedAt = new Date().toISOString()
  
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Obtener pagos pendientes para recordatorios
export function getPagosPendientesHoy(): { prestamo: Prestamo; pago: PagoMensual }[] {
  const prestamos = getPrestamos()
  const hoy = new Date().toISOString().split('T')[0]
  const pendientes: { prestamo: Prestamo; pago: PagoMensual }[] = []

  prestamos.filter((p) => p.estado === 'activo').forEach((prestamo) => {
    prestamo.pagosMensuales.forEach((pago) => {
      if (!pago.pagado && pago.fechaCobro <= hoy) {
        pendientes.push({ prestamo, pago })
      }
    })
  })

  return pendientes
}

// Configuracion de recordatorios
export function getConfiguracionRecordatorio(): ConfiguracionRecordatorio {
  if (typeof window === 'undefined') return { hora: '09:00', activo: false }
  const data = localStorage.getItem(RECORDATORIO_KEY)
  return data ? JSON.parse(data) : { hora: '09:00', activo: false }
}

export function saveConfiguracionRecordatorio(config: ConfiguracionRecordatorio): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECORDATORIO_KEY, JSON.stringify(config))
}
