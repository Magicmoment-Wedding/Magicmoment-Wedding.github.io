import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import crypto from "crypto";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const GENERATE_COUNT = 4;
const XAI_PROVIDER = "xai";
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || "grok-imagine-image";
const XAI_SELECTION_MODEL = process.env.XAI_SELECTION_MODEL || process.env.XAI_VISION_MODEL || "grok-4.3";
const XAI_ACCOUNT_TIER = process.env.XAI_ACCOUNT_TIER || process.env.XAI_BILLING_TIER || "unknown";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
const DISNEY_QUALITY_GATE_MAX_ATTEMPTS = 2;
const GENERATION_MODES = {
  PARIS_SNAP: "parisSnap",
  DISNEY_LIVE: "disneyLive",
};
const GENERATION_MODE_ALIASES = {
  parissnap: GENERATION_MODES.PARIS_SNAP,
  paris: GENERATION_MODES.PARIS_SNAP,
  pariseiffel: GENERATION_MODES.PARIS_SNAP,
  eiffel: GENERATION_MODES.PARIS_SNAP,
  europe: GENERATION_MODES.PARIS_SNAP,
  european: GENERATION_MODES.PARIS_SNAP,
  europesnap: GENERATION_MODES.PARIS_SNAP,
  "유럽명소스냅": GENERATION_MODES.PARIS_SNAP,
  "파리에펠탑": GENERATION_MODES.PARIS_SNAP,
  disneylive: GENERATION_MODES.DISNEY_LIVE,
  disney: GENERATION_MODES.DISNEY_LIVE,
  liveactiondisney: GENERATION_MODES.DISNEY_LIVE,
  disneyliveaction: GENERATION_MODES.DISNEY_LIVE,
  fairytaleroyalwedding: GENERATION_MODES.DISNEY_LIVE,
  "디즈니실사": GENERATION_MODES.DISNEY_LIVE,
};
const XAI_MAX_PROMPT_LENGTH = 7600;
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
Edit the uploaded photo into a subtle Disney-inspired live-action wedding styling while keeping the original subject(s), face, pose, expression, and composition intact.

Shared common base rules for all four Disney slots:
- Apply exactly the same generation quality standard to Cinderella, Belle, Aurora, and Mulan.
- Use the same face identity preservation strength for all four slots.
- Use the same pose, hand position, body angle, camera viewpoint, framing, and composition preservation strength for all four slots.
- Use the same photorealistic quality, sharpness, face-detail, and detail-preservation standard for all four slots.
- Preserve original face identity, face proportions, eyes, nose, mouth, smile, skin tone, hairline, and facial texture detail.
- Preserve skin texture and facial detail; avoid blurred faces, smeared features, low-resolution face detail, waxy skin, and detail loss.
- Do not redesign the face.
- Keep the original face exactly unchanged.
- Do not beautify the face.
- Do not make the person look younger, prettier, slimmer, or more doll-like.
- Do not alter facial identity.
- Do not change face shape, eye size, nose shape, mouth shape, jawline, cheekbones, or smile.
- Preserve the original facial expression exactly.
- Preserve the original skin tone naturally.
- Keep the original face identity exactly.
- Preserve eyes, nose, mouth, facial proportions, and expression.
- Keep the original hairstyle and hair color unless explicitly required otherwise.
- Do not invent new facial structure.
- Do not make the face more cartoonish.
- Keep the original scene's basic spatial feeling, realistic lighting, and wedding-photo realism.
- Concept differences should come from wardrobe, color palette, background mood, props, decor, accessories, and atmosphere only.

Highest priority:
- First priority: preserve the original face as much as possible.
- Second priority: keep pose, hand position, body angle, framing, camera angle, composition, and body placement unchanged.
- Third priority: preserve hair, body impression, age impression, skin tone, hairline, and the natural real-person mood.
- Fourth priority: apply gentle character-specific Disney live-action styling through wardrobe details, color palette, background mood, props, accessories, lighting, and atmosphere.
- Fifth priority: communicate the character concept subtly.
- Preserve the original identity extremely strongly for every visible person.
- For a couple photo, preserve the male face and female face separately; each person must look like their own original self.
- Keep the subject(s) clearly recognizable as the same real people.
- Maintain each person's original facial structure, face shape, eye shape, nose shape, mouth shape, smile, expression impression, gender-specific impression, natural age impression, hairstyle, hair color, and overall likeness.
- Preserve occluded parts naturally. Do not invent hidden fingers, hidden facial parts, or hidden body parts.

Allowed flattering refinement:
- Allow only extremely weak skin cleanup and extremely weak natural editorial polish.
- Do not over-beautify, glamorize, or change the subject(s) into someone else.
- Avoid AI handsome/beautiful standardization, face shape changes, eye size changes, nose redesign, mouth redesign, excessive skin smoothing, exaggerated beauty filters, cartoon-like facial rendering, character-face transformation, or AI-doll face.
- Do not reinterpret the nose, mouth, jaw, cheeks, eye size, or face proportions.

Transformation strength:
- Use subtle-to-moderate concept expression for wardrobe, background mood, color, accessories, and lighting while keeping face, expression, pose, and composition stable.
- Make the Disney transformation happen only through wardrobe color/detail changes, character-specific background mood, props, accessories, hair ornaments, lighting, and cinematic atmosphere.
- Do not use face alteration as the main way to communicate the concept.
- Keep the face natural and extremely close to the source photo.
- If there is a tradeoff, reduce Disney transformation rather than changing the face.
- The final image should still clearly be the original wedding photo with gentle Disney-inspired styling.
- Avoid full scene replacement or a newly generated photo look.
- If the result looks like a different person, different pose, or different location structure, it is a failed result.

Transformation priority:
1. Face, pose, and composition preservation
2. Original expression, eyes, nose, mouth, facial proportions, hairstyle, and hair color preservation
3. Gentle character-specific concept differentiation
4. Subtle-to-moderate costume adaptation
5. Lighting, color, and mood
6. Background mood, small props, hair ornaments, and character accents

Styling:
- Apply subtle-to-moderate costume adaptation.
- Keep the original wedding dress, tuxedo, suit, or outfit silhouette and overall impression as much as possible.
- Add character-inspired color, fabric detail, embroidery, soft sparkle, or accessory accents without turning it into a full cosplay costume.
- Keep the body pose, hand position, and outfit fit consistent with the source photo.

Background:
- Keep the original background structure while adding a gentle Disney-inspired background mood for the locked character concept.
- Avoid full scene replacement.
- Preserve the basic space type and layout: sofa stays sofa, window stays window, indoor stays indoor, outdoor stays outdoor.
- Add character-specific atmosphere through practical-set style decor, color grading, lighting, flowers, fabric, books, chandeliers, garden details, architectural hints, or traditional accents as appropriate for the slot.
- The background should remain a believable photorealistic wedding photo setting, not a cartoon, not an illustration, not a painted animation background.
- Use practical-set realism, natural depth of field, real architecture, real plants, real texture, and movie still lighting only where it fits the original scene.
- Avoid over-saturated colors, flat illustrated scenery, toy-like props, CGI-cartoon backgrounds, and animation-style castles.
- Do not rebuild the scene so strongly that it feels like a newly generated fantasy image.
- Do not make all four backgrounds or moods look the same.

Accessories and hair styling:
- Add subtle but visible princess-like accessories.
- Examples: floral hair accents, elegant earrings, delicate necklace details, soft royal styling elements.
- Accessories should support the concept, not overpower the face.

Lighting and mood:
- Use cinematic soft lighting with fairy-tale atmosphere.
- Add warm glow, gentle bloom, graceful highlights, romantic softness, and a premium live-action fantasy mood.
- Keep the result photorealistic, elegant, and not cartoonish.
- Keep every result live-action, cinematic, photo-real, and grounded in a natural environment.

