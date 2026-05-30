import * as hp from "panchang-ts";

const toHindiNum = (num: number) => new Intl.NumberFormat("hi-IN").format(num);

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

const getAccuratePanchangData = (day: number, month: number, year: number): any => {
  const date = new Date(year, month, day);
  const location = { latitude: 28.6139, longitude: 77.2090 }; // Delhi
  const options = { timezone: 'Asia/Kolkata', language: 'hi' as any };

  const p = hp.getDailyPanchang(date, location, options);
  const festivals = hp.getFestivalsInRange(date, new Date(year, month, day + 1), location, options)
    .filter(f => f.date.getDate() === day);

  let specialMuhurats: string[] = [];

  for (const f of festivals) {
    if (f.festival.name) {
      const fName = f.festival.name;

      if (fName.includes('दिवाली') || fName.includes('दीपावली')) {
        if (p.sunset) {
          const pradoshStart = p.sunset as unknown as Date;
          const pradoshEnd = new Date(pradoshStart.getTime() + 144 * 60000);
          specialMuhurats.push(`लक्ष्मी पूजा मुहूर्त: ${formatHPMuhuratTime(pradoshStart)} - ${formatHPMuhuratTime(pradoshEnd)} (प्रदोष काल)`);
        }
      } else if (fName.includes('रक्षा बंधन')) {
        let rhMuhurat = 'सूर्यास्त तक';
        if (p.bhadra && p.bhadra.isActive && p.bhadra.end) {
          rhMuhurat = `${formatHPMuhuratTime(p.bhadra.end as any)} के बाद (भद्रा समाप्ति)`;
        }
        specialMuhurats.push(`राखी बाँधने का मुहूर्त: ${rhMuhurat}`);
      }
    }
  }

  if (p.eclipse) {
    const isSolar = p.eclipse.kind === 'solar';
    specialMuhurats.push(`${isSolar ? 'सूर्य' : 'चंद्र'} ग्रहण: ${formatHPMuhuratTime(p.eclipse.start as any)} - ${formatHPMuhuratTime(p.eclipse.end as any)}`);
  }
  return {
    specialMuhurats,
    events: festivals.map(f => f.festival.name)
  };
};

console.log('Rakshabandhan:', getAccuratePanchangData(28, 7, 2026));
console.log('Diwali:', getAccuratePanchangData(8, 10, 2026));
