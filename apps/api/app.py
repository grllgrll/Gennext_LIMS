from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
from pathlib import Path

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lims.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# QC Thresholds (environment-overridable)
DNA_MIN_CONC = float(os.getenv("DNA_MIN_CONC", "20"))
A260_280_MIN = float(os.getenv("A260_280_MIN", "1.7"))
A260_280_MAX = float(os.getenv("A260_280_MAX", "2.1"))
A260_230_MIN = float(os.getenv("A260_230_MIN", "1.8"))
CALLRATE_MIN = float(os.getenv("CALLRATE_MIN", "0.98"))
DISHQC_MIN = float(os.getenv("DISHQC_MIN", "0.82"))

# SQLAlchemy Models
class KitModel(Base):
    __tablename__ = "kits"
    id = Column(String, primary_key=True)
    qr_code = Column(String, unique=True, nullable=False)
    clinic_id = Column(String, nullable=True)
    status = Column(String, default="Allocated")
    created_at = Column(DateTime, default=datetime.utcnow)
    samples = relationship("SampleModel", back_populates="kit")

class SampleModel(Base):
    __tablename__ = "samples"
    id = Column(String, primary_key=True)
    kit_qr = Column(String, ForeignKey("kits.qr_code"))
    sample_type = Column(String)
    subject_pseudoid = Column(String)
    collection_datetime = Column(DateTime)
    status = Column(String, default="Received")
    created_at = Column(DateTime, default=datetime.utcnow)
    kit = relationship("KitModel", back_populates="samples")
    consent = relationship("ConsentModel", back_populates="sample", uselist=False)
    aliquots = relationship("AliquotModel", back_populates="sample")

class ConsentModel(Base):
    __tablename__ = "consents"
    id = Column(String, primary_key=True)
    sample_id = Column(String, ForeignKey("samples.id"))
    consent_type = Column(String)
    consent_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    sample = relationship("SampleModel", back_populates="consent")

class ExtractionBatchModel(Base):
    __tablename__ = "extraction_batches"
    id = Column(String, primary_key=True)
    batch_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    aliquots = relationship("AliquotModel", back_populates="extraction_batch")

class AliquotModel(Base):
    __tablename__ = "aliquots"
    id = Column(String, primary_key=True)
    sample_id = Column(String, ForeignKey("samples.id"))
    extraction_batch_id = Column(String, ForeignKey("extraction_batches.id"))
    label = Column(String)
    qc_flag = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sample = relationship("SampleModel", back_populates="aliquots")
    extraction_batch = relationship("ExtractionBatchModel", back_populates="aliquots")
    dna_qc = relationship("DNAQCModel", back_populates="aliquot", uselist=False)
    plate_wells = relationship("PlateWellModel", back_populates="aliquot")

class DNAQCModel(Base):
    __tablename__ = "dna_qc"
    id = Column(String, primary_key=True)
    aliquot_id = Column(String, ForeignKey("aliquots.id"))
    concentration = Column(Float)
    a260_280 = Column(Float)
    a260_230 = Column(Float)
    qc_flag = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    aliquot = relationship("AliquotModel", back_populates="dna_qc")

