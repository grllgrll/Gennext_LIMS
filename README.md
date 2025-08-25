# Gennext LIMS — Laboratory Information Management System

A production-ready **React (Next.js) + FastAPI** monorepo for comprehensive LIMS workflow management.

> **Phase 2 Complete** — Full LIMS workflow with advanced features implemented

## 🚀 Features

### Core LIMS Workflow
- **Sample Intake** — Specimen registration with consent tracking
- **Quality Control** — DNA extraction with three-state validation (Pass/Warn/Fail)
- **Plate Building** — 96-well plate management with barcode validation
- **Run Management** — JSON metrics validation with QC summaries
- **PRS Processing** — Polygenic Risk Score workflow with status tracking

### Phase 2 Enhancements
- ⚙️ **Settings API** — Centralized QC thresholds management
- 🎨 **Smart QC Coloring** — Dynamic Pass/Warn/Fail states based on thresholds
- 📋 **Consent Tracking** — Sample consent indicators throughout workflow
- 🔍 **Barcode Validation** — Real-time Sentrix barcode validation (`^[0-9]{10,12}$`)
- 💾 **Draft Persistence** — Auto-save plate configurations to localStorage
- 📊 **Enhanced Runs Page** — JSON validation with per-row error handling
- ✨ **Polished UX** — Better empty states and navigation guidance
- ♿ **Accessibility** — Focus trap, ARIA labels, keyboard navigation

## 🏗️ Architecture

```
apps/
├── web/           # Next.js 14 frontend with App Router
│   ├── app/       # Page routes (intake, qc, plate, runs, prs, settings)
│   ├── components/ # UI components with design system
│   ├── contexts/  # React Context (Settings, Toast)
│   └── lib/       # Utilities (i18n, validation)
├── api/           # FastAPI backend
│   ├── app.py     # All LIMS endpoints with ORM models
│   └── lims.db    # SQLite database
docs/              # Technical documentation
infra/             # Docker configuration
```

## 🚀 Quick Start

### Local Development
```bash
# Backend (Terminal 1)
cd apps/api && python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)
cd apps/web && npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000 — LIMS workflow interface
- **Backend API**: http://localhost:8000 — FastAPI with auto-docs at `/docs`
- **Settings API**: http://localhost:8000/settings — QC thresholds configuration

## 🎯 Workflow

1. **Intake** → Register samples with consent tracking
2. **QC** → Extract DNA with three-state validation
3. **Plate** → Build 96-well plates with barcode validation
4. **Runs** → Upload metrics with JSON validation
5. **PRS** → Process polygenic risk scores
6. **Settings** → Configure QC thresholds

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS v4
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **UI**: Custom component library with dark mode
- **State**: React Context, localStorage persistence
- **Validation**: Real-time form validation, JSON schema
- **Accessibility**: WCAG compliant with focus management
