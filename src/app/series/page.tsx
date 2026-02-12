import { Suspense } from "react";
import SeriesContent from "@/components/series/SeriesContent";

export default function SeriesPage() {
   return (
     <Suspense>
       <SeriesContent />
     </Suspense>
   );
}
