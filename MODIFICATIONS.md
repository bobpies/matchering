# Modifications Log - Matchering 2025

This document details all modifications made to the original Matchering project.

## Original Project

Based on [Matchering 2.0](https://github.com/sergree/matchering) by Sergree, licensed under GPLv3.

## Modifications Made (2025)

### Core Functionality

1. **Multi-Reference Support**
   - Extended from single reference to support up to 10 reference tracks
   - Batch processing of multiple masterings
   - Parallel processing with threading

2. **Hot or Not Comparison System**
   - Interactive hover-to-preview interface
   - Click-to-vote functionality
   - Automatic comparison continuation
   - Real-time ranking updates

3. **Enhanced Preview System**
   - Synchronized preview playback
   - Hover-based preview activation
   - Auto-pause when mouse leaves preview area

4. **WAV Export Only**
   - WAV 16-bit and 24-bit formats only
   - Simplified processing pipeline
   - No MP3 support (removed due to implementation issues)

5. **Python 3.14+ Compatibility**
   - Fallback to scipy.signal.resample when resampy unavailable
   - Alternative requirements file for Python 3.14+

### User Interface

1. **Drag and Drop**
   - Multi-file drag and drop support
   - Visual feedback during drag operations
   - File removal capability

2. **Ranking Visualization**
   - Real-time bar chart updates
   - Rankings displayed below comparison area
   - Download links integrated in rankings

3. **Download Naming**
   - Automatic filename generation with random 5-letter code
   - Format: `original_filename RANDOM Master.ext`

### Backend Changes

1. **Flask Web Application**
   - New RESTful API endpoints
   - Job-based processing system
   - Voting and ranking data structures

2. **File Management**
   - Organized storage in uploads/, results/, previews/
   - Job-based folder structure
   - Automatic cleanup support

### Removed Features

- Removed donation buttons and links
- Removed advertisement integrations
- Removed external analytics (Cloudflare)
- Simplified navigation (removed external links)

### Files Added

- `app.py` - Flask web application backend
- `app.js` - Frontend JavaScript
- `page/css/app.css` - Additional styles
- `requirements-py314.txt` - Python 3.14+ compatibility
- `check-python-version.py` - Version detection helper
- `docker-start.bat` - Docker startup script
- `run-local.bat` - Local execution script
- `MODIFICATIONS.md` - This file

### Files Modified

- `matchering/checker.py` - Added scipy fallback for resampling
- `index.html` - Complete UI redesign
- `README.md` - Updated documentation
- `requirements.txt` - Added Flask dependencies

## License Compliance

All modifications maintain GPLv3 compliance:
- Original license preserved in LICENSE file
- Copyright notices maintained
- Source code available
- Modifications documented
- No proprietary dependencies added

## Credits

**Original Author:** Sergree  
**Original Repository:** https://github.com/sergree/matchering  
**Original License:** GPLv3

**Modified Version:** Matchering 2025  
**Modification Date:** 2025  
**License:** GPLv3 (unchanged)

