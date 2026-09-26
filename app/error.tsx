"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-title-1 text-paper">Something went wrong</h1>
      <p className="mt-3 max-w-md text-body text-label-2">
        One of the data sources didn’t answer in time. It’s usually temporary — try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="filled" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/">Home</ButtonLink>
      </div>
    </Container>
  );
}
