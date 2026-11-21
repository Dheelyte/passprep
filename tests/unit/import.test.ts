import { describe, expect, it } from "vitest";
import { markInFileDuplicates, parseCsv, questionRow, syllabusRow, validateRows, missingColumns, QUESTION_COLUMNS } from "@/lib/import";

const header = QUESTION_COLUMNS.join(",");
const good = `Mathematics,Algebra,Linear equations,easy,"Solve $2x + 3 = 11$",2,4,6,8,,B,"Subtract 3: $2x = 8$. Divide by 2: $x = 4$.",https://youtu.be/dQw4w9WgXcQ,yes`;

describe("question import validation", () => {
  it("accepts a good row and maps options/correct index", () => {
    const rows = parseCsv(`${header}\n${good}`);
    expect(missingColumns(rows, QUESTION_COLUMNS)).toEqual([]);
    const [r] = validateRows(rows, questionRow);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.options).toEqual(["2", "4", "6", "8"]);
      expect(r.data.correctIndex).toBe(1);
      expect(r.data.videoFree).toBe(true);
      expect(r.data.difficulty).toBe("EASY");
    }
  });

  it("reports every problem on a bad row with its line number", () => {
    const bad = `Mathematics,Algebra,,impossible,Hi,1,,3,,,E,short,https://vimeo.com/1,no`;
    const [r] = validateRows(parseCsv(`${header}\n${bad}`), questionRow);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.line).toBe(2);
      const msg = r.errors.join(" | ");
      expect(msg).toMatch(/difficulty/);
      expect(msg).toMatch(/too short/);
      expect(msg).toMatch(/explanation/);
    }
  });

  it("catches gaps, missing correct option text and bad video links", () => {
    const row = `Mathematics,Algebra,,medium,"What is 2+2?",3,,4,,,D,"Two plus two is four.",https://vimeo.com/1,`;
    const [r] = validateRows(parseCsv(`${header}\n${row}`), questionRow);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const msg = r.errors.join(" | ");
      expect(msg).toMatch(/no gaps/);
      expect(msg).toMatch(/correct answer D/);
      expect(msg).toMatch(/YouTube/);
    }
  });

  it("flags duplicates inside a file", () => {
    const res = markInFileDuplicates(validateRows(parseCsv(`${header}\n${good}\n${good}`), questionRow));
    expect(res[0].ok).toBe(true);
    expect(res[1].ok).toBe(false);
  });

  it("detects missing columns", () => {
    expect(missingColumns(parseCsv("subject,topic\nA,B"), QUESTION_COLUMNS)).toContain("question");
  });
});

describe("syllabus import validation", () => {
  it("parses lists of class levels and exams", () => {
    const [r] = validateRows(parseCsv("subject,topic,subtopic,order,class_levels,exams\nMathematics,Algebra,,1,\"SS 1, SS2\",WAEC;neco"), syllabusRow);
    expect(r.ok && r.data).toMatchObject({ class_levels: ["SS1", "SS2"], exams: ["WAEC", "NECO"], order: 1 });
  });
  it("rejects unknown exams", () => {
    const [r] = validateRows(parseCsv("subject,topic,subtopic,order,class_levels,exams\nMathematics,Algebra,,1,SS1,GCE"), syllabusRow);
    expect(r.ok).toBe(false);
  });
});
