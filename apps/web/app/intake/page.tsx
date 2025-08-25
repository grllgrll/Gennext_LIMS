'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'

interface Sample {
  id: number
  kit_qr: string
  sample_type: string
  subject_pseudoid: string
  status: string
  collection_datetime: string
  has_consent: boolean
  consent?: { id: number; consent_date: string }
}

interface Kit {
  id: number
  qr_code: string
  clinic_id: string
}

export default function Page() {
  const [clinicId, setClinicId] = useState('DemoClinic')
  const [kitQr, setKitQr] = useState('')
  const [sampleType, setSampleType] = useState('Blood')
  const [subjectPseudoid, setSubjectPseudoid] = useState('')
  const [samples, setSamples] = useState<Sample[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const createKit = async () => {
    if (!clinicId.trim()) {
      addToast({ message: 'Clinic ID is required', type: 'error' })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/kits`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({clinic_id: clinicId})
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create kit')
      }
      
      const kit = await response.json()
      setKitQr(kit.qr_code)
      addToast({ message: `Kit ${kit.id} created successfully`, type: 'success' })
      fetchKits()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating kit', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createSample = async () => {
    if (!kitQr.trim() || !sampleType || !subjectPseudoid.trim()) {
      addToast({ message: 'All fields are required for sample creation', type: 'error' })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/samples`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          kit_qr: kitQr,
          sample_type: sampleType,
          subject_pseudoid: subjectPseudoid,
          collection_datetime: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create sample')
      }
      
      const sample = await response.json()
      addToast({ message: `Sample ${sample.id} created successfully`, type: 'success' })
      setSubjectPseudoid('')
      fetchSamples()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating sample', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

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

  const fetchKits = async () => {
    try {
      const response = await fetch(`${API_URL}/kits`)
      if (response.ok) {
        const data = await response.json()
        setKits(data)
      }
    } catch (error) {
      console.error('Error fetching kits:', error)
    }
  }

  useEffect(() => {
    fetchSamples()
    fetchKits()
  }, [])

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'received': return 'default'
      case 'accessioned': return 'secondary'
      case 'extraction': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sample Intake</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Register kits and collect biological samples
        </p>
      </div>

      {/* Kit Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📦</span>
            <span>Step 1: Create Kit</span>
          </CardTitle>
          <CardDescription>
            Generate a new collection kit for the clinic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clinic ID
              </label>
              <Input 
                placeholder="Enter clinic identifier" 
                value={clinicId} 
                onChange={e => setClinicId(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={createKit} disabled={loading || !clinicId.trim()}>
              {loading ? 'Creating...' : 'Create Kit'}
            </Button>
          </div>
          
          {kitQr && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-green-800 dark:text-green-200">Kit QR Code:</span>
                <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                  {kitQr}
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🩸</span>
            <span>Step 2: Register Sample</span>
          </CardTitle>
          <CardDescription>
            Record biological sample collection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kit QR Code *
              </label>
              <Input 
                placeholder="Scan or enter kit QR code" 
                value={kitQr} 
                onChange={e => setKitQr(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sample Type *
              </label>
              <Select value={sampleType} onValueChange={setSampleType} disabled={loading}>
                <option value="Blood">Blood</option>
                <option value="Saliva">Saliva</option>
                <option value="Buccal">Buccal</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Pseudo ID *
              </label>
              <Input 
                placeholder="Enter subject identifier" 
                value={subjectPseudoid} 
                onChange={e => setSubjectPseudoid(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={createSample} 
              disabled={loading || !kitQr.trim() || !subjectPseudoid.trim()}
              className="min-w-32"
            >
              {loading ? 'Creating...' : 'Register Sample'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consent Workflow Info */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Consent Required</span>
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            Samples require consent before extraction. Upload consent forms in QC section.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Recent Samples */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Samples</CardTitle>
          <CardDescription>
            Last {Math.min(samples.length, 10)} registered samples
          </CardDescription>
        </CardHeader>
        <CardContent>
          {samples.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No samples registered yet</p>
              <p className="text-sm mt-1">Create a kit and register your first sample above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Kit QR</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Consent</TableHead>
                    <TableHead>Collection Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.slice(-10).reverse().map(sample => (
                    <TableRow key={sample.id}>
                      <TableCell className="font-mono text-sm">
                        {sample.id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {sample.kit_qr}
                      </TableCell>
                      <TableCell>{sample.sample_type}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {sample.subject_pseudoid}
                      </TableCell>
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
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            ⚠ Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(sample.collection_datetime).toLocaleDateString()}
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