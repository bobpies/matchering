// Matchering Web Application - Frontend JavaScript

let currentJobId = null;
let currentComparison = null;
let rankings = [];
let allMasterings = [];
let currentLimiterSettings = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUpload();
    initializeComparison();
});

// Upload functionality
function initializeUpload() {
    const form = document.getElementById('upload-form');
    const targetFile = document.getElementById('target-file');
    const addRefBtn = document.getElementById('add-reference');
    const refContainer = document.getElementById('reference-container');
    const refDropZone = document.getElementById('reference-drop-zone');
    const refFilesInput = document.getElementById('reference-files-input');
    const limiterAttackInput = document.getElementById('limiter-attack');
    const limiterHoldInput = document.getElementById('limiter-hold');
    const limiterReleaseInput = document.getElementById('limiter-release');
    
    let referenceCount = 0;
    const referenceFiles = [];
    
    // Helper function to setup file input with drag and drop
    function setupFileInput(input, preview, label) {
        // Change event
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                preview.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
                preview.classList.add('active');
                label.classList.add('file-selected');
            }
        });
        
        // Drag and drop
        label.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            label.classList.add('drag-over');
        });
        
        label.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            label.classList.remove('drag-over');
        });
        
        label.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            label.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('audio/')) {
                    // Create a new FileList with the dropped file
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                } else {
                    alert('Please drop an audio file');
                }
            }
        });
    }
    
    // Target file preview and drag/drop
    const targetPreview = document.getElementById('target-preview');
    const targetLabel = targetFile.closest('label');
    setupFileInput(targetFile, targetPreview, targetLabel);
    
    // Function to add reference file to list
    function addReferenceFile(file) {
        if (referenceCount >= 10) {
            alert('Maximum 10 reference tracks allowed');
            return;
        }
        
        referenceCount++;
        referenceFiles.push(file);
        
        const refItem = document.createElement('div');
        refItem.className = 'reference-item';
        refItem.innerHTML = `
            <label class="upload-label file-selected">
                <span class="upload-icon">🎧</span>
                <span>Reference ${referenceCount}: ${file.name}</span>
                <button type="button" class="remove-ref-btn" data-index="${referenceCount - 1}">✕</button>
            </label>
            <div class="file-preview active">${file.name} (${formatFileSize(file.size)})</div>
        `;
        
        refContainer.appendChild(refItem);
        
        // Remove button
        refItem.querySelector('.remove-ref-btn').addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            referenceFiles.splice(index, 1);
            refItem.remove();
            referenceCount--;
            updateReferenceNumbers();
        });
    }
    
    function updateReferenceNumbers() {
        const items = refContainer.querySelectorAll('.reference-item');
        items.forEach((item, index) => {
            const label = item.querySelector('label span');
            if (label) {
                const parts = label.textContent.split(':');
                if (parts.length > 1) {
                    label.textContent = `Reference ${index + 1}: ${parts[1]}`;
                }
            }
        });
    }
    
    // Multi-file drag and drop for references
    refDropZone.addEventListener('click', () => {
        refFilesInput.click();
    });
    
    refDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        refDropZone.classList.add('drag-over');
    });
    
    refDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        refDropZone.classList.remove('drag-over');
    });
    
    refDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        refDropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
        const remainingSlots = 10 - referenceCount;
        const filesToAdd = files.slice(0, remainingSlots);
        
        if (files.length > remainingSlots) {
            alert(`Only ${remainingSlots} more reference(s) can be added. ${files.length - remainingSlots} file(s) ignored.`);
        }
        
        filesToAdd.forEach(file => {
            addReferenceFile(file);
        });
    });
    
    refFilesInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
        const remainingSlots = 10 - referenceCount;
        const filesToAdd = files.slice(0, remainingSlots);
        
        if (files.length > remainingSlots) {
            alert(`Only ${remainingSlots} more reference(s) can be added. ${files.length - remainingSlots} file(s) ignored.`);
        }
        
        filesToAdd.forEach(file => {
            addReferenceFile(file);
        });
        
        // Reset input
        e.target.value = '';
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const target = targetFile.files[0];
        
        if (!target) {
            alert('Please select a target track');
            return;
        }
        
        formData.append('target', target);
        
        // Add reference files
        if (referenceFiles.length === 0) {
            alert('Please add at least one reference track');
            return;
        }
        
        referenceFiles.forEach((file, index) => {
            formData.append(`reference_${index + 1}`, file);
        });

        [
            { input: limiterAttackInput, key: 'limiter_attack' },
            { input: limiterHoldInput, key: 'limiter_hold' },
            { input: limiterReleaseInput, key: 'limiter_release' },
        ].forEach(({ input, key }) => {
            if (input && input.value.trim() !== '') {
                formData.append(key, input.value.trim());
            }
        });
        
        try {
            showStage('processing');
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentJobId = data.job_id;
                pollProcessingStatus(data.job_id);
            } else {
                alert('Error: ' + data.error);
                showStage('upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading files: ' + error.message);
            showStage('upload');
        }
    });
}

