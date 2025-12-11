import path from 'path';
import fs from 'fs/promises';
import type { VideoAnalysis } from '../core/types';
import { logger } from './logger';

/**
 * Generate an interactive HTML timeline for video analysis review
 */
export async function generateTimeline(
  analysis: VideoAnalysis,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, 'timeline.html');

  const html = generateTimelineHtml(analysis);
  await fs.writeFile(outputPath, html);

  logger.info(`Timeline generated: ${outputPath}`);
  return outputPath;
}

/**
 * Generate the HTML content for the timeline
 */
function generateTimelineHtml(analysis: VideoAnalysis): string {
  const { duration, silences, keyframes, actions, suggestions } = analysis;

  // Calculate time savings
  const totalRemovable = suggestions
    .filter((s) => s.type === 'remove_pause')
    .reduce((acc, s) => acc + (s.endSec - s.startSec), 0);

  const silencesToRemove = silences.filter((s) => !s.keepPause);
  const silencesToKeep = silences.filter((s) => s.keepPause);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Timeline Analysis</title>
  <style>
    :root {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-tertiary: #0f3460;
      --text-primary: #eee;
      --text-secondary: #aaa;
      --accent-green: #00d26a;
      --accent-red: #ff4757;
      --accent-yellow: #ffc048;
      --accent-blue: #4285f4;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 24px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 20px;
      margin-bottom: 16px;
      color: var(--text-secondary);
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--bg-secondary);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--bg-tertiary);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-value.green { color: var(--accent-green); }
    .stat-value.red { color: var(--accent-red); }
    .stat-value.blue { color: var(--accent-blue); }
    .stat-value.yellow { color: var(--accent-yellow); }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .section {
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid var(--bg-tertiary);
    }

    /* Timeline */
    .timeline-container {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-bar {
      position: relative;
      height: 60px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      overflow: hidden;
    }

    .timeline-segment {
      position: absolute;
      height: 100%;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .timeline-segment:hover {
      opacity: 0.8;
    }

    .timeline-segment.keep {
      background: var(--accent-green);
      opacity: 0.6;
    }

    .timeline-segment.remove {
      background: var(--accent-red);
      opacity: 0.6;
    }

    .timeline-segment.suggestion {
      border: 2px dashed var(--accent-yellow);
      background: transparent;
      opacity: 0.8;
    }

    .action-marker {
      position: absolute;
      width: 2px;
      height: 100%;
      background: var(--accent-blue);
      cursor: pointer;
    }

    .action-marker::before {
      content: '';
      position: absolute;
      top: -8px;
      left: -4px;
      width: 10px;
      height: 10px;
      background: var(--accent-blue);
      border-radius: 50%;
    }

    .timeline-ruler {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .legend {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-color.green { background: var(--accent-green); opacity: 0.6; }
    .legend-color.red { background: var(--accent-red); opacity: 0.6; }
    .legend-color.yellow { border: 2px dashed var(--accent-yellow); background: transparent; }
    .legend-color.blue { background: var(--accent-blue); }

    /* Keyframes */
    .keyframes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .keyframe-card {
      background: var(--bg-tertiary);
      border-radius: 8px;
      overflow: hidden;
    }

    .keyframe-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      background: #000;
    }

    .keyframe-info {
      padding: 12px;
    }

    .keyframe-time {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .keyframe-action {
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Actions table */
    .actions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .actions-table th,
    .actions-table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--bg-tertiary);
    }

    .actions-table th {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .actions-table tr:hover td {
      background: var(--bg-tertiary);
    }

    .action-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      background: var(--bg-tertiary);
    }

    .action-badge.click { background: #4285f433; color: #4285f4; }
    .action-badge.type { background: #00d26a33; color: #00d26a; }
    .action-badge.wait { background: #ffc04833; color: #ffc048; }
    .action-badge.scroll { background: #9c27b033; color: #9c27b0; }
    .action-badge.other { background: #60606033; color: #909090; }

    /* Suggestions */
    .suggestion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .suggestion-info {
      flex: 1;
    }

    .suggestion-time {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .suggestion-reason {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .suggestion-savings {
      text-align: right;
    }

    .suggestion-duration {
      font-size: 20px;
      font-weight: 700;
      color: var(--accent-green);
    }

    .suggestion-confidence {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .no-data {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary);
    }

    /* Tooltip */
    .tooltip {
      position: fixed;
      background: var(--bg-primary);
      border: 1px solid var(--bg-tertiary);
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      pointer-events: none;
      z-index: 1000;
      max-width: 300px;
      display: none;
    }

    .tooltip.visible {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Video Timeline Analysis</h1>
    <p class="subtitle">${analysis.videoPath}</p>

    <!-- Summary Stats -->
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value blue">${formatTime(duration)}</div>
        <div class="stat-label">Total Duration</div>
      </div>
      <div class="stat-card">
        <div class="stat-value green">${formatTime(totalRemovable)}</div>
        <div class="stat-label">Potential Savings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value yellow">${silences.length}</div>
        <div class="stat-label">Pause Segments</div>
      </div>
      <div class="stat-card">
        <div class="stat-value red">${silencesToRemove.length}</div>
        <div class="stat-label">Segments to Remove</div>
      </div>
      ${actions ? `
      <div class="stat-card">
        <div class="stat-value blue">${actions.length}</div>
        <div class="stat-label">Actions Recorded</div>
      </div>
      ` : ''}
    </div>

    <!-- Timeline -->
    <div class="section">
      <h2>Timeline</h2>
      <div class="timeline-container">
        <div class="timeline-bar" id="timeline">
          ${generateTimelineSegments(silences, duration)}
          ${generateSuggestionOverlays(suggestions, duration)}
          ${actions ? generateActionMarkers(actions, duration) : ''}
        </div>
        <div class="timeline-ruler">
          <span>0:00</span>
          <span>${formatTime(duration / 4)}</span>
          <span>${formatTime(duration / 2)}</span>
          <span>${formatTime(duration * 3 / 4)}</span>
          <span>${formatTime(duration)}</span>
        </div>
      </div>
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color green"></div>
          <span>Keep (${silencesToKeep.length} segments)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color red"></div>
          <span>Remove (${silencesToRemove.length} segments)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color yellow"></div>
          <span>Suggested Trim Zone</span>
        </div>
        ${actions ? `
        <div class="legend-item">
          <div class="legend-color blue"></div>
          <span>Action Markers (${actions.length})</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Trim Suggestions -->
    <div class="section">
      <h2>Trim Suggestions (${suggestions.length})</h2>
      ${suggestions.length > 0 ? `
        <div class="suggestions-list">
          ${suggestions.map((s) => `
            <div class="suggestion-item">
              <div class="suggestion-info">
                <div class="suggestion-time">${formatTime(s.startSec)} - ${formatTime(s.endSec)}</div>
                <div class="suggestion-reason">${s.reason}</div>
              </div>
              <div class="suggestion-savings">
                <div class="suggestion-duration">-${(s.endSec - s.startSec).toFixed(1)}s</div>
                <div class="suggestion-confidence">${Math.round(s.confidence * 100)}% confidence</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="no-data">No trim suggestions - video looks optimal!</div>'}
    </div>

    <!-- Keyframes -->
    <div class="section">
      <h2>Keyframes (${keyframes.length})</h2>
      ${keyframes.length > 0 ? `
        <div class="keyframes-grid">
          ${keyframes.map((kf) => `
            <div class="keyframe-card">
              <img src="${path.basename(kf.thumbnailPath)}"
                   alt="Keyframe at ${formatTime(kf.timestampSec)}"
                   class="keyframe-img"
                   onerror="this.style.display='none'">
              <div class="keyframe-info">
                <div class="keyframe-time">${formatTime(kf.timestampSec)}</div>
                ${kf.associatedAction ? `
                  <div class="keyframe-action">${kf.associatedAction.action}${kf.associatedAction.selector ? ': ' + kf.associatedAction.selector : ''}</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="no-data">No keyframes extracted</div>'}
    </div>

    <!-- Actions -->
    ${actions && actions.length > 0 ? `
    <div class="section">
      <h2>Actions (${actions.length})</h2>
      <table class="actions-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Selector / Args</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${actions.map((a) => `
            <tr>
              <td>${formatTime(a.startMs / 1000)}</td>
              <td><span class="action-badge ${getActionClass(a.action)}">${a.action}</span></td>
              <td>${a.selector || a.args || '-'}</td>
              <td>${(a.durationMs / 1000).toFixed(2)}s</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Silence Details -->
    <div class="section">
      <h2>Silence Segments (${silences.length})</h2>
      <table class="actions-table">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${silences.map((s) => `
            <tr>
              <td>${formatTime(s.startSec)}</td>
              <td>${formatTime(s.endSec)}</td>
              <td>${s.durationSec.toFixed(2)}s</td>
              <td><span class="action-badge ${s.keepPause ? 'type' : 'click'}">${s.keepPause ? 'Keep' : 'Remove'}</span></td>
              <td>${s.reason || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="tooltip" id="tooltip"></div>

  <script>
    // Timeline hover tooltips
    const timeline = document.getElementById('timeline');
    const tooltip = document.getElementById('tooltip');

    timeline.addEventListener('mousemove', (e) => {
      const segment = e.target.closest('.timeline-segment, .action-marker');
      if (segment) {
        tooltip.innerHTML = segment.dataset.tooltip || '';
        tooltip.style.left = e.clientX + 10 + 'px';
        tooltip.style.top = e.clientY + 10 + 'px';
        tooltip.classList.add('visible');
      } else {
        tooltip.classList.remove('visible');
      }
    });

    timeline.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  </script>
</body>
</html>`;
}

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get CSS class for action type
 */
function getActionClass(action: string): string {
  if (action.includes('click') || action.includes('Click')) return 'click';
  if (action.includes('type') || action.includes('Type')) return 'type';
  if (action.includes('wait') || action.includes('Wait')) return 'wait';
  if (action.includes('scroll') || action.includes('Scroll')) return 'scroll';
  return 'other';
}

/**
 * Generate timeline segment HTML
 */
function generateTimelineSegments(
  silences: VideoAnalysis['silences'],
  duration: number
): string {
  return silences
    .map((s) => {
      const left = (s.startSec / duration) * 100;
      const width = ((s.endSec - s.startSec) / duration) * 100;
      const cls = s.keepPause ? 'keep' : 'remove';
      const tooltip = `<strong>${formatTime(s.startSec)} - ${formatTime(s.endSec)}</strong><br>${s.durationSec.toFixed(2)}s<br>${s.reason || ''}`;

      return `<div class="timeline-segment ${cls}"
                   style="left: ${left}%; width: ${width}%"
                   data-tooltip="${escapeHtml(tooltip)}"></div>`;
    })
    .join('');
}

/**
 * Generate suggestion overlay HTML
 */
function generateSuggestionOverlays(
  suggestions: VideoAnalysis['suggestions'],
  duration: number
): string {
  return suggestions
    .filter((s) => s.type === 'remove_pause')
    .map((s) => {
      const left = (s.startSec / duration) * 100;
      const width = ((s.endSec - s.startSec) / duration) * 100;
      const tooltip = `<strong>Trim Suggestion</strong><br>${formatTime(s.startSec)} - ${formatTime(s.endSec)}<br>Save ${(s.endSec - s.startSec).toFixed(1)}s<br>${s.reason}`;

      return `<div class="timeline-segment suggestion"
                   style="left: ${left}%; width: ${width}%"
                   data-tooltip="${escapeHtml(tooltip)}"></div>`;
    })
    .join('');
}

/**
 * Generate action marker HTML
 */
function generateActionMarkers(
  actions: NonNullable<VideoAnalysis['actions']>,
  duration: number
): string {
  return actions
    .map((a) => {
      const left = (a.startMs / 1000 / duration) * 100;
      const tooltip = `<strong>${a.action}</strong><br>${formatTime(a.startMs / 1000)}<br>${a.selector || a.args || ''}`;

      return `<div class="action-marker"
                   style="left: ${left}%"
                   data-tooltip="${escapeHtml(tooltip)}"></div>`;
    })
    .join('');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
