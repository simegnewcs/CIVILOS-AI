import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log("Trying generateImages with imagen-3.0-generate-001");
  try {
    const res1 = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'A red apple',
    });
    console.log("Success 1");
  } catch (e) {
    console.log("Fail 1:", e.message);
  }

  console.log("Trying generateContent with imagen-3.0-generate-001");
  try {
    const res2 = await ai.models.generateContent({
      model: 'imagen-3.0-generate-001',
      contents: 'A red apple',
    });
    console.log("Success 2:", Object.keys(res2));
    console.log("Response text:", res2.text);
    console.log("Parts:", JSON.stringify(res2.candidates?.[0]?.content?.parts));
  } catch (e) {
    console.log("Fail 2:", e.message);
  }
}
run();
