export type Lang = 'en' | 'hi' | 'te' | 'kn' | 'ta';

export interface LangMeta {
  label: string;
  native: string;
  bcp47: string;
}

export const LANG_META: Record<Lang, LangMeta> = {
  en: { label: 'English',  native: 'English',   bcp47: 'en-IN' },
  hi: { label: 'Hindi',    native: 'हिन्दी',      bcp47: 'hi-IN' },
  te: { label: 'Telugu',   native: 'తెలుగు',      bcp47: 'te-IN' },
  kn: { label: 'Kannada',  native: 'ಕನ್ನಡ',       bcp47: 'kn-IN' },
  ta: { label: 'Tamil',    native: 'தமிழ்',        bcp47: 'ta-IN' },
};

const FEMALE_HINTS = [
  'female', 'woman', 'girl',
  'veena', 'raveena', 'priya', 'neerja', 'lekha',
  'heera', 'saina', 'aditi', 'sunita', 'kavya',
  'swara', 'pallavi', 'shruti', 'neeraja', 'asha',
  'samantha', 'victoria', 'karen', 'moira', 'fiona',
  'tessa', 'monica', 'ava', 'susan', 'allison',
  'f1', 'f2',
];

const MALE_HINTS = ['male', 'man', 'guy', 'm1', 'm2'];

function isFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const name = v.name.toLowerCase();
  if (MALE_HINTS.some(h => name.includes(h))) return false;
  return FEMALE_HINTS.some(h => name.includes(h));
}

const FALLBACK_CHAIN: Record<string, string[]> = {
  'te': ['te', 'te-IN', 'hi-IN', 'hi', 'en-IN', 'en'],
  'kn': ['kn', 'kn-IN', 'ta-IN', 'ta', 'hi-IN', 'hi', 'en-IN', 'en'],
  'ta': ['ta', 'ta-IN', 'hi-IN', 'hi', 'en-IN', 'en'],
  'hi': ['hi', 'hi-IN', 'en-IN', 'en'],
  'en': ['en-IN', 'en'],
};

export interface VoiceResult {
  voice: SpeechSynthesisVoice | null;
  usedLang: string;
  isFallback: boolean;
}

export function pickFemaleVoice(bcp47: string): VoiceResult {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { voice: null, usedLang: bcp47, isFallback: false };

  const langCode = bcp47.split('-')[0].toLowerCase();

  const bestFrom = (list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!list.length) return null;
    const female = list.filter(isFemaleVoice);
    return female[0] ?? list[0];
  };

  const exactMatches = voices.filter(v =>
    v.lang.toLowerCase() === bcp47.toLowerCase()
  );
  if (exactMatches.length) {
    return { voice: bestFrom(exactMatches)!, usedLang: bcp47, isFallback: false };
  }

  const prefixMatches = voices.filter(v =>
    v.lang.toLowerCase().startsWith(langCode + '-') ||
    v.lang.toLowerCase() === langCode
  );
  if (prefixMatches.length) {
    return { voice: bestFrom(prefixMatches)!, usedLang: prefixMatches[0].lang, isFallback: false };
  }

  const chain = FALLBACK_CHAIN[langCode] ?? FALLBACK_CHAIN['en'];
  for (const tag of chain) {
    const tagCode = tag.split('-')[0].toLowerCase();
    const matches = voices.filter(v => {
      const vl = v.lang.toLowerCase();
      return vl === tag.toLowerCase() || vl.startsWith(tagCode + '-');
    });
    if (matches.length) {
      const chosen = bestFrom(matches)!;
      return { voice: chosen, usedLang: chosen.lang, isFallback: true };
    }
  }

  const any = bestFrom(voices);
  return { voice: any, usedLang: any?.lang ?? 'en', isFallback: true };
}

export function getVoiceAvailability(): Record<Lang, boolean> {
  const voices = window.speechSynthesis.getVoices();
  const result = {} as Record<Lang, boolean>;
  for (const [lang, meta] of Object.entries(LANG_META) as [Lang, LangMeta][]) {
    const code = meta.bcp47.split('-')[0].toLowerCase();
    result[lang] = voices.some(v => {
      const vl = v.lang.toLowerCase();
      return vl === meta.bcp47.toLowerCase() ||
             vl.startsWith(code + '-') ||
             vl === code;
    });
  }
  return result;
}

export interface UIStrings {
  greeting:  string;
  subtext:   string;
  readBtn:   string;
  stopBtn:   string;
  downloadBtn: string;
  backBtn:   string;
  actSoon:   string;
  watchThis: string;
  monitor:   string;
  triageHigh: string;
  triageMed:  string;
  triageLow:  string;
  whatFound:  string;
  whatToDo:   string;
  aiConf:     string;
  costTitle:  string;
  costNote:   string;
}

