'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge, Button } from './ui'

export function Header() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference or saved setting
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedMode ? savedMode === 'true' : prefersDark
    
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <>
      {/* Skip Navigation Links */}
      <div className="sr-only focus:not-sr-only">
        <a 
          href="#main-content" 
          className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="fixed top-4 left-32 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to navigation
        </a>
      </div>

      <header 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Product Name */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                aria-label="Gennext LIMS - Go to dashboard"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Gennext LIMS
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    Laboratory Information Management
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav 
              id="navigation"
              className="hidden md:flex items-center space-x-8" 
              role="navigation"
              aria-label="Primary navigation"
            >
              <Link 
                href="/" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Dashboard - Main overview page"
              >
                Dashboard
              </Link>
              <Link 
                href="/intake" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Sample Intake - Register kits and samples"
              >
                Intake
              </Link>
              <Link 
                href="/qc" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="DNA QC - Quality control analysis"
              >
                QC
              </Link>
              <Link 
                href="/plate" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Plate Builder - Create 96-well plates"
              >
                Plate
              </Link>
              <Link 
                href="/runs" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Genotyping Runs - Upload and analyze metrics"
              >
                Runs
              </Link>
              <Link 
                href="/prs" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="PRS Analysis - Generate polygenic risk score packages"
              >
                PRS
              </Link>
              <Link 
                href="/settings" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Settings - System configuration and QC thresholds"
              >
                Settings
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="hidden sm:block">
                <div className="relative" role="search" aria-label="Global search">
                  <label htmlFor="global-search" className="sr-only">
                    Search samples, plates, and other laboratory data
                  </label>
                  <input
                    id="global-search"
                    type="text"
                    placeholder="Search samples, plates..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-describedby="search-description"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="w-4 h-4 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div id="search-description" className="sr-only">
                    Search across all laboratory data including samples, plates, runs, and PRS jobs
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <Badge 
                variant="default" 
                className="hidden sm:inline-flex"
                role="status"
                aria-label="Current user role: Lab Tech"
              >
                Lab Tech
              </Badge>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={darkMode}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}