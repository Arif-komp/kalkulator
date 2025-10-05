// Inisialisasi DOM elements
const resultEl = document.getElementById('result');
const historyCurrentEl = document.getElementById('history-current');
const historyListEl = document.getElementById('historyList');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const buttons = document.querySelector('.buttons');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let currentExpression = '0';
let lastResult = null;
let historyRecords = [];

// =================================================================
// LOGIKA RIWAYAT
// =================================================================

function renderHistory() {
    // Hapus konten lama
    historyListEl.innerHTML = '';
    
    if (historyRecords.length === 0) {
        historyListEl.innerHTML = '<p class="empty-history">Belum ada perhitungan.</p>';
        return;
    }

    // Tampilkan riwayat terbaru di atas
    historyRecords.slice().reverse().forEach((record, index) => {
        const item = document.createElement('div');
        // Gunakan indeks asli untuk identifikasi (slice().reverse() mengacaukan indeks)
        const originalIndex = historyRecords.length - 1 - index; 

        item.classList.add('history-item');
        item.setAttribute('data-index', originalIndex);
        item.innerHTML = `
            <div class="history-expression">${record.expression} =</div>
            <div class="history-result">${record.result}</div>
        `;

        item.addEventListener('click', () => {
            // Memuat ulang hasil riwayat ke kalkulator
            currentExpression = String(record.result);
            historyCurrentEl.textContent = record.expression + ' =';
            lastResult = record.result;
            updateDisplay();
        });

        historyListEl.appendChild(item);
    });
}

function addToHistory(expression, result) {
    // Pastikan ekspresi valid sebelum disimpan
    if (expression !== 'Error' && expression !== '0') {
        historyRecords.push({ expression: expression, result: result });
        renderHistory();
    }
}

clearHistoryBtn.addEventListener('click', () => {
    historyRecords = [];
    renderHistory();
});

// =================================================================
// LOGIKA KALKULATOR UTAMA
// =================================================================

function updateDisplay() {
    resultEl.textContent = currentExpression;
    // Mengatur ukuran font agar responsif
    if (currentExpression.length > 15) {
        resultEl.style.fontSize = '2em';
    } else {
        resultEl.style.fontSize = '3em';
    }
}

function calculate() {
    let expressionToCalculate = currentExpression;

    try {
        // Mengganti MOD menjadi % dan simbol yang mudah diucapkan
        let expression = expressionToCalculate
            .replace(/×/g, '*')
            .replace(/MOD/g, '%');
            
        // PENTING: eval() berpotensi tidak aman
        let calculatedResult = eval(expression);

        // Memastikan hasil adalah angka, jika tidak, tampilkan error
        if (!isFinite(calculatedResult)) {
             throw new Error("Invalid Calculation");
        }

        let formattedResult = String(calculatedResult);
        
        // Simpan ke Riwayat
        addToHistory(expressionToCalculate, formattedResult);
        
        historyCurrentEl.textContent = expressionToCalculate + ' =';
        lastResult = calculatedResult;
        currentExpression = formattedResult;
        updateDisplay();
    } catch (error) {
        historyCurrentEl.textContent = expressionToCalculate + ' =';
        currentExpression = 'Error';
        lastResult = null;
        updateDisplay();
    }
}

function handleButton(value) {
    if (value === 'clear') {
        currentExpression = '0';
        historyCurrentEl.textContent = '';
        lastResult = null;
    } else if (value === '=') {
        calculate();
        return;
    } else if (currentExpression === '0' && value !== '.') {
        currentExpression = value;
    } else {
        // Logika untuk melanjutkan operasi setelah hasil
        if (lastResult !== null && lastResult !== undefined) {
             // Jika tombol yang ditekan adalah operator, gunakan hasil sebagai awal ekspresi
            if (/[+\-*/ MOD()]/.test(value)) {
                currentExpression = String(lastResult) + value;
            } else {
                // Jika tombol yang ditekan adalah angka/titik, mulai ekspresi baru
                currentExpression = value;
            }
             lastResult = null;
             historyCurrentEl.textContent = '';
        } else {
             currentExpression += value;
        }
    }
    
    // Perbaikan tampilan operator *
    currentExpression = currentExpression.replace(/\*/g, '×');

    updateDisplay();
}

// Event listener untuk tombol keyboard di layar
buttons.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn')) {
        const value = e.target.getAttribute('data-value');
        if (value === 'module') {
             handleButton(' MOD ');
        } else {
             handleButton(value);
        }
    }
});

// =================================================================
// LOGIKA INPUT SUARA (WEB SPEECH API)
// =================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        micBtn.textContent = 'Mendengarkan...';
        micStatus.textContent = 'Mendengarkan...';
        micStatus.classList.add('listening');
    };

    recognition.onend = () => {
        micBtn.textContent = '🎤 Tekan & Bicara';
        micStatus.textContent = 'Siap';
        micStatus.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        micStatus.textContent = 'Gagal: ' + event.error;
    };

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) {
            console.warn("Recognition already started or error in browser support.");
        }
    });
} else {
    micStatus.textContent = 'API Suara TIDAK didukung browser ini.';
    micBtn.disabled = true;
    micBtn.style.backgroundColor = '#ccc';
}

function processVoiceCommand(command) {
    historyCurrentEl.textContent = 'Perintah Suara: ' + command;
    let expression = command;
    
    // 1. Mengganti kata-kata operasi menjadi simbol matematika
    expression = expression
        .replace(/tambah|plus/g, '+')
        .replace(/kurang|minus/g, '-')
        .replace(/kali|dikali|perkalian|x/g, '*')
        .replace(/bagi|dibagi|pembagian/g, '/')
        .replace(/pangkat/g, '**');

    // 2. Mengubah angka dalam bentuk kata menjadi digit (Penyederhanaan)
    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3');
    expression = expression.replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6');
    expression = expression.replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9');
    expression = expression.replace(/nol/g, '0').replace(/koma/g, '.').replace(/titik/g, '.');

    // 3. Menghapus perintah yang tidak perlu dan membersihkan spasi berlebih
    expression = expression.replace(/tolong hitung|hitung|berapa|hasilnya|adalah/g, '').trim();
    expression = expression.replace(/\s+/g, ''); // Hapus semua spasi

    // 4. Perintah Khusus (Hapus/Clear)
    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    // 5. Eksekusi Perhitungan
    if (expression.length > 0) {
        // Mengganti * kembali ke × untuk tampilan
        currentExpression = expression.replace(/\*/g, '×'); 
        updateDisplay();
        calculate(); // Langsung hitung
    }
}

// Inisialisasi tampilan awal
updateDisplay();
renderHistory();
