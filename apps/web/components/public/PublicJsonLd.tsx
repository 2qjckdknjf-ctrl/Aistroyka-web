type PublicJsonLdProps = {
  data: Record<string, unknown>;
};

export function PublicJsonLd({ data }: PublicJsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
