'use client'
import { useState, useEffect } from 'react'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calculator, Settings, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const REFERENCE_KM = 1000

interface FixedCostInputs {
  insuranceCost: string
  maintenanceCost: string
  officeCost: string
  silviSalary: string
  satelliteCost: string
}

interface FreightCheckInputs {
  freightPrice: string
  kilometers: string
  fuelCost: string
  tollCost: string
  driverPercentage: string
  profitPercentage: string
}

interface NumberFieldConfig<T extends string> {
  id: T
  label: string
}

const fixedCostFields: NumberFieldConfig<keyof FixedCostInputs>[] = [
  { id: 'insuranceCost', label: 'Costo de Seguro ($)' },
  { id: 'maintenanceCost', label: 'Costo de Mantenimiento ($)' },
  { id: 'officeCost', label: 'Costo de Oficina ($)' },
  { id: 'silviSalary', label: 'Sueldo Silvi ($)' },
  { id: 'satelliteCost', label: 'Costo Satelital ($)' },
]

const freightMainFields: NumberFieldConfig<'freightPrice' | 'kilometers'>[] = [
  { id: 'freightPrice', label: 'Precio que ofrecen ($)' },
  { id: 'kilometers', label: 'Kilometros del viaje' },
]

const freightCostFields: NumberFieldConfig<'fuelCost' | 'tollCost'>[] = [
  { id: 'fuelCost', label: 'Costo de Gasoil ($)' },
  { id: 'tollCost', label: 'Costo de Peajes ($)' },
]

const freightPercentageFields: NumberFieldConfig<'driverPercentage' | 'profitPercentage'>[] = [
  { id: 'driverPercentage', label: 'Porcentaje del Chofer (%)' },
  { id: 'profitPercentage', label: 'Porcentaje de Ganancia (%)' },
]

