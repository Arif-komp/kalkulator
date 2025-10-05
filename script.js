// =================================================================
// INISIALISASI & FUNGSI INTI KALKULATOR (dengan Modifikasi Live Score)
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
let isSolvingEquation = false;
let targetValue = null;
let inputNumber = null;


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

// -------------------------------------------------------------
// FUNGSI BARU: Pratinjau Perhitungan (Live Score)
// -------------------------------------------------------------
/**
 * Melakukan perhitungan ekspresi saat ini dan menampilkannya di historyCurrentEl
 * tanpa mengubah currentExpression atau historyRecords.
 */
function previewCalculation() {
    let expressionToCalculate = currentExpression;

    // Jangan tampilkan pratinjau jika ekspresi hanya "0"
    if (expressionToCalculate === '0' || expressionToCalculate === 'Error') {
        historyCurrentEl.textContent = '';
        return;
    }
    
    // Jangan pratinjau jika ekspresi berakhir dengan operator
    if (/[+\-×÷ MOD\^]$/.test(expressionToCalculate)) {
        historyCurrentEl.textContent = expressionToCalculate + '...';
        return;
    }

    // Hanya preview untuk operasi standar (tidak termasuk kombinasi/tujuan)
    if (isSolvingEquation) return; 

    try {
        const expression = cleanExpression(expressionToCalculate);
        
        // Coba evaluasi, jika ada error (misal: kurung belum ditutup), abaikan
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
            historyCurrentEl.textContent = 'Invalid Input';
            return;
        }

        // Pembulatan standar untuk pratinjau
        calculatedResult = parseFloat(calculatedResult.toFixed(10));
        let formattedResult = String(calculatedResult);
        
        // Tampilkan pratinjau di elemen historyCurrentEl
        historyCurrentEl.textContent = formattedResult;

    } catch (error) {
        // Abaikan error sintaks selama input (misal: "1+")
        historyCurrentEl.textContent = expressionToCalculate + '...'; 
    }
}
// -------------------------------------------------------------
// AKHIR FUNGSI BARU
// -------------------------------------------------------------

/**
 * Melakukan perhitungan ekspresi saat ini.
 * (Fungsi calculate() ini TETAP bertanggung jawab untuk hasil AKHIR dan RIWAYAT)
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
        // LOGIKA KOMBINASI DAN PEMBULATAN CERDAS
        // =========================================================
        let formattedResult;
        let combinationDetails = null;

        if (isSolvingEquation && calculatedResult % 1 !== 0) {
            
            let X = Math.round(calculatedResult);
            let Y = 0;
            let finalExpression = expressionToCalculate;

            // Logika hanya berlaku untuk operasi pembagian yang dihasilkan dari masalah kombinasi
            if (expressionToCalculate.includes('/') && targetValue !== null && inputNumber !== null) {
                
                let actualResult = X * inputNumber;
                Y = targetValue - actualResult;
                
                // Ekspresi kombinasi yang mudah dibaca
                finalExpression = `${inputNumber} × ${X} ${Y >= 0 ? '+' : '-'} ${Math.abs(Y)}`;
                formattedResult = `${X}`; // Nilai X yang dibulatkan

                combinationDetails = {
                    X: X,
                    Y: Y,
                    finalExpression: finalExpression,
                    target: targetValue,
                    operation: Y >= 0 ? '+' : '-'
                };
            }
            
            if (combinationDetails === null) {
                // Jika bukan kasus kombinasi, gunakan pembulatan sederhana
                 X = Math.round(calculatedResult);
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
        lastResult = calculatedResult;
        
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
 * TELAH DIMODIFIKASI untuk memanggil previewCalculation()
 */
function handleButton(value) {
    // 1. CLEAR
    if (value === 'clear') {
        currentExpression = '0';
        historyCurrentEl.textContent = '';
        lastResult = null;
        updateDisplay(); // Perlu updateDisplay di sini juga
        return;
    // 2. EQUALS
    } else if (value === '=') {
        // HANYA saat '=' ditekan, kita panggil calculate() yang akan menyimpan riwayat.
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
    
    // 5. Normalisasi tampilan
    currentExpression = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');

    // Tampilkan ekspresi yang sedang diketik
    updateDisplay();
    
    // 6. Pratinjau hasil (Live Score)
    // Panggil fungsi pratinjau setelah setiap tombol input (kecuali clear dan =)
    previewCalculation(); 
}

// =================================================================
// LOGIKA INPUT SUARA
// =================================================================

// ... (Kode untuk Speech Recognition tetap sama) ...
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
    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3')
                         .replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6')
                         .replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9')
                         .replace(/nol|kosong/g, '0').replace(/koma|titik/g, '.');

    // 3. Perintah Khusus
    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    // 4. Analisis Frasa Fleksibel BARU (Pola Pendek: "15 ke 500")
    const simpleFlexMatch = command.match(/(\d+(\.\d+)?)\s+(ke|buat|jadi)\s+(\d+(\.\d+)?)/i);
    
    // Analisis Frasa Fleksibel LAMA (Pola Panjang: "15 diapakan agar hasilnya 500")
    const complexFlexMatch = command.match(/(\d+(\.\d+)?)\s+diapakan\s+agar\s+hasilnya\s+(\d+(\.\d+)?)/i);

    let match = simpleFlexMatch || complexFlexMatch;

    if (match) {
        
        let num1, num2;

        if (simpleFlexMatch) {
            // Untuk pola pendek: [Angka Input] [ke/buat/jadi] [Angka Target]
            num1 = match[1];
            num2 = match[4];
        } else {
             // Untuk pola panjang: [Angka Input] diapakan agar hasilnya [Angka Target]
            num1 = match[1];
            num2 = match[4];
        }

        // Atur variabel global untuk dipakai di fungsi calculate()
        inputNumber = parseFloat(num1);
        targetValue = parseFloat(num2);

        isSolvingEquation = true; // Set flag untuk mengaktifkan logika kombinasi
        
        // Ekspresi yang akan dihitung adalah pembagian sederhana (sebagai basis pencarian)
        let solvedExpression = `${num2} / ${num1}`;
        
        historyCurrentEl.textContent = `Pencarian Kombinasi: ${command} -> ${solvedExpression}`;
        currentExpression = solvedExpression;
        updateDisplay();
        calculate();
        return;
    }
    
    // 5. Jika bukan frasa fleksibel, lakukan perhitungan langsung
    let cleanSpeech = expression.replace(/tolong hitung|hitung|adalah/g, '').trim();
    cleanSpeech = cleanSpeech.replace(/\s+/g, '');
    
    if (cleanSpeech.length > 0) {
        currentExpression = cleanSpeech
            .replace(/\*/g, '×').replace(/\//g, '÷').replace(/\^/g, '^').replace(/MOD/g, ' MOD ');
        
        updateDisplay();
        calculate();
    }
}


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
        
        let expressionText = record.expression;
        let resultText = record.result;

        // Tampilkan hasil kombinasi yang mudah dibaca
        if (record.combination) {
              expressionText = record.combination.finalExpression;
              resultText = `X=${record.combination.X} (${record.combination.operation === '+' ? 'tambah' : 'kurang'} ${Math.abs(record.combination.Y)})`;
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


// =================================================================
// INISIALISASI
// =================================================================

updateDisplay();
renderHistory();
