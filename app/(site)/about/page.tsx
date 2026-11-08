import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { ContentPage, Prose } from "@/components/layout/ContentPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${siteConfig.name}: small runs, heavy fabrics, sold straight off the rail.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About" title={`${siteConfig.name}`} intro="Clothes made in small runs and sold straight off the rail.">
      <Prose>
        <p>
          {siteConfig.name} started as one rail in a shared studio. Friends would walk in, pull a shirt off the bar, turn it around and try it on.
          This site works the same way: every piece hangs on the rail, and you can turn it to see the front and the back.
        </p>
        <h2>How we make</h2>
        <p>
          Each style is cut in a run of a few hundred pieces or fewer. We use heavy cottons, brushed flannels and dense fleeces, and we finish the
          details by hand: piping, labels and buttons. When a size sells out it&apos;s usually gone for good.
        </p>
        <h2>What we stand for</h2>
        <ul>
          <li>Small runs, no overstock.</li>
          <li>Fabrics chosen to last years, not seasons.</li>
          <li>Honest sizing, with flat measurements for every size.</li>
        </ul>
        <p>
          Questions? Use the chat button in the corner and a real person will reply by email.
        </p>
        <div>
          <ButtonLink href="/" variant="outline">
            Back to the rail
          </ButtonLink>
        </div>
      </Prose>
    </ContentPage>
  );
}
