import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated' | 'glass' | 'gradient'
  glow?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        'relative rounded-xl border backdrop-blur-sm transition-all duration-300',
        'bg-white/85 dark:bg-slate-900/85',
        
        // Border styles
        'border-slate-200/60 dark:border-slate-700/60',
        
        // Default variant
        variant === 'default' && [
          'shadow-card hover:shadow-card-hover',
          'hover:-translate-y-0.5 hover:border-slate-300/60 dark:hover:border-slate-600/60'
        ],
        
        // Interactive variant
        variant === 'interactive' && [
          'shadow-card hover:shadow-card-hover',
          'cursor-pointer transition-all duration-200',
          'hover:-translate-y-1 hover:border-primary-300/60 dark:hover:border-primary-600/60',
          'hover:bg-gradient-to-br hover:from-white hover:to-slate-50/50',
          'dark:hover:from-slate-800/80 dark:hover:to-slate-700/80',
          'active:translate-y-0 active:shadow-sm',
          'bg-white/90 dark:bg-slate-800/90' // Ensure proper base backgrounds
        ],
        
        // Elevated variant
        variant === 'elevated' && [
          'shadow-lg hover:shadow-xl',
          'bg-white dark:bg-slate-900',
          'border-slate-300/60 dark:border-slate-600/60',
          'hover:-translate-y-1'
        ],
        
        // Glass variant
        variant === 'glass' && [
          'glass-effect shadow-lg',
          'border-white/20 dark:border-slate-700/30',
          'hover:shadow-xl hover:border-white/30 dark:hover:border-slate-600/40'
        ],
        
        // Gradient variant
        variant === 'gradient' && [
          'bg-gradient-to-br from-primary-50/50 to-secondary-50/50',
          'dark:from-primary-950/20 dark:to-secondary-950/20',
          'border-primary-200/60 dark:border-primary-800/60',
          'shadow-card hover:shadow-card-hover',
          'hover:from-primary-100/50 hover:to-secondary-100/50',
          'dark:hover:from-primary-900/30 dark:hover:to-secondary-900/30'
        ],
        
        // Glow effect
        glow && 'shadow-glow hover:shadow-glow-lg',
        
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        'flex flex-col space-y-2 p-6 pb-4',
        // Optional: Add subtle border bottom
        // 'border-b border-slate-200/50 dark:border-slate-700/50',
        className
      )} 
      {...props} 
    />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        'font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100',
        'text-lg sm:text-xl',
        className
      )} 
      {...props} 
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn(
        'text-sm leading-relaxed text-slate-600 dark:text-slate-400',
        'max-w-none text-balance', // Better text wrapping
        className
      )} 
      {...props} 
    />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        'p-6 pt-0',
        'text-slate-700 dark:text-slate-300',
        className
      )} 
      {...props} 
    />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        'flex items-center justify-between p-6 pt-0',
        // Optional: Add subtle border top
        // 'border-t border-slate-200/50 dark:border-slate-700/50 mt-4',
        className
      )} 
      {...props} 
    />
  )
)
CardFooter.displayName = 'CardFooter'

// Specialized card components for specific use cases
export const StatCard = React.forwardRef<HTMLDivElement, CardProps & {
  icon?: React.ReactNode
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    positive: boolean
  }
}>(({ className, icon, label, value, trend, ...props }, ref) => (
  <Card
    ref={ref}
    variant="interactive"
    className={cn('group', className)}
    {...props}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center text-xs font-medium',
              trend.positive ? 'text-emerald-600' : 'text-red-600'
            )}>
              <span className="mr-1">
                {trend.positive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
))
StatCard.displayName = 'StatCard'