export const UI: Record<Lang, UIStrings> = {
  en: {
    greeting:   "here's what we found",
    subtext:    "Everything explained in plain English. Show this to your dentist.",
    readBtn:    "Read Aloud",
    stopBtn:    "Stop Reading",
    downloadBtn:"Download Report",
    backBtn:    "← Back to Report",
    actSoon:    "Act Soon",
    watchThis:  "Watch This",
    monitor:    "Monitor",
    triageHigh: "Your mouth needs attention soon. A few issues were found that could get worse if left untreated.",
    triageMed:  "Your mouth is mostly okay, but a couple of things need watching.",
    triageLow:  "Great news! Your teeth look healthy overall.",
    whatFound:  "What we found",
    whatToDo:   "What to do:",
    aiConf:     "AI confidence",
    costTitle:  "What will this cost?",
    costNote:   "Prices vary by clinic. Government hospitals may cost significantly less.",
  },
  hi: {
    greeting:   "यह रहा हमारा विश्लेषण",
    subtext:    "सब कुछ सरल हिंदी में समझाया गया है। इसे अपने दंत चिकित्सक को दिखाएँ।",
    readBtn:    "ज़ोर से पढ़ें",
    stopBtn:    "रोकें",
    downloadBtn:"रिपोर्ट डाउनलोड करें",
    backBtn:    "← रिपोर्ट पर वापस",
    actSoon:    "जल्दी करें",
    watchThis:  "ध्यान रखें",
    monitor:    "निगरानी",
    triageHigh: "आपके दाँतों को जल्द ध्यान देने की ज़रूरत है। कुछ समस्याएँ मिली हैं जो इलाज न होने पर बढ़ सकती हैं।",
    triageMed:  "आपके दाँत ज़्यादातर ठीक हैं, लेकिन कुछ चीज़ों पर ध्यान देना होगा।",
    triageLow:  "अच्छी खबर! आपके दाँत कुल मिलाकर स्वस्थ दिखते हैं।",
    whatFound:  "हमें क्या मिला",
    whatToDo:   "क्या करें:",
    aiConf:     "AI विश्वास",
    costTitle:  "इसका खर्च क्या होगा?",
    costNote:   "क्लिनिक के अनुसार कीमतें अलग होती हैं। सरकारी अस्पतालों में काफी कम खर्च हो सकता है।",
  },
  te: {
    greeting:   "మేము ఏమి కనుగొన్నామో ఇక్కడ ఉంది",
    subtext:    "అన్నీ సరళమైన తెలుగులో వివరించబడ్డాయి. దీన్ని మీ దంత వైద్యుడికి చూపించండి.",
    readBtn:    "బిగ్గరగా చదవండి",
    stopBtn:    "ఆపండి",
    downloadBtn:"నివేదికను డౌన్లోడ్ చేయండి",
    backBtn:    "← నివేదికకు తిరిగి",
    actSoon:    "త్వరగా చేయండి",
    watchThis:  "గమనించండి",
    monitor:    "పర్యవేక్షించండి",
    triageHigh: "మీ నోటికి త్వరలో శ్రద్ధ అవసరం. చికిత్స లేకుండా వదిలేస్తే మరింత దిగజారే కొన్ని సమస్యలు కనుగొనబడ్డాయి.",
    triageMed:  "మీ నోరు ఎక్కువగా బాగానే ఉంది, కానీ కొన్ని విషయాలు గమనించాల్సి ఉంది.",
    triageLow:  "శుభవార్త! మీ దంతాలు మొత్తంగా ఆరోగ్యంగా కనిపిస్తున్నాయి.",
    whatFound:  "మేము ఏమి కనుగొన్నాం",
    whatToDo:   "ఏమి చేయాలి:",
    aiConf:     "AI నమ్మకం",
    costTitle:  "దీనికి ఎంత ఖర్చవుతుంది?",
    costNote:   "ధరలు క్లినిక్ ని బట్టి మారుతాయి. ప్రభుత్వ ఆసుపత్రులలో చాలా తక్కువ ఖర్చు అవుతుంది.",
  },
  kn: {
    greeting:   "ನಾವು ಏನು ಕಂಡುಕೊಂಡಿದ್ದೇವೆ ಎಂದರೆ",
    subtext:    "ಎಲ್ಲವನ್ನೂ ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ. ಇದನ್ನು ನಿಮ್ಮ ದಂತ ವೈದ್ಯರಿಗೆ ತೋರಿಸಿ.",
    readBtn:    "ಜೋರಾಗಿ ಓದಿ",
    stopBtn:    "ನಿಲ್ಲಿಸಿ",
    downloadBtn:"ವರದಿ ಡೌನ್ಲೋಡ್ ಮಾಡಿ",
    backBtn:    "← ವರದಿಗೆ ಹಿಂತಿರುಗಿ",
    actSoon:    "ತ್ವರಿತವಾಗಿ ಮಾಡಿ",
    watchThis:  "ಗಮನಿಸಿ",
    monitor:    "ಮೇಲ್ವಿಚಾರಣೆ",
    triageHigh: "ನಿಮ್ಮ ಬಾಯಿಗೆ ಶೀಘ್ರದಲ್ಲೇ ಗಮನ ಬೇಕು. ಚಿಕಿತ್ಸೆ ನೀಡದಿದ್ದರೆ ಇನ್ನಷ್ಟು ಹದಗೆಡಬಹುದಾದ ಕೆಲವು సమస్యಗಳು ಕಂಡುಬಂದಿವೆ.",
    triageMed:  "ನಿಮ್ಮ ಬಾಯಿ ಹೆಚ್ಚಾಗಿ ಸರಿಯಾಗಿದೆ, ಆದರೆ ಕೆಲವು ವಿಷಯಗಳನ್ನು ಗಮನಿಸಬೇಕು.",
    triageLow:  "ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಹಲ್ಲುಗಳು ಒಟ್ಟಾರೆ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿವೆ.",
    whatFound:  "ನಾವು ಏನು ಕಂಡುಕೊಂಡಿದ್ದೇವೆ",
    whatToDo:   "ಏನು ಮಾಡಬೇಕು:",
    aiConf:     "AI ವಿಶ್ವಾಸ",
    costTitle:  "ಇದಕ್ಕೆ ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?",
    costNote:   "ಕ್ಲಿನಿಕ್ ಅನ್ವಯ ಬೆಲೆಗಳು ಬದಲಾಗುತ್ತವೆ. ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆ ಖರ್ಚಾಗಬಹುದು.",
  },
  ta: {
    greeting:   "நாங்கள் கண்டறிந்தது இங்கே உள்ளது",
    subtext:    "அனைத்தும் எளிய தமிழில் விளக்கப்பட்டுள்ளது. இதை உங்கள் பல் மருத்துவரிடம் காட்டுங்கள்.",
    readBtn:    "சத்தமாக படிக்கவும்",
    stopBtn:    "நிறுத்து",
    downloadBtn:"அறிக்கையை பதிவிறக்கு",
    backBtn:    "← அறிக்கைக்கு திரும்பு",
    actSoon:    "விரைவில் செய்யுங்கள்",
    watchThis:  "கவனிங்கள்",
    monitor:    "கண்காணிங்கள்",
    triageHigh: "உங்கள் வாய்க்கு விரைவில் கவனம் தேவை. சிகிச்சையளிக்காவிட்டால் மோசமாகக்கூடிய சில பிரச்சினைகள் கண்டறியப்பட்டன.",
    triageMed:  "உங்கள் வாய் பெரும்பாலும் நலமாக உள்ளது, ஆனால் சில விஷயங்களை கவனிக்க வேண்டும்.",
    triageLow:  "நல்ல செய்தி! உங்கள் பற்கள் ஒட்டுமொத்தமாக ஆரோக்கியமாக தெரிகின்றன.",
    whatFound:  "நாங்கள் கண்டறிந்தது",
    whatToDo:   "என்ன செய்ய வேண்டும்:",
    aiConf:     "AI நம்பிக்கை",
    costTitle:  "இதற்கு எவ்வளவு செலவாகும்?",
    costNote:   "கிளினிக்கைப் பொறுத்து விலைகள் மாறுபடும். அரசு மருத்துவமனைகளில் கணிசமாக குறைவாக செலவாகலாம்.",
  },
};

