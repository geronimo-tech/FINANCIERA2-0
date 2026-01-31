'use client'

import React from "react"

import { Calculator, Camera, MapPin, Phone, User, Calendar, Percent } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import type { PrestamoFormData } from '@/lib/types'
import { createPrestamo } from '@/lib/prestamos-store'

export function PrestamoForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<PrestamoFormData>({
    nombreCliente: '',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    montoCapital: 0,
    tasaInteres: 20, // Por defecto 20%
    fotoINE: null,
    domicilio: '',
    telefono: '',
  })

  const [previewINE, setPreviewINE] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcular interes mensual (tasa como porcentaje)
  const montoInteresMensual = formData.montoCapital * (formData.tasaInteres / 100)

  const handleChange = useCallback((field: keyof PrestamoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreviewINE(base64)
      setFormData((prev) => ({ ...prev, fotoINE: base64 }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const prestamo = createPrestamo(formData)
      router.push(`/prestamos/${prestamo.id}`)
    } catch (error) {
      console.error('Error al crear prestamo:', error)
      setIsSubmitting(false)
    }
  }, [formData, router])

  // Calcular proximas fechas de cobro
  const proximasFechas = () => {
    const fechas: string[] = []
    // Parse the date as local time to avoid timezone issues
    const [year, month, day] = formData.fechaSolicitud.split('-').map(Number)
    const diaOriginal = day
    
    for (let i = 1; i <= 3; i++) {
      // Calculate the target month and year
      let targetMonth = month - 1 + i // month is 1-indexed, JS months are 0-indexed
      let targetYear = year
      
      // Handle year overflow
      while (targetMonth > 11) {
        targetMonth -= 12
        targetYear++
      }
      
      // Get the last day of the target month
      const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      
      // Use the original day, or the last day of the month if it doesn't exist
      const targetDay = Math.min(diaOriginal, lastDayOfMonth)
      
      const fecha = new Date(targetYear, targetMonth, targetDay)
      fechas.push(fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }))
    }
    return fechas
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCliente">Nombre Completo del Cliente</Label>
            <Input
              id="nombreCliente"
              placeholder="Ej: Juan Perez Garcia"
              value={formData.nombreCliente}
              onChange={(e) => handleChange('nombreCliente', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="telefono"
                type="tel"
                placeholder="55 1234 5678"
                className="pl-10"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domicilio">Domicilio</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="domicilio"
                placeholder="Calle, numero, colonia, ciudad, estado"
                className="min-h-[80px] pl-10"
                value={formData.domicilio}
                onChange={(e) => handleChange('domicilio', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto de INE</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-primary hover:bg-muted/50 active:bg-muted/70"
              >
                {previewINE ? (
                  <div className="relative w-full">
                    <img
                      src={previewINE || "/placeholder.svg"}
                      alt="Vista previa INE"
                      className="max-h-48 w-full rounded-lg object-contain"
                    />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Toca para cambiar la imagen
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Subir Foto o Archivo</p>
                    <p className="text-xs text-muted-foreground text-center">
                      Toca para tomar foto, seleccionar imagen o archivo
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                    }
                  }}
                >
                  Galeria
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment')
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Camera className="mr-1 h-4 w-4" />
                  Camara
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Fecha del Prestamo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fechaSolicitud">Fecha de Solicitud</Label>
            <Input
              id="fechaSolicitud"
              type="date"
              value={formData.fechaSolicitud}
              onChange={(e) => handleChange('fechaSolicitud', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              El cobro sera cada mes a partir de esta fecha
            </p>
          </div>
          
          {formData.fechaSolicitud && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground mb-2">Proximas fechas de cobro:</p>
              <div className="flex flex-wrap gap-2">
                {proximasFechas().map((fecha, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Mes {i + 1}: {fecha}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  ...y asi sucesivamente
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Calculo del Prestamo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="montoCapital">Monto del Capital</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="montoCapital"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="10000"
                  className="pl-8"
                  value={formData.montoCapital || ''}
                  onChange={(e) => handleChange('montoCapital', Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasaInteres">Tasa de Interes (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tasaInteres"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="20"
                  className="pl-10"
                  value={formData.tasaInteres || ''}
                  onChange={(e) => handleChange('tasaInteres', Number(e.target.value))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ejemplo: 20 = 20% mensual
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capital prestado:</span>
              <span className="font-medium text-foreground">{formatCurrency(formData.montoCapital)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tasa de interes:
              </span>
              <span className="font-medium text-foreground">
                {formData.tasaInteres}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interes mensual:</span>
              <span className="font-medium text-foreground">{formatCurrency(montoInteresMensual)}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total a cobrar (Capital + Interes):</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(formData.montoCapital + montoInteresMensual)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                El interes de {formatCurrency(montoInteresMensual)} se cobra cada mes hasta que devuelva el capital de {formatCurrency(formData.montoCapital)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || !formData.nombreCliente || !formData.montoCapital}
      >
        {isSubmitting ? 'Guardando...' : 'Registrar Prestamo'}
      </Button>
    </form>
  )
}