class PlateModel(Base):
    __tablename__ = "plates"
    id = Column(String, primary_key=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    wells = relationship("PlateWellModel", back_populates="plate")

class PlateWellModel(Base):
    __tablename__ = "plate_wells"
    id = Column(String, primary_key=True)
    plate_id = Column(String, ForeignKey("plates.id"))
    aliquot_id = Column(String, ForeignKey("aliquots.id"))
    well = Column(String)
    sentrix_barcode = Column(String)
    sentrix_position = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    plate = relationship("PlateModel", back_populates="wells")
    aliquot = relationship("AliquotModel", back_populates="plate_wells")

class RunModel(Base):
    __tablename__ = "runs"
    id = Column(String, primary_key=True)
    run_name = Column(String)
    run_date = Column(DateTime)
    status = Column(String, default="Created")
    created_at = Column(DateTime, default=datetime.utcnow)
    beadchips = relationship("BeadChipModel", back_populates="run")
    metrics = relationship("GenotypeMetricsModel", back_populates="run")
    prs_jobs = relationship("PRSJobModel", back_populates="run")

class BeadChipModel(Base):
    __tablename__ = "beadchips"
    id = Column(String, primary_key=True)
    run_id = Column(String, ForeignKey("runs.id"))
    barcode = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    run = relationship("RunModel", back_populates="beadchips")

class GenotypeMetricsModel(Base):
    __tablename__ = "genotype_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String, ForeignKey("runs.id"))
    sample_id = Column(String, ForeignKey("samples.id"))
    call_rate = Column(Float)
    dish_qc = Column(Float)
    heterozygosity = Column(Float, nullable=True)
    sex_call = Column(String, nullable=True)
    sex_concordance = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    run = relationship("RunModel", back_populates="metrics")

class PRSJobModel(Base):
    __tablename__ = "prs_jobs"
    id = Column(String, primary_key=True)
    run_id = Column(String, ForeignKey("runs.id"))
    job_name = Column(String)
    status = Column(String, default="Created")
    output_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    run = relationship("RunModel", back_populates="prs_jobs")

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Gennext LIMS — API", version="0.0.1")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class KitCreate(BaseModel):
    clinic_id: Optional[str] = None

class KitOut(BaseModel):
    id: str
    qr_code: str
    clinic_id: Optional[str]
    status: str

class SampleCreate(BaseModel):
    kit_qr: str
    sample_type: str
    subject_pseudoid: str
    collection_datetime: datetime

class SampleOut(BaseModel):
    id: str
    kit_qr: str
    sample_type: str
    subject_pseudoid: str
    collection_datetime: datetime
    status: str
    has_consent: bool

class ConsentCreate(BaseModel):
    sample_id: str
    consent_type: str = "General"
    consent_date: datetime = Field(default_factory=datetime.utcnow)

class ExtractionCreate(BaseModel):
    sample_ids: List[str]

class AliquotOut(BaseModel):
    id: str
    sample_id: str
    label: str
    qc_flag: Optional[str] = None

class DNAQCIn(BaseModel):
    aliquot_id: str
    concentration: float
    a260_280: float
    a260_230: float

class DNAQCResult(BaseModel):
    aliquot_id: str
    qc_flag: str

class PlateCreate(BaseModel):
    name: str
    wells: List[Dict[str, str]]  # [{well, aliquot_id, sentrix_barcode, sentrix_position}]

class PlateOut(BaseModel):
    id: str
    name: str
    well_count: int

class RunCreate(BaseModel):
    run_name: str
    run_date: datetime = Field(default_factory=datetime.utcnow)
    beadchip_barcodes: List[str]

class RunOut(BaseModel):
    id: str
    run_name: str
    run_date: datetime
    status: str
    beadchip_count: int

class MetricsIn(BaseModel):
    sample_id: str
    call_rate: float
    dish_qc: float
    heterozygosity: Optional[float] = None
    sex_call: Optional[str] = None
    sex_concordance: Optional[str] = None

class PRSJobCreate(BaseModel):
    job_name: str

class PRSJobOut(BaseModel):
    id: str
    run_id: str
    job_name: str
    status: str
    output_path: Optional[str]

# Endpoints
@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.get("/settings")
def get_settings():
    """Return QC thresholds and system settings"""
    return {
        "DNA_MIN_CONC": DNA_MIN_CONC,
        "A260_280_MIN": A260_280_MIN,
        "A260_280_MAX": A260_280_MAX,
        "A260_230_MIN": A260_230_MIN,
        "CALLRATE_MIN": CALLRATE_MIN,
        "DISHQC_MIN": DISHQC_MIN
    }

@app.post("/kits", response_model=KitOut)
def create_kit(payload: KitCreate, db: Session = Depends(get_db)):
    kit_count = db.query(KitModel).count()
    kit = KitModel(
        id=f"KIT-{kit_count+1:04d}",
        qr_code=f"QR-{kit_count+1:04d}",
        clinic_id=payload.clinic_id,
        status="Allocated"
    )
    db.add(kit)
    db.commit()
    return KitOut(
        id=kit.id,
        qr_code=kit.qr_code,
        clinic_id=kit.clinic_id,
        status=kit.status
    )

@app.get("/kits", response_model=List[KitOut])
def list_kits(db: Session = Depends(get_db)):
    kits = db.query(KitModel).all()
    return [KitOut(
        id=k.id,
        qr_code=k.qr_code,
        clinic_id=k.clinic_id,
        status=k.status
    ) for k in kits]

@app.post("/samples", response_model=SampleOut)
def create_sample(payload: SampleCreate, db: Session = Depends(get_db)):
    # Verify kit exists
    kit = db.query(KitModel).filter(KitModel.qr_code == payload.kit_qr).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Kit not found")
    
    sample_count = db.query(SampleModel).count()
    sample = SampleModel(
        id=f"SAMP-{sample_count+1:05d}",
        kit_qr=payload.kit_qr,
        sample_type=payload.sample_type,
        subject_pseudoid=payload.subject_pseudoid,
        collection_datetime=payload.collection_datetime,
        status="Received"
    )
    db.add(sample)
    db.commit()
    return SampleOut(
        id=sample.id,
        kit_qr=sample.kit_qr,
        sample_type=sample.sample_type,
        subject_pseudoid=sample.subject_pseudoid,
        collection_datetime=sample.collection_datetime,
        status=sample.status
    )

@app.get("/samples", response_model=List[SampleOut])
def list_samples(db: Session = Depends(get_db)):
    samples = db.query(SampleModel).all()
    return [SampleOut(
        id=s.id,
        kit_qr=s.kit_qr,
        sample_type=s.sample_type,
        subject_pseudoid=s.subject_pseudoid,
        collection_datetime=s.collection_datetime,
        status=s.status,
        has_consent=s.consent is not None
    ) for s in samples]

@app.post("/consents")
def create_consent(payload: ConsentCreate, db: Session = Depends(get_db)):
    consent_count = db.query(ConsentModel).count()
    consent = ConsentModel(
        id=f"CONS-{consent_count+1:04d}",
        sample_id=payload.sample_id,
        consent_type=payload.consent_type,
        consent_date=payload.consent_date
    )
    db.add(consent)
    
    # Update sample status to Accessioned
    sample = db.query(SampleModel).filter(SampleModel.id == payload.sample_id).first()
    if sample:
        sample.status = "Accessioned"
    
    db.commit()
    return {"id": consent.id, "sample_id": consent.sample_id}

@app.post("/extractions")
def create_extraction(payload: ExtractionCreate, db: Session = Depends(get_db)):
    # Check consent gate for all samples
    missing_consent = []
    for sample_id in payload.sample_ids:
        sample = db.query(SampleModel).filter(SampleModel.id == sample_id).first()
        if sample:
            consent = db.query(ConsentModel).filter(ConsentModel.sample_id == sample_id).first()
            if not consent:
                missing_consent.append(sample_id)
    
    if missing_consent:
        raise HTTPException(
            status_code=400, 
            detail=f"Consent required: sample(s) {', '.join(missing_consent)} missing Consent. Attach via /consents before extraction."
        )
    
    batch_count = db.query(ExtractionBatchModel).count()
    batch = ExtractionBatchModel(
        id=f"EXT-{batch_count+1:04d}",
        batch_date=datetime.utcnow()
    )
    db.add(batch)
    
    aliquots = []
    for sample_id in payload.sample_ids:
        sample = db.query(SampleModel).filter(SampleModel.id == sample_id).first()
        if sample:
            sample.status = "Extraction"
            aliquot_count = db.query(AliquotModel).filter(AliquotModel.sample_id == sample_id).count()
            aliquot = AliquotModel(
                id=f"{sample_id}-A{aliquot_count+1:02d}",
                sample_id=sample_id,
                extraction_batch_id=batch.id,
                label=f"Aliquot {aliquot_count+1}"
            )
            db.add(aliquot)
            aliquots.append({
                "id": aliquot.id,
                "sample_id": aliquot.sample_id,
                "label": aliquot.label
            })
    
    db.commit()
    return {"batch_id": batch.id, "aliquots": aliquots}

@app.get("/aliquots", response_model=List[AliquotOut])
def list_aliquots(db: Session = Depends(get_db)):
    aliquots = db.query(AliquotModel).all()
    return [AliquotOut(
        id=a.id,
        sample_id=a.sample_id,
        label=a.label,
        qc_flag=a.qc_flag
    ) for a in aliquots]

@app.post("/extractions/qc")
def submit_dna_qc(qcs: List[DNAQCIn], db: Session = Depends(get_db)):
    results = []
    for qc in qcs:
        # Calculate QC flag
        qc_flag = "Pass"
        if qc.concentration < DNA_MIN_CONC:
            if qc.concentration >= DNA_MIN_CONC * 0.7:
                qc_flag = "Warn"
            else:
                qc_flag = "Fail"
        elif not (A260_280_MIN <= qc.a260_280 <= A260_280_MAX):
            qc_flag = "Warn" if abs(qc.a260_280 - 1.9) <= 0.3 else "Fail"
        elif qc.a260_230 < A260_230_MIN:
            qc_flag = "Warn" if qc.a260_230 >= A260_230_MIN * 0.9 else "Fail"
        
        # Save QC data
        qc_count = db.query(DNAQCModel).count()
        dna_qc = DNAQCModel(
            id=f"QC-{qc_count+1:05d}",
            aliquot_id=qc.aliquot_id,
            concentration=qc.concentration,
            a260_280=qc.a260_280,
            a260_230=qc.a260_230,
            qc_flag=qc_flag
        )
        db.add(dna_qc)
        
        # Update aliquot and sample status
        aliquot = db.query(AliquotModel).filter(AliquotModel.id == qc.aliquot_id).first()
        if aliquot:
            aliquot.qc_flag = qc_flag
            sample = db.query(SampleModel).filter(SampleModel.id == aliquot.sample_id).first()
            if sample:
                if qc_flag in ["Pass", "Warn"]:
                    sample.status = "DNA Ready"
                else:
                    sample.status = "Hold for QA"
        
        results.append(DNAQCResult(aliquot_id=qc.aliquot_id, qc_flag=qc_flag))
    
    db.commit()
    return {"qcs": results}

@app.post("/plates", response_model=PlateOut)
def create_plate(payload: PlateCreate, db: Session = Depends(get_db)):
    # Check consent gate for all aliquots
    missing_consent = []
    for well_data in payload.wells:
        aliquot = db.query(AliquotModel).filter(AliquotModel.id == well_data["aliquot_id"]).first()
        if aliquot:
            consent = db.query(ConsentModel).filter(ConsentModel.sample_id == aliquot.sample_id).first()
            if not consent:
                missing_consent.append(aliquot.sample_id)
    
    if missing_consent:
        unique_missing = list(set(missing_consent))
        raise HTTPException(
            status_code=400, 
            detail=f"Consent required: sample(s) {', '.join(unique_missing)} missing Consent. Attach via /consents before plating."
        )
    
    # Check for uniqueness violations within this plate
    sentrix_positions = {}
    aliquot_wells = {}
    
    for well_data in payload.wells:
        sentrix_key = (well_data["sentrix_barcode"], well_data["sentrix_position"])
        aliquot_id = well_data["aliquot_id"]
        well_pos = well_data["well"]
        
        if sentrix_key in sentrix_positions:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate Sentrix position {well_data['sentrix_position']} on plate"
            )
        sentrix_positions[sentrix_key] = well_pos
        
        if aliquot_id in aliquot_wells:
            raise HTTPException(
                status_code=400,
                detail=f"Aliquot {aliquot_id} already assigned to well {aliquot_wells[aliquot_id]}"
            )
        aliquot_wells[aliquot_id] = well_pos
    
    plate_count = db.query(PlateModel).count()
    plate = PlateModel(
        id=f"PLT-{plate_count+1:04d}",
        name=payload.name
    )
    db.add(plate)
    
    for well_data in payload.wells:
        well_count = db.query(PlateWellModel).count()
        well = PlateWellModel(
            id=f"WELL-{well_count+1:05d}",
            plate_id=plate.id,
            aliquot_id=well_data["aliquot_id"],
            well=well_data["well"],
            sentrix_barcode=well_data["sentrix_barcode"],
            sentrix_position=well_data["sentrix_position"]
        )
        db.add(well)
        
        # Update sample status to Plated
        aliquot = db.query(AliquotModel).filter(AliquotModel.id == well_data["aliquot_id"]).first()
        if aliquot:
            sample = db.query(SampleModel).filter(SampleModel.id == aliquot.sample_id).first()
            if sample:
                sample.status = "Plated"
    
    db.commit()
    return PlateOut(
        id=plate.id,
        name=plate.name,
        well_count=len(payload.wells)
    )

