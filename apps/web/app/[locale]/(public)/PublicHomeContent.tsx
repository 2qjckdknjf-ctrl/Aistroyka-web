import { getTranslations } from "next-intl/server";
import {
  AiAnalytics,
  FeatureGrid,
  HomeHero,
  OutcomeStrip,
  PilotCta,
  ProductStory,
  RoleSolutions,
  SecuritySection,
  Workflow,
} from "@/components/public/v41";

export async function PublicHomeContent() {
  const t = await getTranslations("public.v41");

  return (
    <>
      <HomeHero
        copy={{
          eyebrow: t("heroEyebrow"),
          titleLine1: t("heroTitle1"),
          titleLine2: t("heroTitle2"),
          lead: t("heroLead"),
          launchPilot: t("launchPilot"),
          watchPlatform: t("watchPlatform"),
          humanControl: t("humanControl"),
          signalProgressTitle: t("signalProgressTitle"),
          signalProgressMeta: t("signalProgressMeta"),
          signalRiskTitle: t("signalRiskTitle"),
          signalRiskMeta: t("signalRiskMeta"),
          signalPhotoTitle: t("signalPhotoTitle"),
          signalPhotoMeta: t("signalPhotoMeta"),
          productAlt: t("commandCenterAlt"),
          heroAlt: t("heroAlt"),
          syncLabel: t("syncLabel"),
          syncDate: t("syncDate"),
        }}
      />
      <OutcomeStrip
        ariaLabel={t("outcomesLabel")}
        items={[
          { value: t("outcome1Value"), label: t("outcome1Label") },
          { value: t("outcome2Value"), label: t("outcome2Label") },
          { value: t("outcome3Value"), label: t("outcome3Label") },
          { value: t("outcome4Value"), label: t("outcome4Label") },
        ]}
      />
      <Workflow
        copy={{
          eyebrow: t("workflowEyebrow"),
          title: t("workflowTitle"),
          lead: t("workflowLead"),
          steps: [
            { n: "01", title: t("step1Title"), text: t("step1Text") },
            { n: "02", title: t("step2Title"), text: t("step2Text") },
            { n: "03", title: t("step3Title"), text: t("step3Text") },
          ],
        }}
      />
      <ProductStory
        copy={{
          eyebrow: t("storyEyebrow"),
          title: t("storyTitle"),
          lead: t("storyLead"),
          points: [t("storyPoint1"), t("storyPoint2"), t("storyPoint3")],
          linkLabel: t("storyLink"),
          caption: t("storyCaption"),
          imageAlt: t("commandCenterAlt"),
        }}
      />
      <FeatureGrid
        copy={{
          eyebrow: t("featuresEyebrow"),
          title: t("featuresTitle"),
          lead: t("featuresLead"),
          items: [
            { title: t("feature1Title"), text: t("feature1Text") },
            { title: t("feature2Title"), text: t("feature2Text") },
            { title: t("feature3Title"), text: t("feature3Text") },
            { title: t("feature4Title"), text: t("feature4Text") },
          ],
        }}
      />
      <AiAnalytics
        copy={{
          eyebrow: t("aiEyebrow"),
          title: t("aiTitle"),
          lead: t("aiLead"),
          findingTitle: t("aiFindingTitle"),
          findingMeta: t("aiFindingMeta"),
          linkLabel: t("aiLink"),
          imageAlt: t("aiImageAlt"),
        }}
      />
      <RoleSolutions
        copy={{
          eyebrow: t("rolesEyebrow"),
          title: t("rolesTitle"),
          lead: t("rolesLead"),
          roles: [
            {
              eyebrow: t("role1Eyebrow"),
              title: t("role1Title"),
              text: t("role1Text"),
              points: [t("role1Point1"), t("role1Point2"), t("role1Point3")],
            },
            {
              eyebrow: t("role2Eyebrow"),
              title: t("role2Title"),
              text: t("role2Text"),
              points: [t("role2Point1"), t("role2Point2"), t("role2Point3")],
            },
            {
              eyebrow: t("role3Eyebrow"),
              title: t("role3Title"),
              text: t("role3Text"),
              points: [t("role3Point1"), t("role3Point2"), t("role3Point3")],
            },
          ],
        }}
      />
      <SecuritySection
        copy={{
          eyebrow: t("securityEyebrow"),
          title: t("securityTitle"),
          lead: t("securityLead"),
          linkLabel: t("securityLink"),
          points: [
            { title: t("securityPoint1Title"), text: t("securityPoint1Text") },
            { title: t("securityPoint2Title"), text: t("securityPoint2Text") },
            { title: t("securityPoint3Title"), text: t("securityPoint3Text") },
          ],
        }}
      />
      <PilotCta
        copy={{
          eyebrow: t("pilotEyebrow"),
          title: t("pilotTitle"),
          lead: t("pilotLead"),
          launchPilot: t("launchPilot"),
          contact: t("contactUs"),
          note: t("pilotNote"),
        }}
      />
    </>
  );
}
