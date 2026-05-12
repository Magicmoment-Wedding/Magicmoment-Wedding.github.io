const PARIS_AGENT_INSTRUCTION = `
Edit this photo into a natural Paris Eiffel Tower snap.

Keep the original people exactly the same.

Priority:
1. Preserve the original faces and identities exactly.
2. Preserve eye shape, facial expression, hairstyle, hair color, skin tone, and overall facial impression.
3. Preserve the original pose, hand position, body position, camera angle, framing, and composition.
4. Preserve visible clothing and all visible props exactly.
5. Preserve occlusions. Do not invent hidden hands, hidden fingers, hidden eyes, hidden shoes, or hidden facial parts.

Background rule:
- Replace only the background with a realistic Eiffel Tower setting.
- Keep the background change natural and moderate.
- Allow only slight variation in Eiffel Tower distance, terrace angle, surrounding scenery, and lighting.
- Do not restyle the people.
- Do not regenerate the people.
- Do not beautify them into different-looking people.

Blending:
- Match lighting, shadows, perspective, and color tone naturally.
- Keep the result realistic and photo-natural.

Important:
- Face preservation is more important than background accuracy.
- If there is any conflict, reduce the background transformation strength.
- Keep the final result subtle, natural, and realistic.
`.trim();

const DISNEY_AGENT_INSTRUCTION = `
Edit this photo in a subtle live-action Cinderella-inspired style.

Keep the original people exactly the same.

Priority:
1. Preserve the original faces and identities exactly.
2. Preserve eye shape, facial expression, hairstyle, hair color, skin tone, and overall facial impression.
3. Preserve the original pose, hand position, body position, camera angle, framing, and composition.
4. Preserve visible clothing and all visible props unless the styling naturally updates them.
5. Preserve occlusions. Do not invent hidden hands, hidden fingers, hidden eyes, hidden shoes, or hidden facial parts.

Styling rule:
- Apply the Cinderella-inspired feeling mainly through dress detailing, accessories, lighting, color tone, and subtle fairytale elegance.
- Keep the edit natural and moderate, not overly theatrical.
- Do not turn the people into different-looking characters.
- Do not over-smooth or blur the face.
- Do not fully reimagine the whole scene.

Glass slipper rule:
- Only apply glass-slipper-inspired shoe styling if shoes or feet are already clearly visible in the original photo.
- If shoes or feet are not visible, do not create glass slippers.
- Do not add shoes as props.
- Do not place glass slippers in the hand or elsewhere if they are not naturally visible.

Background rule:
- Keep the original background and composition mostly unchanged unless a mild styling enhancement is needed.
- Do not replace the scene with a palace or a fully different fantasy environment unless explicitly requested.
- Keep the result grounded in the original photo.

Blending:
- Match lighting, shadows, perspective, and color tone naturally.
- Keep the result realistic, soft, and photo-natural.

Important:
- Face preservation is more important than styling accuracy.
- If there is any conflict, reduce the styling strength.
- Keep the final result subtle, natural, and realistic.
`.trim();

export function buildGrokAgentInstruction(presetKey = "paris_eiffel") {
  return presetKey === "fairytale_royal_wedding" || presetKey === "disneyLive"
    ? DISNEY_AGENT_INSTRUCTION
    : PARIS_AGENT_INSTRUCTION;
}