Important balance:
- The desired result is the original wedding photo with clearly differentiated Disney-inspired wardrobe, accessories, color, light, and background mood naturally applied.
- The goal is the original subject(s) wearing Disney-inspired styling, not different people generated in a Disney concept.
- Face identity is more important than concept strength.
- If there is any conflict, prioritize face preservation over costume/background styling.
- Express the Disney-inspired concept through wardrobe, set design, props, lighting, and color mood.
- Original pose, hand position, composition, camera angle, and background structure are more important than concept strength.
- Costume and background mood changes should be visible, character-specific, photorealistic, and natural.
- If any visible face looks like a different person, it is also a failed result.
- If preserving the face conflicts with a character concept, preserve the face and weaken the character concept.
- Generate four clearly different Disney-inspired concepts, but keep all four recognizable as edits of the original wedding photo.
`.trim();
const LOCATION_VARIANTS = {
  paris_eiffel: [
    {
      label: "Eiffel Tower riverside",
      instruction: "Use a stable Eiffel Tower riverside background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower garden-side",
      instruction: "Use a stable Eiffel Tower garden-side background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower promenade",
      instruction: "Use a stable Eiffel Tower promenade background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower terrace",
      instruction: "Use a stable Eiffel Tower terrace background. Keep the people, pose, crop, and camera angle unchanged.",
    },
  ],
  default: [
    {
      label: "Eiffel Tower riverside",
      instruction: "Use a stable Eiffel Tower riverside background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower garden-side",
      instruction: "Use a stable Eiffel Tower garden-side background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower promenade",
      instruction: "Use a stable Eiffel Tower promenade background. Keep the people, pose, crop, and camera angle unchanged.",
    },
    {
      label: "Eiffel Tower terrace",
      instruction: "Use a stable Eiffel Tower terrace background. Keep the people, pose, crop, and camera angle unchanged.",
    },
  ],
};
const DISNEY_STYLE_VARIANTS = [
  {
    id: "cinderella",
    title: "Cinderella Royal — Cinderella",
    label: "Cinderella Royal — Cinderella",
    instruction: "Slot 1 locked concept: Cinderella Royal — Cinderella. Gentle concept anchors: pastel blue, silver, and white as the wardrobe and mood palette; subtle crystal sparkle; glass-like highlights; clean premium royal atmosphere. Wardrobe anchor: a blue Cinderella-inspired dress or prince-like formal tailoring adapted to the original wedding outfit silhouette, without changing the body, face, expression, or camera angle. Preserve face identity, eyes, nose, mouth, facial proportions, expression, hairstyle, hair color, pose, hands, body angle, gaze direction, framing, and composition exactly. Keep the original camera angle and natural shooting perspective; do not recompose into a straight-on front-facing portrait. Background change must stay softer than identity preservation: keep the original background structure and add only photorealistic luxury interior cues such as subtle chandelier light, marble texture, crystal highlights, or elegant European interior styling. Avoid cartoon fantasy palace, painted castle, overbuilt staircase scene, or fully replaced background. This slot should read as Cinderella through outfit/color/luxury interior mood while still looking like the original photo and original person.",
  },
  {
    id: "belle",
    title: "Belle Romantic — Beauty and the Beast",
    label: "Belle Romantic — Beauty and the Beast",
    instruction: "Slot 2 locked concept: Belle Romantic — Beauty and the Beast. Gentle concept anchors: gold, warm yellow, amber, and bronze as wardrobe and mood accents; warm romantic glow; refined live-action film mood; classic European interior hints such as library shelves, books, chandelier, candlelit hall, or golden palace-room decor. Wardrobe anchor: Belle-inspired yellow/gold styling adapted to the original wedding outfit silhouette, without changing the subject's face, expression, or body impression. Preserve face identity, eyes, nose, mouth, facial proportions, expression, hairstyle, hair color, pose, hands, body angle, camera angle, framing, and composition exactly. Keep the original spatial layout recognizable. This slot should read as Belle through wardrobe color, set design, props, lighting, and color mood, not through facial redesign. Avoid Cinderella blue/silver crystal mood completely. Do not use Aurora's pink/lavender floral softness or Mulan's East Asian hanbok/traditional architecture mood.",
  },
  {
    id: "aurora",
    title: "Aurora Enchanted — Sleeping Beauty",
    label: "Aurora Enchanted — Sleeping Beauty",
    instruction: "Slot 3 locked concept: Aurora Enchanted — Sleeping Beauty. Gentle concept anchors: pink, rose, lavender, and soft gold as wardrobe and mood accents; dreamy sunlight; soft romantic floral mood; garden, flowers, blossoms, airy palace garden, or gentle natural-light setting. Wardrobe anchor: Aurora-inspired pink styling adapted to the original wedding outfit silhouette, without changing the subject's face, expression, or body impression. Preserve face identity, eyes, nose, mouth, facial proportions, expression, pose, hands, body angle, camera angle, framing, and composition exactly. Hair color must remain the original dark/black or original tone; do not make the subject blonde, lighter-haired, or fantasy-colored. Preserve the original hairstyle as much as possible, allowing only slight princess-like tidying or soft accessories. Express Aurora through dress, palette, lighting, flowers, and background mood, not through changing hair color or facial structure. Keep the original spatial layout recognizable. Avoid Cinderella blue/silver crystal mood and Belle gold/amber library mood. Do not use Mulan's East Asian hanbok/traditional architecture mood.",
  },
  {
    id: "mulan",
    title: "Mulan Oriental Hanbok — Mulan",
    label: "Mulan Oriental Hanbok — Mulan",
    instruction: "Slot 4 locked concept: Mulan Oriental Hanbok — Mulan. Gentle concept anchors: deep red, jade green, rose pink, and traditional gold as wardrobe and mood accents; calm East Asian elegance; realistic East Asian garden, tiled roof, wooden architecture, pond, blossoms, traditional decor, or oriental courtyard mood. Wardrobe anchor: the woman's outfit must be a latest-style luxury Korean hanbok for wedding/editorial photos, clearly Korean hanbok, elegant modern bridal hanbok, refined jeogori and chima silhouette, premium fabric, graceful color blocking, subtle gold details, and not a Chinese traditional outfit. Avoid qipao, cheongsam, hanfu, Chinese armor, Chinese imperial robe, or historical drama costume heaviness. A man may have East Asian formal styling. Preserve face identity, eyes, nose, mouth, facial proportions, expression, hairstyle, hair color, pose, hands, body angle, camera angle, framing, and composition exactly. Keep the original spatial layout recognizable. This slot should read as modern luxury Korean hanbok Mulan through wardrobe, color, props, and live-action background mood, not through facial redesign.",
  },
];
const DISNEY_COMMON_QUALITY_STANDARD = `
Common quality standard for every Disney slot:
- All four slots must use the same generation pipeline, same requested resolution behavior, same sharpness target, same face detail preservation, same face identity strength, same pose preservation strength, and same photorealistic quality bar.
- Do not let one slot become high quality but face-drifted while another slot is identity-preserved but blurry.
- Preserve original face identity, face proportions, eye shape, nose shape, mouth shape, smile, skin tone, hairline, hairstyle, and facial texture detail equally across all slots.
- Do not redesign the face, invent a new facial structure, change expression, enlarge eyes, reshape the nose or mouth, slim the jaw, or make the face cartoonish.
- Do not beautify the face or make the person look younger, prettier, slimmer, or more doll-like.
- Preserve original face shape, eye size, nose shape, mouth shape, jawline, cheekbones, smile, expression, and natural skin tone.
- Express Disney-inspired character identity only through wardrobe, set design, props, lighting, and color mood.
- Preserve pose, hand position, body direction, camera viewpoint, framing, and composition equally across all slots.
- Reject visual outcomes with blurry eyes, smeared nose or mouth detail, broken skin texture, low-resolution facial detail, waxy over-smoothing, or a different-person face.
- Concept overlay may differ by slot only in wardrobe, palette, background mood, props, decorations, accessories, and atmosphere.
`.trim();

const uploadDir = path.join(__dirname, "uploads");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.join(__dirname, "..")));
app.use(express.json({ limit: "80mb" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "code.html"));
});

const upload = multer({
  dest: tempDir,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

function cleanupFiles(filePaths) {
  setTimeout(() => {
    for (const filePath of filePaths) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🧹 임시 파일 삭제 완료:", filePath);
        }
      } catch (error) {
        console.error("⚠️ 임시 파일 삭제 실패:", error.message);
      }
    }
  }, 5000);
}

function getMimeType(file) {
  return file?.mimetype || "image/png";
}

function fileToDataUrl(filePath, mimeType) {
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function getUploadExtension(file) {
  const originalExtension = path.extname(file?.originalname || "").toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  if (file?.mimetype === "image/jpeg") return ".jpg";
  if (file?.mimetype === "image/webp") return ".webp";

  return ".png";
}

function copyUploadToPublicUrl(filePath, file) {
  const fileName = `source_${Date.now()}_${Math.round(Math.random() * 1e6)}${getUploadExtension(file)}`;
  const publicFilePath = path.join(uploadDir, fileName);
  const localImageUrl = `/uploads/${fileName}`;

  fs.copyFileSync(filePath, publicFilePath);

  return {
    publicFilePath,
    imageUrl: PUBLIC_BASE_URL && !PUBLIC_BASE_URL.includes("xxxx.ngrok-free.app")
      ? `${PUBLIC_BASE_URL}${localImageUrl}`
      : localImageUrl,
    localImageUrl,
  };
}

function saveBase64Image(base64Data, index) {
  const fileName = `grok_result_${Date.now()}_${index}.png`;
  const filePath = path.join(uploadDir, fileName);
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  const imageBuffer = Buffer.from(cleanBase64, "base64");

  if (!imageBuffer.length) {
    throw new Error("Generated image body is empty");
  }

  fs.writeFileSync(filePath, imageBuffer);

  return `/uploads/${fileName}`;
}

function saveImageBuffer(imageBuffer, index, extension = ".png") {
  if (!Buffer.isBuffer(imageBuffer) || !imageBuffer.length) {
    throw new Error("Downloaded image is empty");
  }

  const safeExtension = extension && extension.startsWith(".") ? extension : ".png";
  const fileName = `grok_result_${Date.now()}_${index}${safeExtension}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, imageBuffer);

  return `/uploads/${fileName}`;
}

function getImageDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) {
    return null;
  }

  if (buffer.toString("ascii", 1, 4) === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);

      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
        };
      }

      offset += 2 + length;
    }
  }

  return null;
}

function summarizeXaiResponse(data) {
  const firstImage = getImageItems(data)[0] || {};
  const urlCandidates = getImageUrlCandidates(firstImage);
  const base64 = getBase64ImageCandidate(firstImage);

  return {
    keys: Object.keys(data || {}),
    model: data?.model || data?.model_name || data?.resolved_model || null,
    usage: data?.usage || null,
    dataCount: Array.isArray(data?.data) ? data.data.length : 0,
    firstDataKeys: Object.keys(firstImage),
    hasBase64: Boolean(base64),
    base64Length: base64.length || 0,
    hasUrl: Boolean(urlCandidates.length),
    urlHosts: urlCandidates.map(getUrlHost),
    mimeType: firstImage.mime_type || firstImage.image?.mime_type || firstImage.artifact?.mime_type || null,
    revisedPromptLength: typeof firstImage.revised_prompt === "string" ? firstImage.revised_prompt.length : null,
    error: data?.error || null,
    code: data?.code || null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getImageExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const extension = path.extname(pathname);

    return [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ? extension : ".png";
  } catch (error) {
    return ".png";
  }
}

function getFriendlyGenerationError(error) {
  const message = String(error?.message || error || "");

  if (/image_url|image url|url|no image|empty|response/i.test(message)) {
    return "이미지 URL 없음";
  }

  if (/download|fetching image|body|corrupt|corruption|empty|fetch response body|arraybuffer|403|forbidden/i.test(message)) {
    return "이미지를 불러오는 중 문제가 발생했어요.";
  }

  return "이미지를 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

function truncateText(text, maxLength) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function isRetryableImageDownloadError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");

  return /download|body|corrupt|corruption|empty|fetch response body|terminated|network|fetch failed|arraybuffer|403|forbidden/i.test(message)
    || /corrupt|download|body/i.test(code);
}

function headersToObject(headers) {
  return Object.fromEntries([...headers.entries()]);
}

function getUrlHost(url) {
  try {
    return new URL(url).host;
  } catch (error) {
    return "";
  }
}

function describeImageInput(imageInput) {
  if (typeof imageInput !== "string") {
    return {
      type: typeof imageInput,
      length: 0,
      host: "",
      preview: "",
    };
  }

  if (imageInput.startsWith("data:image/")) {
    return {
      type: "base64_data_uri",
      length: imageInput.length,
      host: "",
      preview: imageInput.slice(0, 48),
    };
  }

  return {
    type: imageInput.startsWith("http") ? "url" : "local_url",
    length: imageInput.length,
    host: getUrlHost(imageInput),
    preview: imageInput,
  };
}

function getImageUrlCandidates(imageData) {
  return [
    imageData?.url,
    imageData?.image_url,
    typeof imageData?.image === "string" && imageData.image.startsWith("http") ? imageData.image : "",
    imageData?.image?.url,
    imageData?.artifact?.url,
    imageData?.output?.url,
  ].filter((url) => typeof url === "string" && url.trim());
}

function getBase64ImageCandidate(imageData) {
  return [
    imageData?.b64_json,
    imageData?.base64,
    imageData?.data,
    typeof imageData?.image === "string" && !imageData.image.startsWith("http") ? imageData.image : "",
    imageData?.image?.b64_json,
    imageData?.image?.base64,
    imageData?.image?.data,
    imageData?.artifact?.b64_json,
    imageData?.artifact?.base64,
    imageData?.artifact?.data,
    imageData?.output?.b64_json,
    imageData?.output?.base64,
    imageData?.output?.data,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function getImageItems(data) {
  if (Array.isArray(data?.data) && data.data.length) {
    return data.data;
  }

  if (getBase64ImageCandidate(data) || getImageUrlCandidates(data).length) {
    return [data];
  }

  if (getBase64ImageCandidate(data?.image) || getImageUrlCandidates(data?.image).length) {
    return [data.image];
  }

  return [];
}

function summarizeImageResponseFields(data) {
  const items = getImageItems(data);

  return {
    responseKeys: Object.keys(data || {}),
    dataCount: items.length,
    images: items.map((item, index) => {
      const urlCandidates = getImageUrlCandidates(item);
      const base64 = getBase64ImageCandidate(item);

      return {
        index,
        keys: Object.keys(item || {}),
        nestedImageKeys: Object.keys(item?.image || {}),
        artifactKeys: Object.keys(item?.artifact || {}),
        hasBase64: Boolean(base64),
        base64Length: base64.length || 0,
        hasUrl: Boolean(urlCandidates.length),
        urlCount: urlCandidates.length,
        urlHosts: urlCandidates.map(getUrlHost),
        mimeType: item?.mime_type || item?.image?.mime_type || item?.artifact?.mime_type || null,
        revisedPromptLength: typeof item?.revised_prompt === "string" ? item.revised_prompt.length : null,
      };
    }),
  };
}

async function downloadWithRetry(url, retries = 3, { requestId = "", index = null } = {}) {
  let lastError;
  const host = getUrlHost(url);

  for (let i = 0; i < retries; i += 1) {
    const attempt = i + 1;

    try {
      console.log("[image-download][attempt]", {
        requestId,
        index,
        attempt,
        retries,
        imageUrl: url,
        imageUrlHost: host,
      });
      const res = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 Bloom-Cinematic/1.0 image-fetcher",
          Referer: "https://api.x.ai/",
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
      });
      const responseHeaders = headersToObject(res.headers);

      console.log("[image-download][response]", {
        requestId,
        index,
        attempt,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: responseHeaders,
      });

      if (!res.ok) {
        const error = new Error(`Fetching image failed with HTTP status ${res.status} ${res.statusText}`);
        error.status = res.status;
        error.statusText = res.statusText;
        error.imageUrl = url;
        error.imageUrlHost = host;
        error.responseHeaders = responseHeaders;
        throw error;
      }

      const arrayBuffer = await res.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Downloaded image is empty");
      }

      const buffer = Buffer.from(arrayBuffer);
      console.log("[image-download][success]", {
        requestId,
        index,
        attempt,
        bytes: buffer.length,
        imageUrl: url,
        imageUrlHost: host,
      });
      return buffer;
    } catch (error) {
      lastError = error;
      console.warn("[image-download][failed]", {
        requestId,
        index,
        attempt,
        retries,
        imageUrl: url,
        imageUrlHost: host,
        status: error.status || null,
        statusText: error.statusText || null,
        responseHeaders: error.responseHeaders || null,
        message: error.message || String(error),
        rawError: error,
      });

      if (i < retries - 1) {
        await sleep(1000 * (i + 1));
      }
    }
  }

  throw lastError;
}

