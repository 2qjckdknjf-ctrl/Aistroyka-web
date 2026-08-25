import { ArrowRight, Building2, Camera, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41PilotButton } from "./V41PilotButton";
import { V41_ASSETS } from "./v41-assets";

export type HomeHeroCopy = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  lead: string;
  launchPilot: string;
  watchPlatform: string;
  humanControl: string;
  signalProgressTitle: string;
  signalProgressMeta: string;
  signalRiskTitle: string;
  signalRiskMeta: string;
  signalPhotoTitle: string;
  signalPhotoMeta: string;
  productAlt: string;
  heroAlt: string;
  syncLabel: string;
  syncDate: string;
};

export function HomeHero({ copy }: { copy: HomeHeroCopy }) {
  return (
    <section className="v41-hero">
      <img
        className="v41-hero-photo"
        src={V41_ASSETS.hero}
        alt={copy.heroAlt}
        width={1920}
        height={1080}
        fetchPriority="high"
      />
      <div className="v41-hero-shade" />
      <div className="v41-hero-grid v41-page">
        <div className="v41-hero-copy">
          <p className="v41-eyebrow">{copy.eyebrow}</p>
          <h1>
            {copy.titleLine1}
            <br />
            {copy.titleLine2}
          </h1>
          <p className="v41-hero-lead">{copy.lead}</p>
          <div className="v41-hero-actions">
            <V41PilotButton testId="cta.public.home.hero.launch-pilot">
              {copy.launchPilot} <ArrowRight size={19} />
            </V41PilotButton>
            <Link className="v41-btn v41-btn-secondary" href="#platform">
              {copy.watchPlatform}
            </Link>
          </div>
          <p className="v41-human-control">
            <ShieldCheck size={21} /> {copy.humanControl}
          </p>
        </div>
        <div className="v41-site-lens" aria-label={copy.syncLabel}>
          <div className="v41-signal v41-signal-blue v41-glass">
            <Building2 size={20} />
            <span>
              <strong>{copy.signalProgressTitle}</strong>
              <small>{copy.signalProgressMeta}</small>
            </span>
          </div>
          <div className="v41-signal v41-signal-yellow v41-glass">
            <TriangleAlert size={20} />
            <span>
              <strong>{copy.signalRiskTitle}</strong>
              <small>{copy.signalRiskMeta}</small>
            </span>
          </div>
          <div className="v41-signal v41-signal-green v41-glass">
            <Camera size={20} />
            <span>
              <strong>{copy.signalPhotoTitle}</strong>
              <small>{copy.signalPhotoMeta}</small>
            </span>
          </div>
        </div>
        <div className="v41-product-window v41-glass">
          <img src={V41_ASSETS.commandCenter} alt={copy.productAlt} width={1280} height={800} />
          <div className="v41-product-window-meta">
            <span>
              <span className="v41-live-dot" /> {copy.syncLabel}
            </span>
            <span>{copy.syncDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
