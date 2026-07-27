const sample = {
  document_type: "School field day notice",
  source_language: "ko",
  response_language: "en",
  headline: {
    en: "You only need to do 3 things.",
    vi: "Bạn chỉ cần làm 3 việc."
  },
  actions: {
    en: [
      { title: "Sign the participation form", detail: "A parent or guardian must sign the attached consent form.", evidence_id: "E1", confidence: "confirmed_from_document" },
      { title: "Pack the required items", detail: "Prepare sports shoes, a water bottle, and a hat.", evidence_id: "E2", confidence: "confirmed_from_document" },
      { title: "Submit it by August 3", detail: "Return the signed form to the homeroom teacher before the deadline.", evidence_id: "E3", confidence: "confirmed_from_document" }
    ],
    vi: [
      { title: "Ký phiếu đồng ý tham gia", detail: "Phụ huynh hoặc người giám hộ cần ký vào phiếu đồng ý đính kèm.", evidence_id: "E1", confidence: "confirmed_from_document" },
      { title: "Chuẩn bị đồ dùng cần thiết", detail: "Mang giày thể thao, bình nước và mũ.", evidence_id: "E2", confidence: "confirmed_from_document" },
      { title: "Nộp trước ngày 3 tháng 8", detail: "Nộp phiếu đã ký cho giáo viên chủ nhiệm trước hạn.", evidence_id: "E3", confidence: "confirmed_from_document" }
    ]
  },
  needs: {
    en: ["Guardian signature", "Sports shoes", "Water bottle", "Hat"],
    vi: ["Chữ ký phụ huynh", "Giày thể thao", "Bình nước", "Mũ"]
  },
  evidence: [
    { id: "E1", label: "Document evidence", quote: "보호자 동의서에 서명하여 제출해 주시기 바랍니다." },
    { id: "E2", label: "Document evidence", quote: "준비물: 운동화, 물병, 모자" },
    { id: "E3", label: "Document evidence", quote: "제출 기한: 8월 3일까지 담임교사에게 제출" }
  ],
  deadline: "2026-08-03T09:00:00+09:00",
  privacy: { private_fields_detected: ["student_name"], help_card_redaction: true }
};

const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const emptyState = document.getElementById('emptyState');
const results = document.getElementById('results');
const language = document.getElementById('language');
const actionsEl = document.getElementById('actions');
const needsEl = document.getElementById('needs');
const evidenceEl = document.getElementById('evidence');
const resultTitle = document.getElementById('resultTitle');
const jsonOutput = document.getElementById('jsonOutput');
const toast = document.getElementById('toast');

fileInput.addEventListener('change', () => {
  fileName.textContent = fileInput.files?.[0]?.name || 'No document selected';
});

analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Reading document…';
  await new Promise(r => setTimeout(r, 850));
  analyzeBtn.textContent = 'Linking evidence…';
  await new Promise(r => setTimeout(r, 650));
  analyzeBtn.textContent = 'Creating actions…';
  await new Promise(r => setTimeout(r, 650));
  renderResults();
  analyzeBtn.disabled = false;
  analyzeBtn.textContent = 'Analyze with NextStep';
});

function renderResults() {
  const lang = language.value;
  const actions = sample.actions[lang];
  resultTitle.textContent = sample.headline[lang];
  actionsEl.innerHTML = actions.map((a, i) => `
    <article class="action-card">
      <div class="action-number">${i + 1}</div>
      <div>
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.detail)}</p>
        <span class="source-tag">${a.evidence_id} · ${a.confidence}</span>
      </div>
    </article>`).join('');
  needsEl.innerHTML = sample.needs[lang].map(n => `<span class="need-chip">□ ${escapeHtml(n)}</span>`).join('');
  evidenceEl.innerHTML = sample.evidence.map(e => `
    <div class="evidence-item"><strong>${e.id} · ${e.label}</strong><span>${escapeHtml(e.quote)}</span></div>`).join('');
  jsonOutput.textContent = JSON.stringify({ ...sample, response_language: lang, actions: actions, needs: sample.needs[lang] }, null, 2);
  emptyState.classList.add('hidden');
  results.classList.remove('hidden');
}

document.getElementById('calendarBtn').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NextStep//EN','BEGIN:VEVENT',
    'UID:nextstep-school-form-20260803@example.local',
    'DTSTAMP:20260727T030000Z','DTSTART:20260803T000000Z','DTEND:20260803T010000Z',
    'SUMMARY:Submit signed school participation form',
    'DESCRIPTION:Bring signed consent form to the homeroom teacher.','END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  download('nextstep-school-deadline.ics', ics, 'text/calendar');
  showToast('Calendar file created');
});

document.getElementById('checklistBtn').addEventListener('click', () => {
  const lang = language.value;
  localStorage.setItem('nextstep-checklist', JSON.stringify({ saved_at: new Date().toISOString(), items: sample.actions[lang] }));
  const text = sample.actions[lang].map((a,i)=>`[ ] ${i+1}. ${a.title}\n    ${a.detail}`).join('\n\n');
  download('nextstep-checklist.txt', text, 'text/plain');
  showToast('Checklist saved locally');
});

document.getElementById('helpBtn').addEventListener('click', () => {
  const lang = language.value;
  const text = lang === 'vi'
    ? 'Xin chào, tôi cần hỗ trợ xác nhận thông báo của trường. Thông tin cá nhân của học sinh đã được ẩn. Tôi hiểu rằng cần ký phiếu đồng ý, chuẩn bị giày thể thao/bình nước/mũ và nộp trước ngày 3 tháng 8. Vui lòng cho tôi biết nếu còn thiếu điều gì.'
    : 'Hello, I need help confirming this school notice. The student’s personal information has been removed. I understand that I need a guardian signature, sports shoes, a water bottle, a hat, and must submit the form by August 3. Please tell me if anything is missing.';
  download('nextstep-help-card.txt', text, 'text/plain');
  showToast('Redacted help card created');
});

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

