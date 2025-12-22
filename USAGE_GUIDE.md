# PowerPoint Inspector - Usage Guide

## Quick Start

### Single File Analysis
```bash
python3 src/ppt_inspector.py "path/to/presentation.pptx"
```

### With Custom Tags
```bash
python3 src/ppt_inspector.py "path/to/presentation.pptx" \
    --tags-file example_tags.json \
    --export-format both
```

### Batch Processing
```bash
python3 src/batch_processor.py /path/to/directory/with/ppt/files
```

## Features

### 🔍 **Document Analysis**
- File metadata (size, dates, author, title)
- Slide count and content statistics
- Automatic detection of copyright notices
- Confidentiality label identification
- Company name recognition

### 📄 **Slide Content Extraction**
- Text content from all shapes
- Slide titles and notes
- Shape counts and types
- Automatic content-based tagging

### 🖼️ **Image Processing**
- Extract all embedded images
- Track which slides contain images
- Generate unique filenames with slide references
- Support for images in grouped shapes

### 🏷️ **Tagging System**
- Automatic tags: copyright, confidential, company_info, agenda, introduction, conclusion
- Custom tag application via JSON configuration
- Slide-specific and document-level tags

### 💾 **Export Options**
- **JSON**: Complete structured data export
- **CSV**: Tabular format for spreadsheet analysis
- **Images**: All embedded images extracted to separate files

## Custom Tags Configuration

Create a JSON file with custom tags:

```json
{
  "document": ["quarterly_review", "business_metrics"],
  "slide_1": ["title_slide", "executive_summary"],
  "slide_2": ["agenda", "overview"],
  "slide_3": ["financial_data", "revenue"]
}
```

## Output Structure

### Directory Layout
```
exports/
├── presentation_analysis_20231221_123456.json
├── presentation_slides_20231221_123456.csv
└── batch_summary.json (for batch processing)

images/
├── slide_01_abc123.png
├── slide_02_def456.jpg
└── ...
```

### JSON Export Structure
```json
{
  "metadata": {
    "filename": "presentation.pptx",
    "file_size": 12345678,
    "slide_count": 10,
    "total_images": 5,
    "copyright_notices": ["©"],
    "confidentiality_labels": ["confidential"],
    "custom_tags": ["quarterly_review"]
  },
  "slides": [
    {
      "slide_number": 1,
      "title": "Title Slide",
      "text_content": ["Company Name", "Presentation Title"],
      "image_count": 2,
      "image_files": ["slide_01_abc123.png"],
      "tags": ["title_slide", "copyright"],
      "notes": "Speaker notes here"
    }
  ]
}
```

## Command Line Options

### Main Inspector (`ppt_inspector.py`)
- `--output-dir, -o`: Output directory for exports (default: 'exports')
- `--image-dir, -i`: Directory for extracted images (default: 'images')
- `--tags-file, -t`: JSON file with custom tags
- `--export-format, -f`: Export format(s) - json, csv, or both

### Batch Processor (`batch_processor.py`)
- `--output-dir, -o`: Output directory for batch exports (default: 'batch_exports')

## Use Cases

### 🏢 **Brand Compliance Audit**
```bash
python3 src/batch_processor.py /company/presentations/
# Check all presentations for copyright notices and branding consistency
```

### 📊 **Content Inventory**
```bash
python3 src/ppt_inspector.py quarterly_report.pptx --export-format csv
# Generate spreadsheet of all slide content for review
```

### 🖼️ **Asset Extraction**
```bash
python3 src/ppt_inspector.py marketing_deck.pptx --image-dir /shared/assets/
# Extract all images for reuse in other materials
```

### 🔐 **Security Review**
```bash
python3 src/ppt_inspector.py confidential_proposal.pptx
# Check for proper confidentiality labeling and sensitive content
```

## VS Code Integration

1. **Open Terminal in VS Code** (`Ctrl/Cmd + ``)
2. **Navigate to project directory**:
   ```bash
   cd /path/to/ppt-inspector
   ```
3. **Run analysis**:
   ```bash
   python3 src/ppt_inspector.py "path/to/file.pptx"
   ```
4. **View results**: Open the `exports/` directory in VS Code explorer
5. **Review images**: Open the `images/` directory to preview extracted assets

## Automation Examples

### Shell Script for Regular Audits
```bash
#!/bin/bash
# audit_presentations.sh

PRESENTATIONS_DIR="/company/shared/presentations"
AUDIT_DIR="/company/audits/$(date +%Y%m%d)"

mkdir -p "$AUDIT_DIR"

python3 /path/to/ppt-inspector/src/batch_processor.py \
    "$PRESENTATIONS_DIR" \
    --output-dir "$AUDIT_DIR"

echo "Audit complete: $AUDIT_DIR"
```

### Python Script for Integration
```python
from src.ppt_inspector import PowerPointInspector

def audit_presentation(filepath):
    inspector = PowerPointInspector(filepath)
    inspector.load_presentation()
    metadata = inspector.extract_document_metadata()

    # Check compliance
    has_copyright = len(metadata.copyright_notices) > 0
    has_confidentiality = len(metadata.confidentiality_labels) > 0

    return {
        'compliant': has_copyright and has_confidentiality,
        'issues': []
    }
```

## Troubleshooting

### Common Issues
1. **File not found**: Ensure the PowerPoint file path is correct and accessible
2. **Permission errors**: Check that the output directories are writable
3. **Corrupted images**: Some embedded images may not extract properly - check the console for warnings
4. **Large files**: Processing very large presentations may take several minutes

### Getting Help
- Check the console output for detailed error messages
- Verify all dependencies are installed: `pip3 install -r requirements.txt`
- Ensure you're using Python 3.7 or higher