import { GoogleGenAI, Type } from "@google/genai";
import { UIVariant } from "../types.ts";

export async function generateUIVariants(prompt: string): Promise<UIVariant[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are Anqair, a master UI/UX designer and world-class frontend engineer. 
    Your mission is to generate THREE radically distinct, production-ready UI components for the user's prompt.

    **STRICT IP SAFEGUARD:**
    - Do NOT use specific artist or brand names.
    - Focus on "Physicality" and "Material Logic".

    **VISUAL ARCHITECTURE RULES:**
    1. **Materiality**: Every design choice must stem from a physical metaphor (Tactile Risograph, Spectral Diffusion, or Functionalist Grid).
    2. **Typography**: Use high-quality web fonts (Inter, Geist, or system-ui).
    3. **Tailwind Only**: Output clean, accessible Tailwind CSS. Ensure components are responsive and fully contained.

    **OUTPUT FORMAT:**
    Return a JSON array of exactly 3 objects. 
    Each object must have:
    - 'label': A short, evocative persona name.
    - 'html': The raw HTML string with Tailwind classes.
    - 'description': A one-sentence explanation of the design direction.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 UI variations for: ${prompt}`,
      config: {
        systemInstruction,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              html: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["label", "html", "description"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("The AI model returned an empty response.");
    }
    
    const parsedData = JSON.parse(jsonText.trim());
    
    return parsedData.map((v: any, i: number) => ({
      ...v,
      id: `variant-${Date.now()}-${i}`
    }));
  } catch (error) {
    console.error("Anqair Generation Error:", error);
    throw error;
  }
}