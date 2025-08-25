'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'

interface Run {
  id: string
  run_name: string
  run_date: string
  status: string
  beadchip_count: number
}

interface PRSJob {
  id: string
  run_id: string
  job_name: string
  status: string
  output_path?: string
}

export default function Page() {
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRun, setSelectedRun] = useState('')
  const [jobName, setJobName] = useState('')
  const [prsJobs, setPrsJobs] = useState<PRSJob[]>([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchRuns = async () => {
    try {
      const response = await fetch(`${API_URL}/runs`)
      if (response.ok) {
        const data = await response.json()
        // Only show completed runs for PRS generation
        setRuns(data.filter((r: Run) => r.status === 'Completed'))
      }
    } catch (error) {
      console.error('Error fetching runs:', error)
    }
  }

  const fetchPrsJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/prs_jobs`)
      if (response.ok) {
        const data = await response.json()
        setPrsJobs(data)
      }
    } catch (error) {
      console.error('Error fetching PRS jobs:', error)
    }
  }

  const createPrsPackage = async () => {
    if (!selectedRun) {
      addToast({ message: 'Please select a completed run', type: 'error' })
      return
    }
    if (!jobName.trim()) {
      addToast({ message: 'Please enter a job name', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/runs/${selectedRun}/prs_package`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({job_name: jobName.trim()})
      })
      
      if (!response.ok) {
        const error = await response.json()
        addToast({ message: error.detail || 'Failed to create PRS package', type: 'error' })
        return
      }
      
      const job = await response.json()
      addToast({ message: `PRS package ${job.id} created successfully`, type: 'success' })
      setSelectedRun('')
      setJobName('')
      fetchPrsJobs()
    } catch (error: any) {
      addToast({ message: error.message || 'Error creating PRS package', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getSelectedRunDetails = () => {
    return runs.find(r => r.id === selectedRun)
  }

  useEffect(() => {
    fetchRuns()
    fetchPrsJobs()
  }, [])

  const completedRuns = runs.filter(r => r.status === 'Completed')
  const processingJobs = prsJobs.filter(j => j.status === 'Processing').length
  const completedJobs = prsJobs.filter(j => j.status === 'Completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PRS Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate Polygenic Risk Score packages from completed runs
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {completedRuns.length} eligible runs
          </Badge>
          <Badge variant="outline">
            {prsJobs.length} total jobs
          </Badge>
        </div>
      </div>

      {/* Create PRS Package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧬</span>
            <span>Create PRS Package</span>
          </CardTitle>
          <CardDescription>
            Generate analysis-ready datasets from genotyping runs that have passed QC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedRuns.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="font-medium">No completed runs available</p>
              <p className="text-sm mt-1">Upload genotype metrics to complete runs first</p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => window.location.href = '/runs'}>
                  Go to Runs
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Completed Run *
                </label>
                <Select 
                  value={selectedRun} 
                  onValueChange={setSelectedRun}
                  disabled={loading}
                >
                  <option value="">Choose a completed run...</option>
                  {completedRuns.map(run => (
                    <option key={run.id} value={run.id}>
                      {run.id} - {run.run_name} ({run.beadchip_count} chips)
                    </option>
                  ))}
                </Select>
                {selectedRun && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>
                        Selected: {getSelectedRunDetails()?.run_name} - Only Pass/Warn samples will be included
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Name *
                </label>
                <Input 
                  placeholder="Enter descriptive job name (e.g., CAD_PRS_v2.1)" 
                  value={jobName} 
                  onChange={(e) => setJobName(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={createPrsPackage}
                  disabled={loading || !selectedRun || !jobName.trim()}
                  className="min-w-32"
                >
                  {loading ? 'Creating...' : 'Create PRS Package'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Overview */}
      {prsJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Status Overview</CardTitle>
            <CardDescription>Current PRS job processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {prsJobs.length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {processingJobs}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completedJobs}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {prsJobs.filter(j => j.status === 'Failed').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRS Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>PRS Jobs</CardTitle>
          <CardDescription>Generated PRS analysis packages</CardDescription>
        </CardHeader>
        <CardContent>
          {prsJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">No PRS jobs created yet</p>
              <p className="text-sm mt-1">Create your first PRS package from a completed genotyping run</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prsJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.id}</TableCell>
                      <TableCell className="font-mono text-sm">{job.run_id}</TableCell>
                      <TableCell>{job.job_name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.output_path ? (
                          <div className="text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Ready</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {job.output_path}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Files Info */}
      {prsJobs.some(job => job.output_path) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📁</span>
              <span>Package Contents</span>
            </CardTitle>
            <CardDescription>Files included in completed PRS packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">📄 samples.tsv</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sample information with subject IDs, status, and final QC flags. Only Pass/Warn samples included.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">📊 metrics.tsv</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Genotype QC metrics including call rates, Dish QC, heterozygosity, and sex concordance.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">📋 manifest.md</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Package manifest with job metadata, sample counts, and QC summary statistics.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-medium">Note:</span> PRS packages only include samples with Pass or Warn QC status. 
                  Failed samples are excluded to ensure analysis quality.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}