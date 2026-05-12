import { getSourceImage } from "../mock/sources.js";
import { buildGrokAgentInstruction } from "./grok-instruction.js";

export async function analyzePresetImage(state) {
  const sourceImage = getSourceImage(state.sourceImageId);

  return {
    source: "grok_direct_instruction",
    imageUrl: sourceImage.url,
    preset_intent: state.selectedPresetId,
    instruction: buildGrokAgentInstruction(state.selectedPresetId),
  };
}
