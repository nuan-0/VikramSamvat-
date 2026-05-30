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

const date = new Date(2026, 10, 8); // Nov 8
const location = { latitude: 28.6139, longitude: 77.2090 };
const options = { timezone: 'Asia/Kolkata', language: 'hi' as any };

const p = hp.getDailyPanchang(date, location, options);
const festivals = hp.getFestivalsInRange(date, new Date(2026, 10, 9), location, options)
  .filter(f => f.date.getDate() === 8);

let specialMuhurats: string[] = [];
for (const f of festivals) {
  if (f.festival.name) {
    const fName = f.festival.name;
    if (fName.includes('दिवाली') || fName.includes('दीपावली')) {
      if (p.sunset) {
        const pradoshStart = p.sunset as unknown as Date;
        const pradoshEnd = new Date(pradoshStart.getTime() + 144 * 60000);
        specialMuhurats.push(`लक्ष्मी पूजा मुहूर्त: ${formatHPMuhuratTime(pradoshStart)} - ${formatHPMuhuratTime(pradoshEnd)}`);
      }
    }
  }
}
console.log('Festivals:', festivals.map(f => f.festival.name));
console.log('specialMuhurats:', specialMuhurats);
