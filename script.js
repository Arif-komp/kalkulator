// ... (Logika kalkulator dan inisialisasi DOM elements) ...

// =================================================================
// LOGIKA INPUT SUARA (Diperbarui untuk tampilan baru)
// =================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        // Mengganti teks dan menambahkan kelas untuk efek visual
        micBtn.textContent = 'Mendengarkan... 🔴';
        micBtn.classList.add('listening');
    };

    recognition.onend = () => {
        // Mengembalikan teks dan menghapus kelas
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
    // Tampilkan pesan error jika API tidak didukung
    micBtn.textContent = 'API Suara TIDAK didukung browser ini.';
    micBtn.disabled = true;
    micBtn.style.backgroundColor = '#ccc';
}

function processVoiceCommand(command) {
    // ... (Logika parsing perintah suara sama)
    historyCurrentEl.textContent = 'Perintah Suara: ' + command;
    let expression = command;
    
    expression = expression
        .replace(/akar kuadrat|akar/g, 'sqrt(')
        .replace(/pangkat/g, '^')
        .replace(/sinus/g, 'sin(')
        .replace(/kosinus/g, 'cos(')
        .replace(/tangen/g, 'tan(')
        .replace(/logaritma/g, 'log(')
        .replace(/faktorial/g, '!');
        
    expression = expression
        .replace(/tambah|plus/g, '+')
        .replace(/kurang|minus/g, '-')
        .replace(/kali|dikali|perkalian|x/g, '*')
        .replace(/bagi|dibagi|per/g, '/')
        .replace(/modulus|modulo|sisa bagi/g, ' MOD ');

    expression = expression.replace(/satu/g, '1').replace(/dua/g, '2').replace(/tiga/g, '3');
    expression = expression.replace(/empat/g, '4').replace(/lima/g, '5').replace(/enam/g, '6');
    expression = expression.replace(/tujuh/g, '7').replace(/delapan/g, '8').replace(/sembilan/g, '9');
    expression = expression.replace(/nol|kosong/g, '0').replace(/koma|titik/g, '.');

    if (expression.includes('hapus') || expression.includes('clear')) {
        handleButton('clear');
        return;
    }
    
    expression = expression.replace(/tolong hitung|hitung|berapa|hasilnya|adalah/g, '').trim();
    expression = expression.replace(/\s+/g, '');

    if (expression.length > 0) {
        currentExpression = expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/\^/g, '^')
            .replace(/MOD/g, ' MOD '); 
        
        updateDisplay();
        calculate();
    }
}

// ... (Sisa fungsi JavaScript: handleButton, calculate, dll. sama) ...
// ... (Pastikan Anda menyalin ulang semua fungsi kalkulator di script.js) ...

// Inisialisasi tampilan awal
// updateDisplay();
// renderHistory();
