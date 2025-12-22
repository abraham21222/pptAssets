# PowerPoint Inspector

A Python tool for extracting, analyzing, and tagging PowerPoint presentations programmatically.

## Features

- Extract document metadata and properties
- Analyze slide content (text, shapes, images)
- Track image locations and extract embedded images
- Apply standardized tags and labels
- Export data to JSON/CSV formats
- CLI interface for easy automation

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python src/ppt_inspector.py path/to/presentation.pptx
```

## Output

- `exports/` - JSON/CSV data exports
- `images/` - Extracted images from presentations