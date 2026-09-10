const button = document.getElementById('capture');
function render(status) {
  document.getElementById('status').textContent = status.message;
  document.getElementById('result').value = status.text;
  button.disabled = status.busy;
  document.getElementById('copy').disabled = !status.text;
}
window.ocr.onStatus(render);
window.ocr.getStatus().then(render);
button.addEventListener('click', () => window.ocr.capture());
document.getElementById('copy').addEventListener('click', () => window.ocr.copy());