async function downloadGeneratedImage(imageUrl, index, { requestId = "" } = {}) {
  const imageBuffer = await downloadWithRetry(imageUrl, 3, { requestId, index });
  const extension = getImageExtensionFromUrl(imageUrl);

  return {
    imageUrl: saveImageBuffer(imageBuffer, index, extension),
    bytes: imageBuffer.length,
    dimensions: getImageDimensions(imageBuffer),
  };
}

async function requestGrokImageEditWithRetry({ prompt, inputImageUrl, requestId, generationMode, presetKey, retries = 3 }) {
  let lastError;

  for (let i = 0; i < retries; i += 1) {
    const startedAt = Date.now();

    try {
      const payload = {
        model: XAI_IMAGE_MODEL,
        image: {
          type: "image_url",
          url: inputImageUrl,
        },
        prompt,
        n: 1,
        response_format: "b64_json",
        image_format: "base64",
      };
      const response = await fetch("https://api.x.ai/v1/images/edits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const latencyMs = Date.now() - startedAt;
      const data = await readJsonResponse(response);
      const responseSummary = summarizeXaiResponse(data);
      const resolvedModel = responseSummary.model || XAI_IMAGE_MODEL;
      const tier = response.headers.get("x-account-tier")
        || response.headers.get("x-billing-tier")
        || response.headers.get("x-ratelimit-tier")
        || XAI_ACCOUNT_TIER;

      console.log("[image-edit]", {
        requestId,
        mode: generationMode,
        provider: XAI_PROVIDER,
        tier,
        requestedModel: XAI_IMAGE_MODEL,
        resolvedModel,
        fallbackUsed: resolvedModel !== XAI_IMAGE_MODEL,
        fallbackReason: resolvedModel !== XAI_IMAGE_MODEL ? "provider_resolved_different_model" : "",
        responseStatus: response.status,
        responseLatencyMs: latencyMs,
        outputImageSize: null,
        promptLength: prompt.length,
        requestSeed: null,
        presetKey,
      });
      console.log("[xAI][payload-core]", {
        requestId,
        model: payload.model,
        imageInput: describeImageInput(inputImageUrl),
        imageType: payload.image.type,
        n: payload.n,
        responseFormat: payload.response_format,
        imageFormat: payload.image_format,
        promptLength: prompt.length,
      });
      console.log("[xAI][response]", {
        requestId,
        status: response.status,
        ok: response.ok,
        latencyMs,
        errorCode: data?.error?.code || data?.code || null,
        errorMessage: data?.error?.message || data?.message || null,
        body: responseSummary,
      });
      console.log("[xAI][response-image-fields]", {
        requestId,
        status: response.status,
        requestIdHeader: response.headers.get("x-request-id")
          || response.headers.get("xai-request-id")
          || response.headers.get("cf-ray")
          || null,
        imageFields: summarizeImageResponseFields(data),
      });

      if (!response.ok) {
        const message =
          data?.error?.message ||
          data?.message ||
          JSON.stringify(data);
        const error = new Error(message);
        error.code = data?.error?.code || data?.code || response.status;
        error.status = response.status;
        error.response = data;
        error.metadata = {
          requestId,
          provider: XAI_PROVIDER,
          tier,
          requestedModel: XAI_IMAGE_MODEL,
          resolvedModel,
          fallbackUsed: resolvedModel !== XAI_IMAGE_MODEL,
          fallbackReason: resolvedModel !== XAI_IMAGE_MODEL ? "provider_resolved_different_model" : "",
          responseStatus: response.status,
          responseLatencyMs: latencyMs,
          promptLength: prompt.length,
          requestSeed: null,
        };

        throw error;
      }

      return {
        data,
        metadata: {
          requestId,
          provider: XAI_PROVIDER,
          tier,
          requestedModel: XAI_IMAGE_MODEL,
          resolvedModel,
          actualModel: resolvedModel,
          fallbackUsed: resolvedModel !== XAI_IMAGE_MODEL,
          fallbackReason: resolvedModel !== XAI_IMAGE_MODEL ? "provider_resolved_different_model" : "",
          responseStatus: response.status,
          responseLatencyMs: latencyMs,
          promptLength: prompt.length,
          requestSeed: null,
          responseBody: responseSummary,
        },
      };
    } catch (error) {
      lastError = error;
      console.error("[xAI][request-error]", {
        requestId,
        attempt: i + 1,
        retries,
        code: error.code || null,
        status: error.status || null,
        message: error.message || String(error),
        response: error.response || null,
      });

      if (!isRetryableImageDownloadError(error) || i >= retries - 1) {
        throw error;
      }

      console.warn(`Grok image response retry ${i + 1}/${retries} failed`, error);
      await sleep(1000 * (i + 1));
    }
  }

  throw lastError;
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      error: {
        message: text || response.statusText,
      },
    };
  }
}

function extractXaiText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputItems = Array.isArray(data?.output) ? data.output : [];

  for (const item of outputItems) {
    const content = Array.isArray(item?.content) ? item.content : [];

    for (const block of content) {
      if (typeof block?.text === "string" && block.text.trim()) {
        return block.text.trim();
      }
      if (typeof block?.output_text === "string" && block.output_text.trim()) {
        return block.output_text.trim();
      }
    }
  }

  const choiceContent = data?.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string" && choiceContent.trim()) {
    return choiceContent.trim();
  }

  return "";
}

function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return null;
    }
  }
}

function normalizeModeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function resolveGenerationMode(mode) {
  if (mode === GENERATION_MODES.PARIS_SNAP || mode === GENERATION_MODES.DISNEY_LIVE) {
    return mode;
  }

  return GENERATION_MODE_ALIASES[normalizeModeToken(mode)] || null;
}

function normalizeGenerationMode(mode) {
  return resolveGenerationMode(mode) || GENERATION_MODES.PARIS_SNAP;
}

function getGrokAgentInstruction(generationMode) {
  if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
    return DISNEY_AGENT_INSTRUCTION;
  }

  return PARIS_AGENT_INSTRUCTION;
}

function getLocationVariants(presetKey) {
  return LOCATION_VARIANTS[presetKey] || LOCATION_VARIANTS.default;
}

function getGenerationVariants(generationMode, presetKey) {
  if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
    return DISNEY_STYLE_VARIANTS;
  }

  return getLocationVariants(presetKey);
}

function buildPromptWithLocationVariant(basePrompt, presetKey, index) {
  const variants = getLocationVariants(presetKey);
  const variant = variants[index] || variants[0] || LOCATION_VARIANTS.default[index] || LOCATION_VARIANTS.default[0];

  return `
${basePrompt}

Variation:
${variant.instruction}

Important:
- Make this one of four stable results.
- Prioritize consistency over diversity.
- Keep the couple, pose, crop, and camera angle unchanged.
`.trim();
}

function buildDisneyPrompt(basePrompt, index) {
  const variant = DISNEY_STYLE_VARIANTS[index] || DISNEY_STYLE_VARIANTS[0];
  const otherLabels = DISNEY_STYLE_VARIANTS
    .filter((item) => item.id !== variant.id)
    .map((item) => item.title)
    .join(", ");

  const prompt = `
Independent Disney slot edit request.
This is a standalone image generation request for exactly one locked slot.
Do not treat this as a variation of another slot.
Do not average this slot with a generic Disney princess style.

${DISNEY_COMMON_QUALITY_STANDARD}

Fixed slot generation:
- This image is slot ${index + 1} of 4.
- The locked slot id is "${variant.id}".
- The locked title for this slot is "${variant.title}".
- Generate only this locked slot concept.
- Do not generate or imitate these other slots: ${otherLabels}.
- Do not borrow the color palette, wardrobe style, background mood, props, or atmosphere from the other three slots.
- Do not create a generic princess result.
- The slot should be identifiable through wardrobe, props, lighting, and color mood while preserving the original face and photo structure.
- Do not let Cinderella blue/silver styling leak into Belle, Aurora, or Mulan.
- Do not let European palace styling leak into Mulan.

Slot-specific concept:
${variant.instruction}

Shared face/pose/quality rules:
- Disney live-action mode uses low-to-moderate concept expression for wardrobe, background mood, color, props, accessories, and lighting.
- Do not redesign the face.
- Keep the original face exactly unchanged.
- Do not beautify the face.
- Do not make the person look younger, prettier, slimmer, or more doll-like.
- Do not alter facial identity.
- Do not change face shape, eye size, nose shape, mouth shape, jawline, cheekbones, or smile.
- Preserve the original facial expression exactly.
- Preserve the original skin tone naturally.
- Keep the original face identity exactly.
- Preserve eyes, nose, mouth, facial proportions, and expression.
- Keep the original hairstyle and hair color unless explicitly required otherwise.
- Do not invent new facial structure.
- Do not make the face more cartoonish.
- Face change strength must be near zero.
- Preserve each visible face extremely strongly so every subject looks like the original person first.
- For couple photos, preserve both faces separately; the man and woman must each remain individually recognizable.
- Allow only extremely weak skin cleanup and natural editorial polish.
- Do not enlarge eyes, slim the jaw, reshape the face, reinterpret nose or mouth, over-smooth skin, or standardize the person into an AI handsome/beautiful face.
- Keep pose, hand position, body angle, and composition unchanged.
- Keep the original background structure and add gentle character-specific background mood.
- Apply subtle-to-moderate costume adaptation while keeping the original body silhouette and wedding-photo realism.
- Avoid full scene replacement.
- Photorealistic wedding photo style.
- Balanced Disney mood overlay: concept variation must not change identity, expression, pose, camera angle, or composition.
- Add natural accessories, hair ornaments, floral accents, and cinematic lighting where appropriate.
- Communicate character concept through wardrobe details first, color and background mood second, props/accessories third, lighting fourth, and face never.
- The four generated slots must be Cinderella, Belle, Aurora, and Mulan Hanbok exactly once each.
- Mulan must not be omitted or replaced by another princess concept.
- Keep backgrounds photorealistic wedding photo spaces with natural texture and depth; avoid cartoon, illustration, painted animation, fantasy game art, plastic CGI, or overly saturated scenery.
- If the concept pushes the face away from the source likeness, reduce the concept strength and preserve the face.
- If there is any conflict, prioritize face preservation over costume/background styling.
- Express the Disney-inspired concept through wardrobe, set design, props, lighting, and color mood.
- Do not move the subject, change the camera angle, or replace the original location structure.
- If the face looks like a different person, the result is a failure.

Important:
- Title and actual image concept must match: "${variant.title}".
- If this output visually reads as Cinderella but the slot is not cinderella, it is a failed concept match.
- If this output uses the wrong dominant palette for "${variant.title}", it is a failed concept match.
- Make this slot different through dress color, background mood, props/decor, accessory/hair styling, and lighting mood, not through face changes.
- The concept must remain secondary to preserving every visible face, expression, pose, and original photo composition.
- The result must look like a photorealistic wedding photo based on the original, not an animated or illustrated scene.
`.trim();

  return truncateText(prompt, XAI_MAX_PROMPT_LENGTH);
}

