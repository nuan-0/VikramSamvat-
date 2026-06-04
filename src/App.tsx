import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, ArrowLeft } from "lucide-react";
import * as hp from "panchang-ts";

const MONTHS_HI = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

const toHindiNum = (num: number) => new Intl.NumberFormat("hi-IN").format(num);

interface DayDetails {
  tithi: string;
  tithiShort: string;
  hinduMonth: string;
  eventShort: string | null;
  emoji: string | null;
  isHoliday: boolean;
  sunrise: string;
  sunset: string;
  shubh: string;
  rahu: string;
  events: string[];
  specialMuhurats: string[];
}

const formatHPMuhuratTime = (d: Date | null) => {
  if (!d) return '--';
  let h = d.getUTCHours();
  let m = d.getUTCMinutes();
  let ampm = h >= 12 ? 'दोपहर/सायं' : 'प्रातः';
  if (h >= 17) ampm = 'सायं';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getAccuratePanchangData = (day: number, month: number, year: number): DayDetails => {
  const date = new Date(year, month, day);
  const location = { latitude: 28.6139, longitude: 77.2090 }; // Delhi
  const options = { timezone: 'Asia/Kolkata', language: 'hi' as any };

  const p = hp.getDailyPanchang(date, location, options);
  const festivals = hp.getFestivalsInRange(date, new Date(year, month, day + 1), location, options)
    .filter(f => f.date.getDate() === day);

  const tithiObj = p.tithis[0];
  const tithiShort = `${tithiObj.paksha.charAt(0)}. ${toHindiNum(tithiObj.index)}`;
  
  const tithiFull = `${tithiObj.paksha} पक्ष, ${tithiObj.name}`;
  const monthName = p.chandramasa?.purnimantaName || "";
  const isAdhika = p.chandramasa?.isAdhika ? "अधिक " : "";
  const hinduMonth = monthName ? `${isAdhika}${monthName} मास` : "";

  let eventShort = null;
  let emoji = null;
  let isHoliday = false;
  let events: string[] = [];
  let specialMuhurats: string[] = [];

  for (const f of festivals) {
    if (f.festival.name) {
      events.push(f.festival.name);
      if (!eventShort) eventShort = f.festival.name;
      
      const fName = f.festival.name;

      if (fName.includes('दिवाली') || fName.includes('दीपावली') || fName.includes('धनतेरस')) {
        emoji = '🪔';
        if (p.sunset) {
          const pradoshStart = p.sunset as unknown as Date;
          const pradoshEnd = new Date(pradoshStart.getTime() + 144 * 60000); // 144 mins
          specialMuhurats.push(`लक्ष्मी पूजा / प्रदोष काल मुहूर्त: ${formatHPMuhuratTime(pradoshStart)} - ${formatHPMuhuratTime(pradoshEnd)}`);
        }
      } else if (fName.includes('रक्षा बंधन')) {
        emoji = '🏵️';
        let rhMuhurat = 'सूर्यास्त तक';
        if (p.bhadra && p.bhadra.isActive && p.bhadra.end) {
          rhMuhurat = `${formatHPMuhuratTime(p.bhadra.end as any)} के बाद (भद्रा समाप्ति)`;
        }
        specialMuhurats.push(`राखी बाँधने का मुहूर्त: ${rhMuhurat}`);
      } else if (fName.includes('करवा चौथ')) {
        emoji = '🌙';
        if (p.moonrise) {
          specialMuhurats.push(`चन्द्रोदय समय: ${formatHPMuhuratTime(p.moonrise as any)}`);
        }
      } else if (fName.includes('मकर संक्रांति')) {
         emoji = '☀️';
         specialMuhurats.push(`पुण्य काल: प्रातः काल से`);
      } else if (fName.includes('नवरात्रि') || fName.includes('घटस्थापना')) {
        emoji = '🌺';
        if (p.abhijitMuhurta) {
           specialMuhurats.push(`घटस्थापना / अभिजित मुहूर्त: ${formatHPMuhuratTime(p.abhijitMuhurta.start as any)} - ${formatHPMuhuratTime(p.abhijitMuhurta.end as any)}`);
        }
      } else if (fName.includes('होलिका दहन')) {
        emoji = '🔥';
        if (p.sunset) {
          const pStart = p.sunset as unknown as Date;
          const pEnd = new Date(pStart.getTime() + 144 * 60000);
          specialMuhurats.push(`होलिका दहन मुहूर्त: ${formatHPMuhuratTime(pStart)} - ${formatHPMuhuratTime(pEnd)}`);
        }
      } else if (fName.includes('होली')) {
        emoji = '🎨';
      } else if (fName.includes('शिवरात्रि')) {
        emoji = '🔱';
        if (p.nishitaMuhurta) {
          specialMuhurats.push(`महा शिवरात्रि पूजा (निशिता काल): ${formatHPMuhuratTime(p.nishitaMuhurta.start as any)} - ${formatHPMuhuratTime(p.nishitaMuhurta.end as any)}`);
        }
      } else if (fName.includes('गणेश')) {
        emoji = '🐘';
        if (p.madhyahna) {
          specialMuhurats.push(`मध्याह्न गणेश पूजा: ${formatHPMuhuratTime(p.madhyahna.start as any)} - ${formatHPMuhuratTime(p.madhyahna.end as any)}`);
        }
      } else if (fName.includes('कृष्ण') || fName.includes('जन्माष्टमी')) {
        emoji = '🦚';
        if (p.nishitaMuhurta) {
          specialMuhurats.push(`निशिता काल पूजा: ${formatHPMuhuratTime(p.nishitaMuhurta.start as any)} - ${formatHPMuhuratTime(p.nishitaMuhurta.end as any)}`);
        }
      } else if (fName.includes('बुद्ध')) emoji = '☸️';
      else if (fName.includes('राम')) emoji = '🏹';

      if (f.festival.type === 'eclipse') {
        if (!emoji) emoji = fName.includes('सूर्य') ? '🌘' : '🌕';
      }

      if (f.festival.type === 'major' || fName.includes('पूर्णिमा') || fName.includes('अमावस्या')) {
        isHoliday = true;
      }
    }
  }

  if (p.eclipse) {
    const isSolar = p.eclipse.kind === 'solar';
    specialMuhurats.push(`${isSolar ? 'सूर्य' : 'चंद्र'} ग्रहण: ${formatHPMuhuratTime(p.eclipse.start as any)} - ${formatHPMuhuratTime(p.eclipse.end as any)}`);
    if (p.eclipse.sutakStart) {
      specialMuhurats.push(`सूतक काल आरम्भ: ${formatHPMuhuratTime(p.eclipse.sutakStart as any)} से`);
    }
  }

  // Tithi-based mock recurring events matching
  if (events.length === 0) {
     if (tithiObj.index === 11) {
       events.push("एकादशी");
       eventShort = "एकादशी";
     } else if (tithiObj.index === 15 || tithiObj.index === 30) {
       events.push(tithiObj.name);
       eventShort = tithiObj.name;
     }
  }

  let finalShubh = p.abhijitMuhurta 
    ? `${formatHPMuhuratTime(p.abhijitMuhurta.start as any)} - ${formatHPMuhuratTime(p.abhijitMuhurta.end as any)}`
    : `(अभिजित मुहूर्त नहीं)`;

  if (!p.abhijitMuhurta && p.choghadiya?.day) {
      const shubhSlot = p.choghadiya.day.find(x => x.qualityName === 'शुभ' || x.quality === 'auspicious');
      if (shubhSlot) {
        finalShubh = `${formatHPMuhuratTime(shubhSlot.start as any)} - ${formatHPMuhuratTime(shubhSlot.end as any)}`;
      }
  }

  return {
    tithi: tithiFull,
    tithiShort,
    hinduMonth,
    eventShort,
    emoji,
    isHoliday,
    sunrise: formatHPMuhuratTime(p.sunrise),
    sunset: formatHPMuhuratTime(p.sunset),
    shubh: finalShubh,
    rahu: `${formatHPMuhuratTime(p.rahuKalam.start as any)} - ${formatHPMuhuratTime(p.rahuKalam.end as any)}`,
    events,
    specialMuhurats,
  };
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  
  const [cache, setCache] = useState<Record<string, DayDetails>>(() => {
    try {
      const saved = localStorage.getItem('panchang-cache-v2');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
  });
  
  // Persist cache to localStorage
  useEffect(() => {
    try {
      const keys = Object.keys(cache);
      // Limit localstorage size to 3 months (~90 days) to prevent quota issues
      if (keys.length > 95) {
         // Keep only the most recent month or current view
         const trimmed: Record<string, DayDetails> = {};
         for (let i = Math.max(0, keys.length - 35); i < keys.length; i++) {
            trimmed[keys[i]] = cache[keys[i]];
         }
         localStorage.setItem('panchang-cache-v2', JSON.stringify(trimmed));
      } else {
         localStorage.setItem('panchang-cache-v2', JSON.stringify(cache));
      }
    } catch(e) {}
  }, [cache]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    let active = true;
    const keyPrefix = `${year}-${month}`;
    
    // Check if we need to load anything for this month
    // We only use the initial cache state here to decide if we need to run
    let missing = false;
    for (let day = 1; day <= daysInMonth; day++) {
        if (!cache[`${keyPrefix}-${day}`]) {
            missing = true;
            break;
        }
    }
    if (!missing) return;

    setLoadingMonth(true);
    
    const computeMonth = async () => {
      // Loop through all days in month
      for (let day = 1; day <= daysInMonth; day++) {
          if (!active) return;
          // Look up from local closure first, to avoid redundant calc if already done
          // (Initial cache check doesn't update, but we do catch it inside setCache)
          try {
            let shouldCalculate = true;
            setCache(c => {
               if (c[`${keyPrefix}-${day}`]) shouldCalculate = false;
               return c;
            });
            if (!shouldCalculate) continue;

            const dayData = getAccuratePanchangData(day, month, year);
            if (active) {
              setCache(prev => {
                // Double check it wasn't populated already, then add it
                if (prev[`${keyPrefix}-${day}`]) return prev;
                return { ...prev, [`${keyPrefix}-${day}`]: dayData };
              });
            }
          } catch (e) {
            console.error(`Error on day ${day}:`, e);
            // Put a fallback mock data so it doesn't stay skeleton forever
            if (active) {
               setCache(prev => ({ 
                 ...prev, 
                 [`${keyPrefix}-${day}`]: {
                    tithi: 'त्रुटि', tithiShort: '', hinduMonth: '', eventShort: null, emoji: null,
                    isHoliday: false, sunrise: '--', sunset: '--', shubh: '--', rahu: '--',
                    events: [], specialMuhurats: []
                 } 
               }));
            }
          }
          // Yield to main thread every day so UI isn't blocked and frames can render
          await new Promise(r => setTimeout(r, 0));
      }
      if (active) {
         setLoadingMonth(false);
      }
    };
    
    computeMonth();

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, daysInMonth]);

  useEffect(() => {
    // Initialize Telegram Web App if available
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDateClick = async (day: number) => {
    const dateClicked = new Date(year, month, day);
    setSelectedDate(dateClicked);
    setSheetVisible(true);
    
    const key = `${year}-${month}-${day}`;
    if (cache[key]) {
      setDayDetails(cache[key]);
      setLoading(false);
    } else {
      setLoading(true);
      setDayDetails(null);
      setTimeout(() => {
        setDayDetails(getAccuratePanchangData(day, month, year));
        setLoading(false);
      }, 50);
    }
  };

  const closeSheet = () => {
    setSheetVisible(false);
  };

  const today = new Date();
  const isToday = (d: number) =>
    today.getDate() === d &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-neutral-100 text-gray-900 font-sans selection:bg-amber-200">
      <div className="w-full max-w-md mx-auto bg-white min-h-[100dvh] sm:min-h-[850px] sm:my-8 sm:rounded-[2.5rem] sm:shadow-2xl relative overflow-hidden flex flex-col sm:border sm:border-gray-200 ring-1 ring-gray-900/5">
        {/* Header Navigation */}
        <header className="flex items-center justify-between px-4 py-6 border-b border-gray-100 bg-white z-10">
          <button
            onClick={handlePrevMonth}
            className="text-xl sm:text-2xl font-medium text-amber-600 hover:text-amber-700 active:scale-95 transition-transform px-3 py-2"
          >
            पिछला
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {MONTHS_HI[month]} {year}
          </h1>

          <button
            onClick={handleNextMonth}
            className="text-xl sm:text-2xl font-medium text-amber-600 hover:text-amber-700 active:scale-95 transition-transform px-3 py-2"
          >
            अगला
          </button>
        </header>

        {/* Calendar Grid */}
        <div className="px-2 py-4 sm:py-6 flex-1 bg-white">
          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS_HI.map((day, idx) => (
              <div
                key={idx}
                className="text-center text-lg sm:text-xl text-amber-700 font-semibold pb-2 border-b-2 border-amber-500/20"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {emptyCells.map((cell) => (
              <div
                key={`empty-${cell}`}
                className="place-self-center min-h-[80px]"
              />
            ))}

            {dayCells.map((day) => {
              const currentIsToday = isToday(day);
              const data = cache[`${year}-${month}-${day}`];

              if (!data) {
                return (
                 <div
                   key={day}
                   className="flex justify-center items-center w-full min-h-[84px] sm:min-h-[90px] animate-pulse bg-gray-50/50 rounded-xl"
                 />
                );
              }

              const isSunday = new Date(year, month, day).getDay() === 0;
              const isHoliday = isSunday || data.isHoliday;

              // Render traditional panchang style cell
              return (
                <div
                  key={day}
                  className="flex justify-center items-center w-full min-h-[84px] sm:min-h-[90px]"
                >
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`
                      flex flex-col items-center justify-between w-full h-full py-1.5 px-0.5
                      rounded-xl transition-all duration-200 active:scale-95
                      ${
                        currentIsToday
                          ? "bg-amber-100/80 text-amber-900 shadow-md ring-2 ring-amber-500"
                          : isHoliday
                            ? "bg-rose-50/70 hover:bg-rose-100 border border-rose-100 hover:border-rose-200"
                            : "text-gray-800 hover:bg-gray-50 border border-gray-100 hover:border-gray-200"
                      }
                    `}
                  >
                    {/* Tithi Text - Small & Red for auspicious days or gray */}
                    <span
                      className={`text-[11px] sm:text-xs leading-none text-center truncate w-full ${data.eventShort ? "text-rose-600 font-medium" : "text-gray-500"}`}
                    >
                      {data.tithiShort}
                    </span>

                    {/* Main English Arabic Date - Massive */}
                    <span className="relative flex items-center justify-center">
                      <span
                        className={`text-3xl sm:text-4xl leading-tight font-bold pr-1 ${currentIsToday ? "text-amber-700" : isHoliday ? "text-rose-600" : "text-gray-900"}`}
                      >
                        {day}
                      </span>
                      {data.emoji && (
                        <span className="text-sm sm:text-base drop-shadow-sm ml-0.5">
                          {data.emoji}
                        </span>
                      )}
                    </span>

                    {/* Event text underneath (like traditional panchang) */}
                    <div className="h-4 w-full flex items-center justify-center">
                      {data.eventShort ? (
                        <span className="text-[10px] sm:text-[11px] leading-tight text-center truncate w-full px-0.5 text-rose-700 font-bold bg-rose-100 lg:bg-transparent rounded-sm">
                          {data.eventShort}
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] text-gray-400">
                          {toHindiNum(day)}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Sheet Backdrop */}
        <div
          className={`fixed lg:absolute inset-0 z-40 bg-gray-900/60 backdrop-blur-[2px] transition-opacity duration-300 ${sheetVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={closeSheet}
        />

        {/* Bottom Sheet Modal */}
        <div
          className={`fixed lg:absolute bottom-0 inset-x-0 mx-auto w-full max-w-[420px] z-50 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] lg:max-h-[90%] transition-transform duration-300 ease-out transform ${sheetVisible ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Drag Handle */}
          <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

          {/* Fixed Header */}
          <div className="flex justify-between items-start px-6 sm:px-8 mt-2 mb-4 shrink-0">
            <div className="flex flex-col gap-1 items-start">
              <button onClick={closeSheet} className="flex items-center text-amber-700 font-medium hover:text-amber-800 -ml-2 p-1.5 rounded-lg w-fit active:scale-95 transition-all lg:hidden">
                 <ArrowLeft size={20} className="mr-1.5" />
                 <span>वापस</span>
              </button>
              {selectedDate && (
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 lg:mt-2">
                  {toHindiNum(selectedDate.getDate())}{" "}
                  {MONTHS_HI[selectedDate.getMonth()]}{" "}
                  {toHindiNum(selectedDate.getFullYear())}
                </h2>
              )}
            </div>
            <button
              onClick={closeSheet}
              className="p-2.5 rounded-full bg-gray-100/80 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all shrink-0 ml-4 hidden lg:block mt-1"
            >
              <X size={28} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 sm:px-8 pb-12 overflow-y-auto overscroll-contain flex-1">

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-gray-100/80 rounded-2xl w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-28 bg-gray-100/80 rounded-2xl w-full" />
                <div className="h-28 bg-gray-100/80 rounded-2xl w-full" />
              </div>
              <div className="h-28 bg-gray-100/80 rounded-2xl w-full" />
              <p className="text-2xl text-amber-600 font-medium text-center mt-8">
                जानकारी लोड हो रही...
              </p>
            </div>
          ) : dayDetails ? (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 sm:p-5 bg-amber-50 rounded-2xl border border-amber-100/50 flex flex-col gap-1.5">
                {dayDetails.hinduMonth && (
                  <p className="text-lg sm:text-xl text-amber-900 font-medium flex">
                    <span className="text-amber-600/80 w-16 shrink-0 inline-block font-medium">मास:</span>
                    <span>{dayDetails.hinduMonth}</span>
                  </p>
                )}
                <p className="text-lg sm:text-xl text-amber-900 font-medium flex">
                  <span className="text-amber-600/80 w-16 shrink-0 inline-block font-medium">तिथि:</span>
                  <span>{dayDetails.tithi}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1 sm:mb-2 text-center">
                    सूर्योदय
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                    {dayDetails.sunrise}
                  </div>
                </div>
                <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1 sm:mb-2 text-center">
                    सूर्यास्त
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                    {dayDetails.sunset}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50 space-y-4 sm:space-y-5">
                <div className="flex flex-col items-center">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1">
                    शुभ मुहूर्त
                  </div>
                  <div className="text-xl sm:text-2xl font-medium text-emerald-600 text-center">
                    {dayDetails.shubh}
                  </div>
                </div>
                <div className="h-px w-full bg-gray-200/60" />
                <div className="flex flex-col items-center">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1">
                    राहु काल
                  </div>
                  <div className="text-xl sm:text-2xl font-medium text-rose-600 text-center">
                    {dayDetails.rahu}
                  </div>
                </div>
              </div>

              {dayDetails.events.length > 0 && (
                <div className="pt-2 space-y-3">
                  {dayDetails.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center px-4 sm:px-5 py-3 sm:py-4 bg-rose-50 text-rose-800 rounded-2xl text-xl sm:text-2xl font-medium border border-rose-100/50"
                    >
                      <div className="w-3 h-3 rounded-full bg-rose-500 mr-3 sm:mr-4 shadow-sm" />
                      {event}
                    </div>
                  ))}
                </div>
              )}

              {dayDetails.specialMuhurats.length > 0 && (
                <div className="pt-2 space-y-3">
                  <div className="text-gray-500 font-semibold mb-2">विशेष मुहूर्त एवं समय:</div>
                  {dayDetails.specialMuhurats.map((muh, idx) => (
                    <div
                      key={idx}
                      className="flex items-center px-4 sm:px-5 py-3 sm:py-4 bg-indigo-50 text-indigo-900 rounded-2xl text-lg sm:text-xl font-medium border border-indigo-100/50"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3 shadow-sm" />
                      {muh}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
