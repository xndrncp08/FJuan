import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fill-2 text-label-2">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 text-title-1 text-paper">Off the racing line</h1>
      <p className="mt-3 max-w-md text-body text-label-2">That page doesn’t exist, or it moved. Try searching, or head back to the start.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="filled">
          Home
        </ButtonLink>
        <ButtonLink href="/search">Search</ButtonLink>
      </div>
    </Container>
  );
}
