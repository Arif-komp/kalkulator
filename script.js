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
let isSolvingEquation = false; // Flag untuk melacak mode pemecahan masalah
let targetValue = null;         // Target nilai (misalnya 500)
let inputNumber = null;         // Angka masukan (misalnya 15)

/**
 * Fungsi untuk menghitung faktorial (n!)
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
 */
function cleanExpression(expression) {
    let cleaned = expression
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/MOD/g, '%')
        .replace(/\^/g, '**');

    cleaned = cleaned
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(') 
        .replace(/ln\(/g, 'Math.log(')    
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

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
        
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
             throw new Error("Invalid Calculation");
        }

        // =========================================================
        // LOGIKA BARU UNTUK KOMBINASI DAN PEMBULATAN CERDAS
        // =========================================================
        let formattedResult;
        let combinationDetails = null; // Detail baru untuk kombinasi

        if (isSolvingEquation && calculatedResult % 1 !== 0) {
            
            let X = Math.round(calculatedResult);
            let Y = 0;
            let finalExpression = expressionToCalculate;

            // Logika hanya berlaku untuk operasi perkalian sederhana (seperti 500/15)
            // Cek apakah ekspresi adalah pembagian hasil dari solveSimpleEquation
            if (expressionToCalculate.includes('/') && targetValue !== null && inputNumber !== null) {
                
                // Hitung hasil dengan bilangan bulat (X)
                let actualResult = X * inputNumber;
                
                // Hitung selisih (Y) yang dibutuhkan
                Y = targetValue - actualResult;
                
                // Ekspresi yang akan dicatat: (Input * X) + Y
                finalExpression = `${inputNumber} × ${X} ${Y >= 0 ? '+' : '-'} ${Math.abs(Y)}`;
                formattedResult = `${X} dan ${Y > 0 ? 'tambah' : 'kurang'} ${Math.abs(Y)}`;

                // Simpan detail kombinasi
                combinationDetails = {
                    X: X, 
                    Y: Y, 
                    finalExpression: finalExpression, 
                    target: targetValue,
                    operation: Y >= 0 ? '+' : '-'
                };
            }
            
            // Jika tidak ada kombinasi yang ditemukan (misalnya, bukan perkalian), gunakan pembulatan sederhana
            if (combinationDetails === null) {
                formattedResult = String(X);
            }
            
            // Masukkan hasil ke riwayat
            addToHistory(finalExpression, formattedResult, combinationDetails, calculatedResult); 

        } else {
            // Logika standar untuk perhitungan langsung
            calculatedResult = parseFloat(calculatedResult.toFixed(10));
            formattedResult = String(calculatedResult);
            addToHistory(expressionToCalculate, formattedResult, null, calculatedResult); 
        }
        // =========================================================

        historyCurrentEl.textContent = expressionToCalculate + ' =';
        lastResult = calculatedResult; // Simpan nilai desimal asli untuk perhitungan berikutnya
        
        // Tampilkan jawaban kombinasi di layar utama jika ada
        if (combinationDetails) {
            resultEl.textContent = combinationDetails.X;
            // Tampilkan rincian kombinasi di atas hasil utama
            historyCurrentEl.textContent = `Pilihan Bulat: ${combinationDetails.finalExpression} = ${combinationDetails.target}`;
        } else {
             currentExpression = formattedResult;
        }

        updateDisplay();

    } catch (error) {
        historyCurrentEl.textContent = expressionToCalculate + ' =';
        currentExpression = 'Error';
        lastResult = null;
        updateDisplay();
        console.error("Calculation Error:", error);
    } finally {
        isSolvingEquation = false; // Reset flag
        targetValue = null;
        inputNumber = null;
    }
}

/**
 * Menangani input dari setiap tombol yang diklik.
 */
function handleButton(value) {
    // ... (Logika handleButton sama seperti sebelumnya) ...
    if (value === 'clear') {
        currentExpression = '0';
        historyCurrentEl.textContent = '';
        lastResult = null;
    } else if (value === '=') {
        calculate();
        return;
    } else if (value === 'fact') {
         if (/[0-9)]/.test(currentExpression.slice(-1))) {
             currentExpression += '!';
         }
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
    
    currentExpression = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');

    updateDisplay();
}

// =================================================================
// LOGIKA PEMECAHAN PERSAMAAN 
// =================================================================

/**
 * Mencoba menyelesaikan persamaan linear dasar dan mengekstrak komponennya.
 * @returns {string|null} Ekspresi perhitungan untuk mendapatkan X, atau null.
 */
