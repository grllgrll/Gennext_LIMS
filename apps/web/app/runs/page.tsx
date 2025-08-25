'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { useSettings, getQCStatus, getQCColor } from '@/contexts/settings-context'

interface Run {
  id: string
  run_name: string
  run_date: string
  status: string
  beadchip_count: number
}

interface MetricsInput {
  sample_id: string
  call_rate: number
  dish_qc: number
  heterozygosity?: number
  sex_call?: string
  sex_concordance?: string
}

interface QCResult {
  sample_id: string
  call_rate: number
  dish_qc: number
  qc_flag: 'Pass' | 'Warn' | 'Fail'
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export default function Page() {
  const [runName, setRunName] = useState('')
  const [beadchips, setBeadchips] = useState([''])
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRun, setSelectedRun] = useState('')
  const [metricsJson, setMetricsJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [qcResults, setQcResults] = useState<QCResult[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [parsedMetrics, setParsedMetrics] = useState<MetricsInput[]>([])
  const { addToast } = useToast()
  const { settings } = useSettings()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchRuns = async () => {
    try {
      const response = await fetch(`${API_URL}/runs`)
      if (response.ok) {
        const data = await response.json()
        setRuns(data)
      }
    } catch (error) {
      console.error('Error fetching runs:', error)
    }
  }

  const addBeadchip = () => {
    setBeadchips([...beadchips, ''])
  }

  const updateBeadchip = (index: number, value: string) => {
    const updated = [...beadchips]
    updated[index] = value
    setBeadchips(updated)
  }

  const removeBeadchip = (index: number) => {
    setBeadchips(beadchips.filter((_, i) => i !== index))
  }

  const createRun = async () => {
    if (!runName.trim()) {
      addToast({ message: 'Run name is required', type: 'error' })
      return
    }
    
    const validBeadchips = beadchips.filter(b => b.trim())
    if (validBeadchips.length === 0) {
      addToast({ message: 'Add at least one beadchip barcode', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/runs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          run_name: runName,
          run_date: new Date().toISOString(),
          beadchip_barcodes: validBeadchips
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to create run', type: 'error' })
        return
      }
      
      const run = await response.json()
      addToast({ message: `Run ${run.id} created with ${run.beadchip_count} beadchips`, type: 'success' })
      setRunName('')
      setBeadchips([''])
      fetchRuns()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating run', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const validateMetricsJson = (jsonText: string): { valid: boolean; errors: ValidationError[]; data?: MetricsInput[] } => {
    const errors: ValidationError[] = []
    
    if (!jsonText.trim()) {
      return { valid: false, errors: [{ row: 0, field: 'json', message: 'JSON data is required' }] }
    }

    try {
      const data = JSON.parse(jsonText)
      
      if (!Array.isArray(data)) {
        return { valid: false, errors: [{ row: 0, field: 'json', message: 'JSON must be an array' }] }
      }

      if (data.length === 0) {
        return { valid: false, errors: [{ row: 0, field: 'json', message: 'Array cannot be empty' }] }
      }

      data.forEach((item, index) => {
        const row = index + 1
        
        // Required field validation
        if (!item.sample_id || typeof item.sample_id !== 'string') {
          errors.push({ row, field: 'sample_id', message: 'sample_id is required and must be a string' })
        }
        
        if (item.call_rate === undefined || item.call_rate === null) {
          errors.push({ row, field: 'call_rate', message: 'call_rate is required' })
        } else if (typeof item.call_rate !== 'number' || item.call_rate < 0 || item.call_rate > 1) {
          errors.push({ row, field: 'call_rate', message: 'call_rate must be a number between 0 and 1' })
        }
        
        if (item.dish_qc === undefined || item.dish_qc === null) {
          errors.push({ row, field: 'dish_qc', message: 'dish_qc is required' })
        } else if (typeof item.dish_qc !== 'number' || item.dish_qc < 0 || item.dish_qc > 1) {
          errors.push({ row, field: 'dish_qc', message: 'dish_qc must be a number between 0 and 1' })
        }
        
        // Optional field validation
        if (item.heterozygosity !== undefined && (typeof item.heterozygosity !== 'number' || item.heterozygosity < 0 || item.heterozygosity > 1)) {
          errors.push({ row, field: 'heterozygosity', message: 'heterozygosity must be a number between 0 and 1' })
        }
        
        if (item.sex_call !== undefined && typeof item.sex_call !== 'string') {
          errors.push({ row, field: 'sex_call', message: 'sex_call must be a string' })
        }
        
        if (item.sex_concordance !== undefined && typeof item.sex_concordance !== 'string') {
          errors.push({ row, field: 'sex_concordance', message: 'sex_concordance must be a string' })
        }
      })

      return { valid: errors.length === 0, errors, data }
    } catch (parseError) {
      return { 
        valid: false, 
        errors: [{ row: 0, field: 'json', message: 'Invalid JSON format' }] 
      }
    }
  }

  const handleJsonChange = (value: string) => {
    setMetricsJson(value)
    setQcResults([])
    
    const validation = validateMetricsJson(value)
    setValidationErrors(validation.errors)
    setParsedMetrics(validation.data || [])
  }

  const uploadMetrics = async () => {
    if (!selectedRun) {
      addToast({ message: 'Please select a run first', type: 'error' })
      return
    }

    const validation = validateMetricsJson(metricsJson)
    if (!validation.valid) {
      addToast({ message: `Cannot upload: ${validation.errors.length} validation errors found`, type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/runs/${selectedRun}/metrics`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(validation.data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to upload metrics', type: 'error' })
        return
      }
      
      const result = await response.json()
      setQcResults(result.qc_results || [])
      
      const passCount = result.qc_results?.filter((qc: QCResult) => qc.qc_flag === 'Pass').length || 0
      const warnCount = result.qc_results?.filter((qc: QCResult) => qc.qc_flag === 'Warn').length || 0
      const failCount = result.qc_results?.filter((qc: QCResult) => qc.qc_flag === 'Fail').length || 0
      
      addToast({ 
        message: `Metrics uploaded: ${result.metrics_processed} samples processed (Pass: ${passCount}, Warn: ${warnCount}, Fail: ${failCount})`, 
        type: 'success' 
      })
      setMetricsJson('')
      setValidationErrors([])
      setParsedMetrics([])
      fetchRuns()
    } catch (error: any) {
      addToast({ message: error.message || 'Error uploading metrics', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        handleJsonChange(content)
      }
      reader.readAsText(file)
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'created': return 'outline'
      default: return 'outline'
    }
  }

  const getGenotypeQCStatus = (callRate: number, dishQC: number): 'Pass' | 'Warn' | 'Fail' => {
    if (!settings) return 'Pass'
    
    if (callRate < 0.97 || dishQC < settings.DISHQC_MIN) {
      return 'Fail'
    } else if (callRate >= 0.97 && callRate < settings.CALLRATE_MIN && dishQC >= settings.DISHQC_MIN) {
      return 'Warn'
    } else if (callRate >= settings.CALLRATE_MIN && dishQC >= settings.DISHQC_MIN) {
      return 'Pass'
    } else {
      return 'Fail'
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [])

  const sampleMetrics = `[
  {
    "sample_id": "SAMP-00001",
    "call_rate": 0.99,
    "dish_qc": 0.85,
    "heterozygosity": 0.32,
    "sex_call": "M",
    "sex_concordance": "Match"
  },
  {
    "sample_id": "SAMP-00002", 
    "call_rate": 0.96,
    "dish_qc": 0.88
  }
]`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genotyping Runs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create runs and upload genotype QC metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {runs.length} total runs
          </Badge>
        </div>
      </div>

      {/* Create New Run */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧬</span>
            <span>Create Genotyping Run</span>
          </CardTitle>
          <CardDescription>
            Set up a new genotyping run with beadchip barcodes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Run Name *
              </label>
              <Input 
                placeholder="Enter run name (e.g., GSA_2024_001)" 
                value={runName} 
                onChange={(e) => setRunName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beadchip Barcodes *
            </label>
            {beadchips.map((chip, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input 
                  placeholder="204123456789"
                  value={chip}
                  onChange={(e) => updateBeadchip(index, e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => removeBeadchip(index)}
                  disabled={beadchips.length === 1 || loading}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addBeadchip}
              disabled={loading}
              className="mt-2"
            >
              Add Beadchip
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={createRun}
              disabled={loading || !runName.trim() || beadchips.filter(b => b.trim()).length === 0}
              className="min-w-32"
            >
              {loading ? 'Creating...' : 'Create Run'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>Upload Genotype Metrics</span>
          </CardTitle>
          <CardDescription>
            Upload QC metrics JSON for completed genotyping runs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Run *
            </label>
            <Select 
              value={selectedRun} 
              onValueChange={setSelectedRun}
              disabled={loading}
            >
              <option value="">Choose a run...</option>
              {runs.map(run => (
                <option key={run.id} value={run.id}>
                  {run.id} - {run.run_name} ({run.status})
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload JSON File
            </label>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/20 dark:file:text-blue-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Metrics JSON *
            </label>
            <textarea 
              placeholder={`Enter metrics JSON array:\n${sampleMetrics}`}
              value={metricsJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              disabled={loading}
              className={`w-full h-48 p-3 text-sm border rounded-lg resize-none
                bg-white dark:bg-gray-800 
                border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${validationErrors.length > 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
              `}
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-red-800 dark:text-red-200">
                  {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''} found:
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 dark:text-red-300 mb-1">
                    {error.row > 0 ? `Row ${error.row}` : 'JSON'} - {error.field}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Preview */}
          {parsedMetrics.length > 0 && validationErrors.length === 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Ready to upload: {parsedMetrics.length} sample{parsedMetrics.length > 1 ? 's' : ''} validated
                </span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Preview: {parsedMetrics.slice(0, 3).map(m => m.sample_id).join(', ')}
                {parsedMetrics.length > 3 && ` +${parsedMetrics.length - 3} more`}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span>QC Thresholds: </span>
              <span className="font-mono">
                {settings ? `Call Rate ≥${settings.CALLRATE_MIN}, Dish QC ≥${settings.DISHQC_MIN}` : 'Loading...'}
              </span>
            </div>
            <Button 
              onClick={uploadMetrics} 
              disabled={loading || !selectedRun || !metricsJson.trim() || validationErrors.length > 0}
              className="min-w-32"
            >
              {loading ? 'Uploading...' : 'Upload Metrics'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QC Results */}
      {qcResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>QC Results Summary</CardTitle>
            <CardDescription>Genotype quality control analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {qcResults.length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Samples</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {qcResults.filter(qc => qc.qc_flag === 'Pass').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {qcResults.filter(qc => qc.qc_flag === 'Warn').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warning</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {qcResults.filter(qc => qc.qc_flag === 'Fail').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              </div>
            </div>

            {/* Warning Banner */}
            {qcResults.filter(qc => qc.qc_flag === 'Fail').length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    {qcResults.filter(qc => qc.qc_flag === 'Fail').length} sample(s) failed QC thresholds
                  </span>
                </div>
              </div>
            )}

            {/* Color-coded Results Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Call Rate</TableHead>
                    <TableHead>Dish QC</TableHead>
                    <TableHead>QC Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcResults.map((qc, index) => {
                    const bgColor = qc.qc_flag === 'Pass' ? 'bg-green-50 dark:bg-green-900/20' :
                                   qc.qc_flag === 'Warn' ? 'bg-amber-50 dark:bg-amber-900/20' :
                                   'bg-red-50 dark:bg-red-900/20'
                    
                    return (
                      <TableRow key={index} className={bgColor}>
                        <TableCell className="font-mono text-sm">{qc.sample_id}</TableCell>
                        <TableCell className="font-mono text-sm">{qc.call_rate.toFixed(3)}</TableCell>
                        <TableCell className="font-mono text-sm">{qc.dish_qc.toFixed(3)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              qc.qc_flag === 'Pass' ? 'default' : 
                              qc.qc_flag === 'Warn' ? 'secondary' : 'destructive'
                            }
                          >
                            {qc.qc_flag}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Runs</CardTitle>
          <CardDescription>Previously created genotyping runs</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No runs created yet</p>
              <p className="text-sm mt-1">Create your first genotyping run above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Beadchips</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map(run => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">{run.id}</TableCell>
                      <TableCell>{run.run_name}</TableCell>
                      <TableCell>{new Date(run.run_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{run.beadchip_count} chips</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}