#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Matchering 2025 - Multi-Reference Hot or Not Web Application
Backend Flask server for processing multiple reference tracks

Based on Matchering 2.0 by Sergree
Modified 2025

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
"""

import os
import uuid
import json
import threading
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import matchering as mg
from matchering import Config, Result, pcm16, pcm24
from matchering.defaults import LimiterConfig
import soundfile as sf
import numpy as np
# MP3 conversion removed - using WAV only

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Configuration
UPLOAD_FOLDER = Path('uploads')
RESULTS_FOLDER = Path('results')
PREVIEWS_FOLDER = Path('previews')
MAX_REFERENCES = 10
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'flac', 'aiff', 'm4a', 'ogg'}

# Ensure directories exist
UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)
PREVIEWS_FOLDER.mkdir(exist_ok=True)

# In-memory storage for voting data
voting_data = {}
processing_jobs = {}

def parse_limiter_settings(form_data):
    """Extract optional limiter attack/hold/release overrides from the request."""
    limiter_fields = {
        'limiter_attack': 'attack',
        'limiter_hold': 'hold',
        'limiter_release': 'release',
    }
    settings = {}
    for form_key, limiter_key in limiter_fields.items():
        raw_value = form_data.get(form_key)
        if raw_value in (None, ''):
            continue
        try:
            numeric_value = float(raw_value)
        except ValueError:
            raise ValueError(f"Invalid value for {form_key}. Please provide a number.")
        if numeric_value <= 0:
            raise ValueError(f"{form_key.replace('_', ' ').title()} must be greater than zero.")
        settings[limiter_key] = numeric_value
    return settings

def build_config(limiter_settings=None):
    """Create a Matchering config, optionally overriding limiter values."""
    if limiter_settings:
        limiter = LimiterConfig(**limiter_settings)
        return Config(limiter=limiter)
    return Config()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# MP3 conversion function removed - using WAV only

def process_mastering(target_path, reference_path, job_id, reference_index, limiter_settings=None):
    """Process a single mastering job"""
    try:
        session_folder = RESULTS_FOLDER / job_id
        session_folder.mkdir(exist_ok=True)
        
        preview_folder = PREVIEWS_FOLDER / job_id
        preview_folder.mkdir(exist_ok=True)
        
        # Generate output filenames (WAV only)
        wav_16bit = session_folder / f"mastered_{reference_index}_16bit.wav"
        wav_24bit = session_folder / f"mastered_{reference_index}_24bit.wav"
        preview_wav = preview_folder / f"preview_{reference_index}.wav"
        preview_original_wav = preview_folder / f"preview_{reference_index}_original.wav"
        wav_24bit_no_limiter = session_folder / f"mastered_{reference_index}_24bit_nolimiter.wav"
        
        # Process with matchering
        config = build_config(limiter_settings)
        mg.process(
            target=str(target_path),
            reference=str(reference_path),
            results=[
                pcm16(str(wav_16bit)),
                pcm24(str(wav_24bit)),
                Result(str(wav_24bit_no_limiter), subtype="PCM_24", use_limiter=False, normalize=True),
            ],
            preview_target=Result(str(preview_original_wav), subtype="PCM_16"),
            preview_result=Result(str(preview_wav), subtype="PCM_16"),
            config=config,
        )
        
        return {
            'success': True,
            'reference_index': reference_index,
            'wav_16bit': str(wav_16bit),
            'wav_24bit': str(wav_24bit),
            'preview_wav': str(preview_wav),
            'preview_original_wav': str(preview_original_wav),
            'wav_24bit_no_limiter': str(wav_24bit_no_limiter),
        }
    except Exception as e:
        print(f"Error processing mastering {reference_index}: {e}")
        return {
            'success': False,
            'reference_index': reference_index,
            'error': str(e)
        }

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle file uploads - target and up to 10 reference tracks"""
    try:
        if 'target' not in request.files:
            return jsonify({'error': 'No target file provided'}), 400
        
        try:
            limiter_settings = parse_limiter_settings(request.form)
        except ValueError as validation_error:
            return jsonify({'error': str(validation_error)}), 400
        
        target_file = request.files['target']
        if target_file.filename == '':
            return jsonify({'error': 'No target file selected'}), 400
        
        # Get reference files
        reference_files = []
        for i in range(1, MAX_REFERENCES + 1):
            ref_key = f'reference_{i}'
            if ref_key in request.files:
                ref_file = request.files[ref_key]
                if ref_file.filename != '':
                    reference_files.append(ref_file)
        
        if not reference_files:
            return jsonify({'error': 'At least one reference file is required'}), 400
        
        if len(reference_files) > MAX_REFERENCES:
            return jsonify({'error': f'Maximum {MAX_REFERENCES} reference files allowed'}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        job_folder = UPLOAD_FOLDER / job_id
        job_folder.mkdir(exist_ok=True)
        
        # Save target file
        target_filename = secure_filename(target_file.filename)
        target_path = job_folder / target_filename
        target_file.save(str(target_path))
        
        # Save reference files
        reference_paths = []
        for idx, ref_file in enumerate(reference_files, 1):
            ref_filename = secure_filename(ref_file.filename)
            ref_path = job_folder / f"reference_{idx}_{ref_filename}"
            ref_file.save(str(ref_path))
            reference_paths.append((idx, str(ref_path)))
        
        # Initialize processing job
        processing_jobs[job_id] = {
            'status': 'processing',
            'total': len(reference_paths),
            'completed': 0,
            'results': [],
            'errors': [],
            'target_path': str(target_path),
            'limiter_settings': limiter_settings
        }
        
        # Initialize voting data
        voting_data[job_id] = {
            'masterings': {},
            'votes': {},
            'rankings': []
        }
        
        # Process all masterings in separate threads
        def process_all():
            results = []
            for ref_idx, ref_path in reference_paths:
                result = process_mastering(target_path, ref_path, job_id, ref_idx, limiter_settings=limiter_settings)
                results.append(result)
                processing_jobs[job_id]['completed'] += 1
                if result['success']:
                    processing_jobs[job_id]['results'].append(result)
                    # Initialize voting for this mastering
                    mastering_id = f"{job_id}_ref_{ref_idx}"
                    voting_data[job_id]['masterings'][mastering_id] = {
                        'id': mastering_id,
                        'reference_index': ref_idx,
                        'votes': 0,
                        'wins': 0,
                        'losses': 0
                    }
                else:
                    processing_jobs[job_id]['errors'].append(result)
            
            processing_jobs[job_id]['status'] = 'completed'
        
        thread = threading.Thread(target=process_all)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'total_references': len(reference_paths),
            'status': 'processing'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status/<job_id>')
def get_status(job_id):
    """Get processing status for a job"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = processing_jobs[job_id]
    return jsonify({
        'status': job['status'],
        'total': job['total'],
        'completed': job['completed'],
        'results': job['results'],
        'errors': job['errors'],
        'limiter_settings': job.get('limiter_settings', {})
    })

@app.route('/api/preview/<job_id>/<int:reference_index>')
def get_preview(job_id, reference_index):
    """Get preview file for a mastering (WAV only)"""
    preview_wav = PREVIEWS_FOLDER / job_id / f"preview_{reference_index}.wav"
    
    if preview_wav.exists():
        return send_file(str(preview_wav), mimetype='audio/wav')
    else:
        return jsonify({'error': 'Preview not found'}), 404

@app.route('/api/preview-original/<job_id>/<int:reference_index>')
def get_preview_original(job_id, reference_index):
    """Get original target preview snippet matching mastered preview"""
    preview_original_wav = PREVIEWS_FOLDER / job_id / f"preview_{reference_index}_original.wav"
    
    if preview_original_wav.exists():
        return send_file(str(preview_original_wav), mimetype='audio/wav')
    else:
        return jsonify({'error': 'Original preview not found'}), 404

@app.route('/api/original/<job_id>')
def get_original(job_id):
    """Get original target file preview"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    target_path = processing_jobs[job_id].get('target_path')
    if target_path and Path(target_path).exists():
        return send_file(target_path, mimetype='audio/wav')
    return jsonify({'error': 'Original file not found'}), 404

@app.route('/api/download/<job_id>/<int:reference_index>/<format_type>')
def download_file(job_id, reference_index, format_type):
    """Download mastered file in requested format (WAV only)"""
    session_folder = RESULTS_FOLDER / job_id
    
    if format_type == 'wav16':
        file_path = session_folder / f"mastered_{reference_index}_16bit.wav"
        mimetype = 'audio/wav'
        suffix = ' 16bit.wav'
    elif format_type == 'wav24':
        file_path = session_folder / f"mastered_{reference_index}_24bit.wav"
        mimetype = 'audio/wav'
        suffix = ' 24bit.wav'
    elif format_type == 'wav24_nolimiter':
        file_path = session_folder / f"mastered_{reference_index}_24bit_nolimiter.wav"
        mimetype = 'audio/wav'
        suffix = ' 24bit No Limiter.wav'
    else:
        return jsonify({'error': 'Invalid format. Use wav16, wav24, or wav24_nolimiter'}), 400
    
    if file_path.exists():
        # Generate download filename with random code
        if job_id in processing_jobs:
            target_path = processing_jobs[job_id].get('target_path', '')
            if target_path:
                original_name = Path(target_path).stem
                import random
                import string
                random_code = ''.join(random.choices(string.ascii_uppercase, k=5))
                filename = f"{original_name} {random_code} Master{suffix}"
                return send_file(str(file_path), mimetype=mimetype, as_attachment=True, download_name=filename)
        
        return send_file(str(file_path), mimetype=mimetype, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/vote', methods=['POST'])
def vote():
    """Record a vote in the hot or not system"""
    data = request.json
    job_id = data.get('job_id')
    winner_id = data.get('winner_id')
    loser_id = data.get('loser_id')
    
    if not all([job_id, winner_id, loser_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if job_id not in voting_data:
        return jsonify({'error': 'Job not found'}), 404
    
    # Update vote counts
    if winner_id in voting_data[job_id]['masterings']:
        voting_data[job_id]['masterings'][winner_id]['votes'] += 1
        voting_data[job_id]['masterings'][winner_id]['wins'] += 1
    
    if loser_id in voting_data[job_id]['masterings']:
        voting_data[job_id]['masterings'][loser_id]['losses'] += 1
    
    # Update rankings
    masterings = voting_data[job_id]['masterings']
    rankings = sorted(
        masterings.values(),
        key=lambda x: (x['wins'], x['votes']),
        reverse=True
    )
    voting_data[job_id]['rankings'] = rankings
    
    return jsonify({
        'success': True,
        'rankings': rankings
    })

@app.route('/api/rankings/<job_id>')
def get_rankings(job_id):
    """Get current rankings for a job"""
    if job_id not in voting_data:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify({
        'rankings': voting_data[job_id]['rankings'],
        'masterings': voting_data[job_id]['masterings']
    })

@app.route('/api/next-comparison/<job_id>')
def get_next_comparison(job_id):
    """Get next two masterings to compare"""
    if job_id not in voting_data:
        return jsonify({'error': 'Job not found'}), 404
    
    masterings = list(voting_data[job_id]['masterings'].keys())
    
    if len(masterings) < 2:
        return jsonify({'error': 'Not enough masterings to compare'}), 400
    
    # Improved algorithm: prefer comparing masterings with fewer comparisons
    # NEVER show the same mastering twice
    import random
    mastering_list = list(voting_data[job_id]['masterings'].values())
    
    # Get last comparison IDs to avoid repetition
    last_comparison = voting_data[job_id].get('last_comparison', [])
    
    # Filter out masterings that were in last comparison
    available_masterings = [m for m in mastering_list if m['id'] not in last_comparison]
    
    # If not enough available, use all
    if len(available_masterings) < 2:
        available_masterings = mastering_list
    
    # Sort by number of votes (fewer votes = less compared)
    available_masterings.sort(key=lambda x: x['votes'] + x['wins'] + x['losses'])
    
    # Pick two from the least compared ones, but ensure variety
    if len(available_masterings) >= 2:
        # Take from bottom 50% to ensure variety
        pool_size = max(2, len(available_masterings) // 2)
        pool = available_masterings[:pool_size]
        selected = random.sample(pool, min(2, len(pool)))
    else:
        selected = available_masterings
    
    # Ensure they are different (both ID and reference_index)
    if len(selected) >= 2:
        # Check if same ID
        if selected[0]['id'] == selected[1]['id']:
            # If same, pick a different one
            other_options = [m for m in available_masterings if m['id'] != selected[0]['id']]
            if other_options:
                selected[1] = random.choice(other_options)
        
        # Check if same reference_index (should never happen, but safety check)
        if selected[0]['reference_index'] == selected[1]['reference_index']:
            # Find a different one with different reference_index
            other_options = [m for m in available_masterings 
                           if m['reference_index'] != selected[0]['reference_index'] 
                           and m['id'] != selected[0]['id']]
            if other_options:
                selected[1] = random.choice(other_options)
            else:
                # If no other options, this shouldn't happen but log it
                print(f"Warning: Only one unique reference_index available for comparison")
    
    # Final validation - ensure reference_index are different
    if len(selected) >= 2 and selected[0]['reference_index'] == selected[1]['reference_index']:
        # This should never happen, but if it does, return error
        return jsonify({'error': 'Internal error: Same reference selected twice'}), 500
    
    # Store this comparison to avoid repetition
    comparison_ids = [selected[0]['id'], selected[1]['id']]
    voting_data[job_id]['last_comparison'] = comparison_ids
    
    return jsonify({
        'mastering_1': {
            'id': selected[0]['id'],
            'reference_index': selected[0]['reference_index']
        },
        'mastering_2': {
            'id': selected[1]['id'],
            'reference_index': selected[1]['reference_index']
        }
    })

if __name__ == '__main__':
    import os
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=8360, debug=debug_mode)

