import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

const toHindiNum = (num: number) => new Intl.NumberFormat('hi-IN').format(num);

interface DayDetails {
  tithi: string;
  tithiShort: string;
  eventShort: string | null;
  emoji: string | null;
  isHoliday: boolean;
  sunrise: string;
  sunset: string;
  shubh: string;
  rahu: string;
  events: string[];
}

const FESTIVALS_DATA: Record<number, Record<number, { name: string; isHoliday: boolean; emoji?: string }>> = {
  0: { // Jan
    14: { name: 'मकर संक्रांति', isHoliday: false, emoji: '🪁' },
    26: { name: 'गणतंत्र दिवस', isHoliday: true, emoji: '🇮🇳' }
  },
  1: { // Feb
    15: { name: 'महा शिवरात्रि', isHoliday: false, emoji: '🔱' }
  },
  2: { // Mar
    3: { name: 'होलिका दहन', isHoliday: false, emoji: '🔥' },
    4: { name: 'होली', isHoliday: true, emoji: '🎨' }
  },
  3: { // Apr
    2: { name: 'हनुमान जयंती', isHoliday: false, emoji: '🚩' },
    14: { name: 'बैसाखी', isHoliday: true, emoji: '🌾' }
  },
  7: { // Aug
    15: { name: 'स्वतंत्रता दिवस', isHoliday: true, emoji: '🇮🇳' },
    19: { name: 'रक्षा बंधन', isHoliday: false, emoji: '🏵️' },
    26: { name: 'जन्माष्टमी', isHoliday: true, emoji: '🦚' }
  },
  8: { // Sep
    14: { name: 'गणेश चतुर्थी', isHoliday: false, emoji: '🐘' }
  },
  9: { // Oct
    2: { name: 'गांधी जयंती', isHoliday: true, emoji: '🕊️' },
    19: { name: 'दशहरा', isHoliday: true, emoji: '🏹' },
    30: { name: 'धनतेरस', isHoliday: false, emoji: '🪙' }
  },
  10: { // Nov
    1: { name: 'करवा चौथ', isHoliday: false, emoji: '🌕' },
    8: { name: 'दिवाली', isHoliday: true, emoji: '🪔' },
    10: { name: 'भाई दूज', isHoliday: false, emoji: '🌺' }
  },
  11: { // Dec
    25: { name: 'क्रिसमस', isHoliday: true, emoji: '🎄' }
  }
};

