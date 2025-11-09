import "./SearchPage.css";
import SearchCompany from "../components/SearchCompany";
import BackgroundNetwork from "../components/BackgroundNetwork";

export default function SearchPage() {
  return (
    <section className="relative h-screen w-screen overflow-hidden flex items-center justify-center">
      <BackgroundNetwork />
      <div className="relative z-10">
        <SearchCompany />
      </div>
    </section>
  );
}
