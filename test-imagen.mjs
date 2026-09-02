import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const models = [
    'imagen-3.0-generate-001',
    'imagen-3.0-generate-002',
    'imagen-3.0-fast-generate-001'
  ];

  for (const m of models) {
    console.log("-----------------------");
    console.log("Trying generateImages with", m);
    try {
      const res = await ai.models.generateImages({
        model: m,
        prompt: 'A red apple',
        config: { outputMimeType: "image/jpeg", aspectRatio: "1:1", numberOfImages: 1 }
      });
      console.log("Success with generateImages! bytes:", res.generatedImages?.[0]?.image?.imageBytes?.length);
    } catch (e) {
      console.log("Fail generateImages:", e.message);
    }

    console.log("Trying generateContent with", m);
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'A red apple',
      });
      console.log("Success with generateContent!");
    } catch (e) {
      console.log("Fail generateContent:", e.message);
    }
  }
}
run();