const getMockDayData = (day: number, month: number, year: number): DayDetails => {
  const paksha = day <= 15 ? 'शुक्ल' : 'कृष्ण';
  const tithiNum = day <= 15 ? day : day - 15;
  const tithiShort = `${paksha.charAt(0)}. ${toHindiNum(tithiNum)}`;
  
  let tithiFull = '';
  if (tithiNum === 15 && paksha === 'शुक्ल') tithiFull = 'पूर्णिमा';
  else if (tithiNum === 15 && paksha === 'कृष्ण') tithiFull = 'अमावस्या';
  else tithiFull = `${paksha} पक्ष, तिथि ${toHindiNum(tithiNum)}`;

  const fest = FESTIVALS_DATA[month]?.[day];
  let eventShort = fest ? fest.name : null;
  let isHoliday = fest ? fest.isHoliday : false;
  let emoji = fest ? (fest.emoji || null) : null;
  let events = [];

  if (fest) {
    events.push(fest.name);
  }

  // Tithi-based mock recurring events
  if (tithiNum === 11) {
    events.push("एकादशी व्रत");
    if (!eventShort) eventShort = "एकादशी";
  } else if (tithiNum === 15 && paksha === 'कृष्ण') {
    events.push("दर्श अमावस्या");
    if (!eventShort) eventShort = "अमावस्या";
  } else if (tithiNum === 15 && paksha === 'शुक्ल') {
    events.push("सत्यनारायण पूजा");
    if (!eventShort) eventShort = "पूर्णिमा";
  } else if (day % 13 === 0) {
    events.push("प्रदोष व्रत (शिव पूजा)");
    if (!eventShort) eventShort = "प्रदोष व्रत";
  }

  return {
    tithi: tithiFull,
    tithiShort,
    eventShort,
    emoji,
    isHoliday,
    sunrise: '06:15 प्रातः',
    sunset: '06:45 सायं',
    shubh: '11:30 प्रातः - 12:15 दोपहर',
    rahu: '04:30 सायं - 06:00 सायं',
    events
  };
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);

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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day: number) => {
    const dateClicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(dateClicked);
    setSheetVisible(true);
    setLoading(true);
    setDayDetails(null);

    // Mock API Fetch (500ms delay)
    setTimeout(() => {
      const data = getMockDayData(day, currentDate.getMonth(), currentDate.getFullYear());
      setDayDetails(data);
      setLoading(false);
    }, 500);
  };

  const closeSheet = () => {
    setSheetVisible(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
              <div key={idx} className="text-center text-lg sm:text-xl text-amber-700 font-semibold pb-2 border-b-2 border-amber-500/20">
                {day}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {emptyCells.map(cell => (
              <div key={`empty-${cell}`} className="place-self-center min-h-[80px]" />
            ))}
            
            {dayCells.map(day => {
              const currentIsToday = isToday(day);
              const data = getMockDayData(day, month, year);
              
              const isSunday = new Date(year, month, day).getDay() === 0;
              const isHoliday = isSunday || data.isHoliday;

              // Render traditional panchang style cell
              return (
                <div key={day} className="flex justify-center items-center w-full min-h-[84px] sm:min-h-[90px]">
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`
                      flex flex-col items-center justify-between w-full h-full py-1.5 px-0.5
                      rounded-xl transition-all duration-200 active:scale-95
                      ${currentIsToday 
                        ? 'bg-amber-100/80 text-amber-900 shadow-md ring-2 ring-amber-500' 
                        : 'text-gray-800 hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                      }
                    `}
                  >
                    {/* Tithi Text - Small & Red for auspicious days or gray */}
                    <span className={`text-[11px] sm:text-xs leading-none text-center truncate w-full ${data.eventShort ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                      {data.tithiShort}
                    </span>

                    {/* Main English Arabic Date - Massive */}
                    <span className="relative flex items-center justify-center">
                      <span className={`text-3xl sm:text-4xl leading-tight font-bold pr-1 ${currentIsToday ? 'text-amber-700' : (isHoliday ? 'text-rose-600' : 'text-gray-900')}`}>
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
          className={`absolute inset-0 z-40 bg-gray-900/60 backdrop-blur-[2px] transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
          onClick={closeSheet}
        />

        {/* Bottom Sheet Modal */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-6 sm:p-8 pb-12 transition-transform duration-300 ease-out transform ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:mb-8" />
          
          <button onClick={closeSheet} className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100/80 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all">
            <X size={28} />
          </button>

          {selectedDate && (
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 pt-2">
              {toHindiNum(selectedDate.getDate())} {MONTHS_HI[selectedDate.getMonth()]} {toHindiNum(selectedDate.getFullYear())}
            </h2>
          )}

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
              <div className="p-4 sm:p-5 bg-amber-50 rounded-2xl border border-amber-100/50">
                <p className="text-xl sm:text-2xl text-amber-900 font-medium">
                  <span className="text-amber-600/80 mr-2 sm:mr-3">तिथि:</span> 
                  {dayDetails.tithi}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1 sm:mb-2 text-center">सूर्योदय</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{dayDetails.sunrise}</div>
                </div>
                <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1 sm:mb-2 text-center">सूर्यास्त</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{dayDetails.sunset}</div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100/50 space-y-4 sm:space-y-5">
                <div className="flex flex-col items-center">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1">शुभ मुहूर्त</div>
                  <div className="text-xl sm:text-2xl font-medium text-emerald-600 text-center">{dayDetails.shubh}</div>
                </div>
                <div className="h-px w-full bg-gray-200/60" />
                <div className="flex flex-col items-center">
                  <div className="text-gray-500 text-lg sm:text-xl mb-1">राहु काल</div>
                  <div className="text-xl sm:text-2xl font-medium text-rose-600 text-center">{dayDetails.rahu}</div>
                </div>
              </div>

              {dayDetails.events.length > 0 && (
                <div className="pt-2 space-y-3">
                  {dayDetails.events.map((event, idx) => (
                    <div key={idx} className="flex items-center px-4 sm:px-5 py-3 sm:py-4 bg-rose-50 text-rose-800 rounded-2xl text-xl sm:text-2xl font-medium border border-rose-100/50">
                      <div className="w-3 h-3 rounded-full bg-rose-500 mr-3 sm:mr-4 shadow-sm" />
                      {event}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
