const captureButton = document.getElementById('capture');
const copyButton = document.getElementById('copy');
const clearButton = document.getElementById('clear');
const result = document.getElementById('result');
const statusElement = document.getElementById('status');
const captureHint = document.getElementById('capture-hint');
const engineBadge = document.getElementById('engine-badge');
const engineBadgeText = document.getElementById('engine-badge-text');
const systemCopy = document.getElementById('system-copy');
const resultState = document.getElementById('result-state');
const resultEmpty = document.getElementById('result-empty');
const resultEmptyTitle = document.getElementById('result-empty-title');
const resultEmptyCopy = document.getElementById('result-empty-copy');
const resultLoading = document.getElementById('result-loading');
const confidence = document.getElementById('confidence');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');

function classify(status) {
  const message = status.message || '';
  if (status.busy) return 'scanning';
  if (/^(Błąd|Nie znaleziono|Schowek)/i.test(message)) return 'error';
  if (status.text) return 'success';
  return 'ready';
}

function render(status) {
  const state = classify(status);
  const text = status.text || '';
  const hasText = Boolean(text);
  document.body.dataset.state = state;
  document.body.dataset.hasText = String(hasText);

  statusElement.textContent = status.message;
  captureHint.textContent = status.busy ? 'Przetwarzanie lokalne…' : state === 'success' ? 'Odczyt gotowy do wklejenia' : 'Gotowy do zaznaczania';
  result.value = text;
  captureButton.disabled = status.busy;
  copyButton.disabled = !hasText || status.busy;
  clearButton.disabled = !hasText || status.busy;
  charCount.textContent = text.length;
  wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;

  resultState.textContent = state === 'scanning' ? 'SKANOWANIE' : state === 'success' ? 'SUKCES' : state === 'error' ? 'BŁĄD' : 'GOTOWY';
  engineBadge.classList.toggle('is-busy', state === 'scanning');
  engineBadge.classList.toggle('is-error', state === 'error');
  engineBadgeText.textContent = state === 'scanning' ? 'Skanowanie lokalne' : state === 'error' ? 'Wymaga uwagi' : 'Lokalnie na komputerze';
  systemCopy.textContent = state === 'scanning' ? 'SILNIK LOKALNY: SKANOWANIE…' : state === 'error' ? 'SILNIK LOKALNY: SPRAWDŹ STAN' : 'SILNIK LOKALNY: AKTYWNY';
  confidence.textContent = state === 'scanning' ? 'Rozpoznawanie w pamięci RAM…' : state === 'success' ? 'Gotowe do skopiowania' : state === 'error' ? 'Spróbuj ponownie' : 'Gotowy do pracy';

  resultLoading.hidden = state !== 'scanning';
  resultEmpty.hidden = state === 'scanning' || hasText;
  if (state === 'error') {
    resultEmptyTitle.textContent = 'Nie udało się odczytać tekstu';
    resultEmptyCopy.textContent = status.message.replace(/^Błąd OCR:\s*/i, '') || 'Zaznacz wyraźniejszy fragment i spróbuj ponownie.';
  } else {
    resultEmptyTitle.textContent = 'Czekam na zaznaczenie';
    resultEmptyCopy.textContent = 'Zaznacz fragment ekranu, aby rozpoznać tekst lokalnie.';
  }
}

window.ocr.onStatus(render);
window.ocr.getStatus().then(render);
captureButton.addEventListener('click', () => window.ocr.capture());
copyButton.addEventListener('click', () => window.ocr.copy());
clearButton.addEventListener('click', () => window.ocr.clear());

const guideToggle = document.getElementById('guide-toggle');
const guideContent = document.getElementById('guide-content');
guideToggle.addEventListener('click', () => {
  const expanded = guideToggle.getAttribute('aria-expanded') === 'true';
  guideToggle.setAttribute('aria-expanded', String(!expanded));
  guideContent.hidden = expanded;
});

const infoPanel = document.getElementById('info-panel');
document.getElementById('info-button').addEventListener('click', () => { infoPanel.hidden = !infoPanel.hidden; });
document.getElementById('info-close').addEventListener('click', () => { infoPanel.hidden = true; });
