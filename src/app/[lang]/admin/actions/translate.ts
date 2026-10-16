"use server";

export interface TranslationInput {
  [key: string]: string | undefined;
}

const MODEL_NAME = "gemini-3.6-flash";

async function fetchGeminiWithRetry(
  url: string,
  body: unknown,
  maxRetries = 3,
): Promise<Response> {
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Si responde 200 o es un error de cliente definitivo (400, 401, 403), retornamos de inmediato
    if (response.ok || (response.status !== 503 && response.status !== 429)) {
      return response;
    }

    // Reintento con espera exponencial en caso de 503 (saturación temporal) o 429
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // 1s -> 2s -> 4s
    } else {
      return response;
    }
  }

  throw new Error("Límite de reintentos alcanzado.");
}

export async function autoTranslateAction(
  fields: TranslationInput,
  targetLang: "en" | "fr" = "en",
): Promise<{
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "GEMINI_API_KEY no configurada en las variables de entorno (.env).",
      };
    }

    const activeEntries = Object.entries(fields).filter(
      ([_, value]) => value && value.trim().length > 0,
    );

    if (activeEntries.length === 0) {
      return {
        success: false,
        error: "No hay textos en español para traducir.",
      };
    }

    const payloadToTranslate = Object.fromEntries(activeEntries);

    const systemPrompt = `You are an elite editorial architectural translator specialized in high-end natural stones (marble, quartzite, travertine), haute bespoke ateliers, and contemporary interior architecture. 
Translate the provided JSON values from Spanish to ${targetLang === "en" ? "English" : targetLang}. 
Maintain an architectural, elegant, minimalist, and poetic editorial tone (like Architectural Digest or El Croquis). 
Keep technical stone/quarry terms precise (e.g., 'acabado al corte', 'veteado', 'libro/bookmatch', 'maquinado').
Return strictly a valid JSON object matching the exact keys provided. Do not include markdown codeblocks, backticks, or any additional text.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nTranslate this JSON:\n${JSON.stringify(payloadToTranslate)}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const response = await fetchGeminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      requestBody,
      3,
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Error Gemini API (${response.status}): ${errText}`,
      };
    }

    const jsonRes = await response.json();
    let rawContent = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawContent) {
      return { success: false, error: "No se recibió respuesta del modelo." };
    }

    if (rawContent.startsWith("```")) {
      rawContent = rawContent
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const translatedObj = JSON.parse(rawContent);
    return { success: true, data: translatedObj };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error inesperado al traducir.";
    return { success: false, error: message };
  }
}
