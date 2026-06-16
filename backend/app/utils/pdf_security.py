"""
POLYNOUS PDF Security Module
Validates and sanitizes all PDF uploads before processing
"""
import os
import re
import magic
import hashlib
import tempfile
from typing import Optional, Tuple, Dict
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

# Maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB in bytes

# Allowed MIME types
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/x-pdf',
    'application/octet-stream',  # Some PDFs are detected as this
]

# Blocked file signatures (executables, scripts, etc.)
BLOCKED_SIGNATURES = [
    b'MZ',           # Windows executable (.exe, .dll)
    b'\x7fELF',      # Linux executable
    b'#!/bin/',      # Shell script
    b'#!/usr/',      # Shell script
    b'<?php',        # PHP script
    b'<script',      # HTML/JS
    b'%PDF-',        # We actually want this! But we check it's at byte 0
]

# Allowed PDF version signatures
ALLOWED_PDF_SIGNATURES = [
    b'%PDF-1.',
    b'%PDF-2.',
]

# Dangerous PDF features
DANGEROUS_PDF_FEATURES = [
    '/JavaScript',      # Embedded JavaScript
    '/JS',              # JavaScript action
    '/Launch',          # Launch external program
    '/EmbeddedFile',    # Embedded files
    '/RichMedia',       # Rich media content
    '/AA',              # Automatic action
    '/OpenAction',      # Auto-open action
    '/JBIG2Decode',     # Can be exploited
    '/XFA',             # XML Forms Architecture (can contain scripts)
]

# Maximum pages to scan (prevent DoS with million-page PDFs)
MAX_PAGES_TO_SCAN = 1000

# ============================================================
# FILE VALIDATION FUNCTIONS
# ============================================================

def validate_file_size(file_path: str, max_size: int = MAX_FILE_SIZE) -> Tuple[bool, str]:
    """
    Check if file is within size limits.
    
    Returns:
        (is_valid, error_message)
    """
    try:
        file_size = os.path.getsize(file_path)
        
        if file_size == 0:
            return False, "File is empty"
        
        if file_size > max_size:
            size_mb = file_size / (1024 * 1024)
            max_mb = max_size / (1024 * 1024)
            return False, f"File too large ({size_mb:.1f}MB). Maximum is {max_mb:.0f}MB"
        
        return True, ""
    except Exception as e:
        return False, f"Cannot read file: {str(e)}"

def validate_file_signature(file_path: str) -> Tuple[bool, str]:
    """
    Check if file is actually a PDF by reading its magic bytes.
    This prevents users from uploading .exe files renamed to .pdf.
    
    Returns:
        (is_valid, error_message)
    """
    try:
        with open(file_path, 'rb') as f:
            # Read first 8 bytes
            signature = f.read(8)
        
        # Check for PDF signature (%PDF-1.x or %PDF-2.x)
        if signature[:5] == b'%PDF-':
            version = signature[1:8].decode('ascii', errors='ignore')
            return True, f"Valid PDF signature detected"
        
        # Check for blocked signatures
        for blocked in BLOCKED_SIGNATURES:
            if signature[:len(blocked)] == blocked:
                return False, f"Blocked file type detected. Not a valid PDF."
        
        return False, f"Invalid file signature. File does not appear to be a PDF."
    
    except Exception as e:
        return False, f"Cannot verify file signature: {str(e)}"

def validate_mime_type(file_path: str) -> Tuple[bool, str]:
    """
    Check MIME type using libmagic.
    This provides a second layer of validation beyond file extension.
    
    Returns:
        (is_valid, error_message)
    """
    try:
        # Use python-magic to detect actual file type
        mime_type = magic.from_file(file_path, mime=True)
        
        if mime_type in ALLOWED_MIME_TYPES:
            return True, f"Valid MIME type: {mime_type}"
        
        # Some PDFs are detected as 'application/octet-stream'
        # In that case, rely on file signature check instead
        if mime_type == 'application/octet-stream':
            return True, "MIME type ambiguous, relying on signature check"
        
        return False, f"Invalid file type: {mime_type}. Only PDF files are allowed."
    
    except Exception as e:
        # If magic library fails, don't block — let signature check handle it
        return True, f"MIME check skipped: {str(e)}"

