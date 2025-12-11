
import { GoogleGenAI } from "@google/genai";
import { ConsoleLog, NetworkLog } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeError = async (log: ConsoleLog): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are a senior frontend engineer. Analyze the following console error and provide a concise explanation and a potential fix.
      
      Error Level: ${log.method}
      Timestamp: ${new Date(log.timestamp).toISOString()}
      Messages: ${JSON.stringify(log.args)}
      Stack Trace: ${log.stack || 'Not available'}

      Format the output as Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Failed to analyze error. Please check your API key.";
  }
};

export const analyzeNetworkFailure = async (req: NetworkLog): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are a senior frontend engineer. Analyze the following failed network request and explain why it might have happened.

      URL: ${req.url}
      Method: ${req.method}
      Status: ${req.status}
      Duration: ${req.durationMs}ms
      Request Body: ${JSON.stringify(req.request?.body || {})}
      Response Body: ${JSON.stringify(req.response?.body || req.response?.bodyTextSnippet || {})}

      Format the output as Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Failed to analyze network request.";
  }
};