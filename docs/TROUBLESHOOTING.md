
# Troubleshooting Guide

## Common Issues

### Application Won't Start

**Problem:** Application crashes on startup

**Solutions:**
1. Check Windows Event Viewer for errors
2. Verify .NET dependencies installed
3. Run as Administrator
4. Clear cache: Delete `%APPDATA%\ProductImageReviewPlatform`
5. Reinstall application

### CSV Won't Load

**Problem:** "Failed to load CSV" error

**Solutions:**
1. Verify CSV has required columns (reference, description)
2. Check file encoding is UTF-8 (not ANSI)
3. Ensure no special characters in column names
4. Open CSV in text editor to verify format
5. Try smaller sample CSV to isolate issue
6. Check file is not locked by another application

**Verification Checklist:**
```csv
reference,description,metadata
REF001,Product 1,"{}"
REF002,Product 2,"{}"

Images Not Found

Problem: Gallery shows "No images found"

Solutions:

    Verify image path in Settings → Image Discovery
    Check image directory exists and is accessible
    Verify image filenames match discovery strategy
    Ensure images are in supported format (JPG, PNG, GIF, WebP)
    Check file permissions - application can read files
    Try manual image assignment

Verification:

    Navigate to configured image path
    Manually verify product folders or filenames exist
    Check folder permissions: Right-click → Properties → Security

Performance Issues

Problem: Application is slow or freezes

Solutions:

    Reduce thumbnail cache size:
        Settings → Performance → Cache Size
        Reduce to 100-200 MB
    Close other applications
    Check available disk space (need at least 1 GB free)
    Clear cache: Settings → Storage → Clear Cache
    Restart application
    Check system resources (Task Manager)

Performance Checklist:

    Close Chrome/Firefox
    Disable antivirus temporarily
    Check disk usage: dir C:\
    Check memory: Task Manager → Performance

Database Errors

Problem: "Database locked" or "Cannot save review"

Solutions:

    Close all instances of application
    Delete corrupted database:
        Windows: %APPDATA%\ProductImageReviewPlatform\review_platform.db
        Restart application (new database created)
    Check disk space
    Verify write permissions on data directory
    Run disk check: chkdsk C: /F

Image Upload Fails

Problem: Cannot upload replacement image

Solutions:

    Verify image file format (JPG, PNG, etc.)
    Check file size (max 50 MB)
    Verify file path is valid
    Check available disk space
    Try drag-and-drop instead of file picker
    Try copy-paste from clipboard (Ctrl+V)

Session Won't Save

Problem: Review changes not saved

Solutions:

    Click "Save & Exit" instead of closing
    Wait for "Saving..." indicator to finish
    Check disk space
    Verify write permissions
    Check application is not in read-only mode
    Try exporting to backup first

Report Generation Fails

Problem: Cannot generate PDF or CSV report

Solutions:

    Specify valid output path (writable location)
    Ensure output directory exists
    Check filename doesn't contain invalid characters
    Verify write permissions on output directory
    Try different output location
    Check disk space

Valid Output Paths:
Code

C:\Users\YourName\Documents\report.pdf
C:\Users\YourName\Downloads\report.csv
D:\backup\report.pdf

Getting Help
Debug Logs

    Enable debug logging:
        Settings → Advanced → Enable Debug Logging
    Reproduce issue
    Collect logs from:
        %APPDATA%\ProductImageReviewPlatform\logs\
    Share logs in issue report

Support Information to Include

    Application version
    Windows version
    CSV format and size
    Number of products/images
    Error message (exact text)
    Steps to reproduce
    Screenshots of error
    System specifications (RAM, disk space)

Contact Support

    GitHub Issues: https://github.com/Cesaralugo/product-image-review-platform/issues
    Email: support@example.com
    Wiki: https://github.com/Cesaralugo/product-image-review-platform/wiki
