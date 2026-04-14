export function generateImageUrl(prompt: string, style?: string, size: string = '512x512'): { imgUrl: string, seed: number } {
  const [w, h] = size.split('x');
  const fullPrompt = style ? `${prompt}, ${style}` : prompt;
  const seed = Math.floor(Math.random() * 999999);
  const enc = encodeURIComponent(fullPrompt);
  
  const imgUrl = `https://image.pollinations.ai/prompt/${enc}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;
  return { imgUrl, seed };
}
