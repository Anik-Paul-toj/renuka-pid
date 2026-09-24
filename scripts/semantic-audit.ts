import { masterclassData } from "../data/content";
import * as fs from "fs";
import * as path from "path";

const dbFilePath = path.resolve(process.cwd(), "db_landing_content.json");
const dbData = JSON.parse(fs.readFileSync(dbFilePath, "utf-8"));
const dbMap = new Map<string, any>();
for (const item of dbData) {
  dbMap.set(item.section_key, item.content_json);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

const canonicalSections = [
  "brand",
  "hero",
  "stats",
  "trustSection",
  "aboutArtist",
  "targetAudience",
  "videoSection",
  "transformation",
  "methodFramework",
  "coreSecrets",
  "outcomes",
  "instructorStory",
  "bonuses",
  "fitCheck",
  "included",
  "faqs",
  "finalCta",
  "footer",
];

console.log("=== SEMANTIC CONTENT AUDIT (Ignoring JSON Key Order) ===\n");

let matches = 0;
let differences = 0;

for (const sec of canonicalSections) {
  const fe = (masterclassData as any)[sec];
  const db = dbMap.get(sec);

  if (!db) {
    console.log(`❌ [MISSING IN DB] ${sec}`);
    differences++;
    continue;
  }

  if (deepEqual(fe, db)) {
    console.log(`✅ [EXACT SEMANTIC MATCH] ${sec}`);
    matches++;
  } else {
    console.log(`⚠️ [VALUE DIFFERENCE] ${sec}`);
    differences++;
    if (typeof fe === "object" && !Array.isArray(fe)) {
      for (const k of Object.keys(fe)) {
        if (!deepEqual(fe[k], db[k])) {
          console.log(`    Field '${k}':`);
          console.log(`      Frontend: ${JSON.stringify(fe[k])}`);
          console.log(`      Database: ${JSON.stringify(db[k])}`);
        }
      }
    } else if (Array.isArray(fe)) {
      for (let i = 0; i < Math.max(fe.length, db.length); i++) {
        if (!deepEqual(fe[i], db[i])) {
          console.log(`    Index [${i}]:`);
          console.log(`      Frontend: ${JSON.stringify(fe[i])}`);
          console.log(`      Database: ${JSON.stringify(db[i])}`);
        }
      }
    }
  }
}

console.log(`\nResults: ${matches} Matched, ${differences} Different`);
