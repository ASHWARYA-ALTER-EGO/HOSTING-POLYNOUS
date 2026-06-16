from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os
import shutil
from typing import Optional

from app.utils.pdf_security import validate_pdf_upload
from app.utils.sanitizer import sanitize_filename

router = APIRouter(prefix="/pdfs", tags=["pdfs"])

# ============================================================
# CONFIGURATION
# ============================================================
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSION = '.pdf'

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and validate a PDF file.
    Runs multiple security checks before processing.
    """
    
    # ─── STEP 1: Validate filename ─────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    
    # Check file extension
    if not safe_filename.lower().endswith(ALLOWED_EXTENSION):
        raise HTTPException(
            status_code=400, 
            detail=f"Only {ALLOWED_EXTENSION} files are allowed"
        )
    
    # ─── STEP 2: Read file content ─────────────────
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")
    
    # ─── STEP 3: Check file size ───────────────────
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    if len(content) > MAX_FILE_SIZE:
        size_mb = len(content) / (1024 * 1024)
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Maximum is {max_mb:.0f}MB"
        )
    
    # ─── STEP 4: Save to temp file for scanning ─────
    temp_file = None
    try:
        # Create temp file
        temp_fd, temp_path = tempfile.mkstemp(suffix='.pdf')
        temp_file = os.fdopen(temp_fd, 'wb')
        temp_file.write(content)
        temp_file.close()
        temp_file = None
        
        # ─── STEP 5: Run security validation ─────────
        validation_result = validate_pdf_upload(temp_path, safe_filename)
        
        if not validation_result['valid']:
            raise HTTPException(
                status_code=400,
                detail={
                    'message': validation_result['message'],
                    'failed_checks': validation_result['checks_failed']
                }
            )
        
        # ─── STEP 6: File is safe — process it ───────
        # Here you would call your PDF processing function
        # For example: process_pdf(temp_path, safe_filename)
        
        return {
            'status': 'success',
            'filename': safe_filename,
            'file_size': len(content),
            'file_hash': validation_result['file_hash'],
            'metadata': validation_result['metadata'],
            'warnings': validation_result['warnings'],
            'checks_passed': validation_result['checks_passed'],
            'message': 'PDF uploaded and validated successfully'
        }
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    finally:
        # ─── STEP 7: Clean up temp file ──────────────
        if temp_file:
            temp_file.close()
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@router.get("/validate/{filename}")
async def validate_filename(filename: str):
    """Quick filename validation endpoint"""
    safe_name = sanitize_filename(filename)
    return {
        'original': filename,
        'sanitized': safe_name,
        'valid': safe_name.endswith('.pdf')
    }