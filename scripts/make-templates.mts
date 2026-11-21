// Regenerates public/templates/questions-template.{csv,xlsx}. Run: npx tsx scripts/make-templates.mts
import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { QUESTION_COLUMNS } from "../src/lib/import.ts";

const example = {
  subject: "Mathematics",
  topic: "Algebra",
  subtopic: "Linear equations",
  difficulty: "easy",
  question: "Solve $2x + 3 = 11$.",
  option_a: "3",
  option_b: "4",
  option_c: "7",
  option_d: "8",
  option_e: "",
  correct: "B",
  explanation: "1. Subtract 3 from both sides: $2x = 8$\n2. Divide both sides by 2: $x = 4$\n\n**Check:** $2(4) + 3 = 11$",
  video_url: "",
  video_free: "no",
};

writeFileSync("public/templates/questions-template.csv", Papa.unparse({ fields: [...QUESTION_COLUMNS], data: [QUESTION_COLUMNS.map((c) => example[c])] }) + "\n");

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet("questions");
ws.columns = QUESTION_COLUMNS.map((c) => ({ header: c, key: c, width: ["question", "explanation"].includes(c) ? 50 : 14 }));
ws.addRow(example);
ws.getRow(1).font = { bold: true };
ws.getRow(2).alignment = { wrapText: true, vertical: "top" };
ws.views = [{ state: "frozen", ySplit: 1 }];
const help = wb.addWorksheet("how to fill");
[
  "One row per question. Keep the headings in row 1 exactly as they are.",
  "subject / topic / subtopic must match the syllabus. Leave subtopic blank for questions on the whole topic.",
  "difficulty: easy, medium or hard.",
  "option_a … option_e: fill from A with no gaps. 2 to 5 options.",
  "correct: the letter of the right option (A–E).",
  "explanation: REQUIRED. Full step-by-step working in simple English. Use new lines for steps.",
  "Maths: write formulas between dollar signs, e.g. $x^2 + 3x = 0$ or $\\frac{1}{2}$.",
  "video_url: a YouTube link (optional). video_free: yes = free students can watch it as a sample.",
  "Only the first sheet is imported.",
].forEach((t) => help.addRow([t]));
help.getColumn(1).width = 110;
await wb.xlsx.writeFile("public/templates/questions-template.xlsx");
console.log("templates written");