function buildGenerationPrompt(basePrompt, { generationMode, presetKey, index }) {
  if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
    return buildDisneyPrompt(basePrompt, index);
  }

  return buildPromptWithLocationVariant(basePrompt, presetKey, index);
}

function getSelectionFallbackLabels(generationMode) {
  if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
    return DISNEY_STYLE_VARIANTS.map((variant) => variant.label);
  }

  return LOCATION_VARIANTS.paris_eiffel.map((variant) => variant.label);
}

function buildSelectionPrompt(generationMode) {
  if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
    return `
You are selecting the single best result among 4 generated images.

Compare the original image with the 4 candidate results.
Choose the one result that best preserves the original person and original photo while still remaining natural.
Face and facial-feature preservation must dominate every other criterion. Do not choose the prettiest, most dramatic, most fantasy-like, or strongest-concept image if it changes the original face, eyes, nose, mouth, expression, hair, pose, or background too much.
The best recommendation is the image that looks most like the original person, not the image that is most beautiful or most Disney-like.

Disney live-action priority:
1. Face identity preservation
2. Eye shape, both-eye naturalness, and left-right eye balance
3. Nose, mouth, smile, facial proportions, and original expression preservation
4. Pose, framing, hand position, body angle, and composition preservation
5. Hair style and hair color preservation
6. Photorealistic wedding-photo naturalness
7. Original background structure preservation
8. Disney concept fit through wardrobe, set design, props, lighting, and color mood
9. Wardrobe/background impressiveness

Important:
- Exclude or heavily penalize any image that beautifies the face, makes the person look younger/prettier/slimmer/more doll-like, or changes face shape, jawline, cheekbones, eye size, nose shape, mouth shape, smile, skin tone, or expression.
- Exclude or heavily penalize any image where eyes are broken, warped, mismatched, asymmetrical, cross-eyed, melted, blurry, over-enlarged, or visibly unnatural.
- Exclude or heavily penalize distorted nose/mouth, collapsed face proportions, changed smile/expression, or a face that looks redesigned.
- Penalize images where any visible subject looks like a different person very heavily, even if the concept is beautiful.
- Penalize images where the face is similar but facial detail is blurred, smeared, waxy, low-resolution, or collapsed.
- Exclude or heavily penalize images where hair color/style changes significantly.
- Exclude or heavily penalize images where expression, pose, hands, body direction, camera angle, or composition changes significantly.
- Exclude or heavily penalize images where the original background structure is almost gone or the image looks newly generated as a fantasy scene.
- Do not recommend a result with strong Disney mood if the face, hair, pose, or background preservation is weak.
- When choosing between two results, choose the one with better original preservation even if its Disney styling is weaker.
- Penalize cartoonish, illustrated, painted animation, plastic CGI, overly fantasy-like, or over-beautified results.
- A tiny face refinement is acceptable only if the original likeness remains very strong.
- Reward the result that best matches the status text: the most natural image.
- If all four are imperfect, choose the least transformed image with the best face similarity, pose preservation, hair preservation, and background naturalness.
- Belle Romantic should rank lower if it has stronger transformation than Cinderella or Mulan.
- Prefer Cinderella or Mulan over Belle when Cinderella or Mulan better preserves the original face, pose, hair, background structure, and realistic wedding-photo feel.

Scoring guideline:
- faceSimilarityScore: 30%
- eyeIntegrityScore: 25%
- facialFeatureIntegrityScore: 15%
- faceProportionAndExpressionScore: 15%
- posePreservationScore: 8%
- realismScore: 5%
- conceptScore: 2%
- Apply major penalties for broken eyes, nose/mouth distortion, face drift, expression drift, hair drift, pose drift, background over-replacement, fantasy/cartoon feel, and different-person impression.
- Return rankedIndices sorted from best to worst by the same criteria. recommendedIndex must be the first ranked index.

Return JSON only in the following format:
{
  "recommendedIndex": 0,
  "reason": "Best face and eye preservation with natural live-action styling.",
  "rankedIndices": [0, 3, 1, 2],
  "labels": [
    "Cinderella Royal — Cinderella",
    "Belle Romantic — Beauty and the Beast",
    "Aurora Enchanted — Sleeping Beauty",
    "Mulan Oriental Hanbok — Mulan"
  ]
}
`.trim();
  }

  const example = `{
  "recommendedIndex": 0,
  "reason": "Best face preservation and most natural result.",
  "labels": [
    "Eiffel Tower riverside",
    "Eiffel Tower garden-side",
    "Eiffel Tower promenade",
    "Eiffel Tower terrace"
  ]
}`;

  return `
You are selecting the single best result among 4 generated images.

Compare the original image with the 4 candidate results.
Choose the one result that best preserves the original people while also achieving the requested mode style.

Priority:
1. Face identity preservation
2. Eye shape preservation
3. Hairstyle and hair color preservation
4. Pose / framing / composition preservation
5. No invented hidden parts
6. Natural realism
7. Mode fit

Mode fit rules:
- parisSnap: natural Eiffel Tower background, realistic travel-snap feeling
- disneyLive: four distinct live-action Disney-inspired results including Cinderella, Beauty and the Beast, Sleeping Beauty, and Mulan in hanbok; realistic and not cartoonish

Important:
- Penalize face drift very heavily.
- Penalize over-smoothing, blur, beautification into a different person, pose changes, and invented hidden details.
- Background/style quality is secondary to face preservation.

Current mode: ${generationMode}

Return JSON only in the following format:
${example}
`.trim();
}

function normalizeSelectionPayload(selection, imageCount, generationMode) {
  const fallbackLabels = getSelectionFallbackLabels(generationMode);
  const parsedIndex = Number.parseInt(selection?.recommendedIndex, 10);
  const rankedIndices = [];

  (Array.isArray(selection?.rankedIndices) ? selection.rankedIndices : []).forEach((value) => {
    const index = Number.parseInt(value, 10);
    if (Number.isInteger(index) && index >= 0 && index < imageCount && !rankedIndices.includes(index)) {
      rankedIndices.push(index);
    }
  });

  const recommendedIndex = Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < imageCount
    ? parsedIndex
    : rankedIndices[0] ?? 0;
  const rawLabels = generationMode !== GENERATION_MODES.DISNEY_LIVE && Array.isArray(selection?.labels)
    ? selection.labels.map((label) => String(label || "").trim()).filter(Boolean)
    : [];
  const completeRankedIndices = [
    recommendedIndex,
    ...rankedIndices.filter((index) => index !== recommendedIndex),
    ...Array.from({ length: imageCount }, (_, index) => index).filter((index) => index !== recommendedIndex && !rankedIndices.includes(index)),
  ];

  return {
    recommendedIndex,
    rankedIndices: completeRankedIndices,
    reason: typeof selection?.reason === "string" && selection.reason.trim()
      ? selection.reason.trim()
      : "Best face preservation and most natural result.",
    labels: Array.from({ length: imageCount }, (_, index) => rawLabels[index] || fallbackLabels[index] || `Result ${index + 1}`),
  };
}

function localUploadPathFromUrl(imageUrl) {
  try {
    const parsed = imageUrl.startsWith("http")
      ? new URL(imageUrl)
      : new URL(imageUrl, "http://localhost");

    if (!parsed.pathname.startsWith("/uploads/")) {
      return "";
    }

    const fileName = path.basename(parsed.pathname);
    return path.join(uploadDir, fileName);
  } catch (error) {
    return "";
  }
}

function imageInputToDataUrl(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return "";
  }

  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const uploadPath = localUploadPathFromUrl(trimmed);
  if (uploadPath && fs.existsSync(uploadPath)) {
    const extension = path.extname(uploadPath).toLowerCase();
    const mimeType = extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : "image/png";

    return fileToDataUrl(uploadPath, mimeType);
  }

  return trimmed;
}

