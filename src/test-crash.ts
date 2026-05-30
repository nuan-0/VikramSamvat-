import * as hp from "panchang-ts";

const date = new Date(2026, 7, 28);
const location = { latitude: 28.6139, longitude: 77.2090 };
const options = { timezone: 'Asia/Kolkata', language: 'hi' as any };

try {
  const p = hp.getDailyPanchang(date, location, options);
  console.log('sunrise type:', typeof p.sunrise, p.sunrise);
  console.log('bhadra:', p.bhadra);
  console.log('p.rahuKalam:', typeof p.rahuKalam.start);
} catch (e) {
  console.error(e);
}
