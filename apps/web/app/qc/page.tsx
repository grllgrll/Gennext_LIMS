'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { useSettings, getQCStatus, getQCColor } from '@/contexts/settings-context'

interface Sample {
  id: number
  kit_qr: string
  sample_type: string
  subject_pseudoid: string
  status: string
  has_consent: boolean
  consent?: { id: number; consent_date: string }
}

interface Aliquot {
  id: number
  sample_id: number
  status: string
  qc_flag?: string
  qc?: {
    concentration: number
    a260_280: number
    a260_230: number
  }
}

interface QCData {
  [aliquotId: string]: {
    concentration: string
    a260_280: string
    a260_230: string
  }
}

export default function Page() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [aliquots, setAliquots] = useState<Aliquot[]>([])
  const [qcData, setQcData] = useState<QCData>({})
  const [loading, setLoading] = useState(false)
  const [consentFiles, setConsentFiles] = useState<File[]>([])
  const { addToast } = useToast()
  const { settings } = useSettings()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchSamples = async () => {
    try {
      const response = await fetch(`${API_URL}/samples`)
      if (response.ok) {
        const data = await response.json()
        setSamples(data)
      }
    } catch (error) {
      console.error('Error fetching samples:', error)
    }
  }

  const fetchAliquots = async () => {
    try {
      const response = await fetch(`${API_URL}/aliquots`)
      if (response.ok) {
        const data = await response.json()
        setAliquots(data)
      }
    } catch (error) {
      console.error('Error fetching aliquots:', error)
    }
  }

  const createExtraction = async () => {
    if (selectedSamples.length === 0) {
      addToast({ message: 'Please select samples for extraction', type: 'error' })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/extractions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sample_ids: selectedSamples})
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to create extraction', type: 'error' })
        return
      }
      
      const result = await response.json()
      addToast({ message: `Extraction batch ${result.batch_id} created successfully`, type: 'success' })
      setSelectedSamples([])
      fetchSamples()
      fetchAliquots()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating extraction', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const submitQC = async (validOnly = false) => {
    const allEntries = Object.entries(qcData).filter(([_, data]) => 
      data.concentration && data.a260_280 && data.a260_230
    )

    if (allEntries.length === 0) {
      addToast({ message: 'Please enter QC data for at least one aliquot', type: 'error' })
      return
    }

    // Check for fail states
    const failedEntries = allEntries.filter(([_, data]) => {
      const status = getQCStatus(
        parseFloat(data.concentration),
        parseFloat(data.a260_280),
        parseFloat(data.a260_230),
        settings
      )
      return status === 'fail'
    })

    let submissionEntries = allEntries
    if (validOnly) {
      submissionEntries = allEntries.filter(([_, data]) => {
        const status = getQCStatus(
          parseFloat(data.concentration),
          parseFloat(data.a260_280),
          parseFloat(data.a260_230),
          settings
        )
        return status !== 'fail'
      })
    } else if (failedEntries.length > 0 && !validOnly) {
      // Block submission if there are fails and not specifically requesting valid only
      addToast({ 
        message: `Cannot submit: ${failedEntries.length} rows have hard-fail values. Fix values or use 'Submit valid rows only'.`, 
        type: 'error' 
      })
      return
    }

    const qcSubmissions = submissionEntries.map(([aliquotId, data]) => ({
      aliquot_id: parseInt(aliquotId),
      concentration: parseFloat(data.concentration),
      a260_280: parseFloat(data.a260_280),
      a260_230: parseFloat(data.a260_230)
    }))

    if (qcSubmissions.length === 0) {
      addToast({ message: 'No valid rows to submit', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/extractions/qc`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(qcSubmissions)
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to submit QC', type: 'error' })
        return
      }
      
      const result = await response.json()
      const message = validOnly 
        ? `QC submitted for ${result.qcs.length} valid rows (${failedEntries.length} failed rows skipped)`
        : `QC submitted for ${result.qcs.length} aliquots`
      addToast({ message, type: 'success' })
      setQcData({})
      fetchAliquots()
      fetchSamples()
    } catch (error: any) {
      addToast({ message: error.message || 'Error submitting QC', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updateQcData = (aliquotId: string, field: string, value: string) => {
    setQcData(prev => ({
      ...prev,
      [aliquotId]: {
        ...prev[aliquotId],
        [field]: value
      }
    }))
  }

  const toggleSampleSelection = (sampleId: string) => {
    setSelectedSamples(prev => 
      prev.includes(sampleId) 
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    )
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'received': return 'default'
      case 'accessioned': return 'secondary'
      case 'extraction': return 'outline'
      case 'dna ready': return 'default'
      default: return 'outline'
    }
  }

  const getQCStatusColor = (concentration?: number, a260_280?: number, a260_230?: number) => {
    if (!concentration || !a260_280 || !a260_230) return 'gray'
    
    const concOk = concentration >= 10
    const purityOk = a260_280 >= 1.7 && a260_280 <= 2.0 && a260_230 >= 1.8 && a260_230 <= 2.2
    
    if (concOk && purityOk) return 'green'
    if (!concOk || !purityOk) return 'red'
    return 'yellow'
  }

  const validateQCInput = (field: string, value: string, concentration?: string, a260_280?: string, a260_230?: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return 'gray'
    
    // For comprehensive status, we need all values
    if (field === 'status' && concentration && a260_280 && a260_230) {
      const status = getQCStatus(
        parseFloat(concentration),
        parseFloat(a260_280),
        parseFloat(a260_230),
        settings
      )
      return getQCColor(status)
    }
    
    // Individual field validation
    if (!settings) return 'gray'
    
    switch (field) {
      case 'concentration':
        if (num < settings.DNA_MIN_CONC) return 'red'
        if (num >= settings.DNA_MIN_CONC && num < (settings.DNA_MIN_CONC * 1.5)) return 'amber'
        return 'green'
      case 'a260_280':
        if (num < settings.A260_280_MIN || num > settings.A260_280_MAX) return 'red'
        if ((num >= settings.A260_280_MIN && num < (settings.A260_280_MIN + 0.1)) || 
            (num <= settings.A260_280_MAX && num > (settings.A260_280_MAX - 0.1))) return 'amber'
        return 'green'
      case 'a260_230':
        if (num < settings.A260_230_MIN) return 'red'
        if (num >= settings.A260_230_MIN && num < (settings.A260_230_MIN + 0.1)) return 'amber'
        return 'green'
      default:
        return 'gray'
    }
  }

  const exportToCSV = () => {
    const headers = ['Aliquot ID', 'Sample ID', 'Concentration (ng/µL)', 'A260/280', 'A260/230', 'QC Flag']
    const rows = aliquots.map(aliquot => [
      aliquot.id,
      aliquot.sample_id,
      aliquot.qc?.concentration || '',
      aliquot.qc?.a260_280 || '',
      aliquot.qc?.a260_230 || '',
      aliquot.qc_flag || ''
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qc-results-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast({ message: 'QC results exported successfully', type: 'success' })
  }

  useEffect(() => {
    fetchSamples()
    fetchAliquots()
  }, [])

  const extractableCount = samples.filter(s => s.status === 'Received' || s.status === 'Accessioned').length
  const aliquotsWithoutQC = aliquots.filter(a => !a.qc).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DNA QC</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Extract DNA and perform quality control analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {extractableCount} ready for extraction
          </Badge>
          {aliquots.length > 0 && (
            <Button variant="outline" onClick={exportToCSV} className="text-sm">
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Extraction Batch Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧪</span>
            <span>Step 1: Create Extraction Batch</span>
          </CardTitle>
          <CardDescription>
            Select samples with consent for DNA extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extractableCount === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No samples ready for extraction</p>
              <p className="text-sm mt-1">Register samples in Intake first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input 
                          type="checkbox"
                          checked={selectedSamples.length === extractableCount && extractableCount > 0}
                          onChange={() => {
                            if (selectedSamples.length === extractableCount) {
                              setSelectedSamples([])
                            } else {
                              setSelectedSamples(samples
                                .filter(s => s.status === 'Received' || s.status === 'Accessioned')
                                .map(s => s.id.toString())
                              )
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Sample ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Consent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samples
                      .filter(s => s.status === 'Received' || s.status === 'Accessioned')
                      .map(sample => (
                        <TableRow key={sample.id}>
                          <TableCell>
                            <input 
                              type="checkbox"
                              checked={selectedSamples.includes(sample.id.toString())}
                              onChange={() => toggleSampleSelection(sample.id.toString())}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{sample.id}</TableCell>
                          <TableCell>{sample.sample_type}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(sample.status)}>
                              {sample.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sample.has_consent ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                ✓ Consented
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                ⚠ Missing
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={createExtraction}
                  disabled={selectedSamples.length === 0 || loading}
                  className="min-w-48"
                >
                  {loading ? 'Creating...' : `Create Extraction Batch (${selectedSamples.length})`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QC Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔬</span>
            <span>Step 2: DNA Quality Control</span>
          </CardTitle>
          <CardDescription>
            Enter nanodrop readings and quality metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aliquots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p>No aliquots available for QC</p>
              <p className="text-sm mt-1">Create an extraction batch first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aliquot ID</TableHead>
                      <TableHead>Sample ID</TableHead>
                      <TableHead>Concentration (ng/µL)</TableHead>
                      <TableHead>A260/280</TableHead>
                      <TableHead>A260/230</TableHead>
                      <TableHead>QC Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aliquots.map(aliquot => {
                      const currentData = qcData[aliquot.id] || {}
                      const concColor = validateQCInput('concentration', currentData.concentration || '')
                      const a280Color = validateQCInput('a260_280', currentData.a260_280 || '')
                      const a230Color = validateQCInput('a260_230', currentData.a260_230 || '')
                      
                      return (
                        <TableRow key={aliquot.id}>
                          <TableCell className="font-mono text-sm">{aliquot.id}</TableCell>
                          <TableCell className="font-mono text-sm">{aliquot.sample_id}</TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              step="0.1"
                              placeholder="20.0"
                              value={currentData.concentration || ''}
                              onChange={(e) => updateQcData(aliquot.id.toString(), 'concentration', e.target.value)}
                              className={`w-20 ${
                                concColor === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100' : 
                                concColor === 'amber' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100' :
                                concColor === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : ''
                              }`}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="1.8"
                              value={currentData.a260_280 || ''}
                              onChange={(e) => updateQcData(aliquot.id.toString(), 'a260_280', e.target.value)}
                              className={`w-20 ${
                                a280Color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100' : 
                                a280Color === 'amber' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100' :
                                a280Color === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : ''
                              }`}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="2.0"
                              value={currentData.a260_230 || ''}
                              onChange={(e) => updateQcData(aliquot.id.toString(), 'a260_230', e.target.value)}
                              className={`w-20 ${
                                a230Color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100' : 
                                a230Color === 'amber' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100' :
                                a230Color === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : ''
                              }`}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            {aliquot.qc_flag ? (
                              <Badge variant={aliquot.qc_flag === 'Pass' ? 'default' : 'destructive'}>
                                {aliquot.qc_flag}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Fail state warning banner */}
              {(() => {
                const failedEntries = Object.entries(qcData)
                  .filter(([_, data]) => data.concentration && data.a260_280 && data.a260_230)
                  .filter(([_, data]) => {
                    const status = getQCStatus(
                      parseFloat(data.concentration),
                      parseFloat(data.a260_280),
                      parseFloat(data.a260_230),
                      settings
                    )
                    return status === 'fail'
                  })
                
                return failedEntries.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Some rows are hard-fail. Fix values or submit only valid rows.</span>
                    </div>
                  </div>
                )
              })()}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span>QC Thresholds: </span>
                  <span className="font-mono">
                    {settings ? `Conc ≥${settings.DNA_MIN_CONC} ng/µL, A260/280: ${settings.A260_280_MIN}-${settings.A260_280_MAX}, A260/230: ≥${settings.A260_230_MIN}` : 'Loading...'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const allEntries = Object.entries(qcData).filter(([_, data]) => 
                      data.concentration && data.a260_280 && data.a260_230
                    )
                    const failedEntries = allEntries.filter(([_, data]) => {
                      const status = getQCStatus(
                        parseFloat(data.concentration),
                        parseFloat(data.a260_280),
                        parseFloat(data.a260_230),
                        settings
                      )
                      return status === 'fail'
                    })
                    const hasFailures = failedEntries.length > 0
                    
                    return (
                      <>
                        {hasFailures && (
                          <Button 
                            variant="outline"
                            onClick={() => submitQC(true)}
                            disabled={loading || allEntries.length === failedEntries.length}
                            className="min-w-40"
                          >
                            {loading ? 'Submitting...' : 'Submit Valid Rows Only'}
                          </Button>
                        )}
                        <Button 
                          onClick={() => submitQC(false)}
                          disabled={Object.keys(qcData).length === 0 || loading || (hasFailures && allEntries.length > 0)}
                          className="min-w-32"
                        >
                          {loading ? 'Submitting...' : 'Submit QC Results'}
                        </Button>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QC Summary */}
      {aliquots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>QC Summary</CardTitle>
            <CardDescription>Quality control analysis overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {aliquots.length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Aliquots</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {aliquots.filter(a => a.qc_flag === 'Pass').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passed QC</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {aliquots.filter(a => a.qc_flag === 'Fail').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed QC</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {aliquotsWithoutQC}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending QC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}