// Processing status polling
async function pollProcessingStatus(jobId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/status/${jobId}`);
            const data = await response.json();
            
            const progress = (data.completed / data.total) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
            document.getElementById('processing-text').textContent = 
                `Processing ${data.completed} of ${data.total} masterings...`;
            currentLimiterSettings = data.limiter_settings || {};
            updateLimiterSummary(currentLimiterSettings);
            
            if (data.status === 'completed') {
                clearInterval(interval);
                allMasterings = data.results;
                initializeVoting(jobId);
            }
        } catch (error) {
            console.error('Status polling error:', error);
            clearInterval(interval);
        }
    }, 2000);
}

// Initialize voting system
async function initializeVoting(jobId) {
    currentJobId = jobId;
    
    // Get initial comparison
    await loadNextComparison(jobId);
    showStage('comparison');
}

// Load next comparison
async function loadNextComparison(jobId) {
    try {
        // Pause all audios first
        const originalAudio = document.getElementById('original-audio');
        const masteringAAudio = document.getElementById('mastering-a-audio');
        const masteringBAudio = document.getElementById('mastering-b-audio');
        [originalAudio, masteringAAudio, masteringBAudio].forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        const response = await fetch(`/api/next-comparison/${jobId}`);
        const data = await response.json();
        
        currentComparison = data;
        
        const mastering1 = data.mastering_1;
        const mastering2 = data.mastering_2;
        
        // Set up audio players - each with their own preview
        // Add cache-busting timestamp to prevent browser from caching the same file
        const timestamp = Date.now();
        originalAudio.src = `/api/original/${jobId}?t=${timestamp}`;
        masteringAAudio.src = `/api/preview/${jobId}/${mastering1.reference_index}?t=${timestamp}`;
        masteringBAudio.src = `/api/preview/${jobId}/${mastering2.reference_index}?t=${timestamp}`;
        
        // Log for debugging
        console.log('Loading comparison:', {
            mastering1: { id: mastering1.id, ref: mastering1.reference_index },
            mastering2: { id: mastering2.id, ref: mastering2.reference_index }
        });
        
        // Sync all previews to start at the same time when playing
        const syncTime = 0;
        originalAudio.currentTime = syncTime;
        masteringAAudio.currentTime = syncTime;
        masteringBAudio.currentTime = syncTime;
        
        // Store mastering IDs
        document.querySelector('.mastering[data-mastering="a"]').dataset.masteringId = mastering1.id;
        document.querySelector('.mastering[data-mastering="b"]').dataset.masteringId = mastering2.id;
        
        // Update rankings below
        updateComparisonRankings();
        
    } catch (error) {
        console.error('Error loading comparison:', error);
    }
}

// Comparison functionality
function initializeComparison() {
    // Get all audio elements
    const originalAudio = document.getElementById('original-audio');
    const masteringAAudio = document.getElementById('mastering-a-audio');
    const masteringBAudio = document.getElementById('mastering-b-audio');
    const allAudios = [originalAudio, masteringAAudio, masteringBAudio];
    
    let hoverTimeout = null;
    let currentlyPlaying = null;
    
    // Function to pause all audios
    function pauseAll() {
        allAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        currentlyPlaying = null;
    }
    
    // Function to play audio with sync
    function playAudio(audio, syncOthers = false) {
        pauseAll();
        const startTime = 0;
        audio.currentTime = startTime;
        audio.play();
        currentlyPlaying = audio;
        
        // If syncing, play others at same time
        if (syncOthers) {
            masteringAAudio.currentTime = startTime;
            masteringBAudio.currentTime = startTime;
            masteringAAudio.play();
            masteringBAudio.play();
        }
    }
    
    // Hover preview for mastering players
    document.querySelectorAll('.hover-preview').forEach(player => {
        const mastering = player.dataset.mastering;
        const audio = mastering === 'a' ? masteringAAudio : masteringBAudio;
        const previewArea = player.querySelector('.preview-area');
        
        // Hover to play (only this one)
        previewArea.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                // Force reload audio source to ensure fresh content
                const currentSrc = audio.src;
                audio.src = '';
                audio.src = currentSrc;
                playAudio(audio, false);
            }, 200); // Small delay to avoid accidental triggers
        });
        
        // Mouse out to stop
        previewArea.addEventListener('mouseleave', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                if (currentlyPlaying === audio) {
                    pauseAll();
                }
            }, 100);
        });
        
        // Click to vote
        previewArea.addEventListener('click', async (e) => {
            e.stopPropagation();
            pauseAll();
            await submitVote(mastering);
            // Auto-continue to next comparison
            if (currentJobId) {
                await loadNextComparison(currentJobId);
            }
        });
    });
    
    // Original preview (hover plays all synchronized)
    const originalPreview = document.querySelector('.original .preview-area');
    if (originalPreview) {
        originalPreview.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                // Play original and sync others
                pauseAll();
                const startTime = 0;
                originalAudio.currentTime = startTime;
                masteringAAudio.currentTime = startTime;
                masteringBAudio.currentTime = startTime;
                originalAudio.play();
                masteringAAudio.play();
                masteringBAudio.play();
                currentlyPlaying = originalAudio; // Track original as main
            }, 200);
        });
        
        originalPreview.addEventListener('mouseleave', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                if (currentlyPlaying === originalAudio) {
                    pauseAll();
                }
            }, 100);
        });
    }
    
    // Vote buttons (backup)
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            pauseAll();
            const mastering = e.target.dataset.mastering;
            await submitVote(mastering);
            // Auto-continue to next comparison
            if (currentJobId) {
                await loadNextComparison(currentJobId);
            }
        });
    });
    
    // Skip button
    document.getElementById('skip-comparison').addEventListener('click', async () => {
        pauseAll();
        if (currentJobId) {
            await loadNextComparison(currentJobId);
        }
    });
    
    // Stop comparing button
    document.getElementById('stop-comparing').addEventListener('click', () => {
        pauseAll();
        showStage('rankings');
        updateRankingsChart();
    });
}

// Submit vote
async function submitVote(winnerMastering) {
    if (!currentComparison) return;
    
    const winnerId = winnerMastering === 'a' ? 
        currentComparison.mastering_1.id : currentComparison.mastering_2.id;
    const loserId = winnerMastering === 'a' ? 
        currentComparison.mastering_2.id : currentComparison.mastering_1.id;
    
    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                job_id: currentJobId,
                winner_id: winnerId,
                loser_id: loserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            rankings = data.rankings;
            updateComparisonRankings(); // Update rankings below comparison
        }
    } catch (error) {
        console.error('Vote error:', error);
    }
}

// Update rankings below comparison
function updateComparisonRankings() {
    if (!currentJobId) return;
    
    const rankingsDiv = document.getElementById('comparison-rankings');
    if (rankingsDiv) {
        rankingsDiv.style.display = 'block';
    }
    
    updateRankingsChart('comparison-rankings-chart', 'comparison-rankings-list');
}

// Update rankings chart
async function updateRankingsChart(chartId = 'rankings-chart', listId = 'rankings-list') {
    if (!currentJobId) return;
    
    try {
        const response = await fetch(`/api/rankings/${currentJobId}`);
        const data = await response.json();
        
        rankings = data.rankings;
        
        // Update chart
        const chartContainer = document.getElementById(chartId);
        if (chartContainer) {
            chartContainer.innerHTML = '<canvas class="rankings-canvas"></canvas>';
            
            // Simple bar chart
            const canvas = chartContainer.querySelector('.rankings-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = chartContainer.offsetWidth || 800;
                canvas.height = 300;
                
                const maxVotes = Math.max(...rankings.map(r => r.wins), 1);
                const barWidth = canvas.width / Math.max(rankings.length, 1);
                
                ctx.fillStyle = '#fed535';
                rankings.forEach((ranking, index) => {
                    const barHeight = (ranking.wins / maxVotes) * (canvas.height - 40);
                    ctx.fillRect(index * barWidth + 10, canvas.height - barHeight - 20, barWidth - 20, barHeight);
                    
                    // Label
                    ctx.fillStyle = '#e4e3df';
                    ctx.font = '12px Ubuntu';
                    ctx.fillText(`Ref ${ranking.reference_index}`, index * barWidth + 10, canvas.height - 5);
                    ctx.fillStyle = '#fed535';
                });
            }
        }
        
        // Update rankings list
        const listContainer = document.getElementById(listId);
        if (listContainer) {
            listContainer.innerHTML = rankings.map((ranking, index) => `
                <div class="ranking-item">
                    <div class="ranking-number">#${index + 1}</div>
                    <div class="ranking-info">
                        <div>Reference ${ranking.reference_index}</div>
                        <div class="ranking-stats">
                            <span>🔥 Wins: ${ranking.wins}</span>
                            <span>Votes: ${ranking.votes}</span>
                            <span>Losses: ${ranking.losses}</span>
                        </div>
                    </div>
                    <div class="ranking-actions">
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav16" 
                           class="download-btn">Download WAV 16-bit</a>
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav24" 
                           class="download-btn">Download WAV 24-bit</a>
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav24_low" 
                           class="download-btn">24-bit Low Loudness</a>
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav24_high" 
                           class="download-btn">24-bit High Loudness</a>
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav24_nolimiter" 
                           class="download-btn">24-bit (No Limiter)</a>
                        <a href="/api/download/${currentJobId}/${ranking.reference_index}/wav24_nolimiter_normalized" 
                           class="download-btn">24-bit (No Limiter + Normalize)</a>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading rankings:', error);
    }
}

