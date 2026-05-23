'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Calculator, Settings, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const COST_PER_KM_KEY = 'translogix_cost_per_km'
const REFERENCE_KM = 1000

interface FixedCostInputs {
  insuranceCost: number
  maintenanceCost: number
  officeCost: number
  silviSalary: number
  satelliteCost: number
}

interface FreightCheckInputs {
  freightPrice: number
  kilometers: number
  fuelCost: number
  tollCost: number
  driverPercentage: number
  profitPercentage: number
}

export default function CalcularFletePage() {
  const [fixedCostInputs, setFixedCostInputs] = useState<FixedCostInputs>({
    insuranceCost: 5000,
    maintenanceCost: 3000,
    officeCost: 0,
    silviSalary: 0,
    satelliteCost: 0,
  })

  const [freightInputs, setFreightInputs] = useState<FreightCheckInputs>({
    freightPrice: 0,
    kilometers: 0,
    fuelCost: 0,
    tollCost: 0,
    driverPercentage: 30,
    profitPercentage: 15,
  })

  const [costPerKm, setCostPerKm] = useState<number>(0)
  const [editCostPerKm, setEditCostPerKm] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCostResult, setShowCostResult] = useState(false)
  const [showConvenienceResult, setShowConvenienceResult] = useState(false)
  const [calculatedCostPerKm, setCalculatedCostPerKm] = useState<number>(0)

  useEffect(() => {
    const saved = localStorage.getItem(COST_PER_KM_KEY)
    if (saved) {
      setCostPerKm(parseFloat(saved))
    }
  }, [])

  const calculateCostPerKm = () => {
    const {
      insuranceCost,
      maintenanceCost,
      officeCost,
      silviSalary,
      satelliteCost,
    } = fixedCostInputs

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

  const baseTripCost = costPerKm * freightInputs.kilometers
  const baseBeforePercentages =
    baseTripCost + freightInputs.tollCost + freightInputs.fuelCost
  const withDriver = baseBeforePercentages * (1 + freightInputs.driverPercentage / 100)
  const totalCostForFreight = withDriver * (1 + freightInputs.profitPercentage / 100)
  const profit = freightInputs.freightPrice - totalCostForFreight
  const isConvenient =
    profit > 0 &&
    freightInputs.freightPrice > 0 &&
    freightInputs.kilometers > 0

  const saveCostPerKm = () => {
    const value = parseFloat(editCostPerKm)
    if (!isNaN(value) && value > 0) {
      setCostPerKm(value)
      localStorage.setItem(COST_PER_KM_KEY, value.toString())
      setIsModalOpen(false)
    }
  }

  const useCalculatedCost = () => {
    setCostPerKm(calculatedCostPerKm)
    localStorage.setItem(COST_PER_KM_KEY, calculatedCostPerKm.toString())
  }

  const updateFixedCost = (field: keyof FixedCostInputs, value: string) => {
    setFixedCostInputs({ ...fixedCostInputs, [field]: parseFloat(value) || 0 })
  }

  const updateFreightInput = (field: keyof FreightCheckInputs, value: string) => {
    setFreightInputs({ ...freightInputs, [field]: parseFloat(value) || 0 })
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
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
                  Calculá el costo por kilómetro con costos fijos y evaluá si un flete es rentable.
                </p>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditCostPerKm(costPerKm.toString())}
                  >
                    <Settings className="h-4 w-4" />
                    Costo/km: ${costPerKm.toFixed(2)}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Costo por Kilómetro</DialogTitle>
                    <DialogDescription>
                      Este valor se guardará y se usará para calcular si un flete conviene o no.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="costPerKm">Costo por kilómetro ($)</Label>
                    <Input
                      id="costPerKm"
                      type="number"
                      step="0.01"
                      value={editCostPerKm}
                      onChange={(e) => setEditCostPerKm(e.target.value)}
                      className="mt-2"
                      placeholder="Ej: 125.50"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveCostPerKm}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Izquierda: costos fijos → costo por km */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calculator className="h-5 w-5 text-primary" />
                  Costos Fijos — Costo por Km
                </CardTitle>
                <CardDescription>
                  Ingresá los costos fijos del negocio. Se dividen por {REFERENCE_KM.toLocaleString('es-AR')} km de referencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCost">Costo de Seguro ($)</Label>
                  <Input
                    id="insuranceCost"
                    type="number"
                    value={fixedCostInputs.insuranceCost || ''}
                    onChange={(e) => updateFixedCost('insuranceCost', e.target.value)}
                    placeholder="Ej: 5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceCost">Costo de Mantenimiento ($)</Label>
                  <Input
                    id="maintenanceCost"
                    type="number"
                    value={fixedCostInputs.maintenanceCost || ''}
                    onChange={(e) => updateFixedCost('maintenanceCost', e.target.value)}
                    placeholder="Ej: 3000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officeCost">Costo de Oficina ($)</Label>
                  <Input
                    id="officeCost"
                    type="number"
                    value={fixedCostInputs.officeCost || ''}
                    onChange={(e) => updateFixedCost('officeCost', e.target.value)}
                    placeholder="Ej: 15000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="silviSalary">Sueldo Silvi ($)</Label>
                  <Input
                    id="silviSalary"
                    type="number"
                    value={fixedCostInputs.silviSalary || ''}
                    onChange={(e) => updateFixedCost('silviSalary', e.target.value)}
                    placeholder="Ej: 450000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="satelliteCost">Costo Satelital ($)</Label>
                  <Input
                    id="satelliteCost"
                    type="number"
                    value={fixedCostInputs.satelliteCost || ''}
                    onChange={(e) => updateFixedCost('satelliteCost', e.target.value)}
                    placeholder="Ej: 12000"
                  />
                </div>

                <Button onClick={calculateCostPerKm} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular Costo por Km
                </Button>

                {showCostResult && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Costo por kilómetro calculado:</p>
                    <p className="text-3xl font-bold text-primary">${calculatedCostPerKm.toFixed(2)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Suma de costos fijos ÷ {REFERENCE_KM.toLocaleString('es-AR')} km de referencia.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={useCalculatedCost}
                    >
                      Usar este valor como Costo/km
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Derecha: evaluación del flete */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  ¿Conviene este Flete?
                </CardTitle>
                <CardDescription>
                  Precio ofrecido, kilómetros, gasoil, peajes y porcentajes para ver si el viaje rinde.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {costPerKm === 0 && (
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
                    ⚠️ No tenés configurado un costo por km. Calculalo primero a la izquierda o editá el valor manualmente.
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="freightPrice">Precio que ofrecen ($)</Label>
                  <Input
                    id="freightPrice"
                    type="number"
                    value={freightInputs.freightPrice || ''}
                    onChange={(e) => updateFreightInput('freightPrice', e.target.value)}
                    placeholder="Ej: 150000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kilometers">Kilómetros del viaje</Label>
                  <Input
                    id="kilometers"
                    type="number"
                    value={freightInputs.kilometers || ''}
                    onChange={(e) => updateFreightInput('kilometers', e.target.value)}
                    placeholder="Ej: 800"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fuelCost">Costo de Gasoil ($)</Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      value={freightInputs.fuelCost || ''}
                      onChange={(e) => updateFreightInput('fuelCost', e.target.value)}
                      placeholder="Ej: 25000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tollCost">Costo de Peajes ($)</Label>
                    <Input
                      id="tollCost"
                      type="number"
                      value={freightInputs.tollCost || ''}
                      onChange={(e) => updateFreightInput('tollCost', e.target.value)}
                      placeholder="Ej: 8000"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="driverPercentage">Porcentaje del Chofer (%)</Label>
                    <Input
                      id="driverPercentage"
                      type="number"
                      value={freightInputs.driverPercentage || ''}
                      onChange={(e) => updateFreightInput('driverPercentage', e.target.value)}
                      placeholder="Ej: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitPercentage">Porcentaje de Ganancia (%)</Label>
                    <Input
                      id="profitPercentage"
                      type="number"
                      value={freightInputs.profitPercentage || ''}
                      onChange={(e) => updateFreightInput('profitPercentage', e.target.value)}
                      placeholder="Ej: 15"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Costo por km actual:</p>
                  <p className="text-xl font-bold text-foreground">${costPerKm.toFixed(2)}</p>
                </div>

                <Button
                  onClick={checkConvenience}
                  className="w-full"
                  disabled={costPerKm === 0}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Verificar si Conviene
                </Button>

                {showConvenienceResult &&
                  freightInputs.freightPrice > 0 &&
                  freightInputs.kilometers > 0 && (
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
                          {isConvenient ? '¡Sí conviene!' : 'No conviene'}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Costo base ({freightInputs.kilometers} km × ${costPerKm.toFixed(2)}):
                          </span>
                          <span className="font-medium text-foreground">
                            ${baseTripCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">+ Gasoil:</span>
                          <span className="font-medium text-foreground">
                            ${freightInputs.fuelCost.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">+ Peajes:</span>
                          <span className="font-medium text-foreground">
                            ${freightInputs.tollCost.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            + Chofer ({freightInputs.driverPercentage}%):
                          </span>
                          <span className="font-medium text-foreground">
                            ${(withDriver - baseBeforePercentages).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            + Ganancia ({freightInputs.profitPercentage}%):
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
                            ${freightInputs.freightPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">
                              {isConvenient ? 'Ganancia:' : 'Pérdida:'}
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
        </div>
      </main>
    </div>
  )
}
