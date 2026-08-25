export function ProductWindow({
  src,
  alt,
  objectPosition,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
}) {
  return (
    <figure className="v43-product v41-glass">
      <img src={src} alt={alt} width={1280} height={800} style={objectPosition ? { objectPosition } : undefined} />
    </figure>
  );
}

export function ConstructionMedia({
  src,
  alt,
  objectPosition,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
}) {
  return (
    <figure className="v43-media v41-glass">
      <img src={src} alt={alt} width={1200} height={800} style={objectPosition ? { objectPosition } : undefined} />
    </figure>
  );
}