async function requestGrokSelection({ generationMode, originalImage, generatedImages, prompt, requestId }) {
  const content = [
    {
      type: "input_text",
      text: prompt || buildSelectionPrompt(generationMode),
    },
    {
      type: "input_text",
      text: "Original image:",
    },
    {
      type: "input_image",
      image_url: imageInputToDataUrl(originalImage),
      detail: "high",
    },
    ...generatedImages.flatMap((image, index) => [
      {
        type: "input_text",
        text: `Candidate result ${index}:`,
      },
      {
        type: "input_image",
        image_url: imageInputToDataUrl(image),
        detail: "high",
      },
    ]),
  ];
  const startedAt = Date.now();
  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_SELECTION_MODEL,
      input: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0,
      max_output_tokens: 520,
      store: false,
    }),
  });
  const data = await readJsonResponse(response);

  console.log("[xAI][selection-response]", {
    requestId,
    model: XAI_SELECTION_MODEL,
    status: response.status,
    ok: response.ok,
    latencyMs: Date.now() - startedAt,
    outputTextLength: extractXaiText(data).length,
    error: data?.error || null,
  });

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || "Grok selection failed");
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function buildDisneyQualityGatePrompt(variantLabel) {
  const variant = DISNEY_STYLE_VARIANTS.find((item) => item.label === variantLabel || item.title === variantLabel) || {};
  const slotChecks = {
    cinderella: "Cinderella validation: dominant palette must be pastel blue/silver/white; wardrobe should read as Cinderella blue dress or prince-like formal styling; background mood should be subtle photorealistic luxury interior, not cartoon fantasy; original camera angle, gaze direction, composition, framing, and background structure should remain strongly recognizable.",
    belle: "Belle validation: dominant palette must be gold/yellow/amber/bronze, not blue/silver; wardrobe should read as Belle gold/yellow dress; background mood should read as warm palace, chandelier, library, books, classic European interior, or romantic amber hall.",
    aurora: "Aurora validation: dominant palette must be pink/rose/lavender, not blue/silver and not gold/amber; wardrobe should read as Aurora pink dress; hair color must remain original dark/black or original tone, not blonde or light fantasy hair; background mood should read as flowers, garden, romantic sunlight, dreamy floral palace, or soft natural light.",
    mulan: "Mulan validation: dominant palette must include deep red/jade green/rose pink/traditional gold; woman's wardrobe must be clearly latest-style luxury Korean hanbok for wedding/editorial photos, not Chinese traditional clothing; background mood may read as East Asian garden, tiled roof, wooden architecture, pond, traditional window, blossoms, or oriental courtyard; it must not read as European princess palace.",
  };

  return `
You are a soft scoring reviewer for one Disney live-action wedding image edit.

Compare the original image and the candidate result.
The locked concept is: ${variantLabel}
The locked slot id is: ${variant.id || "unknown"}
${slotChecks[variant.id] || ""}

Score these criteria from 0 to 100:
1. Face identity matches the original person strongly.
2. Eye integrity: eye shape, both eyes, gaze, eyelids, pupils, and left-right eye balance are natural and preserved.
3. Nose and mouth integrity: nose, mouth, smile, lips, and teeth are natural and preserved.
4. Face proportions and expression match the original and do not look redesigned.
5. Hair style and hair color remain close to the original.
6. Pose, hand position, body direction, camera viewpoint, framing, and composition remain almost unchanged.
7. Facial detail is clear: eyes, nose, mouth, skin texture, and facial edges are not blurry, smeared, waxy, low-resolution, or collapsed.
8. Original background structure remains recognizable and is not over-replaced.
9. The result is photorealistic wedding-photo quality, not cartoonish, illustrated, plastic CGI, or AI-doll-like.
10. The locked concept is visible through wardrobe, palette, background mood, props/decor, accessories, and lighting.
11. For Mulan Oriental Hanbok — Mulan, the outfit is hanbok-based and not qipao, hanfu, Chinese armor, or Chinese imperial costume.
12. The title and actual image concept match the locked slot exactly.

Hard-reject or mark as recommendation-disqualified any generated image with broken eyes, severe eye asymmetry, distorted nose/mouth, collapsed face proportions, changed expression, beautified/doll-like/youthened/slimmed facial identity, changed skin tone, or a different-person face.
For recommendation suitability, face and facial-feature preservation is much more important than concept strength.
Concept strength must never compensate for damaged eyes, nose, mouth, face proportions, or identity drift.

Return JSON only:
{
  "faceSimilarityScore": 85,
  "eyeIntegrityScore": 85,
  "facialFeatureIntegrityScore": 85,
  "faceProportionScore": 85,
  "expressionPreservationScore": 85,
  "detailQualityScore": 85,
  "posePreservationScore": 85,
  "hairPreservationScore": 85,
  "backgroundStructureScore": 85,
  "realismScore": 85,
  "conceptScore": 85,
  "photorealQualityScore": 85,
  "overallScore": 85,
  "overTransformationPenalty": 0,
  "rejected": false,
  "recommendationDisqualified": false,
  "rejectReason": "",
  "reason": "short reason"
}
`.trim();
}

async function requestDisneyQualityGate({ originalImage, candidateImage, variantLabel, requestId, index }) {
  const content = [
    {
      type: "input_text",
      text: buildDisneyQualityGatePrompt(variantLabel),
    },
    {
      type: "input_text",
      text: "Original image:",
    },
    {
      type: "input_image",
      image_url: imageInputToDataUrl(originalImage),
      detail: "high",
    },
    {
      type: "input_text",
      text: "Candidate result:",
    },
    {
      type: "input_image",
      image_url: imageInputToDataUrl(candidateImage),
      detail: "high",
    },
  ];
  const startedAt = Date.now();
  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_SELECTION_MODEL,
      input: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0,
      max_output_tokens: 420,
      store: false,
    }),
  });
  const data = await readJsonResponse(response);
  const parsed = safeJsonParse(extractXaiText(data)) || {};

  console.log("[disney-quality-gate][response]", {
    requestId,
    index,
    variantLabel,
    status: response.status,
    ok: response.ok,
    latencyMs: Date.now() - startedAt,
    parsed,
    error: data?.error || null,
  });

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || "Disney quality gate failed");
    error.status = response.status;
    error.response = data;
    throw error;
  }

  const toScore = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : fallback;
  };
  const faceSimilarityScore = toScore(parsed?.faceSimilarityScore);
  const detailQualityScore = toScore(parsed?.detailQualityScore);
  const eyeIntegrityScore = toScore(parsed?.eyeIntegrityScore, toScore(parsed?.eyePreservationScore, detailQualityScore));
  const facialFeatureIntegrityScore = toScore(parsed?.facialFeatureIntegrityScore, toScore(parsed?.noseMouthIntegrityScore, detailQualityScore));
  const faceProportionScore = toScore(parsed?.faceProportionScore, faceSimilarityScore);
  const expressionPreservationScore = toScore(parsed?.expressionPreservationScore, faceSimilarityScore);
  const posePreservationScore = toScore(parsed?.posePreservationScore);
  const hairPreservationScore = toScore(parsed?.hairPreservationScore);
  const backgroundStructureScore = toScore(parsed?.backgroundStructureScore);
  const realismScore = toScore(parsed?.realismScore, toScore(parsed?.photorealQualityScore));
  const conceptScore = toScore(parsed?.conceptScore);
  const photorealQualityScore = toScore(parsed?.photorealQualityScore);
  const faceIntegrityPenalty = [
    faceSimilarityScore < 70 ? 18 : 0,
    eyeIntegrityScore < 70 ? 28 : 0,
    facialFeatureIntegrityScore < 70 ? 22 : 0,
    faceProportionScore < 70 ? 20 : 0,
    expressionPreservationScore < 70 ? 14 : 0,
    detailQualityScore < 65 ? 12 : 0,
  ].reduce((sum, value) => sum + value, 0);
  const penalty = Math.min(100, toScore(parsed?.overTransformationPenalty) + faceIntegrityPenalty);
  const fallbackOverall = Math.max(0, Math.min(100, Math.round(
    (faceSimilarityScore * 0.25)
    + (eyeIntegrityScore * 0.22)
    + (facialFeatureIntegrityScore * 0.14)
    + (faceProportionScore * 0.12)
    + (expressionPreservationScore * 0.08)
    + (posePreservationScore * 0.08)
    + (hairPreservationScore * 0.05)
    + (realismScore * 0.04)
    + (conceptScore * 0.02)
    - penalty,
  )));
  const rawOverallScore = toScore(parsed?.overallScore, fallbackOverall);
  const disqualified = parsed?.recommendationDisqualified === true
    || faceSimilarityScore < 65
    || eyeIntegrityScore < 68
    || facialFeatureIntegrityScore < 64
    || faceProportionScore < 64
    || expressionPreservationScore < 60
    || detailQualityScore < 58
    || posePreservationScore < 55
    || penalty >= 45;
  const recommendationScore = disqualified ? Math.min(rawOverallScore, 20) : rawOverallScore;
  const rejected = parsed?.rejected === true || (
    faceSimilarityScore < 50
    || eyeIntegrityScore < 45
    || facialFeatureIntegrityScore < 45
    || faceProportionScore < 45
  );

  return {
    ...parsed,
    faceSimilarityScore,
    eyeIntegrityScore,
    facialFeatureIntegrityScore,
    faceProportionScore,
    expressionPreservationScore,
    detailQualityScore,
    posePreservationScore,
    hairPreservationScore,
    backgroundStructureScore,
    realismScore,
    conceptScore,
    photorealQualityScore,
    overallScore: rawOverallScore,
    recommendationScore,
    overTransformationPenalty: penalty,
    recommendationDisqualified: disqualified,
    rejected,
    rejectReason: typeof parsed?.rejectReason === "string" ? parsed.rejectReason : "",
    reason: typeof parsed?.reason === "string" ? parsed.reason : "",
  };
}

function buildDisneyDiversityReviewPrompt() {
  return `
You are reviewing a set of Disney live-action wedding edits for concept diversity.

Expected fixed slots:
0. Cinderella Royal — Cinderella: pastel blue/silver/white, crystal, European royal palace/staircase/chandelier mood.
1. Belle Romantic — Beauty and the Beast: gold/yellow/amber/bronze, warm romantic library/classic hall/chandelier mood.
2. Aurora Enchanted — Sleeping Beauty: pink/rose/lavender, soft floral garden/sunlight/dreamy romantic mood.
3. Mulan Oriental Hanbok — Mulan: deep red/jade green/rose pink/traditional gold, hanbok, East Asian garden/wood/roof/pond/blossoms mood.

Judge whether the actual images match their own slot and are visually distinct from each other.
Focus only on concept diversity: palette, wardrobe, background mood, props/decor, atmosphere.
Do not penalize face preservation, pose preservation, or photorealism here.

Regenerate a slot only if:
- it visibly looks like a Cinderella blue/silver palace result but the slot is not Cinderella,
- it is Mulan but does not look East Asian or hanbok-based,
- it is Belle or Aurora but reads as generic Cinderella,
- two or more non-Cinderella slots are too visually similar to Cinderella.

Return JSON only:
{
  "needsRegeneration": false,
  "reason": "short reason",
  "slots": [
    {
      "index": 0,
      "label": "Cinderella Royal — Cinderella",
      "conceptMatchScore": 90,
      "distinctivenessScore": 90,
      "dominantPalette": "pastel blue silver white",
      "looksLike": "Cinderella",
      "tooSimilarToCinderella": false,
      "shouldRegenerate": false,
      "reason": ""
    }
  ]
}
`.trim();
}

async function requestDisneyDiversityReview({ generatedItems, requestId }) {
  const content = [
    {
      type: "input_text",
      text: buildDisneyDiversityReviewPrompt(),
    },
    ...generatedItems.flatMap((item) => [
      {
        type: "input_text",
        text: `Slot ${item.index}: ${item.label}`,
      },
      {
        type: "input_image",
        image_url: imageInputToDataUrl(item.imageUrl),
        detail: "high",
      },
    ]),
  ];
  const startedAt = Date.now();
  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_SELECTION_MODEL,
      input: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0,
      max_output_tokens: 900,
      store: false,
    }),
  });
  const data = await readJsonResponse(response);
  const parsed = safeJsonParse(extractXaiText(data)) || {};

  console.log("[disney][diversity-review]", {
    requestId,
    status: response.status,
    ok: response.ok,
    latencyMs: Date.now() - startedAt,
    parsed,
    error: data?.error || null,
  });

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || "Disney diversity review failed");
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return {
    needsRegeneration: parsed?.needsRegeneration === true,
    reason: typeof parsed?.reason === "string" ? parsed.reason : "",
    slots: Array.isArray(parsed?.slots) ? parsed.slots : [],
  };
}

function buildDisneyDiversityRegenerationPrompt(prompt, slotReview) {
  const reason = typeof slotReview?.reason === "string" && slotReview.reason.trim()
    ? slotReview.reason.trim()
    : "This slot did not look distinct enough from the other Disney concepts.";

  return truncateText(`
${prompt}

Concept diversity correction:
- The previous image for this same locked slot was too visually similar to another slot.
- Diversity issue: ${reason}
- Regenerate only this same locked slot.
- Keep the same face, pose, hands, camera angle, framing, and photorealistic quality level.
- Do not increase face transformation.
- Strengthen only this slot's unique palette, wardrobe anchor, background mood, props/decor, and atmosphere.
- The result must match its label and must not look like a Cinderella-style blue/silver palace image unless the locked slot is Cinderella.
`, XAI_MAX_PROMPT_LENGTH);
}