export interface FindingL10n {
  icon:   string;
  title:  string;
  desc:   string;
  action: string;
}

type ConditionKey = string; // Broadened to support missing keys dynamically

export const FINDINGS_L10N: Record<Lang, Record<ConditionKey, FindingL10n>> = {
  en: {
    'Cavity': {
      icon: '🕳️',
      title: 'A hole in your tooth',
      desc:  'Bacteria have eaten through your tooth enamel. Think of it like a pothole — small now, gets bigger if ignored.',
      action: 'Needs a filling. Simple procedure, done in one visit.',
    },
    'Cavity (Dental Caries)': {
      icon: '🕳️',
      title: 'A hole in your tooth',
      desc:  'Bacteria have eaten through your tooth enamel. Think of it like a pothole — small now, gets bigger if ignored.',
      action: 'Needs a filling. Simple procedure, done in one visit.',
    },
    'Bone Loss': {
      icon: '📉',
      title: 'Your gum bone is shrinking',
      desc:  'The bone that holds your teeth in place is slowly reducing. This is caused by gum disease.',
      action: 'Needs a deep cleaning called scaling. Stops the shrinking.',
    },
    'Bone Loss (Periodontitis)': {
      icon: '📉',
      title: 'Your gum bone is shrinking',
      desc:  'The bone that holds your teeth in place is slowly reducing. This is caused by gum disease.',
      action: 'Needs a deep cleaning called scaling. Stops the shrinking.',
    },
    'Root Infection': {
      icon: '🦠',
      title: 'Infection at the root of a tooth',
      desc:  'An infection has reached the root of your tooth. This can cause pain and spread if untreated.',
      action: 'Needs a root canal treatment. Removes the infection completely.',
    },
    'Periapical Shadow': {
      icon: '🔍',
      title: 'Something to keep an eye on',
      desc:  "The AI spotted something unusual but isn't certain. Could be nothing — needs a dentist check.",
      action: 'Visit a dentist for a closer look.',
    },
    'Fractured Crown': {
      icon: '🪨',
      title: 'A crack in your tooth',
      desc:  'Your tooth has a crack. Like a crack in a phone screen — needs fixing before it spreads.',
      action: 'A crown (cap) will protect and restore the tooth.',
    },
    'Impacted Wisdom Tooth': {
      icon: '😬',
      title: 'A wisdom tooth stuck sideways',
      desc:  'Your wisdom tooth is growing sideways and may push against other teeth.',
      action: 'May need removal. A dentist will advise based on severity.',
    },
    'Old Filling Failure': {
      icon: '🔧',
      title: 'An old filling is wearing out',
      desc:  'A filling from a previous visit is starting to break down. Needs replacing before bacteria get in.',
      action: 'Simple replacement filling. One visit.',
    },
  },
  hi: {
    'Cavity': {
      icon: '🕳️',
      title: 'दाँत में छेद',
      desc:  'बैक्टीरिया ने आपके दाँत की परत को खा लिया है। यह सड़क के गड्ढे जैसा है — अभी छोटा है, अनदेखा किया तो बड़ा हो जाएगा।',
      action: 'फिलिंग की ज़रूरत है। एक ही विज़िट में होने वाली सरल प्रक्रिया।',
    },
    'Cavity (Dental Caries)': {
      icon: '🕳️',
      title: 'दाँत में छेद',
      desc:  'बैक्टीरिया ने आपके दाँत की परत को खा लिया है। यह सड़क के गड्ढे जैसा है — अभी छोटा है, अनदेखा किया तो बड़ा हो जाएगा।',
      action: 'फिलिंग की ज़रूरत है। एक ही विज़िट में होने वाली सरल प्रक्रिया।',
    },
    'Bone Loss': {
      icon: '📉',
      title: 'मसूड़े की हड्डी सिकुड़ रही है',
      desc:  'जो हड्डी आपके दाँतों को जगह पर रखती है वह धीरे-धीरे कम हो रही है। यह मसूड़े की बीमारी से होता है।',
      action: 'स्केलिंग नामक गहरी सफाई की ज़रूरत है। सिकुड़ना रोक देती है।',
    },
    'Bone Loss (Periodontitis)': {
      icon: '📉',
      title: 'मसूड़े की हड्डी सिकुड़ रही है',
      desc:  'जो हड्डी आपके दाँतों को जगह पर रखती है वह धीरे-धीरे कम हो रही है। यह मसूड़े की बीमारी से होता है।',
      action: 'स्केलिंग नामक गहरी सफाई की ज़रूरत है। सिकुड़ना रोक देती है।',
    },
    'Root Infection': {
      icon: '🦠',
      title: 'दाँत की जड़ में संक्रमण',
      desc:  'संक्रमण आपके दाँत की जड़ तक पहुँच गया है। इलाज न होने पर दर्द और फैल सकता है।',
      action: 'रूट कैनाल उपचार की ज़रूरत है। संक्रमण को पूरी तरह हटा देता है।',
    },
    'Periapical Shadow': {
      icon: '🔍',
      title: 'ध्यान देने वाली बात',
      desc:  'AI ने कुछ असामान्य देखा लेकिन निश्चित नहीं है। कुछ नहीं भी हो सकता है — दंत चिकित्सक की जाँच ज़रूरी है।',
      action: 'नज़दीक से देखने के लिए दंत चिकित्सक के पास जाएँ।',
    },
    'Fractured Crown': {
      icon: '🪨',
      title: 'दाँत में दरार',
      desc:  'आपके दाँत में दरार है। फ़ोन की स्क्रीन में दरार की तरह — फैलने से पहले ठीक करना होगा।',
      action: 'क्राउन (कैप) दाँत को सुरक्षित और बहाल करेगा।',
    },
    'Impacted Wisdom Tooth': {
      icon: '😬',
      title: 'अकल दाढ़ टेढ़ी है',
      desc:  'आपकी अकल दाढ़ टेढ़ी बढ़ रही है और दूसरे दाँतों पर दबाव डाल सकती है।',
      action: 'निकालने की ज़रूरत पड़ सकती है। दंत चिकित्सक गंभीरता के आधार पर सलाह देंगे।',
    },
    'Old Filling Failure': {
      icon: '🔧',
      title: 'पुरानी फिलिंग खराब हो रही है',
      desc:  'पिछली विज़िट की फिलिंग टूटने लगी है। बैक्टीरिया घुसने से पहले बदलना होगा।',
      action: 'सरल नई फिलिंग। एक ही विज़िट।',
    },
  },
  te: {
    'Cavity': {
      icon: '🕳️',
      title: 'దంతంలో రంధ్రం',
      desc:  'బ్యాక్టీరియా మీ దంత పూత పొరను తిని వేసింది. రోడ్డు గుంటలా అనుకోండి — ఇప్పుడు చిన్నది, నిర్లక్ష్యం చేస్తే పెద్దదవుతుంది.',
      action: 'ఫిల్లింగ్ అవసరం. ఒకే విజిట్లో పూర్తయ్యే సులభమైన విధానం.',
    },
    'Cavity (Dental Caries)': {
      icon: '🕳️',
      title: 'దంతంలో రంధ్రం',
      desc:  'బ్యాక్టీరియా మీ దంత పూత పొరను తిని వేసింది. రోడ్డు గుంటలా అనుకోండి — ఇప్పుడు చిన్నది, నిర్లక్ష్యం చేస్తే పెద్దదవుతుంది.',
      action: 'ఫిల్లింగ్ అవసరం. ఒకే విజిట్లో పూర్తయ్యే సులభమైన విధానం.',
    },
    'Bone Loss': {
      icon: '📉',
      title: 'చిగురు ఎముక తగ్గిపోతోంది',
      desc:  'మీ దంతాలను స్థానంలో ఉంచే ఎముక నెమ్మదిగా తగ్గిపోతోంది. ఇది చిగురు వ్యాధి వల్ల జరుగుతుంది.',
      action: 'స్కేలింగ్ అని పిలిచే లోతైన శుభ్రపరచడం అవసరం. తగ్గిపోవడాన్ని ఆపుతుంది.',
    },
    'Bone Loss (Periodontitis)': {
      icon: '📉',
      title: 'చిగురు ఎముక తగ్గిపోతోంది',
      desc:  'మీ దంతాలను స్థానంలో ఉంచే ఎముక నెమ్మదిగా తగ్గిపోతోంది. ఇది చిగురు వ్యాధి వల్ల జరుగుతుంది.',
      action: 'స్కేలింగ్ అని పిలిచే లోతైన శుభ్రపరచడం అవసరం. తగ్గిపోవడాన్ని ఆపుతుంది.',
    },
    'Root Infection': {
      icon: '🦠',
      title: 'దంత మూలంలో సంక్రమణ',
      desc:  'సంక్రమణ మీ దంత మూలం వరకు చేరింది. చికిత్స చేయకపోతే నొప్పి కలిగించి వ్యాపించవచ్చు.',
      action: 'రూట్ కెనాల్ చికిత్స అవసరం. సంక్రమణను పూర్తిగా తొలగిస్తుంది.',
    },
    'Periapical Shadow': {
      icon: '🔍',
      title: 'గమనించవలసిన విషయం',
      desc:  'AI ఏదో అసాధారణంగా గుర్తించింది కానీ ఖచ్చితంగా చెప్పలేదు. ఏమీ కాకపోవచ్చు — దంత వైద్యుడి పరీక్ష అవసరం.',
      action: 'దగ్గరగా చూసేందుకు దంత వైద్యుడిని సందర్శించండి.',
    },
    'Fractured Crown': {
      icon: '🪨',
      title: 'దంతంలో పగుళ్ళు',
      desc:  'మీ దంతంలో పగుళ్ళు ఉన్నాయి. ఫోన్ స్క్రీన్ పగుళ్ళలా — వ్యాపించే ముందే సరిచేయాలి.',
      action: 'క్రౌన్ (క్యాప్) దంతాన్ని రక్షించి పునరుద్ధరిస్తుంది.',
    },
    'Impacted Wisdom Tooth': {
      icon: '😬',
      title: 'వంకర అక్కిలి దంతం',
      desc:  'మీ అక్కిలి దంతం వంకరగా పెరుగుతూ ఇతర దంతాలను నెట్టవచ్చు.',
      action: 'తొలగింపు అవసరమవుతుందేమో. తీవ్రత ఆధారంగా దంత వైద్యుడు సలహా ఇస్తారు.',
    },
    'Old Filling Failure': {
      icon: '🔧',
      title: 'పాత ఫిల్లింగ్ పాడవుతోంది',
      desc:  'మునుపటి విజిట్లో వేసిన ఫిల్లింగ్ విరిగిపోవడం మొదలైంది. బ్యాక్టీరియా చొరబడే ముందే మార్చాలి.',
      action: 'సులభమైన కొత్త ఫిల్లింగ్. ఒకే విజిట్.',
    },
  },
  kn: {
    'Cavity': {
      icon: '🕳️',
      title: 'ಹಲ್ಲಿನಲ್ಲಿ ರಂಧ್ರ',
      desc:  'ಬ್ಯಾಕ್ಟೀರಿಯಾ ನಿಮ್ಮ ಹಲ್ಲಿನ ಲೇಪನ ಪದರವನ್ನು ತಿಂದಿದೆ. ರಸ್ತೆ ಗುಂಡಿಯಂತೆ ಯೋಚಿಸಿ — ಈಗ ಚಿಕ್ಕದು, ನಿರ್ಲಕ್ಷಿಸಿದರೆ ದೊಡ್ಡದಾಗುತ್ತದೆ.',
      action: 'ಫಿಲ್ಲಿಂಗ್ ಅಗತ್ಯ. ಒಂದೇ ಭೇಟಿಯಲ್ಲಿ ಮುಗಿಯುವ ಸರಳ ಕಾರ್ಯವಿಧಾನ.',
    },
    'Cavity (Dental Caries)': {
      icon: '🕳️',
      title: 'ಹಲ್ಲಿನಲ್ಲಿ ರಂಧ್ರ',
      desc:  'ಬ್ಯಾಕ್ಟೀರಿಯಾ ನಿಮ್ಮ ಹಲ್ಲಿನ ಲೇಪನ ಪದರವನ್ನು ತಿಂದಿದೆ. ರಸ್ತೆ ಗುಂಡಿಯಂತೆ ಯೋಚಿಸಿ — ಈಗ ಚಿಕ್ಕದು, ನಿರ್ಲಕ್ಷಿಸಿದರೆ ದೊಡ್ಡದಾಗುತ್ತದೆ.',
      action: 'ಫಿಲ್ಲಿಂಗ್ ಅಗತ್ಯ. ಒಂದೇ ಭೇಟಿಯಲ್ಲಿ ಮುಗಿಯುವ ಸರಳ ಕಾರ್ಯವಿಧಾನ.',
    },
    'Bone Loss': {
      icon: '📉',
      title: 'ಒಸಡಿನ ಮೂಳೆ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ',
      desc:  'ನಿಮ್ಮ ಹಲ್ಲುಗಳನ್ನು ಸ್ಥಾನದಲ್ಲಿ ಹಿಡಿದಿಡುವ ಮೂಳೆ ನಿಧಾನವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ. ಇದು ಒಸಡಿನ ರೋಗದಿಂದ ಆಗುತ್ತದೆ.',
      action: 'ಸ್ಕೇಲಿಂಗ್ ಎಂಬ ಆಳವಾದ ಶುಚಿಗೊಳಿಸುವಿಕೆ ಅಗತ್ಯ. ಕಡಿಮೆಯಾಗುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆ.',
    },
    'Bone Loss (Periodontitis)': {
      icon: '📉',
      title: 'ಒಸಡಿನ ಮೂಳೆ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ',
      desc:  'ನಿಮ್ಮ ಹಲ್ಲುಗಳನ್ನು ಸ್ಥಾನದಲ್ಲಿ ಹಿಡಿದಿಡುವ ಮೂಳೆ ನಿಧಾನವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ. ಇದು ಒಸಡಿನ ರೋಗದಿಂದ ಆಗುತ್ತದೆ.',
      action: 'ಸ್ಕೇಲಿಂಗ್ ಎಂಬ ಆಳವಾದ ಶುಚಿಗೊಳಿಸುವಿಕೆ ಅಗತ್ಯ. ಕಡಿಮೆಯಾಗುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆ.',
    },
    'Root Infection': {
      icon: '🦠',
      title: 'ಹಲ್ಲಿನ ಬೇರಿನಲ್ಲಿ ಸೋಂಕು',
      desc:  'ಸೋಂಕು ನಿಮ್ಮ ಹಲ್ಲಿನ ಬೇರಿನ ತನಕ ತಲುಪಿದೆ. ಚಿಕಿತ್ಸೆ ಮಾಡದಿದ್ದರೆ ನೋವು ಉಂಟಾಗಿ ಹರಡಬಹುದು.',
      action: 'ರೂಟ್ ಕೆನಾಲ್ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯ. ಸೋಂಕನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತೆಗೆದುಹಾಕುತ್ತದೆ.',
    },
    'Periapical Shadow': {
      icon: '🔍',
      title: 'ಗಮನಿಸಬೇಕಾದ ವಿಷಯ',
      desc:  'AI ಏನೋ ಅಸಾಮಾನ್ಯ ಗುರುತಿಸಿದೆ ಆದರೆ ಖಚಿತವಾಗಿ ಹೇಳಲಾಗಿಲ್ಲ. ಏನೂ ಆಗಿರದಿರಬಹುದು — ವೈದ್ಯರ ಪರೀಕ್ಷೆ ಅಗತ್ಯ.',
      action: 'ಹತ್ತಿರದಿಂದ ನೋಡಲು ದಂತ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
    },
    'Fractured Crown': {
      icon: '🪨',
      title: 'ಹಲ್ಲಿನಲ್ಲಿ ಬಿರುಕು',
      desc:  'ನಿಮ್ಮ ಹಲ್ಲಿನಲ್ಲಿ ಬಿರುಕು ಇದೆ. ಫೋನ್ ಸ್ಕ್ರೀನ್ ಬಿರುಕಿನಂತೆ — ಹರಡುವ ಮೊದಲು ಸರಿಪಡಿಸಬೇಕು.',
      action: 'ಕ್ರೌನ್ (ಕ್ಯಾಪ್) ಹಲ್ಲನ್ನು ರಕ್ಷಿಸಿ ಪುನಃಸ್ಥಾಪಿಸುತ್ತದೆ.',
    },
    'Impacted Wisdom Tooth': {
      icon: '😬',
      title: 'ವಾಲಿದ ಅಕ್ಕಿಲಿ ಹಲ್ಲು',
      desc:  'ನಿಮ್ಮ ಅಕ್ಕಿಲಿ ಹಲ್ಲು ವಾಲಿ ಬೆಳೆಯುತ್ತಿದ್ದು ಇತರ ಹಲ್ಲುಗಳ ಮೇಲೆ ಒತ್ತಡ ಹಾಕಬಹುದು.',
      action: 'ತೆಗೆಯಬೇಕಾಗಬಹುದು. ತೀವ್ರತೆಯ ಆಧಾರದ ಮೇಲೆ ವೈದ್ಯರು ಸಲಹೆ ನೀಡುತ್ತಾರೆ.',
    },
    'Old Filling Failure': {
      icon: '🔧',
      title: 'ಹಳೆಯ ಫಿಲ್ಲಿಂಗ್ ಹಾಳಾಗುತ್ತಿದೆ',
      desc:  'ಹಿಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಹಾಕಿದ ಫಿಲ್ಲಿಂಗ್ ಒಡೆಯಲು ಶುರುವಾಗಿದೆ. ಬ್ಯಾಕ್ಟೀರಿಯಾ ನುಗ್ಗುವ ಮೊದಲು ಬದಲಾಯಿಸಬೇಕು.',
      action: 'ಸರಳ ಹೊಸ ಫಿಲ್ಲಿಂಗ್. ಒಂದೇ ಭೇಟಿ.',
    },
  },
  ta: {
    'Cavity': {
      icon: '🕳️',
      title: 'பல்லில் துளை',
      desc:  'பாக்டீரியா உங்கள் பல் எனாமலை அரித்துவிட்டது. சாலை குழியை போல் நினைத்துக்கொள்ளுங்கள் — இப்போது சிறியது, கவனிக்காவிட்டால் பெரிதாகும்.',
      action: 'ஃபில்லிங் தேவை. ஒரே விஜிட்டில் முடியும் எளிய செயல்முறை.',
    },
    'Cavity (Dental Caries)': {
      icon: '🕳️',
      title: 'பல்லில் துளை',
      desc:  'பாக்டீரியா உங்கள் பல் எனாமலை அரித்துவிட்டது. சாலை குழியை போல் நினைத்துக்கொள்ளுங்கள் — இப்போது சிறியது, கவனிக்காவிட்டால் பெரிதாகும்.',
      action: 'ஃபில்லிங் தேவை. ஒரே விஜிட்டில் முடியும் எளிய செயல்முறை.',
    },
    'Bone Loss': {
      icon: '📉',
      title: 'ஈறு எலும்பு சுருங்குகிறது',
      desc:  'உங்கள் பற்களை இடத்தில் வைத்திருக்கும் எலும்பு மெல்ல குறைந்து வருகிறது. இது ஈறு நோயால் ஏற்படுகிறது.',
      action: 'ஸ்கேலிங் எனப்படும் ஆழமான சுத்தம் செய்யல் தேவை. சுருங்குவதை நிறுத்தும்.',
    },
    'Bone Loss (Periodontitis)': {
      icon: '📉',
      title: 'ஈறு எலும்பு சுருங்குகிறது',
      desc:  'உங்கள் பற்களை இடத்தில் வைத்திருக்கும் எலும்பு மெல்ல குறைந்து வருகிறது. இது ஈறு நோயால் ஏற்படுகிறது.',
      action: 'ஸ்கேலிங் எனப்படும் ஆழமான சுத்தம் செய்யல் தேவை. சுருங்குவதை நிறுத்தும்.',
    },
    'Root Infection': {
      icon: '🦠',
      title: 'பல் வேரில் தொற்று',
      desc:  'தொற்று உங்கள் பல் வேர் வரை சென்றுவிட்டது. சிகிச்சை செய்யாவிட்டால் வலி ஏற்பட்டு பரவலாம்.',
      action: 'ரூட் கேனால் சிகிச்சை தேவை. தொற்றை முழுமையாக அகற்றுகிறது.',
    },
    'Periapical Shadow': {
      icon: '🔍',
      title: 'கவனிக்க வேண்டியது',
      desc:  'AI ஏதோ அசாதாரணமாக கண்டறிந்தது ஆனால் உறுதியாக சொல்லவில்லை. ஒன்றும் இல்லாமல் இருக்கலாம் — பல் மருத்துவர் பரிசோதனை தேவை.',
      action: 'நெருக்கமாக பார்க்க பல் மருத்துவரை சந்தியுங்கள்.',
    },
    'Fractured Crown': {
      icon: '🪨',
      title: 'பல்லில் விரிசல்',
      desc:  'உங்கள் பல்லில் விரிசல் உள்ளது. ஃபோன் திரை விரிசலை போல் — பரவும் முன் சரிசெய்ய வேண்டும்.',
      action: 'கிரீடம் (கேப்) பல்லை பாதுகாத்து மீட்டெடுக்கும்.',
    },
    'Impacted Wisdom Tooth': {
      icon: '😬',
      title: 'சாய்ந்த அறிவாளி பல்',
      desc:  'உங்கள் அறிவாளி பல் சாய்ந்து வளர்ந்து மற்ற பற்களை தள்ளலாம்.',
      action: 'அகற்றல் தேவைப்படலாம். தீவிரத்தின் அடிப்படையில் மருத்துவர் ஆலோசனை தருவார்.',
    },
    'Old Filling Failure': {
      icon: '🔧',
      title: 'பழைய ஃபில்லிங் கெட்டுவிட்டது',
      desc:  'முந்தைய விஜிட்டில் போட்ட ஃபில்லிங் உடையத் தொடங்கிவிட்டது. பாக்டீரியா நுழைவதற்கு முன் மாற்ற வேண்டும்.',
      action: 'எளிய புதிய ஃபில்லிங். ஒரே விஜிட்.',
    },
  },
};

