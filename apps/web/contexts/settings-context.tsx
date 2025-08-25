'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Settings {
  DNA_MIN_CONC: number
  A260_280_MIN: number
  A260_280_MAX: number
  A260_230_MIN: number
  CALLRATE_MIN: number
  DISHQC_MIN: number
}

interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  error: string | null
  refetchSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: Settings = {
  DNA_MIN_CONC: 20,
  A260_280_MIN: 1.7,
  A260_280_MAX: 2.1,
  A260_230_MIN: 1.8,
  CALLRATE_MIN: 0.98,
  DISHQC_MIN: 0.82
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_URL}/settings`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message)
      // Fallback to default settings
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const refetchSettings = async () => {
    await fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        error, 
        refetchSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

// Utility functions for QC validation using settings
export function getQCStatus(
  concentration?: number,
  a260_280?: number,
  a260_230?: number,
  settings?: Settings | null
): 'pass' | 'warn' | 'fail' | 'pending' {
  if (!concentration || !a260_280 || !a260_230 || !settings) {
    return 'pending'
  }

  const { DNA_MIN_CONC, A260_280_MIN, A260_280_MAX, A260_230_MIN } = settings

  // Hard fail conditions
  const concFail = concentration < DNA_MIN_CONC
  const purityFail = a260_280 < A260_280_MIN || a260_280 > A260_280_MAX || a260_230 < A260_230_MIN

  if (concFail || purityFail) {
    return 'fail'
  }

  // Warn conditions (borderline)
  const concWarn = concentration >= DNA_MIN_CONC && concentration < (DNA_MIN_CONC * 1.5)
  const purityWarn = (a260_280 >= A260_280_MIN && a260_280 < (A260_280_MIN + 0.1)) || 
                     (a260_280 <= A260_280_MAX && a260_280 > (A260_280_MAX - 0.1)) ||
                     (a260_230 >= A260_230_MIN && a260_230 < (A260_230_MIN + 0.1))

  if (concWarn || purityWarn) {
    return 'warn'
  }

  return 'pass'
}

export function getQCColor(status: 'pass' | 'warn' | 'fail' | 'pending'): string {
  switch (status) {
    case 'pass':
      return 'green'
    case 'warn':
      return 'amber'
    case 'fail':
      return 'red'
    case 'pending':
    default:
      return 'gray'
  }
}