function solveSimpleEquation(text) {
    const resultKeywords = /hasilnya|sama\s*dengan/i;
    if (!resultKeywords.test(text)) {
        return null; 
    }

    const parts = text.replace(/berapa/g, 'x').split(resultKeywords);
    
    if (parts.length !== 2) {
        return null; 
    }
    
    let leftSide = parts[0].trim().replace(/\s+/g, ''); 
    let rightSide = parts[1].trim(); 
    
    if (leftSide.includes('x')) {
        let num;
        
        // Kasus Perkalian (Paling relevan untuk kombinasi): num * x = rightSide
        if (leftSide.includes('*')) {
            [num] = leftSide.split('*').filter(p => p !== 'x');
            // Simpan nilai untuk perhitungan kombinasi di calculate()
            inputNumber = parseFloat(num);
            targetValue = parseFloat(rightSide);
            return `${rightSide} / ${num}`; 
        }
        
        // Kasus Pembagian: x / num = rightSide ATAU num / x = rightSide
        if (leftSide.includes('/')) {
             if (leftSide.startsWith('x')) {
                [num] = leftSide.split('x/').filter(p => p !== 'x');
                return `${rightSide} * ${num}`;
            } else {
                [num] = leftSide.split('/x').filter(p => p !== 'x');
                return `${num} / ${rightSide}`;
            }
        }
        // Kasus Penambahan: x + num = rightSide
        if (leftSide.includes('+')) {
            [num] = leftSide.split('+').filter(p => p !== 'x');
            return `${rightSide} - ${num}`; 
        }
        // Kasus Pengurangan: x - num = rightSide ATAU num - x = rightSide
        if (leftSide.includes('-')) {
            if (leftSide.startsWith('x')) {
                 [num] = leftSide.split('x-').filter(p => p !== 'x');
                 return `${rightSide} + ${num}`;
            } else {
                 [num] = leftSide.split('-x').filter(p => p !== 'x');
                 return `${num} - ${rightSide}`;
            }
        }
    }
    
    return null; 
}


// =================================================================
// LOGIKA INPUT SUARA & RIWAYAT
// =================================================================

// ... (Kode SpeechRecognition dan processVoiceCommand sama, tetapi dengan pembaruan pada processVoiceCommand) ...
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
        .replace(/kurang|minus|kurangi/g, '-')
        .replace(/kali|dikali|perkalian|x/g, '*')
        .replace(/bagi|dibagi|per/g, '/')
        .replace(/modulus|modulo|sisa bagi/g, ' MOD ');

    // 2. Mengubah angka dalam bentuk kata
    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3');
    expression = expression.replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6');
    expression = expression.replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9');
    expression = expression.replace(/nol|kosong/g, '0').replace(/koma|titik/g, '.');

    // 3. Perintah Khusus
    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    // 4. Membersihkan untuk analisis
    let cleanSpeech = expression.replace(/tolong hitung|hitung|adalah/g, '').trim();
    cleanSpeech = cleanSpeech.replace(/\s+/g, '');
    
    // 5. PEMECAHAN PERSAMAAN CEPAT
    const solvedExpression = solveSimpleEquation(cleanSpeech);

    if (solvedExpression) {
        isSolvingEquation = true; // Set flag
        historyCurrentEl.textContent = `Pemecahan: ${command} -> ${solvedExpression.replace(/\*/g, '×').replace(/\//g, '÷')}`;
        currentExpression = solvedExpression;
        updateDisplay();
        calculate(); 
        return; 
    }

    // 6. Jika bukan persamaan, lakukan perhitungan langsung
    if (cleanSpeech.length > 0) {
        currentExpression = cleanSpeech
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/\^/g, '^')
            .replace(/MOD/g, ' MOD '); 
        
        updateDisplay();
        calculate(); 
    }
}


// =================================================================
// LOGIKA RIWAYAT
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
        
        let expressionText = record.expression;
        let resultText = record.result;

        // Tampilkan hasil kombinasi yang mudah dibaca
        if (record.combination) {
             expressionText = record.combination.finalExpression;
             resultText = `Jawaban: ${record.combination.X} (${record.combination.operation === '+' ? 'tambah' : 'kurang'} ${Math.abs(record.combination.Y)})`;
        }
        
        item.innerHTML = `
            <div class="history-expression">${expressionText} =</div>
            <div class="history-result">${resultText}</div>
        `;

        item.addEventListener('click', () => {
            // Saat diklik, gunakan hasil yang dibulatkan (X) jika ada kombinasi, atau hasil biasa
            if (record.combination) {
                currentExpression = String(record.combination.X);
                historyCurrentEl.textContent = `Jawaban: ${expressionText} = ${record.combination.target}`;
            } else {
                currentExpression = String(record.result);
                historyCurrentEl.textContent = record.expression + ' =';
            }
            lastResult = parseFloat(record.originalResult);
            updateDisplay();
            toggleHistoryPanel(false);
        });

        historyListEl.appendChild(item);
    });
}

function addToHistory(expression, result, combination = null, originalResult = null) {
    if (expression !== 'Error' && expression !== '0') {
        historyRecords.push({ 
            expression: expression, 
            result: result, 
            combination: combination,
            originalResult: originalResult || result
        });
        renderHistory();
    }
}

clearHistoryBtn.addEventListener('click', () => {
    historyRecords = [];
    renderHistory();
});

// Event listener untuk tombol di layar
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


// INISIALISASI
updateDisplay();
renderHistory();
