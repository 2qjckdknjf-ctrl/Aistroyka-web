export function ProductWindow({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="v43-product v41-glass">
      <img src={src} alt={alt} width={1280} height={800} />
    </figure>
  );
}

export function ConstructionMedia({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="v43-media v41-glass">
      <img src={src} alt={alt} width={1200} height={800} />
    </figure>
  );
}
