import { masterclassData, workshopData } from "../data/content";
import * as fs from "fs";
import * as path from "path";

interface DBRecord {
  section_key: string;
  status: string;
  version: number;
  content_json: any;
}

const dbFilePath = path.resolve(process.cwd(), "db_landing_content.json");
if (!fs.existsSync(dbFilePath)) {
  console.error("Missing db_landing_content.json. Please generate it first.");
  process.exit(1);
}

const dbData: DBRecord[] = JSON.parse(fs.readFileSync(dbFilePath, "utf-8"));
const dbMap = new Map<string, any>();
for (const item of dbData) {
  dbMap.set(item.section_key, item.content_json);
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

console.log("=====================================================================");
console.log("  PHASE 7 RESTART — STEP 1: CONTENT AUDIT & FIELD PARITY ANALYSIS");
console.log("=====================================================================\n");

let matchesCount = 0;
let mismatchCount = 0;
const auditReport: any[] = [];

for (const sectionKey of canonicalSections) {
  const feValue = (masterclassData as any)[sectionKey];
  const dbValue = dbMap.get(sectionKey);

  if (dbValue === undefined) {
    console.log(`❌ [SECTION MISSING IN DB] ${sectionKey}`);
    mismatchCount++;
    auditReport.push({
      sectionKey,
      status: "MISSING_IN_DB",
      mismatches: ["Section not found in Supabase landing_content"],
    });
    continue;
  }

  const feStr = JSON.stringify(feValue);
  const dbStr = JSON.stringify(dbValue);

  if (feStr === dbStr) {
    console.log(`✅ [100% PARITY] ${sectionKey}`);
    matchesCount++;
    auditReport.push({
      sectionKey,
      status: "EXACT_MATCH",
      mismatches: [],
    });
  } else {
    console.log(`⚠️ [MISMATCH DETECTED] ${sectionKey}`);
    mismatchCount++;
    const mismatches: string[] = [];

    if (typeof feValue === "object" && !Array.isArray(feValue)) {
      const allKeys = Array.from(new Set([...Object.keys(feValue || {}), ...Object.keys(dbValue || {})]));
      for (const k of allKeys) {
        const fVal = feValue?.[k];
        const dVal = dbValue?.[k];
        if (JSON.stringify(fVal) !== JSON.stringify(dVal)) {
          mismatches.push(`Field '${k}': Frontend="${JSON.stringify(fVal)}" vs DB="${JSON.stringify(dVal)}"`);
        }
      }
    } else if (Array.isArray(feValue)) {
      if (feValue.length !== dbValue.length) {
        mismatches.push(`Array Length: Frontend=${feValue.length} items vs DB=${dbValue.length} items`);
      }
      for (let i = 0; i < Math.max(feValue.length, dbValue.length); i++) {
        if (JSON.stringify(feValue[i]) !== JSON.stringify(dbValue[i])) {
          mismatches.push(`Item [${i}]: Frontend=${JSON.stringify(feValue[i])} vs DB=${JSON.stringify(dbValue[i])}`);
        }
      }
    }

    auditReport.push({
      sectionKey,
      status: "MISMATCH",
      mismatches,
    });
  }
}

console.log("\n=====================================================================");
console.log(`  AUDIT SUMMARY: ${matchesCount} Sections Identical, ${mismatchCount} Mismatched`);
console.log("=====================================================================\n");

fs.writeFileSync("audit_summary.json", JSON.stringify(auditReport, null, 2));
console.log("Detailed audit report saved to audit_summary.json");