@app.get("/plates", response_model=List[PlateOut])
def list_plates(db: Session = Depends(get_db)):
    plates = db.query(PlateModel).all()
    return [PlateOut(
        id=p.id,
        name=p.name,
        well_count=len(p.wells)
    ) for p in plates]

@app.get("/plates/{plate_id}/samplesheet", response_class=PlainTextResponse)
def get_samplesheet(plate_id: str, db: Session = Depends(get_db)):
    plate = db.query(PlateModel).filter(PlateModel.id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")
    
    # Generate Illumina SampleSheet format
    samplesheet = "[Header]\n"
    samplesheet += f"Date,{datetime.now().strftime('%m/%d/%Y')}\n"
    samplesheet += f"Workflow,GenerateFASTQ\n"
    samplesheet += f"Application,FASTQ Only\n"
    samplesheet += f"Instrument Type,iScan\n"
    samplesheet += f"Assay,Infinium Global Screening Array-24 v3.0\n"
    samplesheet += f"Index Adapters,Illumina Infinium\n\n"
    samplesheet += "[Manifests]\n"
    samplesheet += "A,GSA-24v3-0_A1.bpm\n\n"
    samplesheet += "[Data]\n"
    samplesheet += "Sample_ID,SentrixBarcode_A,SentrixPosition_A,Sample_Plate,Sample_Well\n"
    
    for well in plate.wells:
        aliquot = db.query(AliquotModel).filter(AliquotModel.id == well.aliquot_id).first()
        if aliquot:
            sample_id = aliquot.sample_id
            samplesheet += f"{sample_id},{well.sentrix_barcode},{well.sentrix_position},{plate.name},{well.well}\n"
    
    return samplesheet

@app.post("/runs", response_model=RunOut)
def create_run(payload: RunCreate, db: Session = Depends(get_db)):
    run_count = db.query(RunModel).count()
    run = RunModel(
        id=f"RUN-{run_count+1:04d}",
        run_name=payload.run_name,
        run_date=payload.run_date,
        status="Created"
    )
    db.add(run)
    
    for barcode in payload.beadchip_barcodes:
        chip_count = db.query(BeadChipModel).count()
        chip = BeadChipModel(
            id=f"CHIP-{chip_count+1:04d}",
            run_id=run.id,
            barcode=barcode
        )
        db.add(chip)
    
    db.commit()
    return RunOut(
        id=run.id,
        run_name=run.run_name,
        run_date=run.run_date,
        status=run.status,
        beadchip_count=len(payload.beadchip_barcodes)
    )

@app.get("/runs", response_model=List[RunOut])
def list_runs(db: Session = Depends(get_db)):
    runs = db.query(RunModel).all()
    return [RunOut(
        id=r.id,
        run_name=r.run_name,
        run_date=r.run_date,
        status=r.status,
        beadchip_count=len(r.beadchips)
    ) for r in runs]

@app.post("/runs/{run_id}/metrics")
def upload_metrics(run_id: str, metrics: List[MetricsIn], db: Session = Depends(get_db)):
    run = db.query(RunModel).filter(RunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    processed = 0
    qc_results = []
    
    for metric in metrics:
        # Updated genotype QC banding rules
        if metric.call_rate < 0.97 or metric.dish_qc < DISHQC_MIN:
            qc_flag = "Fail"
        elif 0.97 <= metric.call_rate < CALLRATE_MIN and metric.dish_qc >= DISHQC_MIN:
            qc_flag = "Warn"
        elif metric.call_rate >= CALLRATE_MIN and metric.dish_qc >= DISHQC_MIN:
            qc_flag = "Pass"
        else:
            qc_flag = "Fail"  # fallback
        
        # Save metrics
        genotype_metric = GenotypeMetricsModel(
            run_id=run_id,
            sample_id=metric.sample_id,
            call_rate=metric.call_rate,
            dish_qc=metric.dish_qc,
            heterozygosity=metric.heterozygosity,
            sex_call=metric.sex_call,
            sex_concordance=metric.sex_concordance
        )
        db.add(genotype_metric)
        
        # Update sample status based on QC
        sample = db.query(SampleModel).filter(SampleModel.id == metric.sample_id).first()
        if sample:
            if qc_flag in ["Pass", "Warn"]:
                sample.status = "Genotyped"
            else:
                sample.status = "Hold for QA"
        
        qc_results.append({
            "sample_id": metric.sample_id,
            "qc_flag": qc_flag,
            "call_rate": metric.call_rate,
            "dish_qc": metric.dish_qc
        })
        processed += 1
    
    run.status = "Completed"
    db.commit()
    return {
        "run_id": run_id, 
        "metrics_processed": processed,
        "qc_results": qc_results
    }

@app.post("/runs/{run_id}/prs_package", response_model=PRSJobOut)
def create_prs_package(run_id: str, payload: PRSJobCreate, db: Session = Depends(get_db)):
    run = db.query(RunModel).filter(RunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Check for eligible samples (Pass/Warn only)
    metrics = db.query(GenotypeMetricsModel).filter(GenotypeMetricsModel.run_id == run_id).all()
    eligible_metrics = []
    
    for m in metrics:
        # Apply same QC banding logic to determine if Pass/Warn
        if m.call_rate < 0.97 or m.dish_qc < DISHQC_MIN:
            qc_flag = "Fail"
        elif 0.97 <= m.call_rate < CALLRATE_MIN and m.dish_qc >= DISHQC_MIN:
            qc_flag = "Warn"
        elif m.call_rate >= CALLRATE_MIN and m.dish_qc >= DISHQC_MIN:
            qc_flag = "Pass"
        else:
            qc_flag = "Fail"
            
        if qc_flag in ["Pass", "Warn"]:
            eligible_metrics.append((m, qc_flag))
    
    if not eligible_metrics:
        raise HTTPException(
            status_code=400, 
            detail="No Pass/Warn samples available for PRS"
        )
    
    job_count = db.query(PRSJobModel).count()
    job = PRSJobModel(
        id=f"PRS-{job_count+1:04d}",
        run_id=run_id,
        job_name=payload.job_name,
        status="Processing"
    )
    db.add(job)
    db.commit()
    
    # Simulate package creation (in real system, this would be async)
    output_dir = Path(f"/tmp/prs_output/{job.id}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create samples.tsv (only eligible samples)
    samples_file = output_dir / "samples.tsv"
    with open(samples_file, "w") as f:
        f.write("sample_id\tsubject_pseudoid\tstatus\tfinal_qc_flag\n")
        for m, qc_flag in eligible_metrics:
            sample = db.query(SampleModel).filter(SampleModel.id == m.sample_id).first()
            if sample:
                f.write(f"{sample.id}\t{sample.subject_pseudoid}\t{sample.status}\t{qc_flag}\n")
    
    # Create metrics.tsv (only eligible samples)
    metrics_file = output_dir / "metrics.tsv"
    with open(metrics_file, "w") as f:
        f.write("sample_id\tcall_rate\tdish_qc\theterozygosity\tsex_call\tfinal_qc_flag\n")
        for m, qc_flag in eligible_metrics:
            f.write(f"{m.sample_id}\t{m.call_rate}\t{m.dish_qc}\t{m.heterozygosity or 'NA'}\t{m.sex_call or 'NA'}\t{qc_flag}\n")
    
    # Create manifest.md
    manifest_file = output_dir / "manifest.md"
    with open(manifest_file, "w") as f:
        f.write(f"# PRS Package Manifest\n\n")
        f.write(f"Job ID: {job.id}\n")
        f.write(f"Run ID: {run_id}\n")
        f.write(f"Created: {datetime.utcnow().isoformat()}\n")
        f.write(f"Total Samples: {len(metrics)}\n")
        f.write(f"Eligible Samples (Pass/Warn): {len(eligible_metrics)}\n")
        f.write(f"Pass: {sum(1 for _, qc in eligible_metrics if qc == 'Pass')}\n")
        f.write(f"Warn: {sum(1 for _, qc in eligible_metrics if qc == 'Warn')}\n")
    
    job.status = "Completed"
    job.output_path = str(output_dir)
    db.commit()
    
    return PRSJobOut(
        id=job.id,
        run_id=job.run_id,
        job_name=job.job_name,
        status=job.status,
        output_path=job.output_path
    )

@app.get("/prs_jobs", response_model=List[PRSJobOut])
def list_prs_jobs(db: Session = Depends(get_db)):
    jobs = db.query(PRSJobModel).all()
    return [PRSJobOut(
        id=j.id,
        run_id=j.run_id,
        job_name=j.job_name,
        status=j.status,
        output_path=j.output_path
    ) for j in jobs]