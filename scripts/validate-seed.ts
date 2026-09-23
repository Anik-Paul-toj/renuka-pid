import { masterclassData, workshopData } from "../data/content";
import { sectionSchemaMap } from "../lib/validations/cms";

function validateExistingContent() {
  console.log("Starting Section-Specific Zod Validation on existing content.ts...\n");

  let errorCount = 0;
  let successCount = 0;

  for (const [key, schema] of Object.entries(sectionSchemaMap)) {
    try {
      const sectionData = masterclassData[key as keyof typeof masterclassData];
      if (sectionData === undefined) {
        console.error(`❌ Section [${key}] is missing in masterclassData!`);
        errorCount++;
        continue;
      }

      const result = schema.safeParse(sectionData);
      if (result.success) {
        console.log(`✅ Section [${key}] validated successfully.`);
        successCount++;
      } else {
        console.error(`❌ Section [${key}] failed Zod validation:`, result.error.format());
        errorCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error validating [${key}]:`, err);
      errorCount++;
    }
  }

  // Validate workshopData fields
  if (workshopData.originalPrice > 0 && workshopData.offerPrice > 0 && workshopData.date) {
    console.log(`✅ Workshop Data validated (₹${workshopData.offerPrice} offer / ₹${workshopData.originalPrice} original).`);
    successCount++;
  } else {
    console.error("❌ Workshop data has invalid pricing or missing date!");
    errorCount++;
  }

  console.log(`\n========================================`);
  console.log(`Validation Summary: ${successCount} Passed, ${errorCount} Errors`);
  console.log(`========================================\n`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

validateExistingContent();
