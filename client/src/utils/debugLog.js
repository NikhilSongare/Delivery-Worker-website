import { mapsApiUrl } from '../api/mapsApiUrl';

export function debugLog(hypothesisId, location, message, data, runId = 'post-fix-v3') {
  const payload = {
    sessionId: 'bf6bbc',
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fetch('http://127.0.0.1:7557/ingest/b486153c-0946-40fc-b7f7-348480f01ddc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'bf6bbc' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch(mapsApiUrl('/debug/log'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