function buildDisneyConceptRegenerationPrompt(prompt, gateResult, variantLabel) {
  const reason = typeof gateResult?.reason === "string" && gateResult.reason.trim()
    ? gateResult.reason.trim()
    : "The previous image did not clearly match the locked Disney slot concept.";

  return truncateText(`
${prompt}

Slot concept correction:
- The previous image for "${variantLabel}" did not match its locked slot strongly enough.
- Concept issue: ${reason}
- Regenerate only this same locked slot.
- Keep the current good face identity preservation, pose preservation, composition, and photorealistic quality level.
- Do not increase face transformation.
- Strengthen only subtle slot-specific wardrobe color, wardrobe anchor, background mood, props/decor, and atmosphere.
- Do not modify eyes, nose, mouth, facial proportions, expression, hairstyle, or hair color to improve concept match.
- The title and actual image concept must match exactly.
- Do not output a Cinderella-style blue/silver European palace result unless this locked slot is Cinderella.
`, XAI_MAX_PROMPT_LENGTH);
}

function buildDisneyRegenerationPrompt(prompt, gateResult) {
  const reason = typeof gateResult?.reason === "string" && gateResult.reason.trim()
    ? gateResult.reason.trim()
    : "The previous candidate failed face detail, face similarity, pose/composition, concept, or photoreal quality checks.";

  return truncateText(`
${prompt}

Regeneration quality correction:
- The previous candidate failed the shared Disney quality gate.
- Failure reason: ${reason}
- Regenerate this same locked slot only.
- Keep the same concept, palette, wardrobe direction, and background mood.
- Lower the styling strength if needed.
- Improve face detail clarity, skin texture, eyes, nose, mouth, facial proportions, expression, and facial edges.
- Preserve original face identity exactly.
- Preserve original pose, hands, body angle, camera viewpoint, framing, and composition more strongly.
- Express Disney styling through wardrobe, set design, props, lighting, and color mood only.
- Keep photorealistic wedding-photo quality.
`, XAI_MAX_PROMPT_LENGTH);
}

async function generateOneImageAttempt({ prompt, inputImageUrl, index, generationMode, presetKey, requestId, attempt }) {
  console.log(`🖼️ Grok 이미지 편집 시작: ${index + 1}/${GENERATE_COUNT} attempt ${attempt + 1}`);
  console.log("[xAI][request]", {
    requestId,
    generationMode,
    presetKey,
    index,
    provider: XAI_PROVIDER,
    model: XAI_IMAGE_MODEL,
    tier: XAI_ACCOUNT_TIER,
    inputImageUrl,
    promptLength: prompt.length,
    attempt: attempt + 1,
  });
  console.log(`[xAI][prompt][${generationMode}][${index + 1}/${GENERATE_COUNT}]\n${prompt}`);

  const { data, metadata } = await requestGrokImageEditWithRetry({
    prompt,
    inputImageUrl,
    requestId,
    generationMode,
    presetKey,
  });

  const firstImage = getImageItems(data)[0] || {};
  const base64 = getBase64ImageCandidate(firstImage);
  const imageUrlCandidates = getImageUrlCandidates(firstImage);
  const imageUrl = imageUrlCandidates[0] || "";

  console.log("[xAI][image-output-fields]", {
    requestId,
    generationMode,
    presetKey,
    index,
    imageFieldKeys: Object.keys(firstImage || {}),
    hasBase64: Boolean(base64),
    base64Length: base64.length || 0,
    hasUrl: Boolean(imageUrl),
    imageUrl,
    imageUrlHost: imageUrl ? getUrlHost(imageUrl) : "",
    urlCount: imageUrlCandidates.length,
  });

  if (base64) {
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const dimensions = getImageDimensions(imageBuffer);
    const resultImageUrl = saveBase64Image(base64, index + 1);

    console.log("✅ Grok 이미지 직접 저장 완료:", {
      requestId,
      index,
      imageUrl: resultImageUrl,
      dimensions,
      bytes: imageBuffer.length,
      source: "b64_json",
    });
    console.log("[image-edit-output]", {
      requestId,
      index,
      mode: generationMode,
      provider: metadata.provider,
      tier: metadata.tier,
      requestedModel: metadata.requestedModel,
      resolvedModel: metadata.resolvedModel,
      fallbackUsed: metadata.fallbackUsed,
      fallbackReason: metadata.fallbackReason,
      responseStatus: metadata.responseStatus,
      responseLatencyMs: metadata.responseLatencyMs,
      outputImageSize: dimensions,
      promptLength: metadata.promptLength,
      requestSeed: metadata.requestSeed,
      storageSource: "b64_json",
    });
    return {
      imageUrl: resultImageUrl,
      metadata: {
        ...metadata,
        outputImageSize: dimensions,
        outputBytes: imageBuffer.length,
        storageSource: "b64_json",
      },
    };
  }

  if (imageUrl) {
    const downloaded = await downloadGeneratedImage(imageUrl, index + 1, { requestId });

    console.log("✅ Grok 이미지 다운로드 저장 완료:", {
      requestId,
      index,
      sourceImageUrl: imageUrl,
      sourceImageUrlHost: getUrlHost(imageUrl),
      imageUrl: downloaded.imageUrl,
      dimensions: downloaded.dimensions,
      bytes: downloaded.bytes,
    });
    console.log("[image-edit-output]", {
      requestId,
      index,
      mode: generationMode,
      provider: metadata.provider,
      tier: metadata.tier,
      requestedModel: metadata.requestedModel,
      resolvedModel: metadata.resolvedModel,
      fallbackUsed: metadata.fallbackUsed,
      fallbackReason: metadata.fallbackReason,
      responseStatus: metadata.responseStatus,
      responseLatencyMs: metadata.responseLatencyMs,
      outputImageSize: downloaded.dimensions,
      promptLength: metadata.promptLength,
      requestSeed: metadata.requestSeed,
      storageSource: "downloaded_url",
    });
    return {
      imageUrl: downloaded.imageUrl,
      metadata: {
        ...metadata,
        outputImageSize: downloaded.dimensions,
        outputBytes: downloaded.bytes,
        sourceImageUrl: imageUrl,
        sourceImageUrlHost: getUrlHost(imageUrl),
        storageSource: "downloaded_url",
      },
    };
  }

  console.error("[xAI][missing-image-data]", {
    requestId,
    generationMode,
    presetKey,
    index,
    responseKeys: Object.keys(data || {}),
    firstDataKeys: Object.keys(data?.data?.[0] || {}),
    response: data,
  });
  const error = new Error("xAI 응답에 저장 가능한 이미지 데이터가 없습니다.");
  error.metadata = metadata;
  throw error;
}

async function generateOneImage({ prompt, inputImageUrl, originalImageUrl, index, generationMode, presetKey, requestId }) {
  if (generationMode !== GENERATION_MODES.DISNEY_LIVE) {
    return generateOneImageAttempt({
      prompt,
      inputImageUrl,
      index,
      generationMode,
      presetKey,
      requestId,
      attempt: 0,
    });
  }

  const variantLabel = DISNEY_STYLE_VARIANTS[index]?.label || `결과 ${index + 1}`;
  let currentPrompt = prompt;
  let lastGateResult = null;
  let lastGenerated = null;

  for (let attempt = 0; attempt < DISNEY_QUALITY_GATE_MAX_ATTEMPTS; attempt += 1) {
    const generated = await generateOneImageAttempt({
      prompt: currentPrompt,
      inputImageUrl,
      index,
      generationMode,
      presetKey,
      requestId,
      attempt,
    });
    lastGenerated = generated;

    let gateResult;
    try {
      gateResult = await requestDisneyQualityGate({
        originalImage: originalImageUrl || inputImageUrl,
        candidateImage: generated.imageUrl,
        variantLabel,
        requestId,
        index,
      });
    } catch (error) {
      console.warn("[disney][quality-scoring-failed-soft-pass]", {
        requestId,
        index,
        variantLabel,
        message: error.message || String(error),
        status: error.status || null,
        response: error.response || null,
        imageUrl: generated.imageUrl,
      });

      return {
        ...generated,
        metadata: {
          ...generated.metadata,
          qualityGate: {
            overallScore: 0,
            rejected: false,
            reason: "Quality scoring failed; image kept.",
          },
          qualityScores: {
            overallScore: 0,
          },
          qualityGateError: error.message || String(error),
          qualityGateAttempts: attempt + 1,
        },
      };
    }
    lastGateResult = gateResult;

    console.log("[disney][quality-scores]", {
      requestId,
      index,
      variantLabel,
      attempt: attempt + 1,
      qualityScores: {
        faceSimilarityScore: gateResult.faceSimilarityScore,
        eyeIntegrityScore: gateResult.eyeIntegrityScore,
        facialFeatureIntegrityScore: gateResult.facialFeatureIntegrityScore,
        faceProportionScore: gateResult.faceProportionScore,
        expressionPreservationScore: gateResult.expressionPreservationScore,
        detailQualityScore: gateResult.detailQualityScore,
        posePreservationScore: gateResult.posePreservationScore,
        hairPreservationScore: gateResult.hairPreservationScore,
        backgroundStructureScore: gateResult.backgroundStructureScore,
        realismScore: gateResult.realismScore,
        conceptScore: gateResult.conceptScore,
        photorealQualityScore: gateResult.photorealQualityScore,
        overallScore: gateResult.overallScore,
        recommendationScore: gateResult.recommendationScore,
        overTransformationPenalty: gateResult.overTransformationPenalty,
      },
      rejected: gateResult.rejected,
      rejectReason: gateResult.rejectReason || gateResult.reason || "",
      imageUrl: generated.imageUrl,
    });

    const shouldRegenerateForFace = attempt < DISNEY_QUALITY_GATE_MAX_ATTEMPTS - 1
      && (
        gateResult.recommendationDisqualified === true
        || gateResult.rejected === true
        || gateResult.eyeIntegrityScore < 68
        || gateResult.facialFeatureIntegrityScore < 64
        || gateResult.faceProportionScore < 64
        || gateResult.faceSimilarityScore < 65
      );

    if (shouldRegenerateForFace) {
      console.warn("[disney][slot-face-regenerate-needed]", {
        requestId,
        index,
        variantLabel,
        attempt: attempt + 1,
        faceSimilarityScore: gateResult.faceSimilarityScore,
        eyeIntegrityScore: gateResult.eyeIntegrityScore,
        facialFeatureIntegrityScore: gateResult.facialFeatureIntegrityScore,
        faceProportionScore: gateResult.faceProportionScore,
        reason: gateResult.rejectReason || gateResult.reason || "",
        imageUrl: generated.imageUrl,
      });
      currentPrompt = buildDisneyRegenerationPrompt(prompt, gateResult);
      continue;
    }

    const shouldRegenerateForConcept = attempt < DISNEY_QUALITY_GATE_MAX_ATTEMPTS - 1
      && Number.isFinite(gateResult.conceptScore)
      && gateResult.conceptScore < 72;

    if (shouldRegenerateForConcept) {
      console.warn("[disney][slot-concept-regenerate-needed]", {
        requestId,
        index,
        variantLabel,
        attempt: attempt + 1,
        conceptScore: gateResult.conceptScore,
        reason: gateResult.rejectReason || gateResult.reason || "",
        imageUrl: generated.imageUrl,
      });
      currentPrompt = buildDisneyConceptRegenerationPrompt(prompt, gateResult, variantLabel);
      continue;
    }

    return {
      ...generated,
      metadata: {
        ...generated.metadata,
        qualityGate: gateResult,
        qualityScores: {
          faceSimilarityScore: gateResult.faceSimilarityScore,
          eyeIntegrityScore: gateResult.eyeIntegrityScore,
          facialFeatureIntegrityScore: gateResult.facialFeatureIntegrityScore,
          faceProportionScore: gateResult.faceProportionScore,
          expressionPreservationScore: gateResult.expressionPreservationScore,
          detailQualityScore: gateResult.detailQualityScore,
          posePreservationScore: gateResult.posePreservationScore,
          hairPreservationScore: gateResult.hairPreservationScore,
          backgroundStructureScore: gateResult.backgroundStructureScore,
          realismScore: gateResult.realismScore,
          conceptScore: gateResult.conceptScore,
          photorealQualityScore: gateResult.photorealQualityScore,
          overallScore: gateResult.overallScore,
          recommendationScore: gateResult.recommendationScore,
          overTransformationPenalty: gateResult.overTransformationPenalty,
          recommendationDisqualified: gateResult.recommendationDisqualified,
        },
        softRejected: gateResult.rejected,
        softRejectReason: gateResult.rejectReason || gateResult.reason || "",
        qualityGateAttempts: attempt + 1,
      },
    };
  }

  return {
    ...lastGenerated,
    metadata: {
      ...(lastGenerated?.metadata || {}),
      qualityGate: lastGateResult,
      qualityGateAttempts: DISNEY_QUALITY_GATE_MAX_ATTEMPTS,
    },
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "server is running",
    xaiKeyLoaded: Boolean(process.env.XAI_API_KEY),
    xaiImageModel: XAI_IMAGE_MODEL,
    xaiSelectionModel: XAI_SELECTION_MODEL,
  });
});

