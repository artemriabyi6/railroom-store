import { ContentPage } from "@/components/layout/ContentPage";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <ContentPage eyebrow="404" title="Not on the rail" intro="This page doesn't exist, or the piece you're looking for has sold out and been taken down.">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ButtonLink href="/">Back to the rail</ButtonLink>
      </div>
    </ContentPage>
  );
}
