import { GoogleGenAI } from "@google/genai";
import { TearingStyle } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to find closest supported aspect ratio string
const getBestAspectRatio = (ratio: number): string => {
  const supportedRatios = [
    { label: "1:1", value: 1.0 },
    { label: "3:4", value: 3/4 },
    { label: "4:3", value: 4/3 },
    { label: "9:16", value: 9/16 },
    { label: "16:9", value: 16/9 },
  ];

  // Find the ratio with minimal difference
  const best = supportedRatios.reduce((prev, curr) => {
    return (Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev);
  });

  return best.label;
};

// Simple helper to get width/height of a dataURL to confirm ratio
const getImageRatio = (base64Str: string): Promise<number> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width / img.height);
        img.onerror = () => resolve(1.0); // Fallback
        img.src = base64Str;
    });
};

const getPromptForStyle = (style: TearingStyle): string => {
  switch (style) {
    case TearingStyle.WILD:
      return "Torn Fabric Effect. The edges of the clothing are ragged and frayed, looking like they were violently ripped open.";
    case TearingStyle.BURNT:
      return "Burnt Edges. The clothing borders are charred, blackened, and ash-covered, as if burned away to reveal the skin/layer below.";
    case TearingStyle.CLAW:
      return "Slash Marks. Clean, sharp diagonal cuts through the fabric, as if slashed by claws or a blade.";
    case TearingStyle.MELTING:
      return "Surreal Melting. The fabric edges are dripping and dissolving into liquid, creating a surreal opening.";
    case TearingStyle.GEOMETRIC:
      return "Digital Cutout. The clothing is removed in clean, sharp geometric/polygonal shapes, like a digital glitch or low-poly hole.";
    case TearingStyle.PAPER:
      return "Paper-Cut Collage Style. The torn section features wide, roughly-edged white slits reminiscent of a paper-cut collage. The edges are white and fibrous, exactly like a glossy photograph that has been physically torn by hand.";
    default:
      return "Torn edges revealing the layer underneath.";
  }
};