app.post("/api/generate", upload.single("image"), async (req, res) => {
  const tempFilePath = req.file?.path;
  let publicSourceFilePath = "";
  const requestId = crypto.randomUUID();
  const requestStartedAt = new Date().toISOString();
  const debugContext = {
    requestId,
    requestStartedAt,
    receivedMode: req.body?.mode || null,
    receivedPreset: req.body?.presetKey || null,
    receivedGenerationMode: req.body?.generationMode || null,
    uploadedFileName: req.file?.originalname || null,
    generationMode: null,
    presetKey: null,
    finalPrompt: null,
    finalPromptLength: 0,
    model: XAI_IMAGE_MODEL,
    provider: XAI_PROVIDER,
    tier: XAI_ACCOUNT_TIER,
    payload: null,
  };

  try {
    console.log("🎨 /api/generate 요청 도착", {
      requestStartedAt,
      requestId,
      receivedMode: debugContext.receivedMode,
      receivedPreset: debugContext.receivedPreset,
      receivedGenerationMode: debugContext.receivedGenerationMode,
      uploadedFileName: debugContext.uploadedFileName,
    });

    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "XAI_API_KEY가 .env에 없습니다.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "이미지 파일이 없습니다.",
      });
    }

    const rawPrompt = typeof req.body?.prompt === "string" && req.body.prompt.trim()
      ? req.body.prompt.trim()
      : "";
    const presetKey = typeof req.body?.presetKey === "string" && req.body.presetKey.trim()
      ? req.body.presetKey.trim()
      : "paris_eiffel";
    const generationMode = normalizeGenerationMode(req.body?.generationMode || req.body?.mode || req.body?.presetKey);
    const finalPrompt = rawPrompt || getGrokAgentInstruction(generationMode);
    debugContext.generationMode = generationMode;
    debugContext.presetKey = presetKey;
    console.log("[generate][request]", {
      generationMode,
      receivedMode: req.body?.mode || null,
      receivedGenerationMode: req.body?.generationMode || null,
      presetKey,
      requestedCount: req.body?.count,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      promptLength: finalPrompt.length,
    });
    console.log(`[generate][prompt][${generationMode}]\n${finalPrompt}`);

    if (!finalPrompt) {
      return res.status(400).json({
        success: false,
        error: "prompt가 필요합니다.",
      });
    }

    debugContext.finalPrompt = finalPrompt;
    debugContext.finalPromptLength = finalPrompt.length;
    const { publicFilePath, imageUrl: publicInputImageUrl, localImageUrl: originalImageUrl } = copyUploadToPublicUrl(tempFilePath, req.file);
    publicSourceFilePath = publicFilePath;
    const inputImageUrl = fileToDataUrl(tempFilePath, getMimeType(req.file));
    const requestedCount = Number.parseInt(req.body?.count, 10);
    const generationCount = generationMode === GENERATION_MODES.DISNEY_LIVE
      ? DISNEY_STYLE_VARIANTS.length
      : Number.isInteger(requestedCount)
        ? Math.min(Math.max(requestedCount, 1), GENERATE_COUNT)
        : GENERATE_COUNT;
    const generatedItems = [];
    const failedItems = [];

    console.log("[generate][original-image]", {
      requestId,
      originalImageUrl,
      publicInputImageUrl,
      grokInput: describeImageInput(inputImageUrl),
    });
    console.log("[generate][base-final-prompt]", {
      requestStartedAt,
      requestId,
      generationMode,
      presetKey,
      finalPromptLength: finalPrompt.length,
      provider: XAI_PROVIDER,
      model: XAI_IMAGE_MODEL,
      tier: XAI_ACCOUNT_TIER,
    });
    console.log(`[generate][base-final-prompt][${generationMode}]\n${finalPrompt}`);

    const generationVariants = getGenerationVariants(generationMode, presetKey);
    const prompts = Array.from({ length: generationCount }, (_, index) => buildGenerationPrompt(finalPrompt, {
      generationMode,
      presetKey,
      index,
    }));
    if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
      console.log("[disney] Disney generation start", {
        requestId,
        generationCount,
        slots: generationVariants.slice(0, generationCount).map((variant, index) => ({
          index,
          slotName: variant.label,
          promptSummary: prompts[index]?.slice(0, 320) || "",
        })),
      });
    }
    debugContext.finalPrompt = prompts[0] || finalPrompt;
    debugContext.finalPromptLength = debugContext.finalPrompt.length;
    debugContext.payload = {
      model: XAI_IMAGE_MODEL,
      image: {
        type: "image_url",
        url: describeImageInput(inputImageUrl),
      },
      n: 1,
      response_format: "b64_json",
      image_format: "base64",
      promptLengths: prompts.map((prompt) => prompt.length),
      promptPreview: prompts[0]?.slice(0, 800) || "",
    };
    console.log("[generate][prepared-prompts]", {
      generationMode,
      presetKey,
      generationCount,
      promptLengths: prompts.map((prompt) => prompt.length),
      variantLabels: generationVariants.map((variant) => variant.label),
    });
    console.log("[generate][xai-final-prompt]", {
      requestStartedAt,
      requestId,
      generationMode,
      presetKey,
      provider: XAI_PROVIDER,
      model: XAI_IMAGE_MODEL,
      tier: XAI_ACCOUNT_TIER,
      finalPromptLength: debugContext.finalPromptLength,
      maxPromptLength: XAI_MAX_PROMPT_LENGTH,
    });
    console.log(`[generate][xai-final-prompt][${generationMode}]\n${debugContext.finalPrompt}`);
    const generationResults = await Promise.allSettled(
      prompts.map((prompt, index) => generateOneImage({
        prompt,
        inputImageUrl,
        originalImageUrl,
        index,
        generationMode,
        presetKey,
        requestId,
      })),
    );

    for (const [index, result] of generationResults.entries()) {
      if (result.status === "fulfilled") {
        if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
          console.log("[disney][slot-api-success]", {
            requestId,
            index,
            slotName: generationVariants[index]?.label || `결과 ${index + 1}`,
            imageUrl: result.value.imageUrl,
            savedPath: result.value.imageUrl,
            qualityScores: result.value.metadata?.qualityScores || null,
            rejected: Boolean(result.value.metadata?.softRejected),
            rejectReason: result.value.metadata?.softRejectReason || "",
          });
        }
        console.log("[generate][image-succeeded]", {
          requestId,
          generationMode,
          presetKey,
          index,
          label: generationVariants[index]?.label || `결과 ${index + 1}`,
          imageUrl: result.value.imageUrl,
          storageSource: result.value.metadata?.storageSource || null,
          outputBytes: result.value.metadata?.outputBytes || null,
        });
        generatedItems.push({
          index,
          imageUrl: result.value.imageUrl,
          label: generationVariants[index]?.label || `결과 ${index + 1}`,
          metadata: result.value.metadata,
        });
      } else {
        if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
          console.error("[disney][slot-api-fail]", {
            requestId,
            index,
            slotName: generationVariants[index]?.label || `결과 ${index + 1}`,
            reason: result.reason?.message || String(result.reason),
            rawError: result.reason || null,
          });
        }
        console.error("[generate][image-failed]", {
          generationMode,
          presetKey,
          index,
          label: generationVariants[index]?.label || `결과 ${index + 1}`,
          message: result.reason?.message || String(result.reason),
          code: result.reason?.code || null,
          status: result.reason?.status || null,
          statusText: result.reason?.statusText || null,
          imageUrl: result.reason?.imageUrl || null,
          imageUrlHost: result.reason?.imageUrlHost || null,
          responseHeaders: result.reason?.responseHeaders || null,
          response: result.reason?.response || null,
          metadata: result.reason?.metadata || null,
          rawError: result.reason || null,
        });
        failedItems.push({
          index,
          label: generationVariants[index]?.label || `결과 ${index + 1}`,
          message: getFriendlyGenerationError(result.reason),
          status: result.reason?.status || null,
          statusText: result.reason?.statusText || null,
          imageUrl: result.reason?.imageUrl || null,
          imageUrlHost: result.reason?.imageUrlHost || null,
          metadata: result.reason?.metadata || null,
        });
      }
    }

    if (!generatedItems.length) {
      const firstError = generationResults.find((result) => result.status === "rejected")?.reason;
      const reasons = failedItems.map((item) => ({
        index: item.index,
        label: item.label,
        message: item.message,
        status: item.status,
        metadata: item.metadata,
      }));
      console.error("[disney] all results failed", {
        reasons,
        rawResults: generationResults,
      });
      console.error("[generate][all-images-failed]", {
        generationMode,
        presetKey,
        message: firstError?.message || String(firstError || ""),
        code: firstError?.code || null,
        status: firstError?.status || null,
        response: firstError?.response || null,
      });
      throw firstError || new Error("생성된 이미지가 없습니다.");
    }

    if (generationMode === GENERATION_MODES.DISNEY_LIVE && generatedItems.length > 1) {
      try {
        const diversityReview = await requestDisneyDiversityReview({
          generatedItems,
          requestId,
        });
        const slotsToRegenerate = (Array.isArray(diversityReview.slots) ? diversityReview.slots : [])
          .filter((slot) => slot?.shouldRegenerate === true)
          .map((slot) => Number.parseInt(slot.index, 10))
          .filter((index) => Number.isInteger(index) && index >= 0 && index < generationCount && generatedItems.some((item) => item.index === index));

        console.log("[disney][diversity-decision]", {
          requestId,
          needsRegeneration: diversityReview.needsRegeneration,
          reason: diversityReview.reason,
          slotsToRegenerate,
          slots: diversityReview.slots,
        });

        for (const index of slotsToRegenerate) {
          const slotReview = diversityReview.slots.find((slot) => Number.parseInt(slot.index, 10) === index) || {};
          const prompt = buildDisneyDiversityRegenerationPrompt(prompts[index], slotReview);

          try {
            console.log("[disney][slot-diversity-regenerate-start]", {
              requestId,
              index,
              slotName: generationVariants[index]?.label || `결과 ${index + 1}`,
              reason: slotReview.reason || diversityReview.reason || "",
              promptSummary: prompt.slice(0, 420),
            });
            const regenerated = await generateOneImage({
              prompt,
              inputImageUrl,
              originalImageUrl,
              index,
              generationMode,
              presetKey,
              requestId,
            });
            const replaceIndex = generatedItems.findIndex((item) => item.index === index);
            const replacement = {
              index,
              imageUrl: regenerated.imageUrl,
              label: generationVariants[index]?.label || `결과 ${index + 1}`,
              metadata: {
                ...regenerated.metadata,
                diversityRegenerated: true,
                diversityReason: slotReview.reason || diversityReview.reason || "",
              },
            };

            if (replaceIndex >= 0) {
              generatedItems[replaceIndex] = replacement;
            } else {
              generatedItems.push(replacement);
              generatedItems.sort((a, b) => a.index - b.index);
            }

            console.log("[disney][slot-diversity-regenerate-success]", {
              requestId,
              index,
              slotName: replacement.label,
              imageUrl: replacement.imageUrl,
              qualityScores: replacement.metadata?.qualityScores || null,
            });
          } catch (error) {
            console.error("[disney][slot-diversity-regenerate-failed-soft-keep]", {
              requestId,
              index,
              slotName: generationVariants[index]?.label || `결과 ${index + 1}`,
              message: error.message || String(error),
              response: error.response || null,
            });
          }
        }
      } catch (error) {
        console.warn("[disney][diversity-review-failed-soft-keep]", {
          requestId,
          message: error.message || String(error),
          status: error.status || null,
          response: error.response || null,
        });
      }
    }

    const scores = generatedItems.map((item) => Number(item.metadata?.qualityScores?.recommendationScore ?? item.metadata?.qualityGate?.recommendationScore ?? item.metadata?.qualityScores?.overallScore ?? item.metadata?.qualityGate?.overallScore ?? 0));
    const bestScorePosition = scores.reduce((bestIndex, score, index) => {
      const bestScore = scores[bestIndex] ?? Number.NEGATIVE_INFINITY;
      return score > bestScore ? index : bestIndex;
    }, 0);
    const recommendScores = generatedItems.map((item, position) => ({
      id: DISNEY_STYLE_VARIANTS[item.index]?.id || String(item.index),
      title: item.label,
      faceSimilarityScore: item.metadata?.qualityScores?.faceSimilarityScore ?? null,
      eyeIntegrityScore: item.metadata?.qualityScores?.eyeIntegrityScore ?? null,
      facialFeatureIntegrityScore: item.metadata?.qualityScores?.facialFeatureIntegrityScore ?? null,
      faceProportionScore: item.metadata?.qualityScores?.faceProportionScore ?? null,
      expressionPreservationScore: item.metadata?.qualityScores?.expressionPreservationScore ?? null,
      posePreservationScore: item.metadata?.qualityScores?.posePreservationScore ?? null,
      hairPreservationScore: item.metadata?.qualityScores?.hairPreservationScore ?? null,
      backgroundStructureScore: item.metadata?.qualityScores?.backgroundStructureScore ?? null,
      realismScore: item.metadata?.qualityScores?.realismScore ?? item.metadata?.qualityScores?.photorealQualityScore ?? null,
      conceptScore: item.metadata?.qualityScores?.conceptScore ?? null,
      totalScore: scores[position],
      penalty: item.metadata?.qualityScores?.overTransformationPenalty ?? 0,
      selected: position === bestScorePosition,
      disqualified: item.metadata?.qualityScores?.recommendationDisqualified ?? false,
    }));

    if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
      console.log("[disney recommend scores]", recommendScores);
    }

    const resultItems = Array.from({ length: generationCount }, (_, index) => {
      const successItem = generatedItems.find((item) => item.index === index);
      const failedItem = failedItems.find((item) => item.index === index);

      if (successItem) {
        return {
          ok: true,
          index,
          imageUrl: successItem.imageUrl,
          label: successItem.label,
        };
      }

      return {
        ok: false,
        index,
        error: "IMAGE_DOWNLOAD_FAILED",
        message: failedItem?.message || "이미지를 불러오는 중 문제가 발생했어요.",
        label: failedItem?.label || generationVariants[index]?.label || `결과 ${index + 1}`,
      };
    });
    const initialRecommendedImageUrl = generatedItems[0]?.imageUrl || "";
    const scoreRecommendedImageUrl = generatedItems[bestScorePosition]?.imageUrl || initialRecommendedImageUrl;

    console.log("[generate][storage-summary]", {
      requestId,
      generationMode,
      presetKey,
      successCount: generatedItems.length,
      failureCount: failedItems.length,
      originalImageUrl,
      initialRecommendedImageUrl,
      recommendedIndex: bestScorePosition,
      scoreRecommendedImageUrl,
      scores,
      results: resultItems,
    });
    if (generationMode === GENERATION_MODES.DISNEY_LIVE) {
      console.log("[disney] final displayed results count", {
        requestId,
        displayedResultsCount: generatedItems.length,
        failedResultsCount: failedItems.length,
        recommendedIndex: bestScorePosition,
        scores,
      });
    }
    console.log("[generate][slider-inputs]", {
      requestId,
      originalImageUrl,
      recommendedImageUrl: initialRecommendedImageUrl,
    });

    return res.json({
      ok: true,
      success: true,
      results: resultItems,
      originalImageUrl,
      imageUrls: generatedItems.map((item) => item.imageUrl),
      scores,
      variantLabels: generatedItems.map((item) => item.label),
      failedImages: failedItems,
      warningMessage: failedItems.length
        ? "일부 이미지를 불러오지 못했어요."
        : "",
      generationMode,
      generationMeta: {
        requestId,
        provider: XAI_PROVIDER,
        requestedModel: XAI_IMAGE_MODEL,
        actualModel: generatedItems[0]?.metadata?.actualModel || generatedItems[0]?.metadata?.resolvedModel || XAI_IMAGE_MODEL,
        resolvedModel: generatedItems[0]?.metadata?.resolvedModel || XAI_IMAGE_MODEL,
        tier: generatedItems[0]?.metadata?.tier || XAI_ACCOUNT_TIER,
        fallbackUsed: generatedItems.some((item) => item.metadata?.fallbackUsed),
        fallbackReason: generatedItems.find((item) => item.metadata?.fallbackReason)?.metadata?.fallbackReason || "",
        promptLength: generatedItems[0]?.metadata?.promptLength || prompts[0]?.length || 0,
        requestSeed: null,
      },
      imageMetadata: generatedItems.map((item) => ({
        index: item.index,
        label: item.label,
        ...item.metadata,
      })),
      recommendation: {
        status: "score_fallback",
        bestIndex: bestScorePosition,
      },
    });
  } catch (error) {
    const details = error?.response?.error || error?.response?.message || error?.message || String(error);
    const statusCode = Number.isInteger(error?.status) ? error.status : 500;

    console.error("❌ /api/generate 실패:", {
      ...debugContext,
      statusCode,
      details,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack || null,
      errorResponse: error?.response || null,
      errorMetadata: error?.metadata || null,
    });
    return res.status(500).json({
      ok: false,
      success: false,
      error: "IMAGE_GENERATION_FAILED",
      message: getFriendlyGenerationError(error),
      details,
      detail: details,
      mode: debugContext.generationMode || debugContext.receivedGenerationMode || null,
      statusCode,
      requestStartedAt,
      requestId,
      receivedMode: debugContext.receivedMode,
      receivedPreset: debugContext.receivedPreset,
      receivedGenerationMode: debugContext.receivedGenerationMode,
      uploadedFileName: debugContext.uploadedFileName,
      finalPrompt: debugContext.finalPrompt,
      finalPromptLength: debugContext.finalPromptLength,
      provider: debugContext.provider,
      model: debugContext.model,
      tier: debugContext.tier,
      fallbackUsed: error?.metadata?.fallbackUsed || false,
      fallbackReason: error?.metadata?.fallbackReason || "",
      payload: debugContext.payload,
      stack: error?.stack || null,
      response: error?.response || null,
      metadata: error?.metadata || null,
    });
  } finally {
    cleanupFiles([tempFilePath]);
  }
});

