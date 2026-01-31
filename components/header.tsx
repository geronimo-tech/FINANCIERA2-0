'use client'

import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
            width={50}
            height={50}
            className="h-12 w-12 object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground">FINANCIERA</h1>
            <p className="text-xs text-muted-foreground">FERNÁNDEZ Y ASOCIADOS</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/">Inicio</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/prestamos">Préstamos</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/nuevo">Nuevo Préstamo</Link>
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="flex flex-col p-4">
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/">Inicio</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/prestamos">Préstamos</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/nuevo">Nuevo Préstamo</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