// Continue comparing
const continueComparingBtn = document.getElementById('continue-comparing');
if (continueComparingBtn) {
    continueComparingBtn.addEventListener('click', async () => {
        if (currentJobId) {
            await loadNextComparison(currentJobId);
            showStage('comparison');
        }
    });
}

// View all masterings
document.getElementById('view-all').addEventListener('click', () => {
    showAllResults();
    showStage('results');
});

// Show all results
function showAllResults() {
    const grid = document.getElementById('results-grid');
    grid.innerHTML = allMasterings.map((mastering) => `
        <div class="result-card">
            <h3>Reference ${mastering.reference_index}</h3>
            <div class="preview-group">
                <div class="preview-row">
                    <span>Low Loudness</span>
                    <audio controls>
                        <source src="/api/preview-low/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
                <div class="preview-row">
                    <span>Limited</span>
                    <audio controls>
                        <source src="/api/preview/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
                <div class="preview-row">
                    <span>High Loudness</span>
                    <audio controls>
                        <source src="/api/preview-high/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
                <div class="preview-row">
                    <span>No Limiter</span>
                    <audio controls>
                        <source src="/api/preview-nolimiter/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
                <div class="preview-row">
                    <span>No Limiter + Normalize</span>
                    <audio controls>
                        <source src="/api/preview-nolimiter-normalized/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
                <div class="preview-row">
                    <span>Original Slice</span>
                    <audio controls>
                        <source src="/api/preview-original/${currentJobId}/${mastering.reference_index}" type="audio/wav">
                    </audio>
                </div>
            </div>
            <div class="download-options">
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav16" 
                   class="download-btn">Download WAV 16-bit</a>
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav24" 
                   class="download-btn">Download WAV 24-bit</a>
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav24_low" 
                   class="download-btn">24-bit Low Loudness</a>
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav24_high" 
                   class="download-btn">24-bit High Loudness</a>
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav24_nolimiter" 
                   class="download-btn">24-bit (No Limiter)</a>
                <a href="/api/download/${currentJobId}/${mastering.reference_index}/wav24_nolimiter_normalized" 
                   class="download-btn">24-bit (No Limiter + Normalize)</a>
            </div>
        </div>
    `).join('');
}

// Stage management
function showStage(stageName) {
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    document.getElementById(`stage-${stageName}`).classList.add('active');
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function updateLimiterSummary(settings = {}) {
    const summaryEl = document.getElementById('limiter-settings-summary');
    if (!summaryEl) return;
    const fields = [
        { key: 'attack', label: 'Attack' },
        { key: 'hold', label: 'Hold' },
        { key: 'release', label: 'Release' },
    ];
    const parts = fields
        .map(field => {
            if (settings[field.key] === undefined) return null;
            return `${field.label} ${settings[field.key]} ms`;
        })
        .filter(Boolean);
    if (parts.length === 0) {
        summaryEl.textContent = 'Limiter settings: Default Matchering envelope.';
    } else {
        summaryEl.textContent = `Limiter settings: ${parts.join(' • ')}`;
    }
}

