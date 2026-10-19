const API_URL = 'http://localhost:8000/decide';

const queryInput = document.getElementById('query');
const decideBtn = document.getElementById('decideBtn');
const resultBox = document.getElementById('result');
const output = document.getElementById('output');

async function decide() {
    const q = queryInput.value.trim();
    if (!q) return;

    resultBox.classList.remove('hidden');
    output.textContent = 'Thinking... (TinyLlama 1.1B + LoRA, CPU can take a while)';
    decideBtn.disabled = true;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q })
        });
        if (!res.ok) {
            throw new Error('API error ' + res.status);
        }
        const data = await res.json();
        output.textContent = data.flrrc_decision;
    } catch (e) {
        output.textContent = 'API not reachable. Start it with: uvicorn src.api:app --port 8000';
    } finally {
        decideBtn.disabled = false;
    }
}

decideBtn.addEventListener('click', decide);
queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') decide();
});
