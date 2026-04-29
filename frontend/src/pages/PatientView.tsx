import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  type Lang, LANG_META, UI, FINDINGS_L10N, FALLBACK_L10N,
  pickFemaleVoice, getVoiceAvailability,
} from '../utils/translations';

/** Map language to its Noto script font */
const LANG_FONT: Record<Lang, string> = {
  en: 'Plus Jakarta Sans, Inter, sans-serif',
  hi: '"Noto Sans Devanagari", sans-serif',
  te: '"Noto Sans Telugu", sans-serif',
  kn: '"Noto Sans Kannada", sans-serif',
  ta: '"Noto Sans Tamil", sans-serif',
};

// ── Stars ─────────────────────────────────────────────────────────────────
function Stars({ confidence }: { confidence: number }) {
  const filled = confidence * 5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const pct = Math.min(1, Math.max(0, filled - (star - 1)));
        return (
          <span key={star} className="relative text-xl leading-none">
            <span className="text-surface-border">★</span>
            <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${pct * 100}%` }}>★</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Tooth location map ────────────────────────────────────────────────────
const TOOTH_LOC: Record<string, Record<Lang, string>> = {
  'Molar-26':    { en:'Upper-left back molar',  hi:'ऊपर-बायाँ दाढ़', te:'పైన-ఎడమ గ్రైండర్', kn:'ಮೇಲೆ-ಎಡ ಗ್ರೈಂಡರ್', ta:'மேல்-இடது அரைவை' },
  'Premolar-14': { en:'Upper-right premolar',   hi:'ऊपर-दाहिना प्रीमोलर', te:'పైన-కుడి ప్రీమోలార్', kn:'ಮೇಲೆ-ಬಲ ಪ್ರಿಮೋಲಾರ್', ta:'மேல்-வலது ப்ரீமோலார்' },
  'Incisor-11':  { en:'Upper-right front tooth', hi:'ऊपर-दाहिना सामने का दाँत', te:'పైన-కుడి ముందు దంతం', kn:'ಮೇಲೆ-ಬಲ ಮುಂದಿನ ಹಲ್ಲು', ta:'மேல்-வலது முன் பல்' },
  'Molar-36':    { en:'Lower-left back molar',  hi:'नीचे-बायाँ दाढ़', te:'కింద-ఎడమ గ్రైండర్', kn:'ಕೆಳಗೆ-ಎಡ ಗ್ರೈಂಡರ್', ta:'கீழ்-இடது அரைவை' },
  'Premolar-45': { en:'Lower-right premolar',   hi:'नीचे-दाहिना प्रीमोलर', te:'కింద-కుడి ప్రీమోలార్', kn:'ಕೆಳಗೆ-ಬಲ ಪ್ರಿಮೋಲಾರ್', ta:'கீழ்-வலது ப்ரீமோலார்' },
};

function toothLocation(id: string, lang: Lang) {
  return TOOTH_LOC[id]?.[lang] ?? id;
}

// ── Language Selector ─────────────────────────────────────────────────────
function LangSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(Object.keys(LANG_META) as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
            lang === l
              ? 'bg-brand-600 border-brand-500 text-white shadow-glow'
              : 'bg-surface-raised border-surface-border text-gray-400 hover:text-white hover:border-brand-700'
          }`}
        >
          {LANG_META[l].native}
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function PatientView() {
  const navigate = useNavigate();
  const { scanResult } = useApp();
  const [lang, setLang] = useState<Lang>('en');
  const [isReading, setIsReading] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [voiceAvail, setVoiceAvail] = useState<Record<Lang, boolean>>({ en:true, hi:false, te:false, kn:false, ta:false });

  // Load voice availability after voices populate
  useEffect(() => {
    const update = () => setVoiceAvail(getVoiceAvailability());
    window.speechSynthesis.onvoiceschanged = update;
    update();
  }, []);

  useEffect(() => {
    if (!scanResult) navigate('/');
    return () => { window.speechSynthesis?.cancel(); };
  }, [scanResult, navigate]);

  // Re-stop reading when language changes
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
  }, [lang]);

  if (!scanResult) return null;

  const t = UI[lang];
  const { patient_name, findings, treatment, risk_score } = scanResult;

  const urgencyLabel = (sev: string) => ({
    High: t.actSoon, Medium: t.watchThis, Low: t.monitor,
  }[sev] ?? t.monitor);

  const urgencyStyle = (sev: string) => ({
    High:   'bg-red-950/60 border-red-800/50 text-red-400',
    Medium: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
    Low:    'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
  }[sev] ?? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400');

  const triage = {
    High:   { bg:'bg-red-950/40 border-red-800/40', icon:'⚠️', text: t.triageHigh, textColor:'text-red-200' },
    Medium: { bg:'bg-amber-950/40 border-amber-800/40', icon:'ℹ️', text: t.triageMed, textColor:'text-amber-200' },
    Low:    { bg:'bg-emerald-950/40 border-emerald-800/40', icon:'✅', text: t.triageLow, textColor:'text-emerald-200' },
  }[risk_score];

  // ── Voice Readout ───────────────────────────────────────────────────────
  const readAloud = () => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const bcp47 = LANG_META[lang].bcp47;

    const script = lang === 'en'
      ? `Hi ${patient_name}. Here's your dental health summary. We found ${findings.length} issues in your X-ray. ${treatment.patient_summary}. ${
          findings.map((f, i) => {
            const pe = FINDINGS_L10N.en[f.condition] ?? FALLBACK_L10N.en;
            return `Finding ${i + 1}: ${pe.title} in your ${toothLocation(f.tooth_id, 'en')}. ${pe.action}`;
          }).join('. ')
        }. Total estimated cost: between ${treatment.cost_estimate_inr.low.toLocaleString('en-IN')} and ${treatment.cost_estimate_inr.high.toLocaleString('en-IN')} rupees. Please show this to your dentist.`
      : lang === 'hi'
      ? `नमस्ते ${patient_name}। यहाँ आपकी दाँतों की सेहत की जानकारी है। हमें आपके X-ray में ${findings.length} समस्याएँ मिली हैं। ${
          findings.map((f, i) => {
            const pe = FINDINGS_L10N.hi[f.condition] ?? FALLBACK_L10N.hi;
            return `समस्या ${i + 1}: ${pe.title}, ${toothLocation(f.tooth_id, 'hi')} में। ${pe.action}`;
          }).join('. ')
        }। कुल अनुमानित खर्च ${treatment.cost_estimate_inr.low.toLocaleString('en-IN')} से ${treatment.cost_estimate_inr.high.toLocaleString('en-IN')} रुपये के बीच है। कृपया यह अपने दंत चिकित्सक को दिखाएँ।`
      : lang === 'te'
      ? `నమస్కారం ${patient_name}. ఇక్కడ మీ దంత ఆరోగ్య సారాంశం ఉంది. మేము మీ X-ray లో ${findings.length} సమస్యలు కనుగొన్నాము. ${
          findings.map((f, i) => {
            const pe = FINDINGS_L10N.te[f.condition] ?? FALLBACK_L10N.te;
            return `సమస్య ${i + 1}: ${pe.title}, ${toothLocation(f.tooth_id, 'te')} లో. ${pe.action}`;
          }).join('. ')
        }. మొత్తం అంచనా వ్యయం ${treatment.cost_estimate_inr.low.toLocaleString('en-IN')} నుండి ${treatment.cost_estimate_inr.high.toLocaleString('en-IN')} రూపాయల మధ్య ఉంది. దయచేసి దీన్ని మీ వైద్యుడికి చూపించండి.`
      : lang === 'kn'
      ? `ನಮಸ್ಕಾರ ${patient_name}. ಇಲ್ಲಿ ನಿಮ್ಮ ದಂತ ಆರೋಗ್ಯ ಸಾರಾಂಶ ಇದೆ. ನಾವು ನಿಮ್ಮ X-ray ನಲ್ಲಿ ${findings.length} ಸಮಸ್ಯೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇವೆ. ${
          findings.map((f, i) => {
            const pe = FINDINGS_L10N.kn[f.condition] ?? FALLBACK_L10N.kn;
            return `ಸಮಸ್ಯೆ ${i + 1}: ${pe.title}, ${toothLocation(f.tooth_id, 'kn')} ನಲ್ಲಿ. ${pe.action}`;
          }).join('. ')
        }. ಒಟ್ಟು ಅಂದಾಜು ವೆಚ್ಚ ${treatment.cost_estimate_inr.low.toLocaleString('en-IN')} ರಿಂದ ${treatment.cost_estimate_inr.high.toLocaleString('en-IN')} ರೂಪಾಯಿ. ದಯವಿಟ್ಟು ಇದನ್ನು ನಿಮ್ಮ ವೈದ್ಯರಿಗೆ ತೋರಿಸಿ.`
      : /* ta */
        `வணக்கம் ${patient_name}. இங்கே உங்கள் பல் ஆரோக்கிய சுருக்கம் உள்ளது. உங்கள் X-ray இல் ${findings.length} பிரச்சினைகள் கண்டறியப்பட்டன. ${
          findings.map((f, i) => {
            const pe = FINDINGS_L10N.ta[f.condition] ?? FALLBACK_L10N.ta;
            return `பிரச்சினை ${i + 1}: ${pe.title}, ${toothLocation(f.tooth_id, 'ta')} இல். ${pe.action}`;
          }).join('. ')
        }. மொத்த மதிப்பீட்டு செலவு ${treatment.cost_estimate_inr.low.toLocaleString('en-IN')} முதல் ${treatment.cost_estimate_inr.high.toLocaleString('en-IN')} ரூபாய் வரை. தயவுசெய்து இதை உங்கள் மருத்துவரிடம் காட்டுங்கள்.`;

    const speak = () => {
      const { voice, usedLang, isFallback } = pickFemaleVoice(bcp47);
      // Show fallback notice if we couldn't find native voice
      if (isFallback) {
        const fallbackName = usedLang.startsWith('hi') ? 'Hindi' : 'English';
        setVoiceNotice(`${LANG_META[lang].label} voice not available on this device — reading in ${fallbackName}.`);
        setTimeout(() => setVoiceNotice(null), 5000);
      } else {
        setVoiceNotice(null);
      }
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.lang = voice?.lang ?? bcp47;
      utterance.rate = 0.85;
      utterance.pitch = 1.4; // noticeably higher pitch to force feminine sound
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => setIsReading(false);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speak();
    } else {
      speak();
    }
  };

  return (
    <div className="min-h-screen bg-surface animate-fade-in print:bg-white">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 border-b border-surface-border bg-surface-card/95 backdrop-blur print:hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary !py-1.5 !px-3 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> {t.backBtn}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={readAloud}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isReading
                    ? 'bg-brand-600/30 border border-brand-500/50 text-brand-300 animate-pulse'
                    : 'bg-surface-raised border border-surface-border text-gray-300 hover:text-white hover:border-brand-600/50'
                }`}
              >
                {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isReading ? t.stopBtn : t.readBtn}</span>
                {isReading && <span className="sm:hidden">🔇</span>}
                {!isReading && <span className="sm:hidden">🔊</span>}
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t.downloadBtn}</span>
              </button>
            </div>
          </div>
          {/* Language Selector with native-voice indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(LANG_META) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border relative ${
                  lang === l
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-surface-raised border-surface-border text-gray-400 hover:text-white hover:border-brand-700'
                }`}
                style={{ fontFamily: LANG_FONT[l] }}
              >
                {LANG_META[l].native}
                {!voiceAvail[l] && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-surface-card" title="Voice may use fallback on this device" />
                )}
              </button>
            ))}
            <span className="text-[10px] text-gray-600">🟡 = voice fallback may apply</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Hi {patient_name}, {t.greeting}
          </h1>
          <p className="text-gray-400 text-base">
            <span style={{ fontFamily: LANG_FONT[lang] }}>{t.subtext}</span>
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/30 border border-pink-800/30 text-pink-300 text-xs font-semibold">
              <span>🎙️</span> AI Voice: {LANG_META[lang].label} · Female
              {!voiceAvail[lang] && <span className="text-amber-400">· fallback</span>}
            </div>
          </div>
          {/* Voice fallback notice */}
          {voiceNotice && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-medium animate-fade-in">
              ⚠️ {voiceNotice}
            </div>
          )}
        </div>

        {/* Triage card */}
        <div className={`rounded-2xl border p-5 ${triage.bg}`}>
          <div className="flex items-start gap-4">
            <span className="text-4xl shrink-0">{triage.icon}</span>
            <p className={`text-base font-medium leading-relaxed ${triage.textColor}`}>{triage.text}</p>
          </div>
        </div>

        {/* Findings */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {t.whatFound} ({findings.length})
          </h2>
          <div className="space-y-4">
            {findings.map((f, idx) => {
              const pe = FINDINGS_L10N[lang][f.condition] ?? { ...FALLBACK_L10N[lang], title: f.condition };
              return (
                <div key={f.id} className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4 hover:border-brand-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl shrink-0">{pe.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{pe.title}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${urgencyStyle(f.severity)}`}>
                          {urgencyLabel(f.severity)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">#{idx + 1} · {toothLocation(f.tooth_id, lang)}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{pe.desc}</p>
                  <div className="flex items-start gap-2 bg-brand-950/30 border border-brand-800/30 rounded-xl px-4 py-3">
                    <span className="text-brand-400 font-bold text-sm shrink-0">{t.whatToDo}</span>
                    <p className="text-brand-200 text-sm leading-relaxed">{pe.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars confidence={f.confidence} />
                    <span className="text-xs text-gray-500">{t.aiConf}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-white">{t.costTitle}</h2>
          <div className="flex items-end gap-2 flex-wrap">
            <span className="text-3xl font-extrabold text-white">₹{treatment.cost_estimate_inr.low.toLocaleString('en-IN')}</span>
            <span className="text-gray-400 text-lg mb-0.5">—</span>
            <span className="text-3xl font-extrabold text-brand-400">₹{treatment.cost_estimate_inr.high.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2.5 bg-surface-raised rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full" />
          </div>
          <p className="text-xs text-gray-500 italic">{t.costNote}</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8 print:hidden">
          <button onClick={() => navigate('/dashboard')} className="flex-1 btn-secondary text-sm justify-center py-3">
            {t.backBtn}
          </button>
          <button onClick={() => window.print()} className="flex-1 btn-primary text-sm justify-center py-3">
            <Download className="w-4 h-4" /> {t.downloadBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
