# Matchering 2025

Professional audio matching and mastering tool with multi-reference support and intelligent comparison system.

## Features

- **Multi-Reference Mastering**: Upload up to 10 reference tracks and generate multiple mastering variations
- **Hot or Not Comparison**: Interactive hover-to-preview system to compare masterings side-by-side
- **Real-time Rankings**: Visual chart showing the most popular mastering based on your preferences
- **Multiple Loudness Profiles**: Automatically render Low (slow attack), Medium (default), and High (fast & aggressive) limiter settings for every reference
- **Multiple Export Formats**: Download WAV 16-bit, WAV 24-bit, Low/Medium/High loudness 24-bit, or WAV 24-bit variants without the limiter
- **Limiter Expert Controls**: Override limiter attack/hold/release per mastering session
- **Aligned Previews Per Variant**: Limited, no-limiter, no-limiter (normalized), and original snippets share the identical slice for A/B tests

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
5. **Download**: Grab WAV 16-bit, WAV 24-bit (medium), 24-bit Low/High loudness, 24-bit without the limiter, or 24-bit without the limiter but normalized

### Expert Limiter Controls

- The upload form now exposes: attack, hold, release, attack filter coefficient, hold filter order/coeff, and release filter order/coeff.
- Leave fields blank to use presets; fill them to override the **Medium** profile. All values are returned via `/api/status/<job_id>` so automations know the exact limiter envelope.

### Loudness Presets

- Every mastering now includes **Low** (20 ms attack / 2 ms hold / 4000 ms release), **Medium** (defaults or your custom values), and **High** (0.1 ms attack / 120 ms hold / 500 ms release) limiter profiles.
- Downloads:
  - `/api/download/<job>/<ref>/wav24_low`
  - `/api/download/<job>/<ref>/wav24` (medium – respects expert override)
  - `/api/download/<job>/<ref>/wav24_high`
- Previews:
  - `/api/preview-low/<job>/<ref>`
  - `/api/preview/<job>/<ref>` (medium)
  - `/api/preview-high/<job>/<ref>`

### Preview API

- `/api/preview/<job_id>/<reference_index>` – limiter-on preview (default)
- `/api/preview-low/<job_id>/<reference_index>` – low loudness preview
- `/api/preview-high/<job_id>/<reference_index>` – high loudness preview
- `/api/preview-nolimiter/<job_id>/<reference_index>` – limiter bypassed preview
- `/api/preview-nolimiter-normalized/<job_id>/<reference_index>` – limiter bypassed + normalized preview
- `/api/preview-original/<job_id>/<reference_index>` – matching original slice for direct A/B comparison

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
