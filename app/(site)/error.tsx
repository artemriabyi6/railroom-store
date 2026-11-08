"use client";

import { useEffect } from "react";
import { ContentPage } from "@/components/layout/ContentPage";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ContentPage eyebrow="Error" title="Something went wrong" intro="Please try again. If the problem continues, contact us using the chat button.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Back to the rail
        </ButtonLink>
      </div>
    </ContentPage>
  );
}
