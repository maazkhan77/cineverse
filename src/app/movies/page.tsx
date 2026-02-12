import { Suspense } from "react";
import MoviesContent from "@/components/movies/MoviesContent";

export default function MoviesPage() {
   return (
     <Suspense>
       <MoviesContent />
     </Suspense>
   );
}
