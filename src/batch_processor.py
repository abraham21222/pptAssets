#!/usr/bin/env python3

import os
import json
from pathlib import Path
from typing import List, Dict
import click
from ppt_inspector import PowerPointInspector


def process_directory(directory: str, output_dir: str = "batch_exports") -> Dict:
    """Process all PowerPoint files in a directory."""

    dir_path = Path(directory)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Find all PowerPoint files
    ppt_files = []
    for pattern in ["*.pptx", "*.ppt"]:
        ppt_files.extend(dir_path.glob(pattern))

    if not ppt_files:
        print(f"No PowerPoint files found in {directory}")
        return {}

    results = {
        "processed_files": [],
        "failed_files": [],
        "summary": {
            "total_files": len(ppt_files),
            "total_slides": 0,
            "total_images": 0,
            "files_with_copyright": 0,
            "files_with_confidentiality": 0
        }
    }

    for ppt_file in ppt_files:
        try:
            print(f"\nProcessing: {ppt_file.name}")

            # Create subdirectory for this file
            file_output_dir = output_path / ppt_file.stem
            file_output_dir.mkdir(exist_ok=True)

            # Process file
            inspector = PowerPointInspector(
                str(ppt_file),
                str(file_output_dir / "exports"),
                str(file_output_dir / "images")
            )

            inspector.load_presentation()
            metadata = inspector.extract_document_metadata()
            slides_info = inspector.extract_slide_content()

            # Export data
            inspector.export_to_json()
            inspector.export_to_csv()

            # Update summary
            results["summary"]["total_slides"] += metadata.slide_count
            results["summary"]["total_images"] += metadata.total_images

            if metadata.copyright_notices:
                results["summary"]["files_with_copyright"] += 1
            if metadata.confidentiality_labels:
                results["summary"]["files_with_confidentiality"] += 1

            results["processed_files"].append({
                "filename": ppt_file.name,
                "slides": metadata.slide_count,
                "images": metadata.total_images,
                "output_dir": str(file_output_dir)
            })

        except Exception as e:
            print(f"Error processing {ppt_file.name}: {e}")
            results["failed_files"].append({
                "filename": ppt_file.name,
                "error": str(e)
            })

    # Save batch summary
    summary_file = output_path / "batch_summary.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n📊 Batch processing complete!")
    print(f"Processed: {len(results['processed_files'])} files")
    print(f"Failed: {len(results['failed_files'])} files")
    print(f"Total slides: {results['summary']['total_slides']}")
    print(f"Total images: {results['summary']['total_images']}")
    print(f"Summary saved: {summary_file}")

    return results


@click.command()
@click.argument('directory', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option('--output-dir', '-o', default='batch_exports', help='Output directory for batch exports')
def main(directory, output_dir):
    """Process all PowerPoint files in a directory."""
    process_directory(directory, output_dir)


if __name__ == "__main__":
    main()