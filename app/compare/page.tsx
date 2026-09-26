import { Suspense } from "react";
import CompareClient from "./CompareClient";

export const metadata = { title: "Compare drivers" };

// useSearchParams needs a Suspense boundary so the rest of the page can prerender.
export default function ComparePage() {
  return (
    <Suspense>
      <CompareClient />
    </Suspense>
  );
}
