// Inisialisasi DOM elements
const resultEl = document.getElementById('result');
const historyCurrentEl = document.getElementById('history-current');
const historyListEl = document.getElementById('historyList');
const micBtn = document.getElementById('micBtn');
const buttons = document.querySelector('.buttons');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const burgerMenuBtn = document.getElementById('burgerMenu');
const historyPanel = document.getElementById('historyPanel');
const overlay = document.getElementById('overlay'); 

let currentExpression = '0';
let lastResult = null;
let historyRecords = [];

// =================================================================
// LOGIKA RIWAYAT & MENU (Sama seperti versi sebelumnya)
// =================================================================

function toggleHistoryPanel(isOpen) {
    if (isOpen) {
        historyPanel.classList.add('open');
        overlay.classList.add('active');
    } else {
        historyPanel.classList.remove('open');
        overlay.classList.remove('active');
    }
}

burgerMenuBtn.addEventListener('click', () => {
    const isCurrentlyOpen = historyPanel.classList.contains('open');
    toggleHistoryPanel(!isCurrentlyOpen);
});

overlay.addEventListener('click', () => {
    toggleHistoryPanel(false);
});

function renderHistory() {
    // ... (Logika renderHistory sama)
    historyListEl.innerHTML = '';
    
    if (historyRecords.length === 0) {
        historyListEl.innerHTML = '<p class="empty-history">Belum ada perhitungan.</p>';
        return;
    }

    historyRecords.slice().reverse().forEach((record) => {
        const item = document.createElement('div');
        item.classList.add('history-item');
        item.innerHTML = `
            <div class="history-expression">${record.expression} =</div>
            <div class="history-result">${record.result}</div>
        `;

        item.addEventListener('click', () => {
            currentExpression = String(record.result);
            historyCurrentEl.textContent = record.expression + ' =';
            lastResult = record.result;
            updateDisplay();
            toggleHistoryPanel(false);
        });

        historyListEl.appendChild(item);
    });
}

function addToHistory(expression, result) {
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
// LOGIKA KALKULATOR UTAMA (TERMASUK FUNGSI ILMIAH)
// =================================================================

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function cleanExpression(expression) {
    // 1. Ganti notasi tampilan ke notasi JavaScript
    let cleaned = expression
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/MOD/g, '%')
        .replace(/\^/g, '**');

    // 2. Ganti fungsi/konstanta ramah-pengguna ke fungsi Math JavaScript
    cleaned = cleaned
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(') // Logaritma basis 10
        .replace(/ln\(/g, 'Math.log(')    // Logaritma natural
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

    // 3. Tangani faktorial (n!)
    // Ini adalah logika yang kompleks karena Math.eval() tidak tahu faktorial.
    // Kita cari pola 'Angka!' atau ')'! dan menggantinya dengan fungsi faktorial buatan.
    cleaned = cleaned.replace(/(\d+)!/g, (match, p1) => `factorial(${p1})`);
    
    return cleaned;
}

function updateDisplay() {
    resultEl.textContent = currentExpression;
    resultEl.style.fontSize = currentExpression.length > 15 ? '2em' : '3em';
}

function calculate() {
    let expressionToCalculate = currentExpression;

    try {
        // PERBAIKAN: Sertakan fungsi factorial agar dapat digunakan oleh eval
        const expression = cleanExpression(expressionToCalculate);
        
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
             throw new Error("Invalid Calculation");
        }

        // Bulatkan hasil agar tidak terlalu panjang (4 digit desimal)
        calculatedResult = parseFloat(calculatedResult.toFixed(10));
        let formattedResult = String(calculatedResult);
        
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
    } else if (value === 'fact') {
         // Tambahkan '!' ke akhir angka atau tutup kurung terakhir
         if (currentExpression !== '0') {
             currentExpression += '!';
         }
    } else {
        // Logika untuk tombol angka dan fungsi setelah hasil
        if (currentExpression === '0' && value !== '.') {
            currentExpression = value;
        } else if (lastResult !== null && lastResult !== undefined) {
             if (/[+\-*/ MOD()^]/.test(value) || value.includes('(')) {
                currentExpression = String(lastResult) + value;
            } else {
                currentExpression = value;
            }
             lastResult = null;
             historyCurrentEl.textContent = '';
        } else {
             currentExpression += value;
        }
    }
    
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
// LOGIKA INPUT SUARA (Diperluas untuk fungsi ilmiah)
// =================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    // ... (Konfigurasi SpeechRecognition sama)
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => { /* ... */ };
    recognition.onend = () => { /* ... */ };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) {
            console.warn("Recognition already started or error in browser support.");
        }
    });
}

function processVoiceCommand(command) {
    historyCurrentEl.textContent = 'Perintah Suara: ' + command;
    let expression = command;
    
    // 1. Mengganti kata-kata ilmiah
    expression = expression
        .replace(/akar kuadrat|akar/g, 'sqrt(')
        .replace(/pangkat/g, '^')
        .replace(/sinus/g, 'sin(')
        .replace(/kosinus/g, 'cos(')
        .replace(/tangen/g, 'tan(')
        .replace(/logaritma/g, 'log(')
        .replace(/faktorial/g, '!');
        
    // 2. Mengganti kata-kata operasi umum
    expression = expression
        .replace(/tambah|plus/g, '+')
        .replace(/kurang|minus/g, '-')
        .replace(/kali|dikali|perkalian|x/g, '*')
        .replace(/bagi|dibagi|per/g, '/')
        .replace(/modulus|modulo|sisa bagi/g, ' MOD ');

    // 3. Mengubah angka
    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3');
    expression = expression.replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6');
    expression = expression.replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9');
    expression = expression.replace(/nol|kosong/g, '0').replace(/koma|titik/g, '.');

    // 4. Perintah Khusus (Hapus/Clear)
    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    // 5. Membersihkan dan Eksekusi
    expression = expression.replace(/tolong hitung|hitung|berapa|hasilnya|adalah/g, '').trim();
    expression = expression.replace(/\s+/g, '');

    if (expression.length > 0) {
        // Mengubah notasi kembali ke yang disukai pengguna untuk ditampilkan
        currentExpression = expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/\^/g, '^')
            .replace(/MOD/g, ' MOD '); 
        
        updateDisplay();
        calculate();
    }
}

// Inisialisasi tampilan awal
updateDisplay();
renderHistory();
