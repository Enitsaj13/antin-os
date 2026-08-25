export function setDocumentMetadata(title: string, description: string) {
  document.title = title;

  let descriptionMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );

  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta');
    descriptionMeta.name = 'description';
    document.head.append(descriptionMeta);
  }

  descriptionMeta.content = description;
}
