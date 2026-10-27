// ============================================
// KONFIGURASI - ISI DENGAN DATA ANDA
// ============================================
const CONFIG = {
  // URL Web App dari Google Apps Script
  GAS_URL: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec",
  
  // Email tujuan (center WA)
  TARGET_EMAIL: "support@support.whatsapp.com",
  
  // 3 Slot Gmail - hanya label, pengaturan akun di GAS
  GMAIL_SLOTS: {
    slot1: "zimzz1@gmail.com",
    slot2: "zimzz2@gmail.com",
    slot3: "zimzz3@gmail.com"
  }
};

// ============================================
// ELEMENT
// ============================================
const sendBtn = document.getElementById('sendBtn');
const statusEl = document.getElementById('status');
const historyEl = document.getElementById('history');

// ============================================
// LOAD RIWAYAT DARI LOCALSTORAGE
// ============================================
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('waReports') || '[]');
  if (history.length === 0) {
    historyEl.innerHTML = '<p class="empty">Belum ada laporan terkirim.</p>';
    return;
  }
  
  historyEl.innerHTML = history.slice(0, 10).map(item => `
    <div class="history-item">
      <div class="meta">${item.date} • ${item.slot}</div>
      <strong>${item.waNumber}</strong> - ${item.accountName}<br>
      <small>Status: ${item.status}</small>
    </div>
  `).join('');
}

// ============================================
// SIMPAN RIWAYAT
// ============================================
function saveHistory(report) {
  const history = JSON.parse(localStorage.getItem('waReports') || '[]');
  history.unshift(report);
  localStorage.setItem('waReports', JSON.stringify(history.slice(0, 50)));
  loadHistory();
}

// ============================================
// SHOW STATUS
// ============================================
function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

// ============================================
// VALIDASI INPUT
// ============================================
function validateForm(data) {
  if (!data.waNumber || data.waNumber.length < 10) {
    return "Nomor WhatsApp tidak valid (minimal 10 digit)";
  }
  if (!/^[0-9]+$/.test(data.waNumber)) {
    return "Nomor WhatsApp hanya boleh angka";
  }
  if (!data.accountName) return "Nama akun wajib diisi";
  if (!data.description || data.description.length < 10) {
    return "Deskripsi minimal 10 karakter";
  }
  return null;
}

// ============================================
// KIRIM LAPORAN
// ============================================
async function sendReport() {
  const data = {
    waNumber: document.getElementById('waNumber').value.trim(),
    accountName: document.getElementById('accountName').value.trim(),
    issueType: document.getElementById('issueType').value,
    description: document.getElementById('description').value.trim(),
    gmailSlot: document.getElementById('gmailSlot').value,
    targetEmail: document.getElementById('targetEmail').value
  };

  // Validasi
  const error = validateForm(data);
  if (error) {
    showStatus(`⚠️ ${error}`, 'error');
    return;
  }

  // Disable button
  sendBtn.disabled = true;
  showStatus('⏳ Mengirim laporan via Gmail...', 'loading');

  try {
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Karena no-cors, kita anggap sukses kalau tidak error
    showStatus('✅ Laporan berhasil dikirim via ' + CONFIG.GMAIL_SLOTS[data.gmailSlot] + '!', 'success');

    // Simpan riwayat
    saveHistory({
      waNumber: data.waNumber,
      accountName: data.accountName,
      slot: CONFIG.GMAIL_SLOTS[data.gmailSlot],
      status: 'Terkirim',
      date: new Date().toLocaleString('id-ID')
    });

    // Reset form
    document.getElementById('waNumber').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('description').value = '';

  } catch (err) {
    console.error(err);
    showStatus('❌ Gagal mengirim: ' + err.message, 'error');
  } finally {
    sendBtn.disabled = false;
  }
}

// ============================================
// INIT
// ============================================
sendBtn.addEventListener('click', sendReport);
loadHistory();
