function safeFilePart(value) {
  return String(value || 'document')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getIripFilename(learnerName, extension) {
  return `${safeFilePart(learnerName)}-IRIP.${extension}`;
}
