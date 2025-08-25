import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status' | 'qc'
  status?: 'received' | 'accessioned' | 'extraction' | 'dna-ready' | 'plated' | 'genotyped' | 'hold-qa'
  qc?: 'pass' | 'warn' | 'fail'
  size?: 'sm' | 'md' | 'lg'
}

const statusColors = {
  received: 'bg-status-received-100 text-status-received-800',
  accessioned: 'bg-status-accessioned-100 text-status-accessioned-800',
  extraction: 'bg-status-extraction-100 text-status-extraction-800',
  'dna-ready': 'bg-status-dna-ready-100 text-status-dna-ready-800',
  plated: 'bg-status-plated-100 text-status-plated-800',
  genotyped: 'bg-status-genotyped-100 text-status-genotyped-800',
  'hold-qa': 'bg-status-hold-qa-100 text-status-hold-qa-800',
}

const qcColors = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', status, qc, size = 'md', ...props }, ref) => {
    let colorClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
    
    if (variant === 'status' && status) {
      colorClass = statusColors[status] || colorClass
    } else if (variant === 'qc' && qc) {
      colorClass = qcColors[qc] || colorClass
    }

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium ring-1 ring-inset ring-gray-500/10',
          sizes[size],
          colorClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'