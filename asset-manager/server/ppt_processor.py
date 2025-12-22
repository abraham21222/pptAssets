#!/usr/bin/env python3
import sys
import json
import os
from pathlib import Path

# Add the parent directory to the path to import ppt_inspector
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.ppt_inspector import PowerPointInspector

def process_powerpoint(file_path, output_dir, image_dir):
    """Process PowerPoint file and return analysis data"""
    try:
        # Create inspector
        inspector = PowerPointInspector(file_path, output_dir, image_dir)

        # Redirect stdout temporarily to suppress print statements
        import sys
        from io import StringIO

        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            # Load and analyze
            inspector.load_presentation()
            metadata = inspector.extract_document_metadata()
            slides_info = inspector.extract_slide_content()
        finally:
            # Restore stdout
            sys.stdout = old_stdout

        # Export data (suppress output here too)
        sys.stdout = StringIO()
        try:
            json_path = inspector.export_to_json()
        finally:
            sys.stdout = old_stdout

        # Return structured data
        return {
            'success': True,
            'metadata': {
                'filename': metadata.filename,
                'file_size': metadata.file_size,
                'slide_count': metadata.slide_count,
                'total_images': metadata.total_images,
                'author': metadata.author,
                'title': metadata.title,
                'created_date': metadata.created_date,
                'modified_date': metadata.modified_date,
                'company_mentions': metadata.company_mentions,
                'copyright_notices': metadata.copyright_notices,
                'confidentiality_labels': metadata.confidentiality_labels
            },
            'slides': [
                {
                    'slide_number': slide.slide_number,
                    'title': slide.title,
                    'text_content': slide.text_content,
                    'shape_count': slide.shape_count,
                    'image_count': slide.image_count,
                    'image_files': slide.image_files,
                    'text_shapes': slide.text_shapes,
                    'graphic_elements': slide.graphic_elements,
                    'logos_and_brands': slide.logos_and_brands,
                    'tags': slide.tags,
                    'notes': slide.notes
                }
                for slide in slides_info
            ],
            'json_export': json_path
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ppt_processor.py <file_path> <output_dir> <image_dir>'
        }))
        sys.exit(1)

    file_path = sys.argv[1]
    output_dir = sys.argv[2]
    image_dir = sys.argv[3]

    result = process_powerpoint(file_path, output_dir, image_dir)
    print(json.dumps(result))