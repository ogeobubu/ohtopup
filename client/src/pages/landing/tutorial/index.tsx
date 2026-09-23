import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiArrowUpRight, FiClock, FiBook, FiPlay } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";
import { getAllTutorials, getTutorialCategories } from "../../../api";

const primaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark nav:gap-4 nav:px-[19px] nav:text-sm';
const secondaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint nav:gap-4 nav:px-[19px] nav:text-sm';
const lightBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa] nav:gap-4 nav:px-[19px] nav:text-sm';
const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm nav:gap-4';
const eyebrow = 'mb-[22px] text-[9px] font-semiboldish tracking-[1.4px] leading-relaxed nav:text-[10px] nav:tracking-[1.7px]';
const field = 'min-h-[46px] rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
const empty = 'rounded-lg border border-line bg-paper p-12 text-center';
const chip = 'inline-flex min-h-auto items-center rounded-md border px-3.5 py-2 text-xs font-semibold transition';
const heroH1 = 'm-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]';
const heroP = 'my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]';
const heroActions = 'flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]';
const heroSection =
  'mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]';

const TutorialPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("name");

  const { data: tutorialsData, error: tutorialsError, isLoading: tutorialsLoading } = useQuery({
    queryKey: ["tutorials"],
    queryFn: getAllTutorials,
  });
  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useQuery({
    queryKey: ["tutorialCategories"],
    queryFn: getTutorialCategories,
  });

  const tutorials = tutorialsData?.tutorials ?? [];
  const categories = categoriesData?.categories ?? [];
  const isLoading = tutorialsLoading || categoriesLoading;
  const error = tutorialsError || categoriesError;

  const filteredTutorials = useMemo(() => {
    const byCategory = activeCategory === "all" ? tutorials : tutorials.filter((t) => t.category === activeCategory);
    const bySearch = searchTerm
      ? byCategory.filter(
          (t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : byCategory;
    return [...bySearch].sort((a, b) =>
      sort === "duration" ? (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0) : a.title.localeCompare(b.title),
    );
  }, [tutorials, activeCategory, searchTerm, sort]);

  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className={heroSection}>
          <div className="min-w-0">
            <p className={eyebrow}>
              <span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> HELP CENTRE
            </p>
            <h1 className={heroH1}>
              Learn how<br />OhTopUp works.
            </h1>
            <p className={heroP}>Step-by-step guides to help you make the most of our platform.</p>
            <div className={heroActions}>
              <Link to="/create" className={primaryBtn}>
                Create your account <FiArrowRight className="shrink-0" />
              </Link>
              <Link to="/pricing" className={textLink}>
                Browse data plans <FiArrowUpRight className="shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto box-border w-full max-w-app px-4 pb-24 nav:px-10">
          {isLoading ? (
            <div className={empty} role="status">
              <p className="text-muted">Loading tutorials…</p>
            </div>
          ) : error ? (
            <div className={empty}>
              <h3 className="mb-2 text-lg font-semibold">We couldn&apos;t load tutorials.</h3>
              <p className="mb-4 text-sm text-muted">{(error as Error).message || "Please try again later."}</p>
              <button className={secondaryBtn} onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-center gap-2.5">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tutorials…"
                  className={`${field} min-w-0 flex-[1_1_200px] max-w-[320px]`}
                />
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className={`${field} flex-[0_1_180px]`}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${field} flex-[0_1_160px]`}>
                  <option value="name">Sort by Name</option>
                  <option value="duration">Sort by Duration</option>
                </select>
                <span className="text-xs text-muted">{filteredTutorials.length} found</span>
              </div>

              {categories.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`${chip} ${activeCategory === "all" ? "border-transparent bg-accent text-white" : "border-line bg-paper text-ink hover:bg-tint"}`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`${chip} ${activeCategory === c.id ? "border-transparent bg-accent text-white" : "border-line bg-paper text-ink hover:bg-tint"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {filteredTutorials.length === 0 ? (
                <div className={empty}>
                  <h3 className="mb-2 text-lg font-semibold">No tutorials found.</h3>
                  <p className="mb-4 text-sm text-muted">Try adjusting your search or browse all categories.</p>
                  <button
                    className={secondaryBtn}
                    onClick={() => {
                      setActiveCategory("all");
                      setSearchTerm("");
                    }}
                  >
                    View all
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 min-w-0 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                  {filteredTutorials.map((tutorial) => (
                    <div
                      key={tutorial.id || tutorial._id}
                      className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-paper"
                    >
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-b border-line p-5 nav:p-[22px_24px]">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-tint px-2 py-0.5 text-[11px] font-semibold text-accent">
                            {tutorial.difficulty || "Beginner"}
                          </span>
                          {tutorial.popular && (
                            <span className="rounded bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col px-6 py-4">
                        <h3 className="mb-2 text-[15px] font-semibold">{tutorial.title}</h3>
                        <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted">{tutorial.description}</p>
                        <div className="mb-4 flex items-center gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <FiClock /> {tutorial.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiBook /> {tutorial.type || "article"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/tutorial/${tutorial.id || tutorial._id}`)}
                            className="inline-flex min-h-auto flex-1 items-center justify-center gap-2 rounded-md border border-transparent bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dark"
                          >
                            <FiPlay /> Start
                          </button>
                          <button
                            onClick={() => navigate(`/tutorial/${tutorial.id || tutorial._id}`)}
                            className="inline-flex min-h-auto items-center justify-center rounded-md border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink transition hover:bg-tint"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="mx-auto box-border w-full max-w-app px-4 pb-24 nav:px-10">
          <p className={eyebrow}>NEED HELP?</p>
          <h2 className="mb-[22px] text-[26px] font-medium leading-tight tracking-[-1.3px] nav:text-4xl">
            Still have questions?
          </h2>
          <p className="mb-[25px] max-w-[425px] text-sm leading-[1.8] text-muted">
            Our tutorials are designed to be beginner-friendly. Start with the getting-started guides and work your way through.
          </p>
          <div className="flex flex-wrap gap-5">
            <Link to="/create" className={primaryBtn}>
              Create an account <FiArrowRight className="shrink-0" />
            </Link>
            <Link to="/about" className={textLink}>
              Learn about us <FiArrowUpRight className="shrink-0" />
            </Link>
          </div>
        </section>

        <section className="bg-night py-8 text-white nav:py-14">
          <div className="mx-auto box-border flex w-full max-w-app flex-col items-start gap-4 px-4 nav:flex-row nav:items-center nav:justify-between nav:gap-[30px] nav:px-10">
            <div>
              <p className="mb-3 text-[9px] font-semiboldish tracking-[1.4px] text-[#b6c5d4] nav:text-[10px] nav:tracking-[1.7px]">
                READY TO START?
              </p>
              <h2 className="m-0 text-[26px] font-medium tracking-[-0.5px] nav:text-[34px] nav:tracking-[-1px]">
                One less thing on your list.
              </h2>
            </div>
            <Link to="/create" className={lightBtn}>
              Create an account <FiArrowRight className="shrink-0" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TutorialPage;
