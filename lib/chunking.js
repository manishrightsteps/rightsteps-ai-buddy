export function chunkDocument(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentChunk = '';
  let currentSize = 0;

  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    const sentenceSize = sentenceWithPunctuation.length;

    if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        size: currentSize
      });

      // Create overlap with previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6)); // Approximate word count for overlap
      currentChunk = overlapWords.join(' ') + ' ' + sentenceWithPunctuation;
      currentSize = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
      currentSize += sentenceSize + (currentChunk ? 1 : 0);
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      size: currentSize
    });
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    id: index,
    chunkIndex: index
  }));
}

export function generateChunkId(fileName, chunkIndex) {
  return `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_chunk_${chunkIndex}`;
}