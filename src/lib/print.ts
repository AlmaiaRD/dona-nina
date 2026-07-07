export async function captureElementAsCanvas(
  el: HTMLElement,
  width: number = 800
): Promise<HTMLCanvasElement> {
  const domtoimage = await import("dom-to-image-more");
  const canvas = await domtoimage.toCanvas(el, { scale: 2, width });
  return canvas;
}

export async function canvasToPDF(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const jspdfModule = await import("jspdf");
  const pdf = new jspdfModule.default({
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

export async function canvasToJPG(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
}

export async function canvasToPDFBase64(
  canvas: HTMLCanvasElement
): Promise<string> {
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const jspdfModule = await import("jspdf");
  const pdf = new jspdfModule.default({
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  return pdf.output("datauristring").split(",")[1];
}

export async function buildElement(
  html: string,
  width: number = 800
): Promise<HTMLElement> {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:0;left:0;z-index:9999;background:#fff;width:${width}px;padding:32px;font-family:system-ui,sans-serif;font-size:16px;`;
  el.innerHTML = html;
  document.body.appendChild(el);
  await new Promise((r) => setTimeout(r, 500));
  return el;
}

export async function captureAndSaveAsPDF(
  html: string,
  filename: string,
  width: number = 800
): Promise<void> {
  const el = await buildElement(html, width);
  try {
    const canvas = await captureElementAsCanvas(el, width);
    await canvasToPDF(canvas, filename);
  } finally {
    document.body.removeChild(el);
  }
}

export async function captureAndSaveAsJPG(
  html: string,
  filename: string,
  width: number = 800
): Promise<void> {
  const el = await buildElement(html, width);
  try {
    const canvas = await captureElementAsCanvas(el, width);
    await canvasToJPG(canvas, filename);
  } finally {
    document.body.removeChild(el);
  }
}

export async function captureAsPDFBase64(
  el: HTMLElement,
  width: number = 800
): Promise<string> {
  const canvas = await captureElementAsCanvas(el, width);
  return canvasToPDFBase64(canvas);
}