export default function CalcularFletePage() {
  const [fixedCostInputs, setFixedCostInputs] = useState<FixedCostInputs>({
    insuranceCost: '',
    maintenanceCost: '',
    officeCost: '',
    silviSalary: '',
    satelliteCost: '',
  })

  const [freightInputs, setFreightInputs] = useState<FreightCheckInputs>({
    freightPrice: '',
    kilometers: '',
    fuelCost: '',
    tollCost: '',
    driverPercentage: '',
    profitPercentage: '',
  })

  const [costPerKm, setCostPerKm] = useState<number>(0)
  const [editCostPerKm, setEditCostPerKm] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCostResult, setShowCostResult] = useState(false)
  const [showConvenienceResult, setShowConvenienceResult] = useState(false)
  const [calculatedCostPerKm, setCalculatedCostPerKm] = useState<number>(0)
  const [isLoadingCostPerKm, setIsLoadingCostPerKm] = useState(true)
  const [isSavingCostPerKm, setIsSavingCostPerKm] = useState(false)
  const [costPerKmError, setCostPerKmError] = useState('')
  const [canEditCostPerKm, setCanEditCostPerKm] = useState(false)

  const parseInput = (value: string) => {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  useEffect(() => {
    let mounted = true

    async function loadCostPerKm() {
      try {
        const response = await fetch('/api/company/settings', { cache: 'no-store' })
        const body = await response.json() as { freightCostPerKm?: number; canEdit?: boolean; error?: string }
        if (!response.ok) throw new Error(body.error || 'No se pudo cargar el costo por km de la empresa.')
        if (!mounted) return
        setCostPerKm(Number(body.freightCostPerKm ?? 0))
        setCanEditCostPerKm(Boolean(body.canEdit))
      } catch (requestError) {
        if (mounted) setCostPerKmError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el costo por km de la empresa.')
      } finally {
        if (mounted) setIsLoadingCostPerKm(false)
      }
    }

    void loadCostPerKm()
    return () => {
      mounted = false
    }
  }, [])

  const persistCostPerKm = async (value: number) => {
    setCostPerKmError('')
    setIsSavingCostPerKm(true)
    try {
      const response = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freightCostPerKm: value }),
      })
      const body = await response.json() as { freightCostPerKm?: number; error?: string }
      if (!response.ok) throw new Error(body.error || 'No se pudo guardar el costo por km de la empresa.')
      setCostPerKm(Number(body.freightCostPerKm ?? value))
      return true
    } catch (requestError) {
      setCostPerKmError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el costo por km de la empresa.')
      return false
    } finally {
      setIsSavingCostPerKm(false)
    }
  }

  const calculateCostPerKm = () => {
    const insuranceCost = parseInput(fixedCostInputs.insuranceCost)
    const maintenanceCost = parseInput(fixedCostInputs.maintenanceCost)
    const officeCost = parseInput(fixedCostInputs.officeCost)
    const silviSalary = parseInput(fixedCostInputs.silviSalary)
    const satelliteCost = parseInput(fixedCostInputs.satelliteCost)

    const totalFixedCosts =
      insuranceCost +
      maintenanceCost +
      officeCost +
      silviSalary +
      satelliteCost
    const costPerKilometer = totalFixedCosts / REFERENCE_KM
    setCalculatedCostPerKm(costPerKilometer)
    setShowCostResult(true)
  }

  const checkConvenience = () => {
    setShowConvenienceResult(true)
  }

  const freightPrice = parseInput(freightInputs.freightPrice)
  const kilometers = parseInput(freightInputs.kilometers)
  const fuelCost = parseInput(freightInputs.fuelCost)
  const tollCost = parseInput(freightInputs.tollCost)
  const driverPercentage = parseInput(freightInputs.driverPercentage)
  const profitPercentage = parseInput(freightInputs.profitPercentage)
  const baseTripCost = costPerKm * kilometers
  const baseBeforePercentages = baseTripCost + tollCost + fuelCost
  const withDriver = baseBeforePercentages * (1 + driverPercentage / 100)
  const totalCostForFreight = withDriver * (1 + profitPercentage / 100)
  const profit = freightPrice - totalCostForFreight
  const isConvenient = profit > 0 && freightPrice > 0 && kilometers > 0

  const saveCostPerKm = async () => {
    const value = parseFloat(editCostPerKm)
    if (!isNaN(value) && value > 0) {
      if (await persistCostPerKm(value)) setIsModalOpen(false)
    }
  }

  const useCalculatedCost = () => {
    void persistCostPerKm(calculatedCostPerKm)
  }

  const updateFixedCost = (field: keyof FixedCostInputs, value: string) => {
    setFixedCostInputs({ ...fixedCostInputs, [field]: value })
  }

  const updateFreightInput = (field: keyof FreightCheckInputs, value: string) => {
    setFreightInputs({ ...freightInputs, [field]: value })
  }

  return (
    <PageShell>
          <div className="mb-8">
            <Link
              href="/"
              className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  Calcular Flete
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Calcula el costo por kilometro con costos fijos y evalua si un flete es rentable.
                </p>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditCostPerKm(costPerKm.toString())}
                    disabled={isLoadingCostPerKm || !canEditCostPerKm}
                  >
                    <Settings className="h-4 w-4" />
                    {isLoadingCostPerKm ? 'Cargando costo…' : `Costo/km: $${costPerKm.toFixed(2)}`}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Costo por Kilometro</DialogTitle>
                    <DialogDescription>
                      Este valor compartido se guardará para toda la empresa y se usará para calcular si un flete conviene o no.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="costPerKm">Costo por kilometro ($)</Label>
                    <Input
                      id="costPerKm"
                      type="number"
                      step="0.01"
                      value={editCostPerKm}
                      onChange={(e) => setEditCostPerKm(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSavingCostPerKm}>
                      Cancelar
                    </Button>
                    <Button onClick={() => void saveCostPerKm()} disabled={isSavingCostPerKm}>
                      {isSavingCostPerKm ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calculator className="h-5 w-5 text-primary" />
                  Costos Fijos - Costo por Km
                </CardTitle>
                <CardDescription>
                  Ingresa los costos fijos del negocio. Se dividen por {REFERENCE_KM.toLocaleString('es-AR')} km de referencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fixedCostFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type="number"
                      value={fixedCostInputs[field.id]}
                      onChange={(e) => updateFixedCost(field.id, e.target.value)}
                    />
                  </div>
                ))}
                <Button onClick={calculateCostPerKm} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular Costo por Km
                </Button>
                {showCostResult && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Costo por kilometro calculado:</p>
                    <p className="text-3xl font-bold text-primary">${calculatedCostPerKm.toFixed(2)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Suma de costos fijos ÷ {REFERENCE_KM.toLocaleString('es-AR')} km de referencia.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={useCalculatedCost}
                      disabled={isSavingCostPerKm || !canEditCostPerKm}
                    >
                      {isSavingCostPerKm ? 'Guardando…' : 'Usar este valor como Costo/km'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  ¿Conviene este Flete?
                </CardTitle>
                <CardDescription>
                  Precio ofrecido, kilometros, gasoil, peajes y porcentajes para ver si el viaje rinde.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {costPerKm === 0 && !isLoadingCostPerKm && (
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
                    ⚠️ No tenes configurado un costo por km. Calculalo primero a la izquierda o editá el valor manualmente.
                  </div>
                )}
                {freightMainFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type="number"
                      value={freightInputs[field.id]}
                      onChange={(e) => updateFreightInput(field.id, e.target.value)}
                    />
                  </div>
                ))}
                <div className="grid gap-4 sm:grid-cols-2">
                  {freightCostFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type="number"
                        value={freightInputs[field.id]}
                        onChange={(e) => updateFreightInput(field.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {freightPercentageFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type="number"
                        value={freightInputs[field.id]}
                        onChange={(e) => updateFreightInput(field.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Costo por km actual:</p>
                  <p className="text-xl font-bold text-foreground">${costPerKm.toFixed(2)}</p>
                </div>
                {costPerKmError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{costPerKmError}</p>}
                <Button
                  onClick={checkConvenience}
                  className="w-full"
                  disabled={costPerKm === 0}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Verificar si Conviene
                </Button>
                {showConvenienceResult &&
                  freightPrice > 0 &&
                  kilometers > 0 && (
                    <div
                      className={`mt-4 rounded-lg border p-4 ${
                        isConvenient
                          ? 'border-success/20 bg-success/5'
                          : 'border-destructive/20 bg-destructive/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isConvenient ? (
                          <CheckCircle className="h-6 w-6 text-success" />
                        ) : (
                          <XCircle className="h-6 w-6 text-destructive" />
                        )}
                        <p
                          className={`text-lg font-bold ${isConvenient ? 'text-success' : 'text-destructive'}`}
                        >
                          {isConvenient ? '¡Si conviene!' : 'No conviene'}
                        </p>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Costo base ({kilometers} km × ${costPerKm.toFixed(2)}):
                          </span>
                          <span className="font-medium text-foreground">
                            ${baseTripCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">+ Gasoil:</span>
                          <span className="font-medium text-foreground">
                            ${fuelCost.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">+ Peajes:</span>
                          <span className="font-medium text-foreground">
                            ${tollCost.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            + Chofer ({driverPercentage}%):
                          </span>
                          <span className="font-medium text-foreground">
                            ${(withDriver - baseBeforePercentages).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            + Ganancia ({profitPercentage}%):
                          </span>
                          <span className="font-medium text-foreground">
                            ${(totalCostForFreight - withDriver).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="font-medium text-muted-foreground">Costo total del viaje:</span>
                          <span className="font-bold text-foreground">
                            ${totalCostForFreight.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio ofrecido:</span>
                          <span className="font-medium text-foreground">
                            ${freightPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">
                              {isConvenient ? 'Ganancia:' : 'Perdida:'}
                            </span>
                            <span
                              className={`font-bold ${isConvenient ? 'text-success' : 'text-destructive'}`}
                            >
                              ${Math.abs(profit).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
    </PageShell>
  )
}
