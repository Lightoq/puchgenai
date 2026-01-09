
// This file is to declare global variables available from CDNs.

interface Mammoth {
  extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}

declare global {
  const mammoth: Mammoth;
}

// Export something to make it a module
export const { mammoth } = (window as any);
