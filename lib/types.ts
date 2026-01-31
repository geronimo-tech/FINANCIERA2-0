export interface PagoMensual {
  id: string
  mes: number // 1, 2, 3...
  fechaCobro: string
  montoCobro: number // Interes mensual
  pagado: boolean
  fechaPago: string | null
  notas: string | null
}

export interface Prestamo {
  id: string
  nombreCliente: string
  fechaSolicitud: string
  montoCapital: number
  tasaInteres: number // Porcentaje (ej: 20 = 20%)
  montoInteresMensual: number
  fotoINE: string | null
  domicilio: string
  telefono: string
  estado: 'activo' | 'pagado'
  pagosMensuales: PagoMensual[]
  createdAt: string
  updatedAt: string
}

export interface PrestamoFormData {
  nombreCliente: string
  fechaSolicitud: string
  montoCapital: number
  tasaInteres: number // Porcentaje (ej: 20)
  fotoINE: string | null
  domicilio: string
  telefono: string
}

export interface ConfiguracionRecordatorio {
  hora: string // HH:mm format
  activo: boolean
}
