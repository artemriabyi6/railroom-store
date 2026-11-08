import { ContentPage } from "@/components/layout/ContentPage";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { ButtonLink } from "@/components/ui/Button";

/** Global 404 (unknown URLs and notFound() anywhere). Renders inside the root layout, so it brings the store chrome itself. */
export default function NotFound() {
  return (
    <SiteFrame>
      <ContentPage eyebrow="404" title="Not on the rail" intro="This page doesn't exist, or the piece you're looking for has sold out and been taken down.">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ButtonLink href="/">Back to the rail</ButtonLink>
        </div>
      </ContentPage>
    </SiteFrame>
  );
}
