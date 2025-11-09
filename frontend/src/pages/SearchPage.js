import "./SearchPage.css";
import SearchCompany from "../components/SearchCompany";
import BackgroundNetwork from "../components/BackgroundNetwork";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";


export default function SearchPage() {
    const [params] = useSearchParams();
const q = params.get("q") || "";

    useEffect(() => {
  if (!q) return;
// fetch with q here and render results
}, [q]);

  return (
    <section className="relative h-screen w-screen overflow-hidden flex items-center justify-center">
      <BackgroundNetwork />
      <div className="relative z-10">
        <SearchCompany />
      </div>
    </section>
  );
}