def validate_pdf_structure(file_path: str) -> Tuple[bool, str, Dict]:
    """
    Validate PDF internal structure.
    Checks for malicious content, JavaScript, excessive pages, etc.
    
    Returns:
        (is_valid, error_message, metadata_dict)
    """
    warnings = []
    metadata = {
        'pages': 0,
        'has_javascript': False,
        'has_embedded_files': False,
        'has_forms': False,
        'pdf_version': 'Unknown',
        'is_encrypted': False,
        'warnings': []
    }
    
    try:
        from PyPDF2 import PdfReader
        
        reader = PdfReader(file_path)
        
        # Check encryption
        if reader.is_encrypted:
            metadata['is_encrypted'] = True
            warnings.append("PDF is encrypted — some features may be limited")
        
        # Check page count
        num_pages = len(reader.pages)
        metadata['pages'] = num_pages
        
        if num_pages == 0:
            return False, "PDF has no pages", metadata
        
        if num_pages > MAX_PAGES_TO_SCAN:
            return False, f"PDF has too many pages ({num_pages}). Maximum is {MAX_PAGES_TO_SCAN}", metadata
        
        # Check PDF version from metadata
        if reader.metadata:
            metadata['pdf_version'] = reader.metadata.get('/Version', 'Unknown')
            
            # Check metadata for XSS
            for key, value in reader.metadata.items():
                if isinstance(value, str):
                    if re.search(r'<script|javascript:', value, re.IGNORECASE):
                        warnings.append(f"Suspicious content in metadata field: {key}")
        
        # Scan for dangerous features
        full_text = ""
        for i, page in enumerate(reader.pages[:10]):  # Check first 10 pages
            try:
                page_text = page.extract_text() or ""
                full_text += page_text
            except:
                pass
        
        # Check for dangerous PDF features in raw content
        with open(file_path, 'rb') as f:
            raw_content = f.read(500000)  # Read first 500KB
            
            # Decode as latin-1 to search for patterns
            try:
                raw_text = raw_content.decode('latin-1', errors='ignore')
                
                for feature in DANGEROUS_PDF_FEATURES:
                    if feature in raw_text:
                        if feature in ['/JavaScript', '/JS']:
                            metadata['has_javascript'] = True
                            warnings.append(f"PDF contains JavaScript ({feature})")
                        elif feature in ['/EmbeddedFile']:
                            metadata['has_embedded_files'] = True
                            warnings.append("PDF contains embedded files")
                        elif feature in ['/XFA']:
                            metadata['has_forms'] = True
                            warnings.append("PDF contains XML Forms (potential script vector)")
                        elif feature in ['/Launch', '/OpenAction', '/AA']:
                            warnings.append(f"PDF contains auto-execute feature ({feature})")
            except:
                pass
        
        metadata['warnings'] = warnings
        
        # If JavaScript is found, still allow but warn heavily
        if metadata['has_javascript']:
            return True, "PDF contains JavaScript — processed with caution", metadata
        
        return True, "", metadata
    
    except Exception as e:
        return False, f"Cannot parse PDF: {str(e)}", metadata

def scan_for_malware(file_path: str) -> Tuple[bool, str]:
    """
    Basic malware scanning using file hashes.
    For production, integrate with VirusTotal or ClamAV.
    
    Returns:
        (is_clean, message)
    """
    try:
        # Calculate file hash for logging/reference
        with open(file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Basic checks
        file_size = os.path.getsize(file_path)
        
        # Check for suspicious patterns
        with open(file_path, 'rb') as f:
            content = f.read(100000)  # First 100KB
            
            # Check for executable code in PDF
            suspicious = [
                b'ShellExecute',
                b'WinExec',
                b'cmd.exe',
                b'powershell.exe',
                b'wscript.shell',
                b'ActiveXObject',
                b'CreateObject',
                b'eval(',
                b'unescape(',
            ]
            
            found = []
            for pattern in suspicious:
                if pattern in content:
                    found.append(pattern.decode('ascii', errors='ignore'))
            
            if found:
                return False, f"Potentially malicious content detected: {', '.join(found)}"
        
        return True, f"File hash: {file_hash[:16]}..."
    
    except Exception as e:
        return True, f"Scan skipped: {str(e)}"

def sanitize_pdf_metadata(metadata: Dict) -> Dict:
    """
    Clean PDF metadata to prevent XSS and injection.
    """
    safe_metadata = {}
    
    for key, value in metadata.items():
        if isinstance(value, str):
            # Remove HTML/script content
            value = re.sub(r'<[^>]*>', '', value)
            value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
            # Limit length
            value = value[:500]
        safe_metadata[key] = value
    
    return safe_metadata

# ============================================================
# MAIN VALIDATION FUNCTION
# ============================================================

def validate_pdf_upload(file_path: str, original_filename: str) -> Dict:
    """
    Complete PDF upload validation pipeline.
    Runs ALL security checks.
    
    Args:
        file_path: Path to the uploaded file (temp file)
        original_filename: Original filename from user
    
    Returns:
        Dict with validation results:
        {
            'valid': True/False,
            'message': 'Status message',
            'file_hash': 'sha256 hash',
            'metadata': {...},
            'warnings': [...]
        }
    """
    result = {
        'valid': False,
        'message': '',
        'file_hash': '',
        'file_size': 0,
        'original_filename': original_filename,
        'metadata': {},
        'warnings': [],
        'checks_passed': [],
        'checks_failed': []
    }
    
    # ─── Check 1: File Size ───────────────────────
    valid, msg = validate_file_size(file_path)
    if not valid:
        result['message'] = msg
        result['checks_failed'].append('file_size')
        return result
    result['checks_passed'].append('file_size')
    result['file_size'] = os.path.getsize(file_path)
    
    # ─── Check 2: File Signature ──────────────────
    valid, msg = validate_file_signature(file_path)
    if not valid:
        result['message'] = msg
        result['checks_failed'].append('file_signature')
        return result
    result['checks_passed'].append('file_signature')
    
    # ─── Check 3: MIME Type ───────────────────────
    valid, msg = validate_mime_type(file_path)
    if not valid:
        result['message'] = msg
        result['checks_failed'].append('mime_type')
        return result
    result['checks_passed'].append('mime_type')
    
    # ─── Check 4: PDF Structure ───────────────────
    valid, msg, metadata = validate_pdf_structure(file_path)
    result['metadata'] = sanitize_pdf_metadata(metadata)
    result['warnings'].extend(metadata.get('warnings', []))
    
    if not valid:
        result['message'] = msg
        result['checks_failed'].append('pdf_structure')
        return result
    result['checks_passed'].append('pdf_structure')
    
    # ─── Check 5: Malware Scan ────────────────────
    valid, msg = scan_for_malware(file_path)
    if not valid:
        result['message'] = msg
        result['checks_failed'].append('malware_scan')
        return result
    result['checks_passed'].append('malware_scan')
    
    # ─── Calculate File Hash ──────────────────────
    with open(file_path, 'rb') as f:
        result['file_hash'] = hashlib.sha256(f.read()).hexdigest()
    
    # ─── All checks passed! ───────────────────────
    result['valid'] = True
    result['message'] = 'PDF passed all security checks'
    
    return result