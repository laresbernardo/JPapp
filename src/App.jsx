import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Utensils,
  Info,
  CheckCircle2,
  AlertCircle,
  Plane,
  Train,
  Bed,
  Camera,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Wifi,
  Navigation,
  Footprints,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Languages,
  BookOpen,
  Search,
  Play,
  Pause,
  FastForward,
  Rewind,
  Headphones,
  Loader2,
  Settings2
} from 'lucide-react';
import preCreatedGuides from './data/guides.json';

const AudioGuide = ({ placeName, dayContext, timeContext, apiKey, cachedData, onCacheUpdate }) => {
  const [status, setStatus] = useState(cachedData ? 'done' : 'idle');
  const [audioUrl, setAudioUrl] = useState(cachedData?.audioUrl || null);
  const [guideText, setGuideText] = useState(cachedData?.text || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + amount, 0), duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = (e.target.value / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const generateContent = async (mode = 'audio') => {
    try {
      setStatus('generating_text');
      setErrorMsg('');

      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Please enter your Google API Key in the Global Settings (Menu).');
      }

      const contextStr = dayContext && timeContext ? ` This is for an activity planned for ${dayContext} at ${timeContext}.` : '';
      const prompt = `Write an engaging, 300-350 word audio-guide script about ${placeName} in Japan.${contextStr} Include history, interesting curiosities, and context. Don't introduce yourself. Make it sound like a friendly, deeply knowledgeable local tour guide speaking to tourists. Do not include any text formatting like * or #, just use plain, readable text that flows well when spoken aloud.`;

      const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
      let text = '';
      let success = false;
      let lastError = '';

      for (const model of modelsToTry) {
        if (success) break;
        try {
          const textRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (textRes.ok) {
            const textData = await textRes.json();
            if (textData.candidates?.[0]?.content?.parts?.[0]?.text) {
              text = textData.candidates[0].content.parts[0].text;
              success = true;
            } else {
              lastError = `Gemini (${model}): Malformed response (no text).`;
            }
          } else {
            const errData = await textRes.json();
            lastError = `Gemini (${model}): ${errData.error?.message || textRes.statusText}`;
          }
        } catch (err) {
          console.warn(`Model ${model} failed, trying next...`, err.message);
          lastError = err.message;
        }
      }

      if (!success) {
        throw new Error(lastError || 'Failed to generate script with Gemini API. Check your API key.');
      }

      setGuideText(text);

      if (mode === 'text') {
        setStatus('done');
        onCacheUpdate(placeName, { text });
        return;
      }

      setStatus('generating_audio');

      const audioRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
          audioConfig: { audioEncoding: 'MP3' }
        })
      });

      if (!audioRes.ok) {
        const errData = await audioRes.json();
        // Fallback to standard voice if premium/Journey fails
        if (errData.error?.message?.includes('Journey') || errData.error?.message?.includes('not found')) {
          const audioResFallback = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode: 'en-US', name: 'en-US-Standard-D' },
              audioConfig: { audioEncoding: 'MP3' }
            })
          });
          if (!audioResFallback.ok) {
            const errDataFb = await audioResFallback.json();
            throw new Error(errDataFb.error?.message || 'Failed to generate audio with Google Cloud TTS.');
          }
          const audioDataFallback = await audioResFallback.json();
          const audioBlobFallback = new Blob([Uint8Array.from(atob(audioDataFallback.audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
          const newUrlFallback = URL.createObjectURL(audioBlobFallback);
          setAudioUrl(newUrlFallback);
          setStatus('done');
          setIsAutoPlay(true);
          onCacheUpdate(placeName, { text, audioUrl: newUrlFallback });
          return;
        }
        throw new Error(errData.error?.message || 'Failed to generate audio with Google Cloud TTS (Make sure Cloud TTS API is enabled).');
      }

      const audioData = await audioRes.json();
      const audioBlob = new Blob([Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const newUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newUrl);
      setStatus('done');
      setIsAutoPlay(true);
      onCacheUpdate(placeName, { text, audioUrl: newUrl });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-2xl p-4 border border-[var(--color-border-light)]/50 mt-4 overflow-hidden shadow-sm" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-3">
        <h6 className="flex items-center gap-1.5 font-bold text-[var(--color-accent-pink)] uppercase tracking-widest text-[10px]">
          <Headphones size={12} /> AI Guide
        </h6>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-start gap-2 border border-red-100">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="break-words w-full">{errorMsg}</p>
        </div>
      )}

      {status === 'generating_text' && (
        <div className="w-full py-6 flex flex-col items-center justify-center gap-3 bg-neutral-100 rounded-xl border border-neutral-200 border-dashed">
          <Loader2 size={24} className="animate-spin text-[var(--color-accent-pink)]" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            Writing script...
          </span>
        </div>
      )}

      {status !== 'generating_text' && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {status === 'generating_audio' && (
            <div className="w-full py-4 flex flex-col items-center justify-center gap-2 bg-neutral-100/50 rounded-xl border border-neutral-200 border-dashed animate-pulse">
              <Loader2 size={16} className="animate-spin text-[var(--color-accent-pink)]" />
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                Recording audio...
              </span>
            </div>
          )}
          {guideText && (
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 italic text-sm text-[var(--color-sumi-gray)] leading-relaxed relative group max-h-[140px] overflow-y-auto no-scrollbar">
              {guideText}
            </div>
          )}

          {audioUrl && (
            <div className="bg-white rounded-xl border border-[var(--color-border-light)] p-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
              <audio
                ref={audioRef}
                src={audioUrl}
                autoPlay={isAutoPlay}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  if (audioRef.current && (duration === 0 || isNaN(duration))) {
                    setDuration(audioRef.current.duration);
                  }
                }}
              />
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[10px] tabular-nums font-bold text-neutral-400 w-6 text-right">{formatTime(progress)}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (progress / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--color-accent-pink)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer touch-none"
                  />
                  <span className="text-[10px] tabular-nums font-bold text-neutral-400 w-6 text-left">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button onClick={() => skip(-15)} className="text-neutral-400 hover:text-[var(--color-sumi-black)] transition-colors active:scale-90">
                    <Rewind size={20} fill="currentColor" />
                  </button>
                  <button onClick={togglePlay} className="w-14 h-14 bg-[var(--color-accent-pink)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-accent-pink-soft)] hover:text-[var(--color-accent-pink)] transition-all active:scale-95 shadow-md hover:shadow-lg">
                    {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                  </button>
                  <button onClick={() => skip(15)} className="text-neutral-400 hover:text-[var(--color-sumi-black)] transition-colors active:scale-90">
                    <FastForward size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {apiKey ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); generateContent('text'); }}
                className="w-full py-3 bg-white text-[var(--color-sumi-black)] border border-neutral-200 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <BookOpen size={16} /> {guideText ? 'Re-generate Text' : 'Generate Text Only'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); generateContent('audio'); }}
                className="w-full py-3 bg-[var(--color-sumi-black)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-[0.98] shadow-md"
              >
                <Headphones size={16} /> {audioUrl ? 'Re-generate Audio' : 'Generate Audio Guide'}
              </button>
            </div>
          ) : !guideText && !audioUrl && (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">AI Guide Locked</p>
              <p className="text-[10px] text-neutral-500 font-medium">Add Google API Key in <span className="text-[var(--color-accent-pink)]">Global Settings</span> to enable.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NoteRenderer = ({ note }) => {
  if (!note) return null;

  // Common labels used in the itinerary
  const labels = [
    "Travel", "Highlight", "Tip", "Action", "Strategy", "Logistics",
    "Done", "Eat", "Vibe", "GMaps", "Where", "Why", "Activity",
    "Experience", "Structure", "Architecture", "Admission",
    "Recommendation", "Task", "Hotel", "Ryokan", "Checkout",
    "Arrive", "Flight", "Fly", "Info", "Venue", "Gathering"
  ];

  // Create a regex that matches any of these labels followed by a colon
  const labelRegex = new RegExp(`(${labels.join('|')}):`, 'g');

  // Split the note into parts
  const parts = note.split(labelRegex).filter(Boolean);

  // If no labels were found or only one part remains, just render as text
  if (parts.length <= 1 && !note.includes(':')) {
    return <p className="text-sm text-[var(--color-sumi-black)] leading-relaxed font-semibold">{note}</p>;
  }

  const sections = [];
  let currentLabel = "";

  // The split with capturing group preserves the labels.
  // parts will look like: ["Some prefix ", "Travel", " content", "Tip", " content"]
  // If it doesn't start with a label, the first part is just text.
  
  let i = 0;
  // Check if first part is a label
  if (labels.includes(parts[0])) {
    // Starts with a label
  } else {
    // Starts with plain text
    sections.push({ label: "", content: parts[0] });
    i = 1;
  }

  for (; i < parts.length; i += 2) {
    const label = parts[i];
    const content = parts[i + 1] || "";
    sections.push({ label, content: content.trim() });
  }

  return (
    <ul className="space-y-1.5 list-none">
      {sections.map((section, idx) => (
        <li key={idx} className="flex gap-2 text-sm text-[var(--color-sumi-black)] leading-relaxed">
          <span className="text-neutral-300 mt-1">•</span>
          <p className="font-medium">
            {section.label && <span className="font-extrabold mr-1">{section.label}:</span>}
            {section.content}
          </p>
        </li>
      ))}
    </ul>
  );
};

const App = () => {
  const [activePart, setActivePart] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [weather, setWeather] = useState({});
  const [jpyAmount, setJpyAmount] = useState('1000');
  const [expandedEventIds, setExpandedEventIds] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('googleApiKey') || '');
  const [guideCache, setGuideCache] = useState(() => {
    try {
      const saved = localStorage.getItem('guideCache');
      const localCache = saved ? JSON.parse(saved) : {};
      // Merge pre-created guides with local cache, local cache takes precedence if user regenerated
      return { ...preCreatedGuides, ...localCache };
    } catch {
      return preCreatedGuides || {};
    }
  });
  const [isPreGenerating, setIsPreGenerating] = useState(false);

  const handleCacheUpdate = (placeName, data) => {
    setGuideCache((prev) => ({ ...prev, [placeName]: { ...prev[placeName], ...data } }));
  };

  // Persist guideCache
  React.useEffect(() => {
    localStorage.setItem('guideCache', JSON.stringify(guideCache));
  }, [guideCache]);

  const preGenerateAllTexts = async () => {
    if (!googleApiKey || isPreGenerating) return;
    setIsPreGenerating(true);

    const placesToGen = [];
    const seenPlaces = new Set();
    itineraryData.forEach(part => {
      part.days.forEach(day => {
        day.events.forEach(event => {
          if (event.activity && !guideCache[event.activity]?.text && !seenPlaces.has(event.activity)) {
            placesToGen.push({
              place: event.activity,
              dayContext: day.label,
              timeContext: event.time
            });
            seenPlaces.add(event.activity);
          }
        });
      });
    });

    for (const item of placesToGen) {
      try {
        const contextStr = item.dayContext && item.timeContext ? ` This is for an activity planned for ${item.dayContext} at ${item.timeContext}.` : '';
        const prompt = `Write an engaging, 300-350 word audio-guide script about ${item.place} in Japan.${contextStr} Include history, interesting curiosities, and context. Don't introduce yourself. Make it sound like a friendly, deeply knowledgeable local tour guide speaking to tourists. Do not include any text formatting like * or #, just use plain, readable text that flows well when spoken aloud.`;
        const model = 'gemini-2.0-flash'; // Use faster model for batch
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            handleCacheUpdate(item.place, { text });
          }
        }
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Failed to pre-generate for ${item.place}`, err);
      }
    }
    setIsPreGenerating(false);
  };

  const getEventTypeBanner = (type, activity) => {
    const FALLBACK_ID = "1526481280693-3bfa7568e0f3"; // Mt Fuji Verified
    const CAT_DEFAULTS = {
      food: "1697652974652-a2336106043b", // Ramen Verified
      transport: "1534274920174-3ad0b7ff2925", // Shinkansen Verified
      hotel: "1582719478250-c89cae4dc85b",
      sight: "1676829940012-4d61ecd20e57", // Kinkaku-ji Verified
      walk: "1524413840807-0c3cb6fa808d",
      default: "1526481280693-3bfa7568e0f3"
    };

    const getUrl = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=1000`;

    if (!activity) return getUrl(CAT_DEFAULTS[type] || CAT_DEFAULTS.default);

    const actLower = activity.toLowerCase();

    // Verified Iconic IDs (Numerical)
    if (actLower.includes('haneda') || actLower.includes('airport')) return getUrl("1674725690428-948af1d7f5a1");
    if (actLower.includes('teamlab')) return getUrl("1593071376160-9881e78495ea");
    if (actLower.includes('shibuya sky')) return getUrl("1729707397413-d4b10d6a0376");
    if (actLower.includes('shibuya') || actLower.includes('scramble')) return getUrl("1706631093613-be82889d8a63");
    if (actLower.includes('senso-ji') || actLower.includes('asakusa')) return getUrl("1706813253696-10ee6332edd3");
    if (actLower.includes('fushimi') || actLower.includes('inari')) return getUrl("1558862108-daa1be6fda90");
    if (actLower.includes('bamboo') || actLower.includes('arashiyama')) return getUrl("1632923754832-60642c12a7ed");
    if (actLower.includes('kinkaku-ji') || actLower.includes('golden pavilion')) return getUrl("1676829940012-4d61ecd20e57");
    if (actLower.includes('kiyomizu-dera') || actLower.includes('hokan-ji') || actLower.includes('yasaka')) return getUrl("1636089041212-21316c2fba75");
    if (actLower.includes('nara') || (actLower.includes('deer') && !actLower.includes('giro'))) return getUrl("1592841451220-553d1a8f306f");
    if (actLower.includes('osaka castle')) return getUrl("1704003671784-ca0a7c7cb4aa");
    if (actLower.includes('dotonbori') || actLower.includes('glico')) return getUrl("1636589950353-041d4fba544c");
    if (actLower.includes('akihabara')) return getUrl("1544974918420-a61f5c71a858");
    if (actLower.includes('ueno')) return getUrl("1553078197116-ae4fd84cbbe8");
    if (actLower.includes('imperial palace')) return getUrl("1758496519274-8172931b2773");
    if (actLower.includes('chidorigafuchi') || actLower.includes('moat')) return getUrl("1760708392291-e1658031ee66");
    if (actLower.includes('gotokuji')) return getUrl("1723708889726-08a3921cc0e6");
    if (actLower.includes('nijo')) return getUrl("1668551776853-0b81db47e2cf");
    if (actLower.includes('uji') || actLower.includes('byodo-in')) return getUrl("1752552750561-422ba1237170");
    if (actLower.includes('meiji jingu')) return getUrl("1720783199805-bf399ed5173c");
    if (actLower.includes('shinjuku gyoen')) return getUrl("1660519083174-d39af2133902");
    if (actLower.includes('godzilla')) return getUrl("1748740345094-7b8d8128e147");
    if (actLower.includes('3d cat') || actLower.includes('shinjuku vision')) return getUrl("1737670060060-5b7d702cced9");
    if (actLower.includes('gov. building') || actLower.includes('metropolitan')) return getUrl("1705699147926-05813429312a");
    if (actLower.includes('nakamise')) return getUrl("1769321308975-4c069a352677");
    if (actLower.includes('fire ramen')) return getUrl("1697652974652-a2336106043b");
    if (actLower.includes('mochi')) return getUrl("1528699633336-3b0439f17d5c");
    if (actLower.includes('philosopher')) return getUrl("1542931287-023b922fa89b");
    if (actLower.includes('nishiki')) return getUrl("1701001909948-8048598fbc92");
    if (actLower.includes('depachika')) return getUrl("1709515522019-4794fd3568eb");
    if (actLower.includes('sky building') || actLower.includes('umeda')) return getUrl("1678730184758-7a54022449ee");
    if (actLower.includes('hiroshima') || actLower.includes('peace memorial')) return getUrl("1658167865945-7e9949fa4d69");
    if (actLower.includes('miyajima')) return getUrl("1623614864429-8fa811a8d854");
    if (actLower.includes('gion') || actLower.includes('pontocho') || actLower.includes('geiko')) return getUrl("1534515033467-dd4df1704496");
    if (actLower.includes('himeji')) return getUrl("1525636127473-251821bc56ab");
    if (actLower.includes('monkey') || actLower.includes('snow monkey')) return getUrl("1550713898958-3570906a58c4");
    if (actLower.includes('sushi')) return getUrl("1639019595653-e7395f071c00");
    if (actLower.includes('yomoide') || actLower.includes('yokocho') || actLower.includes('golden gai')) return getUrl("1715905732164-0acc9dab00d4");
    if (actLower.includes('tsukiji')) return getUrl("1553621042-f6e147245754");
    if (actLower.includes('museum')) return getUrl("1723013082670-2ea6bd4f7ffa");
    if (actLower.includes('nanzen-ji')) return getUrl("1668551776853-0b81db47e2cf");
    if (actLower.includes('shinkansen')) return getUrl("1534274920174-3ad0b7ff2925");
    if (actLower.includes('ginza') || actLower.includes('chuo-dori')) return getUrl("1714332257298-b8bff34dbac7");
    if (actLower.includes('ramen')) return getUrl("1697652974652-a2336106043b");

    return getUrl(CAT_DEFAULTS[type] || CAT_DEFAULTS.default);
  };

  const getActivityRecommendations = (activity) => {
    if (!activity) return [];

    const recs = {
      "Haneda": ["Have your Visit Japan Web QR code ready on screen", "Pick up a Welcome Suica or Pasmo Passport at the station", "Use airport baggage delivery (Kuroneko Yamato) if you have large suitcases"],
      "Shintomicho": ["Check if they provide pajamas (many Japanese hotels do)", "Familiarize yourself with the nearest subway exits"],
      "Ramen Street": ["Expect a 20-30 min queue for Rokurinsha", "Buy your ticket from the vending machine first"],
      "Ginza": ["Visit Uniqlo's global flagship store", "Itoya stationery store is a must-visit nearby"],
      "Senso-ji": ["Buy an Omikuji (paper fortune) for 100 yen", "If you get a bad fortune, tie it to the racks to leave the bad luck behind", "Experience the incense smoke at the main cauldron for good health"],
      "Nakamise": ["Don't walk and eat! Eat at the stall where you bought the food", "Try the Ningyoyaki (sweet bean cakes) and fresh Agemanju"],
      "Asakusa Pier": ["Sit on the right side for better views of Skytree", "Get tickets in advance online if possible"],
      "Hama-rikyu": ["Enjoy matcha set at the Nakajima-no-ochaya tea house", "Notice the tide-water pond which changes level with Tokyo Bay"],
      "Manten Sushi": ["Trust the chef (Omakase style)", "No need for extra soy sauce, pieces are pre-seasoned"],
      "Monjayaki": ["Let the staff cook it for you if it's your first time", "Use the tiny spatulas to scrape and eat directly from the grill"],
      "Ueno Park": ["Bring a leisure sheet (picnic mat) to sit on", "Grab some bentos and drinks from a nearby conbini beforehand"],
      "Ameyoko": ["Bargaining is possible here (rare for Japan!)", "Try the fresh fruit skewers and Takoyaki"],
      "Akihabara": ["Bring your passport for tax-free shopping", "Check out Super Potato for retro gaming nostalgics"],
      "Onodera": ["Stand-up sushi means fast-paced but incredible quality at a lower price", "Order seasonal items (Ask: 'Osusume wa nan desu ka?')"],
      "teamLab": ["Wear pants that can be rolled up to your knees", "Avoid wearing skirts (mirrored floors)", "Download the teamLab app to interact with some exhibits"],
      "National Museum": ["See the Honkan (Japanese Gallery) if you only have one hour", "The museum shop is excellent for high-quality, unique souvenirs"],
      "Tsukiji": ["Go early (before 9 AM) to avoid the worst crowds", "Try the 100-yen Tamagoyaki (rolled omelet)", "Cash is king here"],
      "Imperial Palace": ["The East Gardens are free and offer a peaceful escape", "Check out the massive stone foundations of the old Edo castle"],
      "Chidorigafuchi": ["Rent a rowboat for the ultimate romantic view", "Expect massive crowds during peak bloom"],
      "Shibuya Sky": ["No loose items allowed on the roof (lockers provided)", "The escalator ride up is part of the experience, have camera ready"],
      "Ushigoro": ["Don't overcook A5 Wagyu! 3-5 seconds per side is enough", "Order the raw beef with egg yolk if you're adventurous"],
      "Meiji Jingu": ["Bow once before entering the Torii gates", "Wash your hands at the Chozuya before approaching the main shrine"],
      "Gotokuji": ["You can buy a cat statue, make a wish, and leave it, or take it home", "Please be quiet in the residential neighborhood nearby"],
      "Godzilla": ["Head to the 8th-floor terrace of Hotel Gracery for an up-close view", "The Godzilla roars on the hour (from 12:00 to 20:00)"],
      "Shinjuku Gyoen": ["Alcohol is strictly prohibited inside this park", "Requires a small entrance fee (around 500 yen)"],
      "Gov. Building": ["The South Observatory is open during the day, North is open at night", "Look for Mt. Fuji on clear days in the morning"],
      "Golden Gai": ["Many bars have a cover charge (table charge)", "Look for 'English Menu' or 'Tourists Welcome' signs if unsure"],
      "Omoide": ["Also known as Piss Alley!", "Great for cheap Yakitori skewers and a beer in a cramped, authentic setting"],
      "Tokyo Station": ["Stock up on Ekiben (station bentos) before boarding", "Locate your car number on the platform floor markings"],
      "Fushimi Inari": ["Hike up further past the halfway point to escape 90% of the crowds", "Stop for some Inari Sushi or Kitsune Udon at the base"],
      "Pontocho": ["Keep an eye out for Geiko and Maiko scurrying between appointments", "Many restaurants facing the river have outdoor terraces (Kawayuka)"],
      "Bamboo": ["Arrive before 8 AM for photos without crowds", "Combine with the nearby Tenryu-ji Temple"],
      "Tenryu-ji": ["The garden is famous for its 'borrowed scenery' of the Arashiyama mountains", "Take your shoes off and enjoy the view from the main hall"],
      "Otagi": ["Try to find a statue that looks like you (there are 1,200 unique ones!)", "A peaceful alternative to the crowded bamboo grove"],
      "Kinkaku-ji": ["Afternoons offer the best sunlight shining on the gold leaf", "Follow the set path, strict one-way system"],
      "Giro Giro": ["Modern, affordable Kaiseki. Bookings essential", "Sit at the counter to watch the chefs work"],
      "Keage": ["Walk right in the middle of the tracks for the best perspective", "Visit early morning if you want photos without crowds"],
      "Nanzen-ji": ["Climb to the top of the Sanmon gate for a great view", "The brick aqueduct is a very rare and photogenic sight in Kyoto"],
      "Philosopher's": ["Start from Ginkaku-ji and walk down to Nanzen-ji", "Stop by a local cafe along the canal for matcha"],
      "Hokan-ji": ["Go early (around 5:30am) to capture the Yasaka Pagoda fully empty for photos.", "Sannen-zaka and Ninen-zaka are right next to it, also great for early morning shots."],
      "Kiyomizu-dera": ["Drink from the Otowa Waterfall for longevity, success, or love (choose only one!)", "The sunset view from the observation deck is spectacular"],
      "Miyako Odori": ["No photos allowed during the performance", "The theater is a beautiful example of early Showa architecture"],
      "Nijo Castle": ["Listen to the 'Nightingale floors' that squeak to warn of ninjas", "The gardens are spectacularly illuminated during spring"],
      "Nara": ["Keep any paper or maps hidden, the deer will eat them!", "Bow to the deer and they will bow back before you give them a cracker"],
      "Todai-ji": ["Try to squeeze through the 'Buddha's Nostril' pillar for enlightenment", "The scale of the bronze Buddha is hard to capture on camera"],
      "Byodo-in": ["Check your 10-yen coin—this is the temple pictured on it!", "Uji is famous for the best Matcha in Japan"],
      "Uji": ["Try the Matcha Gyoza or ice cream nearby", "Byodo-in's museum is partially underground and very modern"],
      "Nishiki": ["Try the 'Tako Tamago' (baby octopus with quail egg)", "Great place to buy high-quality Japanese kitchen knives"],
      "Umeda": ["The escalator going across the void is a photo highlight", "Visit just before sunset to see both day and night views"],
      "Shinsekai": ["Don't double-dip your Kushikatsu in the communal sauce!", "Try the mixed juice, a retro Osaka specialty"],
      "Glico": ["Take the classic pose photo on the Ebisu Bridge", "Eat Takoyaki and Okonomiyaki here"],
      "Checkout": ["Ensure you have not left anything in the safe or under the bed", "Leave room keys at the front desk"],
      "Namba Station": ["The Rapi:t train looks like a retro-futuristic blue spaceship", "Reserve seats in advance if traveling during rush hour"],
      "KIX": ["Stock up on Tokyo Banana and Royce Chocolate here", "Security can be slow, arrive at least 2.5 hours early"],
      "Airport": ["Ensure your liquids are packed correctly", "Have your boarding pass and passport easily accessible"]
    };

    const match = Object.keys(recs).find(key => activity.toLowerCase().includes(key.toLowerCase()));
    if (match) return recs[match];

    return ["Stay hydrated and wear comfortable walking shoes!", "Look around for small, hidden details and take plenty of photos.", "Check Google Maps for last-minute route changes."];
  };

  const vocabData = [
    {
      category: "Basic Phrases",
      phrases: [
        { en: "Thank you (polite)", ro: "Arigatou gozaimasu", jp: "ありがとうございます" },
        { en: "Excuse me / Sorry", ro: "Sumimasen", jp: "すみません" },
        { en: "Yes, please", ro: "Hai, onegaishimasu", jp: "はい、お願いします" },
        { en: "No, I’m okay / No thank you", ro: "Iie, daijoubu desu", jp: "いいえ, 大丈夫です" },
        { en: "Do you understand English?", ro: "Eigo wakarimasu ka?", jp: "英語分かりますか？" },
        { en: "I don’t understand", ro: "Wakarimasen", jp: "分かりません" },
        { en: "I understood / I got it", ro: "Wakarimashita", jp: "分かりました" },
        { en: "Please wait a moment", ro: "Chotto matte kudasai", jp: "ちょっと待ってください" }
      ]
    },
    {
      category: "Navigating the City",
      phrases: [
        { en: "Where is [place]?", ro: "[Place] wa doko desu ka?", jp: "[Place] はどこですか？" },
        { en: "Do you have [item]?", ro: "[Item] wa arimasu ka?", jp: "[Item] はありますか？" },
        { en: "What is the Wi-Fi password?", ro: "Wi-Fi no pasu waado wa nan desu ka?", jp: "Wi-Fiのパスワードは何ですか？" },
        { en: "To [place], please", ro: "[Place] made onegaishimasu", jp: "[Place] までお願いします" },
        { en: "I want to go to [place]", ro: "[Place] ni ikitai desu", jp: "[Place] に行きたいです" },
        { en: "Does this bus go to [place]?", ro: "Kono basu wa [Place] ni ikisu ka?", jp: "このバスは [Place] に行きますか？" }
      ]
    },
    {
      category: "Restaurant & Shopping",
      phrases: [
        { en: "How much is this?", ro: "Kore wa ikura desu ka?", jp: "これはいくらですか？" },
        { en: "Can I use a credit card?", ro: "Kurejitto kaado tsukaemasu ka?", jp: "クレジットカード使えますか？" },
        { en: "With [payment method], please", ro: "[Method] de onegaishimasu", jp: "[Method] でお願いします" },
        { en: "Welcome (You will hear this)", ro: "Irasshaimase", jp: "いらっしゃいませ" },
        { en: "How many people? (Hearing)", ro: "Nanmei-sama desu ka? (Reply: Futari desu)", jp: "何名様ですか？" },
        { en: "[Number] people, please", ro: "[Number]-nin desu", jp: "[Number] 人です" },
        { en: "Please give me [item]", ro: "[Item] kudasai", jp: "[Item] ください" },
        { en: "Please / I'd like [item]", ro: "[Item] onegaishimasu", jp: "[Item] お願いします" },
        { en: "Thank you for the meal", ro: "Gochisousama deshita", jp: "ごちそうさまでした" }
      ]
    },
    {
      category: "Photos",
      phrases: [
        { en: "Could you take a picture for me?", ro: "Shashin totte moratte mo ii desu ka?", jp: "写真撮ってもらってもいいですか？" },
        { en: "May I take a photo for you?", ro: "Yokattara torimashou ka?", jp: "よかったら撮りましょうか？" }
      ]
    },
    {
      category: "Emergencies & Health",
      phrases: [
        { en: "Help!", ro: "Tasukete!", jp: "助けて！" },
        { en: "Where is the hospital?", ro: "Byouin wa doko desu ka?", jp: "病院はどこですか？" },
        { en: "I don't feel well", ro: "Kibun ga warui desu", jp: "気分が悪いです" },
        { en: "Please call an ambulance", ro: "Kyuukyuusha o yonde kudasai", jp: "救急車を呼んでください" }
      ]
    },
    {
      category: "Stations & Trains",
      phrases: [
        { en: "One ticket, please", ro: "Kippu o ichimai onegaishimasu", jp: "切符を1枚お願いします" },
        { en: "Which platform is this?", ro: "Nan-ban sen desu ka?", jp: "何番線ですか？" },
        { en: "Does this stop at [place]?", ro: "Kore wa [Place] ni tomarimasu ka?", jp: "これは [Place] に止まりますか？" }
      ]
    },
    {
      category: "Hotel & Accommodation",
      phrases: [
        { en: "I have a reservation", ro: "Yoyaku shite imasu", jp: "予約しています" },
        { en: "Check-in, please", ro: "Chekkuin onegaishimasu", jp: "チェックインお願いします" },
        { en: "Could you keep my luggage?", ro: "Nimotsu o azukatte moraemasu ka?", jp: "荷物を預かってもらえますか？" },
        { en: "Is breakfast included?", ro: "Choushoku wa tsuite imasu ka?", jp: "朝食はついていますか？" }
      ]
    },
    {
      category: "Greetings & Chatting",
      phrases: [
        { en: "Good morning", ro: "Ohayou gozaimasu", jp: "おはようございます" },
        { en: "Good evening", ro: "Konbanwa", jp: "こんばんは" },
        { en: "Nice to meet you", ro: "Hajimemashite", jp: "はじめまして" },
        { en: "I am from [country]", ro: "[Country] kara kimashita", jp: "[Country] から来ました" }
      ]
    },
    {
      category: "Convenience Store (Konbini)",
      phrases: [
        { en: "Can you heat this up?", ro: "Atatamete moraemasu ka?", jp: "温めてもらえますか？" },
        { en: "A plastic bag, please", ro: "Fukuro o onegaishimasu", jp: "袋をお願いします" },
        { en: "I don't need a bag", ro: "Fukuro wa irimasen", jp: "袋はいりません" },
        { en: "Can I get chopsticks?", ro: "Ohashi o moraemasu ka?", jp: "お箸をもらえますか？" }
      ]
    }
  ];

  React.useEffect(() => {
    // Fetch Currency
    fetch('https://open.er-api.com/v6/latest/JPY')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.EUR) {
          setExchangeRate(data.rates.EUR);
        }
      })
      .catch(err => console.error("Currency fetch failed", err));

    // Fetch Weather for main cities with daily ranges
    const areas = {
      "Tokyo": { lat: 35.6762, lon: 139.6503 },
      "Kyoto": { lat: 35.0116, lon: 135.7683 },
      "Osaka": { lat: 34.6937, lon: 135.5023 }
    };
    Object.entries(areas).forEach(([city, coords]) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`)
        .then(res => res.json())
        .then(data => {
          if (data && data.current_weather) {
            setWeather(prev => ({
              ...prev,
              [city]: {
                temp: data.current_weather.temperature,
                code: data.current_weather.weathercode,
                daily: data.daily // Full forecast object
              }
            }));
          }
        })
        .catch(err => console.error(`Weather fetch failed for ${city}`, err));
    });
  }, []);

  const getWeatherKey = (area) => {
    if (!area) return null;
    const lowerArea = area.toLowerCase();
    if (lowerArea.includes('tokyo') || lowerArea.includes('ginza') || lowerArea.includes('shinjuku')) return 'Tokyo';
    if (lowerArea.includes('kyoto') || lowerArea.includes('sanjo')) return 'Kyoto';
    if (lowerArea.includes('osaka') || lowerArea.includes('namba')) return 'Osaka';
    return null;
  };

  const getWeatherIcon = (code) => {
    if (code === undefined) return <Cloud size={14} />;
    if (code === 0) return <Sun size={14} className="text-orange-400" />;
    if (code <= 3) return <Cloud size={14} className="text-neutral-400" />;
    if (code >= 51) return <CloudRain size={14} className="text-blue-400" />;
    return <Cloud size={14} />;
  };

  const itineraryData = [
  {
    "title": "Part 1: Tokyo East (The Historic & Blooming Heart)",
    "subtitle": "Stay: 3 Nights.",
    "dates": "",
    "area": "Ginza, Nihonbashi, or Tokyo Station area.",
    "days": [
      {
        "date": "Thu, Mar 26",
        "label": "Day 0: Welcome to Tokyo",
        "events": [
          {
            "time": "14:25",
            "activity": "Touchdown at Haneda (HND)",
            "type": "sight",
            "transportMode": "public",
            "note": "Welcome! You land at Terminal 3. Clear immigration (approx. 1 hour). Transport: Take the Keikyu Line or Tokyo Monorail, depending on your specific hotel location in Ginza/Nihonbashi. It takes about 35\u201345 minutes.",
            "status": "pending"
          },
          {
            "time": "17:00",
            "activity": "Hotel Check-in: HOTEL LIVEMAX Tokyo Shintomicho",
            "type": "hotel",
            "transportMode": "public",
            "note": "Drop bags and freshen up.",
            "status": ""
          },
          {
            "time": "18:30",
            "activity": "First Meal: Ramen Street or Yakitori",
            "type": "food",
            "transportMode": "public",
            "note": "Where: If staying near Tokyo Station, head to \"Tokyo Ramen Street\" in the basement. Recommendation: Rokurinsha for Tsukemen (dipping noodles) if the line isn't too crazy, or Soranoiro for a lighter option. Alternative: Tatsunoya Ramen in Shinjuku is famous, but since you are in the East, look for Kagari in Ginza (famous creamy chicken broth).",
            "status": ""
          },
          {
            "time": "20:00",
            "activity": "Easy Evening Walk",
            "type": "walk",
            "transportMode": "walk",
            "note": "Walk through Ginza Chuo-dori. The architecture is lit up beautifully. Stop at a Konbini (7-Eleven/Lawson) to buy an Egg Salad Sandwich and tea for tomorrow morning.",
            "status": ""
          },
          {
            "time": "21:30",
            "activity": "Rest",
            "type": "sight",
            "transportMode": "public",
            "note": "You need to beat jet lag. Sleep early.",
            "status": ""
          }
        ]
      },
      {
        "date": "Fri, Mar 27",
        "label": "Day 1: Old Edo & River Breezes",
        "events": [
          {
            "time": "07:00",
            "activity": "Senso-ji Temple (Asakusa)",
            "type": "sight",
            "transportMode": "public",
            "note": "Why: Tokyo\u2019s oldest temple. The huge red lantern (Kaminarimon) is iconic. Tip: Draw an \"Omikuji\" (fortune) for 100 yen.",
            "status": ""
          },
          {
            "time": "10:00",
            "activity": "Nakamise Dori Snacking",
            "type": "food",
            "transportMode": "public",
            "note": "Try a freshly baked Melonpan at Kagetsudo. It\u2019s sweet, fluffy bread (no actual melon).",
            "status": ""
          },
          {
            "time": "11:00",
            "activity": "Water Bus to Hamarikyu",
            "type": "transport",
            "transportMode": "boat",
            "note": "Take the \"Tokyo Cruise\" boat from Asakusa Pier down the Sumida River to Hamarikyu Gardens.",
            "status": ""
          },
          {
            "time": "12:00",
            "activity": "Hama-rikyu Gardens",
            "type": "sight",
            "transportMode": "public",
            "note": "Why: An Edo-period saltwater garden surrounded by modern skyscrapers. Activity: Have Matcha and a sweet at the tea house on the island in the middle of the pond.",
            "status": ""
          },
          {
            "time": "13:30",
            "activity": "Lunch: Manten Sushi (Marunouchi/Nihonbashi)",
            "type": "food",
            "transportMode": "public",
            "note": "Logistics: Booked and confirmed 1 month ahead. Done! Why: Incredible Omakase for the price (approx. \u00a57,000).",
            "status": "confirmed"
          },
          {
            "time": "15:30",
            "activity": "Ginza Central & Depachika (Food Halls)",
            "type": "food",
            "transportMode": "taxi",
            "note": "Metro o Taxi desde Akihabara (aprox. 15 min). Cerca de Ginza para cenar. Paseo relajado. Arquitectura: Admiren las fachadas del emblem\u00e1tico edificio Wako con su torre de reloj.",
            "status": ""
          },
          {
            "time": "19:00",
            "activity": "Dinner: Monjayaki Street (Tsukishima)",
            "type": "food",
            "transportMode": "taxi",
            "note": "Travel: Short metro ride or taxi to Tsukishima. Experience: \"Monjayaki\" is a gooey, savory pancake unique to Tokyo. Go to Monja Kura. Order the \"Mentaiko & Cheese\" version. It looks messy but tastes divine.",
            "status": ""
          }
        ]
      },
      {
        "date": "Sat, Mar 28",
        "label": "Day 2: The Sakura Explosion",
        "events": [
          {
            "time": "08:30",
            "activity": "Ueno Park",
            "type": "sight",
            "transportMode": "walk",
            "note": "Vibe: \"Hanami\" ground zero. Thousands of lanterns and people picnicking under trees. Walk the main alley toward the National Museum. [Maybe] Tokyo National Museum (Ueno Park): Despu\u00e9s del paseo por el parque (o antes de Ameyoko Market). Entrada: Aprox. \u00a51,000. Es el museo m\u00e1s grande y antiguo de Jap\u00f3n, con una colecci\u00f3n impresionante de arte y artefactos japoneses y asi\u00e1ticos. Ya est\u00e1n en la puerta; podr\u00edan dedicar 1-2 horas para verlo y aprovechar al m\u00e1ximo su tiempo en Ueno.",
            "status": ""
          },
          {
            "time": "11:00",
            "activity": "Ameyoko Market",
            "type": "food",
            "transportMode": "public",
            "note": "Lunch: Street food chaos. Grab a cheap seafood bowl (Kaisen-don) at Minatoya or just snack on fruit sticks and takoyaki.",
            "status": ""
          },
          {
            "time": "13:30",
            "activity": "Akihabara Electric Town",
            "type": "sight",
            "transportMode": "walk",
            "note": "Travel: 2 km walk or short train from Ueno. Visit: Radio Kaikan for anime figures and Gachapon Hall (hundreds of capsule toy machines). It is a sensory overload in the best way.",
            "status": ""
          },
          {
            "time": "15:30",
            "activity": "Ginza Central & Depachika (Food Halls)",
            "type": "food",
            "transportMode": "taxi",
            "note": "Metro o Taxi desde Akihabara (aprox. 15 min). Cerca de Ginza para cenar. Paseo relajado. Gastronom\u00eda (Cultura): Visiten el s\u00f3tano Depachika de un gran almac\u00e9n (como Ginza Mitsukoshi o Daimaru) para ver una incre\u00edble exhibici\u00f3n de reposter\u00eda japonesa, chocolates y exquisiteces gourmet. Es una experiencia cultural en s\u00ed misma y una excelente oportunidad para un tentempi\u00e9 ligero antes del sushi.",
            "status": ""
          },
          {
            "time": "18:30",
            "activity": "Dinner: Sushi Ginza Onodera T\u014dry\u016bmon",
            "type": "food",
            "transportMode": "public",
            "note": "Why: A standing sushi bar run by apprentices of a Michelin-starred chef. High quality, lower price.",
            "status": ""
          },
          {
            "time": "20:00",
            "activity": "teamLab Planets (Toyosu)",
            "type": "sight",
            "transportMode": "public",
            "note": "An unforgettable, barefoot, immersive art experience with water features. Logistics: Critical booking! Your reservation must be for this time - DONE!",
            "status": ""
          }
        ]
      }
    ]
  },
  {
    "title": "Part 2: Tokyo West (Neon Finale)",
    "subtitle": "Stay: 2 Nights.",
    "dates": "",
    "area": "Shinjuku or Shibuya.",
    "days": [
      {
        "date": "Sun, Mar 29",
        "label": "Day 3: Digital Art, East Tokyo Finale & Wagyu",
        "events": [
          {
            "time": "08:00",
            "activity": "Tsukiji Outer Market",
            "type": "food",
            "transportMode": "public",
            "note": "Eat: Grab a quick, fresh breakfast like Tamagoyaki (sweet egg omelet) or a wagyu skewer. Tip: You checked out of your East hotel this morning, so leave your luggage at reception or in a coin locker near Shimbashi Station for now. 9:30 | Luggage Check-Out Check out of HOTEL LIVEMAX Tokyo Shintomicho and move your luggage to a coin locker at Shimbashi Station (close to your last hotel/Tsukiji) or Tokyo Station for the morning activities.",
            "status": ""
          },
          {
            "time": "10:30",
            "activity": "Imperial Palace East Gardens (Free)",
            "type": "sight",
            "transportMode": "walk",
            "note": "Walk off the sushi. See the massive stone walls of the old Edo castle. A relaxing walk through the former grounds of Edo Castle, featuring the massive stone foundations of the main keep. Tip: This is free and offers beautiful architecture and landscaping.",
            "status": ""
          },
          {
            "time": "12:00",
            "activity": "Chidorigafuchi Moat",
            "type": "sight",
            "transportMode": "walk",
            "note": "Travel: Metro to Kudanshita Station. Highlight: The classic Tokyo postcard shot. Hundreds of Sakura trees hang over the Imperial Palace moat. Tip: If the line for rowboats is under 45 mins, do it. If not, just walk the path.",
            "status": ""
          },
          {
            "time": "13:00",
            "activity": "Retrieve Luggage & Travel",
            "type": "sight",
            "transportMode": "public",
            "note": "Action: Retrieve your bags from the locker (e.g., Shimbashi). Take the subway to Shinjuku (your next hotel area). This is your mandatory move to the West side of Tokyo.",
            "status": ""
          },
          {
            "time": "14:00",
            "activity": "Quick Lunch near Shinjuku/Shibuya & Drop-off Luggage",
            "type": "food",
            "transportMode": "public",
            "note": "Action: Go straight to Premier Hotel Cabin Shinjuku. Even if your room is not ready, the staff will store your bags for you. You are now luggage-free. Eat: Grab a quick, easy meal near your new area (e.g., in a Shinjuku station department store food hall, or a quick ramen/soba shop).",
            "status": ""
          },
          {
            "time": "15:00",
            "activity": "Shibuya Sky (Booked)",
            "type": "sight",
            "transportMode": "public",
            "note": "Logistics: Confirmed booking for 15:20-15:39 slot. Arrive 15 minutes early to start the queue. This is not the sunset slot, but it offers a great afternoon view. Travel: Take the subway from Shinjuku to Shibuya.",
            "status": "confirmed"
          },
          {
            "time": "17:00",
            "activity": "The Move & Check-in",
            "type": "transport",
            "transportMode": "public",
            "note": "Logistics: Travel from Shibuya to Premier Hotel Cabin Shinjuku (approx. 15-20 mins). Check in and drop your bags. This time avoids the hectic travel and luggage hassle from your old hotel.",
            "status": ""
          },
          {
            "time": "20:00",
            "activity": "Dinner: Wagyu Yakiniku Blackhole (Booked)",
            "type": "food",
            "transportMode": "public",
            "note": "Eat: It is highly regarded on local Japanese food sites for offering excellent A5-rank Wagyu and a great value lunch set menu. The dinner menu is more reasonably priced than the higher-end chains. GMaps: https://maps.app.goo.gl/95d4KqfjsG1i83Di8",
            "status": "confirmed"
          }
        ]
      },
      {
        "date": "Mon, Mar 30",
        "label": "Day 4: Cats, Forests & Golden Gai",
        "events": [
          {
            "time": "09:00",
            "activity": "Meiji Jingu Shrine",
            "type": "sight",
            "transportMode": "walk",
            "note": "Start your day with a tranquil walk through this massive, forested Shinto shrine dedicated to Emperor Meiji. It is a peaceful contrast to the city.",
            "status": ""
          },
          {
            "time": "11:00",
            "activity": "Gotokuji Temple (The Cat Temple)",
            "type": "sight",
            "transportMode": "public",
            "note": "Travel: Take the Odakyu line to Gotokuji Station (aprox. 40 min from Shinjuku). Why: Thousands of \"Maneki Neko\" (waving cat) statues. It is unique and very photogenic.",
            "status": ""
          },
          {
            "time": "13:30",
            "activity": "Lunch: AFURI Ramen (Shinjuku/Harajuku)",
            "type": "food",
            "transportMode": "public",
            "note": "Famous for their Yuzu-scented broth. Light and refreshing.",
            "status": ""
          },
          {
            "time": "15:00",
            "activity": "Shinjuku Gyoen National Garden",
            "type": "sight",
            "transportMode": "public",
            "note": "If the Sakura is late, this park has late-blooming varieties. It is huge and beautiful.",
            "status": ""
          },
          {
            "time": "17:00",
            "activity": "Shinjuku 3D Cat & Godzilla",
            "type": "sight",
            "transportMode": "walk",
            "note": "Walk past the Cross Shinjuku Vision (3D Cat billboard) and the Hotel Gracery (Godzilla head).",
            "status": ""
          },
          {
            "time": "18:00",
            "activity": "Tokyo Metropolitan Government Building",
            "type": "sight",
            "transportMode": "public",
            "note": "Kenzo Tange-designed City Hall complex with views from the tallest building's observation decks.",
            "status": ""
          },
          {
            "time": "20:00",
            "activity": "Dinner: Omoide Yokocho (Piss Alley)",
            "type": "food",
            "transportMode": "public",
            "note": "Tiny yakitori stalls, smoke, beer crates. Very authentic. Don't let the nickname scare you.",
            "status": ""
          },
          {
            "time": "22:00",
            "activity": "Golden Gai",
            "type": "sight",
            "transportMode": "public",
            "note": "Drink: End the night with a highball in one of the 200 tiny bars packed into a few alleyways. IMPORTANT: Ask your hotel to ship your large luggage to Kyoto tonight. Pack a small backpack for tomorrow's travel.",
            "status": ""
          }
        ]
      }
    ]
  },
  {
    "title": "Part 3: Kyoto (The Cultural Heart)",
    "subtitle": "Stay: 4 Nights.",
    "dates": "",
    "area": "Sanjo or Kawaramachi (Central).",
    "days": [
      {
        "date": "Tue, Mar 31",
        "label": "Day 5: The Shinkansen & Red Gates",
        "events": [
          {
            "time": "09:00",
            "activity": "Shinkansen to Kyoto",
            "type": "transport",
            "transportMode": "public",
            "note": "Depart Tokyo or Shinagawa Station. Tip: Buy a \"Katsu Sando\" (Pork sandwich) at the station. Sit on the Right side (Seat E) for Mt. Fuji views.",
            "status": ""
          },
          {
            "time": "11:30",
            "activity": "Arrival & Check-in",
            "type": "transport",
            "transportMode": "taxi",
            "note": "Arrive Kyoto Station. Take a taxi/subway to your hotel to drop your backpack if needed.",
            "status": ""
          },
          {
            "time": "13:00",
            "activity": "Lunch: Chao Chao Gyoza",
            "type": "food",
            "transportMode": "public",
            "note": "Near Sanjo/Gion area. Award-winning, crispy gyoza.",
            "status": ""
          },
          {
            "time": "14:30",
            "activity": "Fushimi Inari Taisha",
            "type": "sight",
            "transportMode": "public",
            "note": "Strategy: Thousands of red Torii gates. Most tourists stop at the bottom. Hike up past the \"Yotsutsuji\" intersection (about 30-40 mins up) and the crowd disappears.",
            "status": ""
          },
          {
            "time": "17:30",
            "activity": "Pontocho Alley Stroll",
            "type": "walk",
            "transportMode": "public",
            "note": "Narrow alleyway packed with restaurants along the river. Very atmospheric.",
            "status": ""
          },
          {
            "time": "19:00",
            "activity": "Dinner: Menbaka Fire Ramen",
            "type": "food",
            "transportMode": "public",
            "note": "Experience: The chef creates a massive fire column over your bowl. It\u2019s a tourist spectacle, but the onion-flavored ramen is actually tasty, and it\u2019s great fun. PENDING",
            "status": "pending"
          }
        ]
      },
      {
        "date": "Wed, Apr 1",
        "label": "Day 6: Bamboo & Gold",
        "events": [
          {
            "time": "07:00",
            "activity": "Arashiyama Bamboo Grove",
            "type": "sight",
            "transportMode": "public",
            "note": "Why Early? At 10 AM it is a crushed nightmare. At 7 AM it is spiritual.",
            "status": ""
          },
          {
            "time": "08:30",
            "activity": "Tenryu-ji Garden",
            "type": "sight",
            "transportMode": "public",
            "note": "Beautiful Zen garden right next to the bamboo exit.",
            "status": ""
          },
          {
            "time": "10:00",
            "activity": "Otagi Nenbutsu-ji",
            "type": "sight",
            "transportMode": "taxi",
            "note": "Travel: Take a short taxi ride north (don't walk, it's far). Why: A hidden gem with 1,200 whimsical stone statues covered in moss.",
            "status": ""
          },
          {
            "time": "12:30",
            "activity": "Lunch: Arashiyama Street Food or Soba",
            "type": "food",
            "transportMode": "public",
            "note": "Grab a Yuba (tofu skin) snack or noodles in the main street.",
            "status": ""
          },
          {
            "time": "14:00",
            "activity": "Kinkaku-ji (Golden Pavilion)",
            "type": "sight",
            "transportMode": "taxi",
            "note": "Travel: Taxi from Arashiyama (Bus takes too long). Photo: The classic gold temple reflecting in the pond.",
            "status": ""
          },
          {
            "time": "16:00",
            "activity": "Ryoan-ji (Optional)",
            "type": "sight",
            "transportMode": "public",
            "note": "Famous rock garden nearby if you aren't \"templed out.\"",
            "status": ""
          },
          {
            "time": "20:30",
            "activity": "Giro Giro Hitoshina (Dinner: Gion District)",
            "type": "food",
            "transportMode": "public",
            "note": "Booked: (Kaiseki, which is a traditional multi-course. 2 people = \u00a513,168). Keep an eye out for Geiko/Maiko on their way to appointments.",
            "status": "confirmed"
          }
        ]
      },
      {
        "date": "Thu, Apr 2",
        "label": "Day 7: The Philosopher\u2019s Walk + Miyako Odori (Sakura Peak)",
        "events": [
          {
            "time": "08:30",
            "activity": "Keage Incline",
            "type": "sight",
            "transportMode": "public",
            "note": "Photo Spot: Old railway tracks lined with Sakura trees. Stunning.",
            "status": ""
          },
          {
            "time": "09:30",
            "activity": "Nanzen-ji Temple",
            "type": "sight",
            "transportMode": "public",
            "note": "See the massive wooden Sanmon gate and the brick aqueduct (strange Roman style in a Japanese temple).",
            "status": ""
          },
          {
            "time": "10:30",
            "activity": "Philosopher\u2019s Path",
            "type": "sight",
            "transportMode": "walk",
            "note": "Walk from Nanzen-ji towards Ginkaku-ji. A canal lined with hundreds of cherry trees. This is the quintessential Kyoto spring walk.",
            "status": ""
          },
          {
            "time": "13:00",
            "activity": "Lunch: Udon near Ginkaku-ji",
            "type": "food",
            "transportMode": "public",
            "note": "Omen is a famous Udon shop near the end of the path.",
            "status": ""
          },
          {
            "time": "14:30",
            "activity": "Kiyomizu-dera Temple",
            "type": "sight",
            "transportMode": "taxi",
            "note": "Travel: Take a taxi (approx. 20-30 minutes) from the Ginkaku-ji area to the bottom of the hill. View: The massive wooden stage looking over the city.",
            "status": ""
          },
          {
            "time": "16:00",
            "activity": "Sannen-zaka & Ninen-zaka",
            "type": "sight",
            "transportMode": "walk",
            "note": "Walk downhill through these preserved stone streets and continue toward Gion. Visit the Starbucks inside an old Tatami house (world's only one).",
            "status": ""
          },
          {
            "time": "16:30",
            "activity": "The 152nd Miyako Odori (Geiko Dances) (Booked)",
            "type": "sight",
            "transportMode": "public",
            "note": "Venue: Gion Kobu Kaburenjo Theatre. A cultural highlight and performance by Geiko and Maiko. (Tickets booked in advance already; no tea ceremony which requires to arrive earlier).",
            "status": "confirmed"
          },
          {
            "time": "19:00",
            "activity": "Dinner: Yakiniku Hiro (Kyoto Style)",
            "type": "food",
            "transportMode": "public",
            "note": "Order the Yukke (tartare) and varied beef cuts. Digital Art + Sakura: Nijo Castle: evento por la noche (NAKED FLOWERS) durante la temporada. Muy visual y moderno dentro del castillo. Altamente recomendado incluirlo.",
            "status": ""
          }
        ]
      },
      {
        "date": "Fri, Apr 3",
        "label": "Day 8: Deer, Buddhas & Matcha (Nara & Uji Day Trip)",
        "events": [
          {
            "time": "09:00",
            "activity": "Train to Nara",
            "type": "transport",
            "transportMode": "public",
            "note": "Take the Kintetsu Line (faster/closer to the park than JR) (aprox. 55 min). You do not need to buy train tickets from Osaka to Nara in advance for regular trains. Trains, such as the Kintetsu line from Namba or JR line from Osaka/Tennoji, run every 10\u201315 minutes, and you can simply use an IC card (Suica/Pasmo/ICOCA).",
            "status": ""
          },
          {
            "time": "10:00",
            "activity": "Nara Park",
            "type": "sight",
            "transportMode": "public",
            "note": "Activity: Buy shika-senbei (deer crackers) for \u00a5200 and bow to the free-roaming deer.",
            "status": ""
          },
          {
            "time": "11:30",
            "activity": "Todai-ji Temple (Daibutsuden)",
            "type": "sight",
            "transportMode": "public",
            "note": "Why: Largest wooden building in the world housing the Great Buddha (Daibutsu). It is awe-inspiring. Approx. \u00a5600.",
            "status": ""
          },
          {
            "time": "13:00",
            "activity": "Nakatanidou Mochi",
            "type": "food",
            "transportMode": "public",
            "note": "Watch: The famous high-speed mochi pounders. Eat a warm, green mugwort mochi.",
            "status": ""
          },
          {
            "time": "14:00",
            "activity": "Train to Uji",
            "type": "transport",
            "transportMode": "public",
            "note": "Transport: Go to JR Nara Station and take the JR Nara Line towards Kyoto. Uji is a perfect stop on the way back (approx. 30 min ride).",
            "status": ""
          },
          {
            "time": "14:45",
            "activity": "Byodo-in Temple",
            "type": "sight",
            "transportMode": "public",
            "note": "Architecture: Visit this spectacular UNESCO World Heritage Site. The Phoenix Hall is featured on the back of the Japanese \u00a510 coin. Admission: Approx. \u00a5700.",
            "status": ""
          },
          {
            "time": "16:00",
            "activity": "Uji Bridge & Matcha Shops",
            "type": "sight",
            "transportMode": "public",
            "note": "Experience: Uji is the source of Japan's best Matcha. Stroll across the ancient Uji Bridge and indulge in the local specialty\u2014matcha ice cream, parfait, or high-quality loose-leaf tea. Recommendation: Nakamura Tokichi or Tsujiri Main Shop.",
            "status": ""
          },
          {
            "time": "17:30",
            "activity": "Return to Kyoto",
            "type": "sight",
            "transportMode": "public",
            "note": "Take the JR Nara Line directly back to Kyoto Station (approx. 20 min).",
            "status": ""
          },
          {
            "time": "18:00",
            "activity": "Nishiki Market (Early Dinner/Snacks)",
            "type": "food",
            "transportMode": "public",
            "note": "The market closes around 17:30-18:00, but many restaurants inside stay open. Or head back to Pontocho for a final Kyoto drink. Task: Pack bags. We move to Osaka tomorrow.",
            "status": ""
          }
        ]
      }
    ]
  },
  {
    "title": "Part 4: Osaka (The Kitchen of Japan)",
    "subtitle": "Stay: 1 Night.",
    "dates": "",
    "area": "",
    "days": [
      {
        "date": "Sat, Apr 4",
        "label": "Day 9: Castles, Neon & Osaka's Modern View",
        "events": [
          {
            "time": "09:30",
            "activity": "Train to Osaka",
            "type": "transport",
            "transportMode": "public",
            "note": "Take the JR Special Rapid or Hankyu line. 30-45 mins.",
            "status": ""
          },
          {
            "time": "10:30",
            "activity": "Check-in",
            "type": "hotel",
            "transportMode": "public",
            "note": "\u200b\u200b\u200b\u200bHotel: Hotel Balian Resort Namba Shinsaibashi. Check in and drop bags. Ryokan: If possible, look for Kaneyoshi Ryokan (near Dotonbori) or Yamatoya Honten. If those are booked, try Onyado Nono Namba (a hotel that feels like a Ryokan with tatami floors and onsen).",
            "status": "confirmed"
          },
          {
            "time": "11:30",
            "activity": "Umeda Sky Building (Floating Garden Observatory)",
            "type": "sight",
            "transportMode": "public",
            "note": "Travel: Take the Midosuji Subway Line from Namba to Umeda Station (approx. 20-30 min total). Why: An iconic piece of modern architecture connecting two towers. The open-air deck offers a spectacular 360-degree view of the city, perfect for watching the sunset over Osaka. Tip: Aim to arrive 45 minutes before the official sunset time for the best light.",
            "status": ""
          },
          {
            "time": "14:00",
            "activity": "Osaka Castle",
            "type": "sight",
            "transportMode": "walk",
            "note": "Walk the park grounds. The castle looks majestic from the outside (the inside is a modern museum, skip if short on time).",
            "status": ""
          },
          {
            "time": "16:00",
            "activity": "Shinsekai District (Lunch)",
            "type": "food",
            "transportMode": "public",
            "note": "Eat: Kushikatsu (fried skewers) at Daruma. Vibe: Retro-futuristic, nostalgic Japan.",
            "status": ""
          },
          {
            "time": "18:00",
            "activity": "Osaka Night Free Walking Tour (2 hours)",
            "type": "walk",
            "transportMode": "public",
            "note": "Gathering: Starts under the Giant Penguin of MEGA Don Quijote Shinsekai. Booked. Experience: Uncover a different side of Japan, exploring Osaka's historic 'getto' area and its largest red-light district, delving into the hidden and shadowed aspects of Japanese society. Kuromon Market: \"Osaka's Kitchen.\" Try grilled scallops or Kobe beef bits. It is very active in the morning. We could skip Kuromon if we have already eaten a lot and focus on Shinsekai and Dotonbori, which are the true night focus of the city. The market closes early (around 18:00).",
            "status": "confirmed"
          },
          {
            "time": "20:00",
            "activity": "Dotonbori Night",
            "type": "sight",
            "transportMode": "walk",
            "note": "Activity: Walk to the canal. See the famous Glico Man sign and the giant crab/octopus signs. Dinner: This is your farewell feast. Option A (Beef): Matsusakaagyu Yakiniku M. Option B (Crab): Kani Doraku (the giant crab sign). Option C (Street Food): Takoyaki (octopus balls) and Okonomiyaki (pancakes) from a street stall.",
            "status": ""
          },
          {
            "time": "22:00",
            "activity": "Bed",
            "type": "sight",
            "transportMode": "public",
            "note": "Early start tomorrow!",
            "status": ""
          }
        ]
      },
      {
        "date": "Sun, Apr 5",
        "label": "Day 10: Sayonara",
        "events": [
          {
            "time": "06:00",
            "activity": "Checkout",
            "type": "sight",
            "transportMode": "public",
            "note": "",
            "status": ""
          },
          {
            "time": "06:30",
            "activity": "Train to KIX",
            "type": "transport",
            "transportMode": "public",
            "note": "Take the Nankai Rapi:t (from Namba) or Haruka Express (from Tennoji/Shin-Osaka). It takes ~40-50 mins.",
            "status": ""
          },
          {
            "time": "07:30",
            "activity": "Arrive Kansai Airport (KIX)",
            "type": "transport",
            "transportMode": "public",
            "note": "Check in for Air China CA162.",
            "status": ""
          },
          {
            "time": "09:05",
            "activity": "Flight Departs",
            "type": "transport",
            "transportMode": "public",
            "note": "Fly to Beijing, then connect to Madrid. Arrive in Madrid at 21:00 the same day.",
            "status": ""
          }
        ]
      }
    ]
  }
];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transport': return <Train size={18} strokeWidth={1.5} className="text-[var(--color-accent-green)]" />;
      case 'food': return <Utensils size={18} strokeWidth={1.5} className="text-[#D97706]" />;
      case 'hotel': return <Bed size={18} strokeWidth={1.5} className="text-[#7C3AED]" />;
      case 'sight': return <Camera size={18} strokeWidth={1.5} className="text-[var(--color-accent-pink)]" />;
      case 'walk': return <MapPin size={18} strokeWidth={1.5} className="text-[var(--color-accent-green)]" />;
      default: return <Info size={18} strokeWidth={1.5} />;
    }
  };

  const getGoogleMapsUrl = (event, prevEvent, part) => {
    if (!event.activity) return '#';

    const destination = encodeURIComponent(event.activity);
    let origin = '';
    let travelMode = 'transit';

    switch (event.transportMode) {
      case 'walk': travelMode = 'walking'; break;
      case 'taxi': travelMode = 'driving'; break;
      case 'public':
      case 'train':
      case 'boat':
      default:
        travelMode = 'transit';
        break;
    }

    if (prevEvent) {
      origin = encodeURIComponent(prevEvent.activity);
    } else if (part.hotel) {
      origin = encodeURIComponent(part.hotel);
    }

    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  };

  return (
    <div className="min-h-screen pb-44">
      {/* Header */}
      <header className="glass-header sticky top-0 z-[100] px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--color-accent-pink)] rounded-full flex items-center justify-center text-white text-xl shadow-inner">🌸</div>
          <div>
            <h1 className="text-base font-bold leading-none mb-1 text-[var(--color-sumi-black)] uppercase tracking-tight">Ber & Maru</h1>
            <p className="text-[10px] font-semibold text-[var(--color-sumi-gray)] uppercase tracking-[0.2em]">Japan 2026</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-accent-pink-soft)] transition-all active:scale-95 border border-[var(--color-border-light)] bg-white"
          >
            <Search size={20} className="text-[var(--color-sumi-black)]" />
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-accent-pink-soft)] transition-all active:scale-95 border border-[var(--color-border-light)] bg-white"
          >
            {isMenuOpen ? <X size={20} className="text-[var(--color-sumi-black)]" /> : <Menu size={20} className="text-[var(--color-sumi-black)]" />}
          </button>
        </div>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-white/95 backdrop-blur-md pt-24 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
          <div className="max-w-2xl mx-auto px-6 space-y-8 pb-20">
            <h2 className="text-3xl font-bold text-[var(--color-sumi-black)] mb-8">Itinerary Phases</h2>
            <div className="grid gap-4">
              {itineraryData.map((part, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePart(idx);
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`group relative w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 ${activePart === idx
                    ? 'border-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] text-[var(--color-sumi-black)]'
                    : 'border-[var(--color-border-light)] bg-white hover:border-[var(--color-accent-pink)]/30'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${activePart === idx ? 'text-[var(--color-accent-pink)]' : 'text-neutral-400'}`}>Part {idx + 1}</span>
                      <h3 className="text-xl font-bold mt-1">{part.title.split(': ')[1] || part.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1 font-medium">{part.dates}</p>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${activePart === idx ? 'bg-[var(--color-accent-pink)] text-white' : 'bg-neutral-100 text-neutral-400 group-hover:translate-x-1'}`}>
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-[var(--color-border-light)]">
              <h2 className="text-2xl font-bold text-[var(--color-sumi-black)] mb-6 font-instrument">Travel Essentials</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsVocabOpen(true)}
                  className="text-left p-6 rounded-[2rem] bg-orange-50/50 border border-orange-100 group hover:border-orange-200 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                    <Languages size={20} />
                  </div>
                  <h4 className="font-bold text-[var(--color-sumi-black)] mb-2 font-instrument italic">Vocab</h4>
                  <ul className="text-xs space-y-2 text-orange-900/60 font-medium">
                    <li>• Sumimasen</li>
                    <li>• Arigato</li>
                    <li>• Onegaishimasu</li>
                  </ul>
                </button>
                <div className="p-6 rounded-[2rem] bg-blue-50/50 border border-blue-100 group hover:border-blue-200 transition-all">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="font-bold text-[var(--color-sumi-black)] mb-2 font-instrument italic">Etiquette</h4>
                  <ul className="text-xs space-y-2 text-blue-900/60 font-medium">
                    <li>• No Tipping (Keep it!)</li>
                    <li>• Shhh on Trains</li>
                    <li>• Take Trash Home</li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-[var(--color-border-light)]">
                <h2 className="text-2xl font-bold text-[var(--color-sumi-black)] mb-6 font-instrument uppercase tracking-tight">App Settings</h2>
                <div className="bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100 italic">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[var(--color-accent-pink)]/10 rounded-lg flex items-center justify-center text-[var(--color-accent-pink)]">
                      <Settings2 size={16} />
                    </div>
                    <h4 className="font-bold text-[var(--color-sumi-black)] text-[10px] uppercase tracking-widest not-italic">Google AI Integration</h4>
                  </div>
                  <div className="space-y-4 not-italic">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em] mb-2 block ml-1">Google API Key</label>
                      <div className="flex flex-col gap-3">
                        <input
                          type="password"
                          value={googleApiKey}
                          onChange={(e) => {
                            setGoogleApiKey(e.target.value);
                            localStorage.setItem('googleApiKey', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-neutral-200 rounded-2xl py-3.5 px-5 text-xs font-mono focus:ring-2 focus:ring-[var(--color-accent-pink)] focus:border-transparent transition-all outline-none shadow-sm"
                          placeholder="AIzaSy..."
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            preGenerateAllTexts();
                          }}
                          disabled={isPreGenerating || !googleApiKey}
                          className="w-full py-3.5 bg-[var(--color-sumi-black)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isPreGenerating ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <FastForward size={14} />
                              <span>Pre-generate All Guide Texts</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-3 text-[10px] text-neutral-400 leading-relaxed ml-1 font-medium italic">
                        Required for AI Audio Guides. Your key is stored locally in your browser.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-md pt-6 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
          <div className="max-w-2xl mx-auto px-6 space-y-6 pb-20">
            <div className="flex justify-between items-center sticky top-0 bg-white/95 pt-4 pb-4 z-10">
              <div className="relative w-full mr-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  type="text"
                  placeholder="Search places, activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 border-none rounded-full py-4 pl-12 pr-4 text-[var(--color-sumi-black)] placeholder-neutral-400 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-pink)] transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-12 h-12 flex shrink-0 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <X size={20} className="text-[var(--color-sumi-black)]" />
              </button>
            </div>

            <div className="space-y-4">
              {searchQuery.length > 1 ? (
                (() => {
                  const results = [];
                  itineraryData.forEach((part, pIdx) => {
                    part.days.forEach((day, dIdx) => {
                      day.events.forEach((event, eIdx) => {
                        if (
                          event.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.note.toLowerCase().includes(searchQuery.toLowerCase())
                        ) {
                          results.push({ partIdx: pIdx, dayIdx: dIdx, eventIdx: eIdx, event, day, part });
                        }
                      });
                    });
                  });
                  if (results.length === 0) {
                    return <p className="text-center text-neutral-500 mt-10">No results found for "{searchQuery}"</p>;
                  }
                  return results.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActivePart(res.partIdx);
                        if (!expandedEventIds.includes(`${res.dayIdx}-${res.eventIdx}`)) {
                          setExpandedEventIds(prev => [...prev, `${res.dayIdx}-${res.eventIdx}`]);
                        }
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        setTimeout(() => {
                          const el = document.getElementById(`day-${res.dayIdx}-event-${res.eventIdx}`);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }, 300);
                      }}
                      className="p-4 rounded-2xl border border-[var(--color-border-light)] bg-white cursor-pointer hover:border-[var(--color-accent-pink)]/50 focus:border-[var(--color-accent-pink)] transition-all flex items-start gap-4 shadow-sm hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                        <img src={getEventTypeBanner(res.event.type, res.event.activity)} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-sumi-black)]">{res.event.activity}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] px-2 py-0.5 rounded-full tracking-wider">Part {res.partIdx + 1}</span>
                          <span className="text-xs text-neutral-500 font-medium">{res.day.date} • {res.event.time}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-center text-neutral-400 mt-10">
                  <Search size={48} className="mx-auto text-neutral-200 mb-4" />
                  <p>Type to search your itinerary...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-6 pt-10">
        <section className="mb-16 animate-in slide-in-from-bottom duration-700">
          <div className="relative p-8 rounded-[3rem] bg-white border border-[var(--color-border-light)] premium-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-pink-soft)] rounded-bl-full -z-0 opacity-50"></div>
            <div className="relative z-10 flex flex-col items-start">
              <span className="px-3 py-1 bg-[var(--color-accent-pink-soft)] text-[var(--color-accent-pink)] text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-4">
                {itineraryData[activePart].dates}
              </span>
              <h2 className="text-4xl font-bold text-[var(--color-sumi-black)] leading-[1.1] mb-2">
                {itineraryData[activePart].title}
              </h2>
              <p className="text-lg text-[var(--color-sumi-gray)] font-medium italic opacity-80">
                {itineraryData[activePart].subtitle}
              </p>
              <div className="flex items-center mt-6 space-x-2 text-[var(--color-sumi-gray)] opacity-60">
                <MapPin size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">{itineraryData[activePart].area}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="relative space-y-16">
          <div className="absolute left-[20px] top-4 bottom-4 w-px bg-[var(--color-border-light)] z-0"></div>

          {itineraryData[activePart].days.map((day, dayIdx) => (
            <section key={dayIdx} className="relative z-10">
              <div className="flex items-center mb-8 sticky top-[80px] z-20 py-4 px-6 -mx-6 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm border-b border-[var(--color-border-light)]/50 transition-all duration-300">
                <div className="w-10 h-10 bg-[var(--color-sumi-black)] text-white rounded-2xl flex items-center justify-center font-bold text-lg mr-5 shadow-lg shadow-black/10 ring-2 ring-white/10 shrink-0">
                  {day.date.split(',')[1]?.split(' ')[2] || dayIdx}
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase text-neutral-400 tracking-[0.25em] mb-0.5 leading-none font-inter">{day.date}</h3>
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-bold text-[var(--color-sumi-black)] leading-none font-instrument">{day.label}</h4>
                    {(() => {
                      const weatherKey = getWeatherKey(itineraryData[activePart].area);
                      const cityWeather = weather[weatherKey];
                      if (!cityWeather) return null;

                      // Try to find specific day forecast
                      const dayForecast = (() => {
                        if (!cityWeather.daily) return null;
                        const dayDate = new Date(day.date + ", 2026").toISOString().split('T')[0];
                        const dateIdx = cityWeather.daily.time.indexOf(dayDate);
                        if (dateIdx === -1) return null;
                        return {
                          max: cityWeather.daily.temperature_2m_max[dateIdx],
                          min: cityWeather.daily.temperature_2m_min[dateIdx]
                        };
                      })();

                      return (
                        <div className="flex items-center gap-3 px-3 py-1 bg-white/60 backdrop-blur-md rounded-xl border border-[var(--color-border-light)] shadow-sm animate-in fade-in zoom-in duration-500">
                          <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200">
                            {getWeatherIcon(cityWeather.code)}
                            <span className="text-[11px] font-extrabold text-[var(--color-sumi-black)] tabular-nums">{Math.round(cityWeather.temp)}°C</span>
                          </div>
                          {dayForecast && (
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter text-neutral-500 tabular-nums">
                              <span className="flex items-center"><span className="text-[7px] mr-0.5 opacity-50">H:</span>{Math.round(dayForecast.max)}°</span>
                              <span className="flex items-center"><span className="text-[7px] mr-0.5 opacity-50">L:</span>{Math.round(dayForecast.min)}°</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-6 ml-[20px]">
                {day.events.map((event, eventIdx) => {
                  const prevEvent = eventIdx > 0 ? day.events[eventIdx - 1] : null;
                  const mapUrl = getGoogleMapsUrl(event, prevEvent, itineraryData[activePart]);

                  return (
                    <div key={eventIdx} id={`day-${dayIdx}-event-${eventIdx}`} className="relative pl-10 group">
                      <div className="absolute left-[-4.5px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-[var(--color-border-light)] ring-4 ring-[var(--color-bg-primary)] group-hover:border-[var(--color-accent-pink)] transition-colors duration-300 z-10"></div>

                      <div
                        className={`bg-white rounded-[2rem] border border-[var(--color-border-light)] premium-shadow transition-all duration-500 cursor-pointer overflow-hidden ${expandedEventIds.includes(`${dayIdx}-${eventIdx}`) ? 'shadow-xl translate-y-[-4px] ring-2 ring-[var(--color-accent-pink)]/20' : 'hover:translate-y-[-4px] hover:shadow-lg hover:shadow-black/5'}`}
                        onClick={() => {
                          const id = `${dayIdx}-${eventIdx}`;
                          setExpandedEventIds(prev =>
                            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                          );
                        }}
                      >
                        <div className="relative h-28 sm:h-36 overflow-hidden rounded-t-[2.5rem] group cursor-pointer border-b border-[var(--color-border-light)] z-0">
                          {guideCache[event.activity] !== undefined && (
                            <div className="absolute top-4 right-4 z-20 bg-[var(--color-sumi-black)]/80 backdrop-blur-md text-white p-2 rounded-full shadow-lg border border-white/20 flex flex-col items-center justify-center animate-in zoom-in duration-300 pointer-events-none">
                              {guideCache[event.activity].audioUrl ? <Headphones size={16} className="text-[var(--color-accent-pink)]" /> : <BookOpen size={16} className="text-[var(--color-accent-pink)]" />}
                            </div>
                          )}
                          <img
                            src={getEventTypeBanner(event.type, event.activity)}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            alt={event.activity}
                            onError={(e) => {
                              const fallbackId = "1526481280693-3bfa7568e0f3";
                              if (!e.target.src.includes(fallbackId)) {
                                e.target.src = `https://images.unsplash.com/photo-${fallbackId}?auto=format&fit=crop&q=80&w=1000`;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-white/90 p-1.5 rounded-lg shadow-sm border border-white/20 text-neutral-800">
                                {getTypeIcon(event.type)}
                              </div>
                              <span className="text-white font-bold tracking-wide text-sm">{event.activity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                          <div className="w-full flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-[var(--color-accent-pink)] tabular-nums uppercase tracking-widest">{event.time}</span>
                              {event.status === 'confirmed' && (
                                <div className="px-2 py-0.5 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                                  <CheckCircle2 size={10} className="text-green-500 mr-1" />
                                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Confirmed</span>
                                </div>
                              )}
                              {event.status === 'pending' && (
                                <div className="px-2 py-0.5 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                                  <AlertCircle size={10} className="text-amber-500 mr-1" />
                                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--color-bg-primary)] text-[9px] font-bold text-neutral-500 uppercase tracking-widest border border-neutral-100 hover:border-neutral-200 transition-colors">
                                {event.transportMode === 'walk' ? <Footprints size={10} className="mr-1.5 opacity-60 text-[var(--color-accent-green)]" /> : <Train size={10} className="mr-1.5 opacity-60 text-blue-500" />}
                                {event.transportMode}
                              </span>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-sumi-gray)] rounded-full hover:bg-[var(--color-accent-pink)] hover:text-white transition-all active:scale-90 border border-[var(--color-border-light)] shrink-0"
                              >
                                <Navigation size={14} strokeWidth={2} />
                              </a>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start pb-1">
                            <div className="flex flex-col gap-3 w-full">
                              {!expandedEventIds.includes(`${dayIdx}-${eventIdx}`) ? (
                                <p className="text-sm text-[var(--color-sumi-gray)] leading-relaxed font-medium line-clamp-1 opacity-80">
                                  {event.note}
                                </p>
                              ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <NoteRenderer note={event.note} />

                                  <AudioGuide
                                    placeName={event.activity}
                                    dayContext={day.label}
                                    timeContext={event.time}
                                    apiKey={googleApiKey}
                                    cachedData={guideCache[event.activity]}
                                    onCacheUpdate={handleCacheUpdate}
                                  />
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main >

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[200]">
        <div className="bg-[var(--color-sumi-black)]/90 backdrop-blur-xl text-white rounded-[2rem] p-1.5 flex items-center justify-between shadow-2xl shadow-black/40 border border-white/10 transition-all duration-300">
          <div className="flex items-center space-x-1 p-1">
            {itineraryData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActivePart(idx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-500 ${activePart === idx
                  ? 'bg-white text-[var(--color-sumi-black)] shadow-lg scale-105'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
              >
                P{idx + 1}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/10 mx-1 sm:mx-2"></div>
          <div className="flex flex-col items-end pr-3 sm:pr-6 select-none shrink-0">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1 leading-none hidden sm:block">Converter</span>
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/10 group focus-within:border-[var(--color-accent-pink)] transition-colors">
              <span className="text-[10px] font-bold text-white/50">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={jpyAmount}
                onChange={(e) => setJpyAmount(e.target.value.replace(/\D/g, ''))}
                className="w-10 sm:w-12 bg-transparent border-none text-[10px] sm:text-xs font-bold text-white focus:outline-none focus:ring-0 p-0 tabular-nums"
              />
              <div className="h-3 w-px bg-white/10"></div>
              <span className="text-[10px] sm:text-xs font-bold text-[var(--color-accent-pink)] tabular-nums whitespace-nowrap">
                €{exchangeRate ? (parseInt(jpyAmount || 0) * exchangeRate).toFixed(jpyAmount.length > 5 ? 0 : 2) : '...'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Vocab Modal */}
      {
        isVocabOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[var(--color-sumi-black)]/40 backdrop-blur-sm" onClick={() => setIsVocabOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[var(--color-bg-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-[var(--color-border-light)] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-sumi-black)] font-instrument">Japanese Vocab</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Must-Know and Useful Phrases</p>
                </div>
                <button
                  onClick={() => setIsVocabOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border-light)] text-[var(--color-sumi-black)] hover:bg-neutral-50 transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {vocabData.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center gap-2">
                      <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                      {section.category}
                    </h4>
                    <div className="grid gap-3">
                      {section.phrases.map((phrase, pIdx) => (
                        <div key={pIdx} className="bg-white p-4 rounded-2xl border border-[var(--color-border-light)] premium-shadow group hover:border-[var(--color-accent-pink)]/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-bold text-[var(--color-sumi-black)] leading-tight">{phrase.en}</p>
                            <span className="text-[10px] font-medium text-neutral-400 italic tabular-nums">#{sIdx * 6 + pIdx + 1}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-medium text-[var(--color-sumi-gray)] opacity-60 font-mono tracking-tight">{phrase.ro}</p>
                            <p className="text-base font-bold text-[var(--color-sumi-black)] font-instrument">{phrase.jp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/50 backdrop-blur-md border-t border-[var(--color-border-light)]">
                <button
                  onClick={() => setIsVocabOpen(false)}
                  className="w-full py-4 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;
