import { renderWatermarkedImage, shouldShowWatermarkOverlay } from "../components/watermarked-image.js";
import { escapeHtml } from "../services/format.js";

export function renderUploadedGalleryPage(galleryImages = []) {
  if (galleryImages.length === 0) {
    return `
      <section class="w-full flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span class="material-symbols-outlined text-[48px] text-on-surface-variant">image_not_supported</span>
        <p class="font-display text-[22px] text-on-surface">아직 업로드된 결과물이 없어요.</p>
        <p class="text-sm text-on-surface-variant">AI 생성 결과를 스타일 갤러리에 업로드해보세요!</p>
      </section>
    `;
  }

  // Create masonry-style layout with varied sizes
  const masonryItems = galleryImages.map((image, index) => {
    // Vary sizes: some larger, some smaller
    const sizeVariants = ['col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-2 row-span-1', 'col-span-1 row-span-2'];
    const size = sizeVariants[index % sizeVariants.length];
    
    return `
      <article class="rounded-[20px] overflow-hidden glass-panel glow-shadow cursor-pointer transition-transform hover:scale-105 group ${size}" data-gallery-image-url="${escapeHtml(image.imageUrl)}" data-gallery-image-title="${escapeHtml(image.title || 'Uploaded Result')}">
        <div class="relative w-full h-full">
          ${renderWatermarkedImage({
            src: image.imageUrl,
            alt: image.title || "Uploaded Result",
            imageClassName: "absolute inset-0 w-full h-full object-cover",
            showWatermark: shouldShowWatermarkOverlay(image),
            compact: true,
          }).replace("<img ", "<img loading=\"lazy\" ")}
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="material-symbols-outlined text-[32px] text-white">search</span>
          </div>
          ${image.createdAt ? `
            <div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              ${new Date(image.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="w-full grid auto-rows-[140px] md:auto-rows-[180px] gap-2 grid-cols-4 md:grid-cols-6">
      ${masonryItems}
    </section>
  `;
}
