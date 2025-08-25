'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, StatCard } from '@/components/ui'

interface DashboardStats {
  samples: { total: number; byStatus: Record<string, number> }
  plates: { total: number; active: number }
  runs: { total: number; inProgress: number }
  prsJobs: { total: number; pending: number }
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Modern Icons (SVG components for professional appearance)
  const BeakerIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
    </svg>
  )

  const PlateIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )

  const RunIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )

  const DNAIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container-page space-y-8 animate-in">
          {/* Loading Header */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl animate-pulse" />
              <div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 animate-pulse" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64 mt-2 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="elevated" className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                    </div>
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Quick Actions */}
          <Card variant="glass" className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const quickActions = [
    { 
      href: '/intake', 
      label: 'Register Samples', 
      icon: <BeakerIcon className="w-6 h-6" />,
      description: 'Register new kits and samples',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      href: '/qc', 
      label: 'DNA QC Batch', 
      icon: <DNAIcon className="w-6 h-6" />,
      description: 'Quality control analysis',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      href: '/plate', 
      label: 'Build Plate', 
      icon: <PlateIcon className="w-6 h-6" />,
      description: 'Create 96-well plates',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      href: '/runs', 
      label: 'Submit Run', 
      icon: <RunIcon className="w-6 h-6" />,
      description: 'Upload genotyping metrics',
      color: 'from-orange-500 to-red-500'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container-page space-y-8 animate-in">
        {/* Modern Header with Hero Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BeakerIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Laboratory Dashboard
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Real-time overview of laboratory operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant="outline" 
                className="px-3 py-1 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950/20 dark:to-secondary-950/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300"
              >
                ✨ Lab Operations
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Samples"
            value={stats?.samples.total ?? 0}
            icon={<BeakerIcon className="w-6 h-6" />}
            trend={stats?.samples.total ? {
              value: 12,
              label: 'vs last week',
              positive: true
            } : undefined}
            className="animate-slide-up"
            style={{ animationDelay: '0ms' }}
          />
          
          <StatCard
            label="Active Plates"
            value={stats?.plates.active ?? 0}
            icon={<PlateIcon className="w-6 h-6" />}
            trend={stats?.plates.active ? {
              value: 8,
              label: 'vs last week',
              positive: true
            } : undefined}
            className="animate-slide-up"
            style={{ animationDelay: '100ms' }}
          />
          
          <StatCard
            label="Running Jobs"
            value={stats?.runs.inProgress ?? 0}
            icon={<RunIcon className="w-6 h-6" />}
            trend={stats?.runs.inProgress ? {
              value: 3,
              label: 'vs last week',
              positive: false
            } : undefined}
            className="animate-slide-up"
            style={{ animationDelay: '200ms' }}
          />
          
          <StatCard
            label="PRS Pending"
            value={stats?.prsJobs.pending ?? 0}
            icon={<DNAIcon className="w-6 h-6" />}
            trend={stats?.prsJobs.pending ? {
              value: 15,
              label: 'vs last week',
              positive: true
            } : undefined}
            className="animate-slide-up"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        {/* Modern Quick Actions */}
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-base">
                  Start common laboratory workflows
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Live System</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={action.href} href={action.href} className="group">
                  <Card 
                    variant="interactive" 
                    className="h-full border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-700/50 hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className="text-white">
                          {action.icon}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {action.label}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sample Status Breakdown */}
        {stats?.samples.byStatus && Object.keys(stats.samples.byStatus).length > 0 && (
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-xl">Sample Status Overview</CardTitle>
              <CardDescription>Current distribution of samples across workflow stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.samples.byStatus).map(([status, count]) => (
                  <div key={status} className="text-center space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {count}
                    </div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {status.replace(/-/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Timeline */}
        <Card variant="gradient" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Latest laboratory updates and system events</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Activity Timeline Coming Soon</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Real-time activity feed will display sample processing events, QC results, and system notifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
