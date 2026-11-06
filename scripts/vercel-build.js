// Vercel 배포 때 실행: 환경 변수 GOOGLE_MAPS_API_KEY 로 js/keys.js 를 만든다.
// (키를 GitHub 저장소에 두지 않기 위해)
const fs = require("fs");
const path = require("path");

const key = (process.env.GOOGLE_MAPS_API_KEY || "").trim();
const file = path.join(__dirname, "..", "js", "keys.js");
fs.writeFileSync(file, "export const API_KEY = " + JSON.stringify(key) + ";\n");
console.log(key ? "js/keys.js 생성 (구글 지도 키 있음)" : "⚠ GOOGLE_MAPS_API_KEY 없음 → 간이 지도로 배포");