app.post("/api/grok/choose-best", async (req, res) => {
  const requestId = crypto.randomUUID();

  try {
    console.log("🧠 /api/grok/choose-best 요청 도착", { requestId });

    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "XAI_API_KEY가 .env에 없습니다.",
      });
    }

    const generationMode = normalizeGenerationMode(req.body?.mode || req.body?.generationMode);
    const originalImage = typeof req.body?.originalImage === "string" ? req.body.originalImage : "";
    const generatedImages = Array.isArray(req.body?.generatedImages)
      ? req.body.generatedImages.filter((image) => typeof image === "string" && image).slice(0, GENERATE_COUNT)
      : [];
    const prompt = typeof req.body?.prompt === "string" && req.body.prompt.trim()
      ? req.body.prompt.trim()
      : buildSelectionPrompt(generationMode);

    if (!originalImage || !generatedImages.length) {
      return res.status(400).json({
        success: false,
        error: "원본 1장과 결과 1장 이상이 필요합니다.",
      });
    }

    console.log("[grok-selection][request]", {
      requestId,
      generationMode,
      imageCount: generatedImages.length,
      promptLength: prompt.length,
      model: XAI_SELECTION_MODEL,
    });

    const data = await requestGrokSelection({
      generationMode,
      originalImage,
      generatedImages,
      prompt,
      requestId,
    });
    const parsed = safeJsonParse(extractXaiText(data)) || {};
    const selection = normalizeSelectionPayload(parsed, generatedImages.length, generationMode);

    console.log("✅ Grok 추천 완료:", {
      requestId,
      generationMode,
      selection,
      raw: parsed,
    });

    return res.json({
      success: true,
      selection,
      rawSelection: parsed,
      generationMode,
      provider: XAI_PROVIDER,
      model: XAI_SELECTION_MODEL,
    });
  } catch (error) {
    const fallbackMode = normalizeGenerationMode(req.body?.mode || req.body?.generationMode);
    const imageCount = Array.isArray(req.body?.generatedImages) ? Math.min(req.body.generatedImages.length, GENERATE_COUNT) : 0;
    const selection = normalizeSelectionPayload(null, imageCount || 1, fallbackMode);

    console.error("❌ /api/grok/choose-best 실패:", {
      requestId,
      message: error.message || String(error),
      status: error.status || null,
      response: error.response || null,
    });

    return res.json({
      success: true,
      selection,
      fallback: true,
      error: error.message || "Grok 추천 실패",
      generationMode: fallbackMode,
      provider: XAI_PROVIDER,
      model: XAI_SELECTION_MODEL,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 server running → http://localhost:${PORT}`);
  console.log(`🌐 test page → http://localhost:${PORT}/code.html`);
});
