'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasCompanyPermission, type Company, type CompanyMember, type CompanyPermission } from './company'

interface CompanyContextState {
  company: Company | null
  member: CompanyMember | null
  members: CompanyMember[]
  loading: boolean
  error: string
  can: (permission: CompanyPermission) => boolean
  refresh: () => Promise<void>
  setMembers: (members: CompanyMember[]) => void
}

const CompanyContext = createContext<CompanyContextState | null>(null)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [member, setMember] = useState<CompanyMember | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/company', { cache: 'no-store' })
      const body = await response.json() as { company?: Company; member?: CompanyMember; members?: CompanyMember[]; error?: string }
      if (!response.ok || !body.company || !body.member) throw new Error(body.error || 'No se pudo cargar la empresa.')
      setCompany(body.company)
      setMember(body.member)
      setMembers(body.members ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la empresa.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<CompanyContextState>(() => ({
    company,
    member,
    members,
    loading,
    error,
    can: (permission) => member ? hasCompanyPermission(member, permission) : false,
    refresh,
    setMembers,
  }), [company, error, loading, member, members, refresh])

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) throw new Error('useCompany must be used inside CompanyProvider')
  return context
}