export const FALLBACK_L10N: Record<Lang, FindingL10n> = {
  en: { icon:'🔍', title:'Unknown finding', desc:'The AI detected something that needs a closer look.', action:'Please consult your dentist.' },
  hi: { icon:'🔍', title:'अज्ञात खोज', desc:'AI ने कुछ ऐसा पाया जिस पर करीब से ध्यान देना चाहिए।', action:'कृपया अपने दंत चिकित्सक से मिलें।' },
  te: { icon:'🔍', title:'తెలియని కనుగోలు', desc:'AI దగ్గరగా చూడవలసిన ఏదో గుర్తించింది.', action:'దయచేసి మీ దంత వైద్యుడిని సంప్రదించండి.' },
  kn: { icon:'🔍', title:'ಅಜ್ಞಾತ ಸಂಶೋಧನೆ', desc:'AI ಹತ್ತಿರದಿಂದ ನೋಡಬೇಕಾದ ಏನನ್ನೋ ಪತ್ತೆ ಮಾಡಿದೆ.', action:'ದಯವಿಟ್ಟು ನಿಮ್ಮ ದಂತ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.' },
  ta: { icon:'🔍', title:'தெரியாத கண்டுபிடிப்பு', desc:'AI நெருக்கமாக பார்க்க வேண்டியதை கண்டறிந்தது.', action:'தயவுசெய்து உங்கள் பல் மருத்துவரை அணுகுங்கள்.' },
};
