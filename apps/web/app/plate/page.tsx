'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, useToast, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'

interface Aliquot {
  id: number
  sample_id: number
  qc_flag: string
  qc?: {
    concentration: number
    a260_280: number
    a260_230: number
  }
}

interface Well {
  position: string
  aliquot_id?: number
  sentrix_barcode: string
  sentrix_position: string
  aliquot?: Aliquot
}

interface Plate {
  id: number
  name: string
  well_count: number
}

export default function Page() {
  const [plateName, setPlateName] = useState('')
  const [wells, setWells] = useState<{[key: string]: Well}>({})
  const [aliquots, setAliquots] = useState<Aliquot[]>([])
  const [plates, setPlates] = useState<Plate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWell, setSelectedWell] = useState<string | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [sentrixBarcode, setSentrixBarcode] = useState('')
  const { addToast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchAliquots = async () => {
    try {
      const response = await fetch(`${API_URL}/aliquots`)
      const data = await response.json()
      setAliquots(data.filter((a: Aliquot) => a.qc_flag === 'Pass' || a.qc_flag === 'Warn'))
    } catch (error) {
      console.error('Error fetching aliquots:', error)
    }
  }

  const fetchPlates = async () => {
    try {
      const response = await fetch(`${API_URL}/plates`)
      const data = await response.json()
      setPlates(data)
    } catch (error) {
      console.error('Error fetching plates:', error)
    }
  }

  // Generate 96-well positions (A1-H12)
  const generateWellPositions = (): string[] => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const cols = Array.from({ length: 12 }, (_, i) => i + 1)
    return rows.flatMap(row => cols.map(col => `${row}${col}`))
  }

  const wellPositions = generateWellPositions()

  const addAliquotToWell = (position: string, aliquot: Aliquot) => {
    const sentrixPosition = generateSentrixPosition(position)
    setWells(prev => ({
      ...prev,
      [position]: {
        position,
        aliquot_id: aliquot.id,
        sentrix_barcode: sentrixBarcode,
        sentrix_position: sentrixPosition,
        aliquot
      }
    }))
    setIsPickerOpen(false)
    setSelectedWell(null)
    addToast({ message: `Aliquot ${aliquot.id} added to well ${position}`, type: 'success' })
  }

  const removeAliquotFromWell = (position: string) => {
    setWells(prev => {
      const updated = { ...prev }
      delete updated[position]
      return updated
    })
  }

  const generateSentrixPosition = (wellPosition: string): string => {
    const row = wellPosition.charAt(0)
    const col = parseInt(wellPosition.slice(1))
    const rowNum = row.charCodeAt(0) - 65 + 1
    return `R${rowNum.toString().padStart(2, '0')}C${col.toString().padStart(2, '0')}`
  }

  const validateSentrixBarcode = (barcode: string): boolean => {
    return /^[0-9]{10,12}$/.test(barcode)
  }

  const validateSentrixPosition = (position: string): boolean => {
    return /^R\d{2}C\d{2}$/.test(position)
  }

  const updateWellSentrixPosition = (position: string, newSentrixPosition: string) => {
    if (!validateSentrixPosition(newSentrixPosition)) {
      addToast({ message: 'Invalid sentrix position format. Use R##C## (e.g., R01C01)', type: 'error' })
      return
    }
    
    setWells(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        sentrix_position: newSentrixPosition
      }
    }))
  }

  const createPlate = async () => {
    if (!plateName.trim()) {
      addToast({ message: 'Plate name is required', type: 'error' })
      return
    }

    if (!sentrixBarcode.trim()) {
      addToast({ message: 'Sentrix barcode is required', type: 'error' })
      return
    }

    if (!validateSentrixBarcode(sentrixBarcode)) {
      addToast({ message: 'Invalid sentrix barcode format. Must be 10-12 digits.', type: 'error' })
      return
    }

    const wellArray = Object.values(wells)
    if (wellArray.length === 0) {
      addToast({ message: 'Add at least one well to the plate', type: 'error' })
      return
    }

    // Validation checks
    const aliquotIds = new Set()
    const sentrixPositions = new Set()
    const errors: string[] = []

    for (const well of wellArray) {
      if (aliquotIds.has(well.aliquot_id)) {
        errors.push(`Aliquot ${well.aliquot_id} used multiple times`)
      }
      aliquotIds.add(well.aliquot_id)

      const sentrixKey = `${well.sentrix_barcode}-${well.sentrix_position}`
      if (sentrixPositions.has(sentrixKey)) {
        errors.push(`Duplicate sentrix position ${well.sentrix_position}`)
      }
      sentrixPositions.add(sentrixKey)

      if (!validateSentrixPosition(well.sentrix_position)) {
        errors.push(`Invalid sentrix position format: ${well.sentrix_position}`)
      }
    }

    if (errors.length > 0) {
      addToast({ message: `Validation errors: ${errors.join(', ')}`, type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/plates`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: plateName,
          wells: wellArray.map(well => ({
            well: well.position,
            aliquot_id: well.aliquot_id,
            sentrix_barcode: well.sentrix_barcode,
            sentrix_position: well.sentrix_position
          }))
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to create plate', type: 'error' })
        return
      }
      
      const plate = await response.json()
      addToast({ message: `Plate ${plate.id} created with ${plate.well_count} wells`, type: 'success' })
      setPlateName('')
      setSentrixBarcode('')
      setWells({})
      clearDraft()
      fetchPlates()
      fetchAliquots()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating plate', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleSheet = async (plateId: number) => {
    try {
      const response = await fetch(`${API_URL}/plates/${plateId}/samplesheet`)
      if (!response.ok) {
        throw new Error('Failed to generate sample sheet')
      }
      const text = await response.text()
      const blob = new Blob([text], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `samplesheet_${plateId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      addToast({ message: 'Sample sheet downloaded successfully', type: 'success' })
    } catch (error: any) {
      addToast({ message: error.message || 'Error downloading sample sheet', type: 'error' })
    }
  }

  const clearPlate = () => {
    setWells({})
    setPlateName('')
    setSentrixBarcode('')
    clearDraft()
    addToast({ message: 'Plate cleared', type: 'info' })
  }

  const usedAliquotIds = new Set(Object.values(wells).map(w => w.aliquot_id))
  const availableAliquots = aliquots.filter(a => !usedAliquotIds.has(a.id))

  // Save draft to localStorage
  const saveDraft = () => {
    const draft = {
      plateName,
      sentrixBarcode,
      wells,
      timestamp: Date.now()
    }
    localStorage.setItem('plateDraft', JSON.stringify(draft))
  }

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem('plateDraft')
      if (saved) {
        const draft = JSON.parse(saved)
        setPlateName(draft.plateName || '')
        setSentrixBarcode(draft.sentrixBarcode || '')
        setWells(draft.wells || {})
        addToast({ message: 'Draft loaded from previous session', type: 'info' })
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem('plateDraft')
  }

  // Auto-save draft when plate data changes
  useEffect(() => {
    if (plateName || sentrixBarcode || Object.keys(wells).length > 0) {
      const timeoutId = setTimeout(() => {
        saveDraft()
      }, 1000) // Debounce save
      
      return () => clearTimeout(timeoutId)
    }
  }, [plateName, sentrixBarcode, wells])

  useEffect(() => {
    fetchAliquots()
    fetchPlates()
    loadDraft()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plate Builder</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Build 96-well plates for genotyping arrays
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {aliquots.length} QC passed aliquots
          </Badge>
          <Badge variant="outline">
            {Object.keys(wells).length}/96 wells filled
          </Badge>
        </div>
      </div>

      {/* Plate Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚖️</span>
            <span>96-Well Plate Layout</span>
          </CardTitle>
          <CardDescription>
            Click wells to assign aliquots. Each well represents a sample position.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plate Configuration */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plate Name *
              </label>
              <Input
                placeholder="Enter plate name"
                value={plateName}
                onChange={(e) => setPlateName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sentrix Barcode *
              </label>
              <Input
                placeholder="10-12 digits (e.g., 204123456789)"
                value={sentrixBarcode}
                onChange={(e) => setSentrixBarcode(e.target.value)}
                className={sentrixBarcode && !validateSentrixBarcode(sentrixBarcode) 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
                }
              />
              {sentrixBarcode && !validateSentrixBarcode(sentrixBarcode) && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Must be 10-12 digits only
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  Object.keys(wells).forEach(position => {
                    const autoPosition = generateSentrixPosition(position)
                    updateWellSentrixPosition(position, autoPosition)
                  })
                  addToast({ message: 'Auto-generated sentrix positions for all wells', type: 'info' })
                }}
                disabled={Object.keys(wells).length === 0}
                className="text-sm"
              >
                Auto-fill Positions
              </Button>
              <Button variant="outline" onClick={clearPlate} disabled={Object.keys(wells).length === 0}>
                Clear All
              </Button>
            </div>
          </div>

          {/* 96-Well Grid */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plate Layout (96 wells)</span>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Filled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-gray-300 rounded"></div>
                  <span>Empty</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-13 gap-1 max-w-4xl">
              {/* Column headers */}
              <div></div>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 h-6 flex items-center justify-center">
                  {i + 1}
                </div>
              ))}
              
              {/* Well grid */}
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                <React.Fragment key={row}>
                  {/* Row header */}
                  <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-6 flex items-center justify-center">
                    {row}
                  </div>
                  
                  {/* Wells in this row */}
                  {Array.from({ length: 12 }, (_, colIndex) => {
                    const position = `${row}${colIndex + 1}`
                    const well = wells[position]
                    const isEmpty = !well
                    
                    return (
                      <button
                        key={position}
                        onClick={() => {
                          setSelectedWell(position)
                          setIsPickerOpen(true)
                        }}
                        className={`
                          w-8 h-8 text-xs font-mono rounded border-2 transition-colors
                          ${isEmpty 
                            ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white dark:bg-gray-800' 
                            : 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                          }
                          ${selectedWell === position ? 'ring-2 ring-blue-300' : ''}
                        `}
                        title={well ? `${position}: Aliquot ${well.aliquot_id}\nSentrix: ${well.sentrix_position}` : `${position}: Empty`}
                      >
                        {isEmpty ? position : well.aliquot_id}
                      </button>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Wells filled: {Object.keys(wells).length}/96 • Available aliquots: {availableAliquots.length}
              {(plateName || sentrixBarcode || Object.keys(wells).length > 0) && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">• Draft auto-saved</span>
              )}
            </div>
            <Button 
              onClick={createPlate} 
              disabled={loading || !plateName.trim() || !sentrixBarcode.trim() || !validateSentrixBarcode(sentrixBarcode) || Object.keys(wells).length === 0}
              className="min-w-32"
            >
              {loading ? 'Creating...' : 'Create Plate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Plates */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Plates</CardTitle>
          <CardDescription>Previously created plates and sample sheets</CardDescription>
        </CardHeader>
        <CardContent>
          {plates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No plates created yet</p>
              <p className="text-sm mt-1">Build your first plate above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Wells</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plates.map(plate => (
                  <TableRow key={plate.id}>
                    <TableCell className="font-mono text-sm">{plate.id}</TableCell>
                    <TableCell>{plate.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plate.well_count} wells</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSampleSheet(plate.id)}
                      >
                        Download Sample Sheet
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Aliquot Picker Modal */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false)
          setSelectedWell(null)
        }}
        title={`Select Aliquot for Well ${selectedWell}`}
        size="lg"
      >
        {selectedWell && wells[selectedWell] && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Current: Aliquot {wells[selectedWell].aliquot_id}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedWell) {
                    removeAliquotFromWell(selectedWell)
                    setIsPickerOpen(false)
                    setSelectedWell(null)
                  }
                }}
              >
                Remove
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-300">Sentrix Position:</span>
              <Input
                value={wells[selectedWell].sentrix_position}
                onChange={(e) => selectedWell && updateWellSentrixPosition(selectedWell, e.target.value)}
                className="w-24 h-8 text-xs"
                placeholder="R##C##"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedWell) {
                    const autoPosition = generateSentrixPosition(selectedWell)
                    updateWellSentrixPosition(selectedWell, autoPosition)
                  }
                }}
                className="h-8 text-xs"
              >
                Auto
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Available aliquots ({availableAliquots.length} remaining)
          </div>
          
          {availableAliquots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No available aliquots</p>
              <p className="text-sm mt-1">All QC-passed aliquots are already assigned</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aliquot ID</TableHead>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>QC Flag</TableHead>
                    <TableHead>Concentration</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableAliquots.map(aliquot => (
                    <TableRow key={aliquot.id}>
                      <TableCell className="font-mono text-sm">{aliquot.id}</TableCell>
                      <TableCell className="font-mono text-sm">{aliquot.sample_id}</TableCell>
                      <TableCell>
                        <Badge variant={aliquot.qc_flag === 'Pass' ? 'default' : 'outline'}>
                          {aliquot.qc_flag}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {aliquot.qc?.concentration ? `${aliquot.qc.concentration} ng/µL` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => selectedWell && addAliquotToWell(selectedWell, aliquot)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}