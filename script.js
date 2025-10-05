// =================================================================
// INISIALISASI & FUNGSI INTI KALKULATOR
// =================================================================

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


/**
 * Fungsi untuk menghitung faktorial (n!)
 * @param {number} n 
 */
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0) return 1;
    n = Math.floor(n); 
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/**
 * Mengkonversi ekspresi yang mudah dibaca pengguna menjadi ekspresi JS yang dapat dievaluasi.
 * @param {string} expression 
 */
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
    // Penting: Menggunakan regex untuk menangani angka integer atau float sebelum '!'
    cleaned = cleaned.replace(/(\d+(\.\d+)?)!/g, (match, p1) => `factorial(${p1})`);
    
    return cleaned;
}

/**
 * Memperbarui tampilan hasil di layar kalkulator.
 */
function updateDisplay() {
    resultEl.textContent = currentExpression;
    resultEl.style.fontSize = currentExpression.length > 15 ? '2em' : '4.5em';
}

/**
 * Melakukan perhitungan ekspresi saat ini.
 */
function calculate() {
    let expressionToCalculate = currentExpression;

    if (expressionToCalculate === '0' || expressionToCalculate === 'Error') return;

    try {
        const expression = cleanExpression(expressionToCalculate);
        
        // PENTING: Menggunakan new Function untuk eksekusi yang aman dan dapat mengakses fungsi global (factorial)
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
             throw new Error("Invalid Calculation");
        }

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
        console.error("Calculation Error:", error);
    }
}

/**
 * Menangani input dari setiap tombol yang diklik.
 * @param {string} value - Nilai data-value dari tombol
 */
function handleButton(value) {
    // 1. CLEAR
    if (value === 'clear') {
        currentExpression = '0';
        historyCurrentEl.textContent = '';
        lastResult = null;
    // 2. EQUALS
    } else if (value === '=') {
        calculate();
        return;
    // 3. FAKTORIAL
    } else if (value === 'fact') {
         if (/[0-9)]/.test(currentExpression.slice(-1))) {
             currentExpression += '!';
         }
    // 4. ANGKA DAN OPERATOR LAIN
    } else {
        if (lastResult !== null && lastResult !== undefined) {
             if (/[+\-*/ MOD()^]/.test(value) || value.includes('(')) {
                currentExpression = String(lastResult) + value;
            } else {
                currentExpression = value;
            }
             lastResult = null;
             historyCurrentEl.textContent = '';
        } else {
             if (currentExpression === '0' && value !== '.') {
                 currentExpression = value;
             } else {
                 currentExpression += value;
             }
        }
    }
    
    // Pembersihan tampilan: Pastikan '×' dan '÷' yang disukai pengguna ada di tampilan
    currentExpression = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');

    updateDisplay();
}

// =================================================================
// EVENT LISTENERS
// =================================================================

// Event listener untuk tombol di layar
buttons.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn')) {
        const value = e.target.getAttribute('data-value');
        if (value === 'module') {
             handleButton(' MOD '); // Beri spasi untuk modulus
        } else {
             handleButton(value);
        }
    }
});


// =================================================================
// LOGIKA RIWAYAT & MENU
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
// LOGIKA INPUT SUARA
// =================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        micBtn.textContent = 'Mendengarkan... 🔴';
        micBtn.classList.add('listening');
    };

    recognition.onend = () => {
        micBtn.textContent = 'Rekam';
        micBtn.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Kesalahan Pengenalan Suara:", event.error);
        micBtn.textContent = 'Error. Klik untuk coba lagi.';
        micBtn.classList.remove('listening');
    };

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) {
            console.warn("Recognition already started or error in browser support.", e);
        }
    });
} else {
    micBtn.textContent = 'API Suara TIDAK didukung browser ini.';
    micBtn.disabled = true;
    micBtn.style.backgroundColor = '#ccc';
}

function processVoiceCommand(command) {
    historyCurrentEl.textContent = 'Perintah Suara: ' + command;
    let expression = command;
    
    // 1. Mengganti kata-kata ilmiah dan operator
    expression = expression
        .replace(/akar kuadrat|akar/g, 'sqrt(')
        .replace(/pangkat/g, '^')
        .replace(/sinus/g, 'sin(')
        .replace(/kosinus/g, 'cos(')
        .replace(/tangen/g, 'tan(')
        .replace(/logaritma/g, 'log(')
        .replace(/faktorial/g, '!')
        .replace(/tambah|plus/g, '+')
        .replace(/kurang|minus/g, '-')
        .replace(/kali|dikali|perkalian|x/g, '*')
        .replace(/bagi|dibagi|per/g, '/')
        .replace(/modulus|modulo|sisa bagi/g, ' MOD ');

    // 2. Mengubah angka
    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3');
    expression = expression.replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6');
    expression = expression.replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9');
    expression = expression.replace(/nol|kosong/g, '0').replace(/koma|titik/g, '.');

    // 3. Perintah Khusus
    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    // 4. Membersihkan dan Eksekusi
    expression = expression.replace(/tolong hitung|hitung|berapa|hasilnya|adalah/g, '').trim();
    expression = expression.replace(/\s+/g, '');

    if (expression.length > 0) {
        currentExpression = expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/\^/g, '^')
            .replace(/MOD/g, ' MOD '); 
        
        updateDisplay();
        calculate(); // Langsung hitung hasil dari suara
    }
}


// =================================================================
// INISIALISASI
// =================================================================

updateDisplay();
renderHistory();
