// services/aiService.js
// Handles AI generation using Google Gemini API

import { GoogleGenerativeAI } from "@google/generative-ai";
import WritingSample from "../models/WritingSample.js";
import { buildPrompt } from "../utils/promptBuilder.js";

let genAI = null;

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_gemini_api_key")) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add your Gemini API key to backend/.env and restart the backend."
    );
  }

  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

const looksLikeStructuredEmail = (text) => {
  const t = String(text || "");
  return /(^|\n)Subject:\s*/i.test(t) && /(^|\n)Greeting:\s*/i.test(t) && /(^|\n)Body:\s*/i.test(t) && /(^|\n)Closing:\s*/i.test(t);
};

const enforceEmailStructure = async (model, text) => {
  if (looksLikeStructuredEmail(text)) return text.trim();

  const formattingPrompt = `Format the following content as an email using EXACTLY these headings on separate lines:
Subject:
Greeting:
Body:
Closing:

Content:
${text}

Return ONLY the final formatted email with those headings.`;

  const result = await model.generateContent(formattingPrompt);
  const formatted = result.response.text();
  if (!formatted || formatted.trim() === "") return text.trim();
  return formatted.trim();
};

/**
 * Generates a reply mimicking the user's writing style
 * @param {string} userId - The authenticated user's ID
 * @param {string} inputMessage - The message to reply to
 * @param {string} tone - The requested tone for generation
 * @returns {string} - AI-generated reply text
 */
const generateReply = async (userId, userPrompt, tone, contentType = "general") => {
  // Step 1: Fetch user's writing samples from DB
  const allSamples = await WritingSample.find({ userId }).sort({ createdAt: -1 });

  if (allSamples.length === 0) {
    throw new Error("No writing samples found. Please add some writing samples on your Profile page first.");
  }

  // Step 2: Filter samples by requested tone, fallback to all samples
  let filteredSamples = allSamples.filter((s) => s.tone === tone);

  // If not enough tone-matched samples, include all
  if (filteredSamples.length < 2) {
    filteredSamples = allSamples;
  }

  // Step 3: Limit to top 5 most recent samples for context window efficiency
  const topSamples = filteredSamples.slice(0, 5);

  // Step 4: Build the prompt using promptBuilder utility
  const prompt = buildPrompt(topSamples, userPrompt, tone, contentType);

  // Step 5: Call Gemini API
  try {
    const genAiClient = getGenAI();
      // The @google/generative-ai SDK uses the Gemini API (historically v1beta).
      // Some model IDs are not available on that endpoint for some keys/projects.
      const modelName = (process.env.GEMINI_MODEL || "gemini-pro").trim();
      const model = genAiClient.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    if (!response || response.trim() === "") {
      throw new Error("Gemini returned an empty response.");
    }

    const normalizedType = String(contentType || "general").toLowerCase();
    if (normalizedType === "email") {
      return await enforceEmailStructure(model, response);
    }

    return response.trim();
  } catch (geminiError) {
    console.error("Gemini API error:", geminiError.message);
      const rawMessage = geminiError?.message || String(geminiError);
      console.error("Gemini API error:", rawMessage);

      // Common actionable case: model not found / not supported on v1beta.
      const looksLikeModelNotSupported =
        /404|not found|not supported|v1beta/i.test(rawMessage);
      if (looksLikeModelNotSupported) {
        const modelName = (process.env.GEMINI_MODEL || "gemini-pro").trim();
        throw new Error(
          "AI generation failed: The configured Gemini model isn't available for this API/client. " +
            `Current GEMINI_MODEL=${modelName}. ` +
            "Try setting GEMINI_MODEL in backend/.env to `gemini-pro` and restart the backend. " +
            `Provider message: ${rawMessage}`
        );
      }

      throw new Error(`AI generation failed: ${rawMessage}`);
  }
};

const rewriteText = async (originalText, tone) => {
  const prompt = `You are an expert editor.
Rewrite the following text in a ${tone} tone.
Keep meaning same, improve clarity, and polish it.

Text:
${originalText}

Return only the rewritten version.`;

  const genAiClient = getGenAI();
  const modelName = (process.env.GEMINI_MODEL || "gemini-pro").trim();
  const model = genAiClient.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  if (!response || response.trim() === "") throw new Error("Gemini returned an empty response.");
  return response.trim();
};

const analyzeText = async (text) => {
  const prompt = `You are a writing evaluator.

Analyze the following text:

${text}

Return:
* Professionalism score (out of 10)
* Clarity score (out of 10)
* Tone description (1-2 words)
* 2 concise suggestions for improvement

Return the response in structured JSON format, with exactly these keys:
professionalism, clarity, tone, suggestions

Do not wrap in markdown. Return only JSON.`;

  const genAiClient = getGenAI();
  const modelName = (process.env.GEMINI_MODEL || "gemini-pro").trim();
  const model = genAiClient.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  if (!raw || raw.trim() === "") throw new Error("Gemini returned an empty response.");

  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting first JSON object if there's extra text.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Analysis parsing failed: model did not return valid JSON.");
  }
};

const improveText = async (originalText, suggestions) => {
  const suggestionsText = Array.isArray(suggestions)
    ? suggestions.map((s) => `- ${s}`).join("\n")
    : String(suggestions || "");

  const prompt = `You are an expert editor.

Improve the following text using these suggestions:

Text:
${originalText}

Suggestions:
${suggestionsText}

Requirements:
* Keep original intent
* Improve clarity and professionalism
* Apply suggestions effectively

Return only the improved version.`;

  const genAiClient = getGenAI();
  const modelName = (process.env.GEMINI_MODEL || "gemini-pro").trim();
  const model = genAiClient.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  if (!response || response.trim() === "") throw new Error("Gemini returned an empty response.");
  return response.trim();
};

export { generateReply, rewriteText, analyzeText, improveText };