export const generateMousatsuImage = async (
  apiKey: string,
  baseImageBase64: string,
  maskImageBase64: string,
  style: TearingStyle
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Determine aspect ratio from the provided base image (which should be pre-cropped now)
  let aspectRatio = "1:1";
  try {
    const ratio = await getImageRatio(baseImageBase64);
    aspectRatio = getBestAspectRatio(ratio);
    console.log(`Sending image with ratio: ${ratio.toFixed(2)}, requesting AspectRatio: ${aspectRatio}`);
  } catch (e) {
    console.warn("Failed to detect image dimensions, defaulting to 1:1", e);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean base64 strings if they have prefixes
  const cleanBaseImage = baseImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const cleanMaskImage = maskImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const promptText = `
    Task: Artistic Inpainting & Collage Fashion Design.
    
    **OBJECTIVE**:
    Create a high-fashion "Cutout" effect in the masked area (Red pixels).
    Digitally remove the top layer (clothing) to reveal the layer underneath (skin or inner wear), simulating a torn paper collage or fashion cutout.

    **NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN)**:
    - NO Hairstyle changes.
    - NO Background changes.
    - NO Composition changes.
    - NO Pose changes.
    - Do NOT generate external objects (flowers, smoke) unless specified by style.
    - Do NOT distort the original face features.

    **CRITICAL ALIGNMENT RULES (HIGHEST PRIORITY)**:
    1. **SKELETAL INTEGRITY**: The revealed body parts MUST align perfectly with the character's skeleton. 
       - The navel must be on the centerline.
       - The chest volume must follow the perspective of the torso.
       - If the body is twisted, the skin/muscles must show that twist.
    2. **VOLUME & DEPTH**: The skin lies *beneath* the clothes. Do NOT paint the skin floating above the clothes. The revealed surface must follow the curvature of the body implied by the clothing.
    3. **NO RE-SHAPING**: Do NOT change the waist size, hip width, or shoulder width. Follow the silhouette of the original image exactly.

    **INPUTS**:
    - **Base Image**: Reference for Pose, Lighting, Perspective, and Art Style.
    - **Mask Image**: The RED area indicates the specific fabric to remove.

    **CONTENT TO REVEAL (IN THE MASKED AREA)**:
    - **Analyzed Context**:
      - If *School Uniform*: Reveal white cotton underwear or simple lingerie.
      - If *Fantasy/Armor*: Reveal leather strapping or bare skin.
      - If *Swimsuit/Sportswear*: Reveal bare skin.
      - *Default*: Reveal anatomically correct BARE SKIN or matching LINGERIE.
    - **Requirement**: The revealed layer must be strictly Bare Skin or Underwear/Lingerie. No outer clothes.

    **STYLE MATCHING**:
    - **Exact Art Style**: If the Base Image is Anime, the result MUST be Anime style. If Realism, use realistic textures.
    - **Seamless Blending**: The lighting on the revealed skin must match the global lighting direction and intensity.

    **TEARING STYLE**:
    ${getPromptForStyle(style)}
    
    **EXECUTION**:
    Output the full image with the mask area replaced. The result must look like a "Mousatsu" collage where the clothes are torn open to reveal the body, preserving the rest of the image perfectly.
  `;

  // Retry Logic for 503 Errors
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: cleanBaseImage,
              },
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: cleanMaskImage,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio, // Dynamically set based on input image
            imageSize: "1K",
          },
        },
      });

      // Extract image from response with robust checks
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];

        // Check for Safety Block explicitly
        if (candidate.finishReason === 'SAFETY') {
          console.warn("Safety Block Triggered:", candidate);
          throw new Error("セーフティフィルターにより生成がブロックされました。露出が多すぎるか、不適切な領域と判断された可能性があります。別の領域またはスタイルを試してください。");
        }

        let textResponse = "";
        let hasImage = false;

        // Check content parts
        if (candidate.content && Array.isArray(candidate.content.parts)) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
            if (part.text) {
              textResponse += part.text;
            }
          }
        }

        // If we found text but no image, treat it as a refusal/error
        if (textResponse) {
             console.warn("Model returned text instead of image:", textResponse);
             // Often text is "I cannot generate..."
             throw new Error(`モデルが画像生成を行いませんでした。: "${textResponse.slice(0, 100)}..."`);
        }
        
        // If finishReason is not STOP and no content
         if (candidate.finishReason !== 'STOP') {
             throw new Error(`生成が完了しませんでした (Finish Reason: ${candidate.finishReason})`);
         }
      }

      // If we got a response but no image data found (and not safety blocked), throw generic error
      throw new Error("画像データがレスポンスに含まれていませんでした。");

    } catch (error: any) {
      console.error(`Gemini API Attempt ${attempt + 1} Error:`, error);

      // Check for 503 (Service Unavailable) or 429 (Too Many Requests) or general "Overloaded" messages
      const isOverloaded = 
        error.code === 503 || 
        error.status === 503 ||
        error.message?.includes('overloaded') ||
        error.message?.includes('503');

      if (isOverloaded && attempt < maxRetries - 1) {
        attempt++;
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Model overloaded. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      // Check specifically for Safety errors thrown above to pass them through directly
      if (error.message && (error.message.includes("セーフティフィルター") || error.message.includes("モデルが画像生成"))) {
        throw error;
      }

      // For other errors or final attempt failure
      if (attempt === maxRetries - 1) {
        if (isOverloaded) {
          throw new Error("サーバーが混み合っています。しばらく時間をおいてから再度お試しください。(503 Overloaded)");
        }
        throw new Error("画像生成中にエラーが発生しました: " + (error.message || "Unknown error"));
      }
      
      // If it's not a retry-able error, throw immediately
      throw error;
    }
  }

  throw new Error("予期せぬエラーが発生しました。");
};