'use client'

import { Banknote, CheckCircle, Clock, TrendingUp, Users, Wallet, Bell, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { StatCard } from './stat-card'
import { PrestamoCard } from './prestamo-card'
import { ListaMensual } from './lista-mensual'
import { formatCurrency, formatDate } from '@/lib/format'
import { 
  getEstadisticas, 
  getPrestamos, 
  getPagosPendientesHoy,
  getConfiguracionRecordatorio,
  saveConfiguracionRecordatorio,
} from '@/lib/prestamos-store'
import type { Prestamo, ConfiguracionRecordatorio, PagoMensual } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalCapital: 0,
    totalInteresesMensuales: 0,
    pagosPendientesEsteMes: 0,
    pagosCompletadosEsteMes: 0,
    prestamosActivos: 0,
    prestamosPagados: 0,
    totalPrestamos: 0,
  })
  const [recentPrestamos, setRecentPrestamos] = useState<Prestamo[]>([])
  const [pagosPendientes, setPagosPendientes] = useState<{ prestamo: Prestamo; pago: PagoMensual }[]>([])
  const [configRecordatorio, setConfigRecordatorio] = useState<ConfiguracionRecordatorio>({ hora: '09:00', activo: false })
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const estadisticas = getEstadisticas()
    const prestamos = getPrestamos().slice(0, 6)
    const pendientes = getPagosPendientesHoy()
    const config = getConfiguracionRecordatorio()
    
    setStats(estadisticas)
    setRecentPrestamos(prestamos)
    setPagosPendientes(pendientes)
    setConfigRecordatorio(config)
    setIsLoading(false)
  }, [])

  const handleSaveConfig = () => {
    saveConfiguracionRecordatorio(configRecordatorio)
    setConfigDialogOpen(false)
    
    // Mostrar notificacion de ejemplo si esta activo
    if (configRecordatorio.activo && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Recordatorios Activados', {
            body: `Recibiras recordatorios a las ${configRecordatorio.hora}`,
            icon: '/favicon.ico',
          })
        }
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Configuracion de Recordatorios */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-foreground">Panel de Control</h2>
        <div className="flex items-center gap-2">
          <ListaMensual />
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Bell className="mr-2 h-4 w-4" />
                Recordatorios
                {configRecordatorio.activo && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Recordatorios</DialogTitle>
                <DialogDescription>
                  Configura la hora a la que deseas recibir recordatorios de los cobros pendientes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="activo">Activar recordatorios</Label>
                  <Button
                    variant={configRecordatorio.activo ? "default" : "outline"}
                    size="sm"
                    className={cn(!configRecordatorio.activo && "bg-transparent")}
                    onClick={() => setConfigRecordatorio(prev => ({ ...prev, activo: !prev.activo }))}
                  >
                    {configRecordatorio.activo ? 'Activado' : 'Desactivado'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora del recordatorio</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={configRecordatorio.hora}
                    onChange={(e) => setConfigRecordatorio(prev => ({ ...prev, hora: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibiras una notificacion a esta hora con los cobros pendientes del dia.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="bg-transparent">
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas de Pagos Pendientes */}
      {pagosPendientes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Bell className="h-5 w-5" />
              Cobros Pendientes ({pagosPendientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pagosPendientes.slice(0, 5).map(({ prestamo, pago }) => (
                <Link 
                  key={`${prestamo.id}-${pago.id}`}
                  href={`/prestamos/${prestamo.id}`}
                  className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">{prestamo.nombreCliente}</p>
                    <p className="text-xs text-muted-foreground">
                      Mes {pago.mes} - Vence: {formatDate(pago.fechaCobro)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(pago.montoCobro)}</p>
                    <p className="text-xs text-muted-foreground">{prestamo.telefono}</p>
                  </div>
                </Link>
              ))}
              {pagosPendientes.length > 5 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  y {pagosPendientes.length - 5} mas...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Capital Prestado"
          value={formatCurrency(stats.totalCapital)}
          icon={Wallet}
          variant="primary"
        />
        <StatCard
          title="Intereses Mensuales"
          value={formatCurrency(stats.totalInteresesMensuales)}
          icon={TrendingUp}
          variant="secondary"
        />
        <StatCard
          title="Cobros Pendientes"
          value={pagosPendientes.length.toString()}
          icon={Clock}
          variant={pagosPendientes.length > 0 ? "destructive" : "default"}
          description="Vencidos o por cobrar"
        />
        <StatCard
          title="Prestamos Activos"
          value={stats.prestamosActivos.toString()}
          icon={Users}
          description={`${stats.prestamosPagados} liquidados de ${stats.totalPrestamos} total`}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Prestamos Recientes</h2>
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/prestamos">Ver Todos</Link>
          </Button>
        </div>

        {recentPrestamos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-16">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Sin prestamos registrados</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comienza registrando tu primer prestamo
            </p>
            <Button asChild>
              <Link href="/nuevo">Registrar Prestamo</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPrestamos.map((prestamo) => (
              <PrestamoCard key={prestamo.id} prestamo={prestamo} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
