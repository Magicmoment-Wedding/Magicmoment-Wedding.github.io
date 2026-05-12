import { getPresetPromptIntent } from "./prompt-intents.js";

export function buildParisEiffelPrompt({ analysisMeta, ratioLabel, customText }) {
  const intent = getPresetPromptIntent("paris_eiffel");
  const prompt = [
    "Edit the provided wedding photo with precision.",
    intent.join(" "),
    "Do not replace faces.",
    "Do not distort hands, bouquet, body proportions, or the original composition.",
    `Preserve the framing for a ${ratioLabel} output.`,
    `Reference analysis: ${JSON.stringify(analysisMeta)}`,
    customText ? `Additional direction: ${customText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  console.log("[prompt] built for paris_eiffel", {
    presetKey: "paris_eiffel",
    promptIntent: intent,
    ratioLabel,
    customText,
  });

  return prompt;
}
