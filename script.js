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
let isSolvingEquation = false;
let targetValue = null;
let inputNumber = null;

// =================================================================
// FUNGSI PERSISTENSI RIWAYAT (LocalStorage)
// =================================================================

function loadHistory() {
    const storedHistory = localStorage.getItem('calculatorHistory');
    if (storedHistory) {
        try {
            historyRecords = JSON.parse(storedHistory);
        } catch (e) {
            console.error("Gagal memuat riwayat:", e);
            historyRecords = [];
        }
    }
    renderHistory();
}

function saveHistory() {
    localStorage.setItem('calculatorHistory', JSON.stringify(historyRecords));
}

// =================================================================
// FUNGSI MATEMATIKA & UTILITY
// =================================================================

// Fungsi factorial dihilangkan karena tombol n! diganti dengan %

function cleanExpression(expression) {
    let cleaned = expression
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/MOD/g, '%')
        .replace(/\^/g, '**')
        .replace(/%/g, '/100') // <-- LOGIKA BARU UNTUK PERSEN
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

    // Menghapus baris faktorial karena sudah diganti tombol %
    // cleaned = cleaned.replace(/(\d+(\.\d+)?)!/g, (match, p1) => `factorial(${p1})`);
    
    return cleaned;
}

function updateDisplay() {
    resultEl.textContent = currentExpression;
    resultEl.style.fontSize = currentExpression.length > 15 ? '2em' : '3.5em';
    
    // KUNCI: Membuat input baru selalu terlihat (Auto-Scroll Kanan)
    // Karena kita menggunakan CSS direction: rtl, kita scroll ke kiri (0) untuk melihat ujung kanan ekspresi
    resultEl.scrollLeft = 0;
}

function previewCalculation() {
    let expressionToCalculate = currentExpression;

    if (expressionToCalculate === '0' || expressionToCalculate === 'Error') {
        historyCurrentEl.textContent = '';
        return;
    }
    
    if (/[+\-×÷ MOD\^()]$/.test(expressionToCalculate.slice(-1))) {
        historyCurrentEl.textContent = expressionToCalculate + '...';
        return;
    }

    if (isSolvingEquation) return; 

    try {
        const expression = cleanExpression(expressionToCalculate);
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
            historyCurrentEl.textContent = 'Invalid Input';
            return;
        }

        calculatedResult = parseFloat(calculatedResult.toFixed(10)); 
        let formattedResult = String(calculatedResult);
        
        historyCurrentEl.textContent = ' = ' + formattedResult;

    } catch (error) {
        historyCurrentEl.textContent = expressionToCalculate + '...'; 
    }
}

function calculate() {
    let expressionToCalculate = currentExpression;

    if (expressionToCalculate === '0' || expressionToCalculate === 'Error') return;

    try {
        const expression = cleanExpression(expressionToCalculate);
        let calculatedResult = (new Function('return ' + expression))();
        
        if (!isFinite(calculatedResult)) {
            throw new Error("Invalid Calculation");
        }

        let formattedResult;
        let combinationDetails = null;

        if (isSolvingEquation && calculatedResult % 1 !== 0) {
            
            let X = Math.round(calculatedResult);
            let Y = 0;
            let finalExpression = expressionToCalculate;

            if (expressionToCalculate.includes('/') && targetValue !== null && inputNumber !== null) {
                let actualResult = X * inputNumber;
                Y = targetValue - actualResult;
                
                finalExpression = `${inputNumber} × ${X} ${Y >= 0 ? '+' : '-'} ${Math.abs(Y)}`;
                formattedResult = `${X}`; 

                combinationDetails = { X: X, Y: Y, finalExpression: finalExpression, target: targetValue, operation: Y >= 0 ? '+' : '-' };
            }
            
            if (combinationDetails === null) {
                 X = Math.round(calculatedResult);
                 formattedResult = String(X);
            }
            addToHistory(expressionToCalculate, formattedResult, combinationDetails, calculatedResult);

        } else {
            calculatedResult = parseFloat(calculatedResult.toFixed(10));
            formattedResult = String(calculatedResult);
            addToHistory(expressionToCalculate, formattedResult, null, calculatedResult);
        }

        historyCurrentEl.textContent = expressionToCalculate + ' =';
        lastResult = calculatedResult;
        
        if (combinationDetails) {
            resultEl.textContent = combinationDetails.X;
            historyCurrentEl.textContent = `Pilihan Bulat: ${combinationDetails.finalExpression} ≈ ${combinationDetails.target}`;
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
        isSolvingEquation = false; 
        targetValue = null;
        inputNumber = null;
    }
}

function addToHistory(expression, result, combination = null, originalResult = null) {
    if (expression !== 'Error' && expression !== '0') {
        historyRecords.push({ expression: expression, result: result, combination: combination, originalResult: originalResult || result });
        saveHistory(); 
        renderHistory();
    }
}


function handleButton(value) {
    
    if (value === 'clear') { // Tombol "C"
        currentExpression = '0';
        historyCurrentEl.textContent = '';
        lastResult = null;
        updateDisplay(); 
        return;
    
    } else if (value === '=') {
        calculate();
        return;

    } else if (value === '%') { // Tombol "%"
        // Hanya tambahkan % jika input terakhir adalah angka atau kurung tutup
        if (/[0-9)]$/.test(currentExpression.slice(-1))) { 
            currentExpression += '%'; 
        } else {
            return;
        }
    } else if (value === 'backspace') {
        if (currentExpression === 'Error') { currentExpression = '0'; } 
        else if (lastResult !== null) { currentExpression = '0'; lastResult = null; } 
        else {
            // Menghapus karakter terakhir
            currentExpression = currentExpression.slice(0, -1);
            // Menghapus ' MOD ' secara keseluruhan jika itu yang terakhir
            if (currentExpression.endsWith(' MOD ')) {
                currentExpression = currentExpression.slice(0, -5);
            }
            if (currentExpression.length === 0) { currentExpression = '0'; }
        }
        currentExpression = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');
        updateDisplay();
        previewCalculation();
        return;

    } else if (value === '^2') { 
          if (/[0-9)]/.test(currentExpression.slice(-1))) { currentExpression += '^2'; }
          else if (currentExpression === 'Error' || currentExpression === '0') { currentExpression = '0^2'; }
          else { currentExpression += '0^2'; }
          
    } else {
        const isOperator = /[+\-×÷ MOD()^%]/.test(value) || value.includes('(');
        
        if (lastResult !== null && lastResult !== undefined) {
              if (isOperator) { currentExpression = String(lastResult) + value; } 
              else { currentExpression = value; }
              lastResult = null;
              historyCurrentEl.textContent = '';
        
        } else {
              if (currentExpression === '0' && value !== '.') { currentExpression = value; } 
              else { currentExpression += value; }
        }
    }
    
    currentExpression = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');
    updateDisplay();
    previewCalculation(); 
}

