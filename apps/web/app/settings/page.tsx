'use client'
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { useSettings } from '@/contexts/settings-context'

export default function Page() {
  const { settings } = useSettings()
  const { addToast } = useToast()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast({ message: `${label} copied to clipboard`, type: 'success' })
    }).catch(() => {
      addToast({ message: 'Failed to copy to clipboard', type: 'error' })
    })
  }

  const thresholdExplanations = [
    {
      category: "DNA Extraction QC",
      description: "Quality control thresholds for DNA extraction and nanodrop analysis",
      thresholds: [
        {
          name: "DNA_MIN_CONC",
          value: settings?.DNA_MIN_CONC,
          unit: "ng/µL",
          description: "Minimum DNA concentration required for downstream analysis",
          type: "DNA Quality"
        },
        {
          name: "A260_280_MIN",
          value: settings?.A260_280_MIN,
          unit: "ratio",
          description: "Minimum A260/280 ratio for acceptable protein contamination levels",
          type: "DNA Purity"
        },
        {
          name: "A260_280_MAX", 
          value: settings?.A260_280_MAX,
          unit: "ratio",
          description: "Maximum A260/280 ratio for acceptable protein contamination levels",
          type: "DNA Purity"
        },
        {
          name: "A260_230_MIN",
          value: settings?.A260_230_MIN,
          unit: "ratio", 
          description: "Minimum A260/230 ratio for acceptable salt/phenol contamination levels",
          type: "DNA Purity"
        }
      ]
    },
    {
      category: "Genotyping QC",
      description: "Quality control thresholds for genotyping array analysis",
      thresholds: [
        {
          name: "CALLRATE_MIN",
          value: settings?.CALLRATE_MIN,
          unit: "fraction",
          description: "Minimum call rate (fraction of SNPs successfully genotyped) for sample pass",
          type: "Genotype Quality"
        },
        {
          name: "DISHQC_MIN",
          value: settings?.DISHQC_MIN,
          unit: "score",
          description: "Minimum Dish QC score (array hybridization quality metric)",
          type: "Array Quality"
        }
      ]
    }
  ]

  const systemInfo = [
    { label: "Frontend", value: "Next.js 14 (App Router)" },
    { label: "Backend", value: "FastAPI + SQLAlchemy" },
    { label: "Database", value: "SQLite (Development)" },
    { label: "Environment", value: process.env.NODE_ENV || 'development' },
    { label: "API URL", value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' }
  ]

  const workflowSteps = [
    {
      step: 1,
      name: "Sample Intake",
      description: "Register kits and biological samples with collection metadata"
    },
    {
      step: 2,
      name: "DNA QC",
      description: "Extract DNA and perform quality control with nanodrop measurements"
    },
    {
      step: 3,
      name: "Plate Builder",
      description: "Create 96-well plates for genotyping arrays with sentrix positioning"
    },
    {
      step: 4,
      name: "Genotyping Runs",
      description: "Execute array-based genotyping and upload QC metrics"
    },
    {
      step: 5,
      name: "PRS Analysis",
      description: "Generate Polygenic Risk Score packages from quality-controlled data"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quality control thresholds and system configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {settings ? 'Connected' : 'Loading...'}
          </Badge>
        </div>
      </div>

      {/* QC Thresholds */}
      {thresholdExplanations.map((category, categoryIndex) => (
        <Card key={categoryIndex}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{categoryIndex === 0 ? '🧪' : '🧬'}</span>
              <span>{category.category}</span>
            </CardTitle>
            <CardDescription>
              {category.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.thresholds.map((threshold, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                          {threshold.name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-medium">
                            {threshold.value !== undefined ? threshold.value : 'Loading...'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {threshold.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {threshold.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {threshold.description}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => copyToClipboard(
                            threshold.value?.toString() || '', 
                            threshold.name
                          )}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          disabled={!threshold.value}
                        >
                          Copy
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* QC Logic Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚖️</span>
            <span>QC Status Logic</span>
          </CardTitle>
          <CardDescription>
            How samples are classified based on quality control metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-green-500 text-white">Pass</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>DNA QC:</strong> All metrics within acceptable ranges</p>
                <p><strong>Genotyping:</strong> Call Rate ≥ {settings?.CALLRATE_MIN} AND Dish QC ≥ {settings?.DISHQC_MIN}</p>
                <p className="text-green-700 dark:text-green-300 font-medium">✓ Eligible for all downstream analysis</p>
              </div>
            </div>
            
            <div className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary" className="bg-amber-500 text-white">Warn</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>DNA QC:</strong> Minor deviations from optimal ranges</p>
                <p><strong>Genotyping:</strong> Call Rate 0.97-{(settings?.CALLRATE_MIN || 0) - 0.01} AND Dish QC ≥ {settings?.DISHQC_MIN}</p>
                <p className="text-amber-700 dark:text-amber-300 font-medium">⚠ Usable with caution</p>
              </div>
            </div>
            
            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="destructive">Fail</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>DNA QC:</strong> Metrics below minimum thresholds</p>
                <p><strong>Genotyping:</strong> Call Rate &lt; 0.97 OR Dish QC &lt; {settings?.DISHQC_MIN}</p>
                <p className="text-red-700 dark:text-red-300 font-medium">✗ Excluded from analysis</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔄</span>
            <span>LIMS Workflow</span>
          </CardTitle>
          <CardDescription>
            Standard laboratory workflow for genomic analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{step.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="absolute left-4 mt-8 w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💻</span>
            <span>System Information</span>
          </CardTitle>
          <CardDescription>
            Technical details and environment configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {systemInfo.map((info, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{info.label}</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{info.value}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2 text-blue-800 dark:text-blue-200 text-sm">
              <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium">Development Mode:</span> QC thresholds are configurable via environment variables. 
                In production, these should be managed through a secure configuration system.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🚀</span>
            <span>Planned Features</span>
          </CardTitle>
          <CardDescription>
            Upcoming enhancements to the LIMS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Configuration Management</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Editable QC thresholds via UI</li>
                <li>• Custom array manifests</li>
                <li>• Email notification settings</li>
                <li>• Audit trail for changes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">User Management</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Role-based access control</li>
                <li>• User authentication</li>
                <li>• Activity logging</li>
                <li>• Multi-lab support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Advanced Analytics</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• QC trend analysis</li>
                <li>• Batch effect detection</li>
                <li>• Statistical reporting</li>
                <li>• Data export tools</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Integration</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Laboratory equipment APIs</li>
                <li>• External database connectors</li>
                <li>• Workflow automation</li>
                <li>• Cloud storage integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}