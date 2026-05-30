import * as hp from "panchang-ts";
let failed = 0;
for(let m = 0; m < 12; m++) {
  const days = new Date(2026, m+1, 0).getDate();
  for(let d = 1; d <= days; d++) {
    try {
      hp.getDailyPanchang(new Date(2026, m, d), { latitude: 28.6139, longitude: 77.2090 }, { timezone: 'Asia/Kolkata', language: 'hi' as any });
      hp.getFestivalsInRange(new Date(2026, m, d), new Date(2026, m, d + 1), { latitude: 28.6139, longitude: 77.2090 }, { timezone: 'Asia/Kolkata', language: 'hi' as any });
    } catch(e: any) {
      failed++;
      console.error(`Failed on 2026-${m+1}-${d}:`, e.message);
    }
  }
}
console.log('Total failed:', failed);