// ... (Logika Riwayat dan Event Listeners yang Tidak Terkait Langsung dengan input) ...

function toggleHistoryPanel(isOpen) {
    if (isOpen) { historyPanel.classList.add('open'); overlay.classList.add('active'); } 
    else { historyPanel.classList.remove('open'); overlay.classList.remove('active'); }
}
burgerMenuBtn.addEventListener('click', () => {
    const isCurrentlyOpen = historyPanel.classList.contains('open');
    toggleHistoryPanel(!isCurrentlyOpen);
});
overlay.addEventListener('click', () => { toggleHistoryPanel(false); });

function renderHistory() {
    historyListEl.innerHTML = '';
    if (historyRecords.length === 0) { historyListEl.innerHTML = '<p class="empty-history">Belum ada perhitungan.</p>'; return; }
    historyRecords.slice().reverse().forEach((record) => {
        const item = document.createElement('div');
        item.classList.add('history-item');
        let expressionText = record.expression;
        let resultText = record.result;
        if (record.combination) {
              expressionText = record.combination.finalExpression;
              resultText = `X=${record.combination.X} (${record.combination.operation === '+' ? 'selisih' : 'kurang'} ${Math.abs(record.combination.Y)})`;
        }
        item.innerHTML = `<div class="history-expression">${expressionText} =</div><div class="history-result">${resultText}</div>`;
        item.addEventListener('click', () => {
            if (record.combination) { currentExpression = String(record.combination.X); historyCurrentEl.textContent = `Jawaban: ${expressionText} = ${record.combination.target}`; } 
            else { currentExpression = String(record.result); historyCurrentEl.textContent = record.expression + ' ='; }
            lastResult = parseFloat(record.originalResult);
            updateDisplay();
            toggleHistoryPanel(false);
        });
        historyListEl.appendChild(item);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    historyRecords = [];
    localStorage.removeItem('calculatorHistory'); 
    renderHistory();
});

buttons.addEventListener('click', (e) => {
    let target = e.target;
    if (!target.classList.contains('btn')) { target = target.closest('.btn'); }
    if (target) {
        const value = target.getAttribute('data-value');
        if (value === 'module') { handleButton(' MOD '); } else { handleButton(value); }
    }
});


// =================================================================
// INISIALISASI AKHIR
// =================================================================

loadHistory(); 
updateDisplay();

// ... (Logika Input Suara processVoiceCommand juga perlu di update untuk mendukung '%' ) ...
// Bagian ini berada di blok kode suara sebelumnya, pastikan Anda menggunakan versi yang lengkap, termasuk update pada:
/* function processVoiceCommand(command) {
    // ...
    expression = expression.replace(/.../g, '...').replace(/persen/g, '%');
    // ...
}
*/
