# Matchering 2025

Professional audio matching and mastering tool with multi-reference support and intelligent comparison system.

## Features

- **Multi-Reference Mastering**: Upload up to 10 reference tracks and generate multiple mastering variations
- **Hot or Not Comparison**: Interactive hover-to-preview system to compare masterings side-by-side
- **Real-time Rankings**: Visual chart showing the most popular mastering based on your preferences
- **Multiple Export Formats**: Download your masterings in WAV 16-bit or WAV 24-bit
- **Limiter Expert Controls**: Override limiter attack/hold/release per mastering session
- **Synchronized Previews**: All previews use the same audio segment for fair comparison

## Installation

### Requirements

- Python 3.10 or higher (3.14+ supported with fallback)
- 4 GB RAM minimum

### Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

For Python 3.14+:
```bash
pip install -r requirements-py314.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to `http://localhost:8360`

## Usage

1. **Upload Tracks**: Drag and drop your target track and up to 10 reference tracks
2. **Processing**: Wait while the system generates masterings for each reference
3. **Compare**: Hover over mastering areas to preview, click to choose your favorite
4. **Rank**: View the ranking chart that updates in real-time below the comparison
5. **Download**: Download your favorite masterings as WAV 16-bit, WAV 24-bit, or 24-bit without the limiter applied

### Expert Limiter Controls

- In the upload form, expand the expert area to set custom **attack**, **hold**, and **release** (milliseconds).
- Leave any field blank to fall back to the Matchering defaults (Attack 1 ms / Hold 1 ms / Release 3000 ms).
- The API exposes the values via `/api/status/<job_id>` and the downloads include both the standard and no-limiter renders.

## Docker

Build and run with Docker:

```bash
docker-start.bat
```

Or manually:
```bash
docker build -t matchering-2025:latest .
docker run -dp 8360:8360 \
  -v matchering-uploads:/app/uploads \
  -v matchering-results:/app/results \
  -v matchering-previews:/app/previews \
  --name matchering-2025 \
  --restart always \
  matchering-2025:latest
```

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

## Credits

Based on [Matchering](https://github.com/sergree/matchering) by Sergree.

### Modifications (2025)

This version includes significant modifications:
- Multi-reference support (up to 10 references)
- Hot or Not comparison system with hover previews
- Real-time ranking charts
- WAV 16-bit and 24-bit export formats
- Python 3.14+ compatibility
- Enhanced user interface

See [MODIFICATIONS.md](MODIFICATIONS.md) for detailed change log.

## Technical Details

- Built on the Matchering audio processing library
- Flask backend with RESTful API
- Real-time processing with progress tracking
- Intelligent comparison algorithm for optimal mastering selection
