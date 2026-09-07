import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiArrowUpRight, FiClock, FiBook, FiPlay } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";
import { getAllTutorials, getTutorialCategories } from "../../../api";

const TutorialPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('name');

  const { data: tutorialsData, error: tutorialsError, isLoading: tutorialsLoading } = useQuery({ queryKey: ["tutorials"], queryFn: getAllTutorials });
  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useQuery({ queryKey: ["tutorialCategories"], queryFn: getTutorialCategories });

  const tutorials = tutorialsData?.tutorials ?? [];
  const categories = categoriesData?.categories ?? [];
  const isLoading = tutorialsLoading || categoriesLoading;
  const error = tutorialsError || categoriesError;

  const filteredTutorials = useMemo(() => {
    const byCategory = activeCategory === 'all' ? tutorials : tutorials.filter(t => t.category === activeCategory);
    const bySearch = searchTerm ? byCategory.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase())) : byCategory;
    return [...bySearch].sort((a, b) => sort === "duration" ? (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0) : a.title.localeCompare(b.title));
  }, [tutorials, activeCategory, searchTerm, sort]);

  return (
    <div className="ot-public">
      <Navbar />
      <main id="main-content">
        <section className="ot-container ot-hero">
          <div className="ot-hero-copy">
            <p className="ot-eyebrow"><span className="ot-small-line" /> HELP CENTRE</p>
            <h1>Learn how<br />OhTopUp works.</h1>
            <p className="ot-hero-description">Step-by-step guides to help you make the most of our platform.</p>
            <div className="ot-hero-actions"><Link to="/create" className="ot-button ot-button-primary">Create your account <FiArrowRight /></Link><Link to="/pricing" className="ot-text-link">Browse data plans <FiArrowUpRight /></Link></div>
          </div>
        </section>

        <section className="ot-container" style={{ paddingBottom: 98 }}>
          {isLoading ? (
            <div className="ot-empty" role="status"><p>Loading tutorials…</p></div>
          ) : error ? (
            <div className="ot-empty"><h3>We couldn't load tutorials.</h3><p>{error.message || 'Please try again later.'}</p><button className="ot-button ot-button-secondary" onClick={() => window.location.reload()}>Try again</button></div>
          ) : (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32, alignItems: 'center' }}>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tutorials…" className="ot-field" style={{ flex: '1 1 200px', maxWidth: 320 }} />
                <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="ot-field" style={{ flex: '0 1 180px' }}>
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="ot-field" style={{ flex: '0 1 160px' }}>
                  <option value="name">Sort by Name</option>
                  <option value="duration">Sort by Duration</option>
                </select>
                <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{filteredTutorials.length} found</span>
              </div>

              {/* Category chips */}
              {categories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                  <button onClick={() => setActiveCategory('all')} className={`ot-button ${activeCategory === 'all' ? 'ot-button-primary' : 'ot-button-secondary'}`} style={{ fontSize: 12, padding: '8px 14px', minHeight: 'auto' }}>All</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`ot-button ${activeCategory === c.id ? 'ot-button-primary' : 'ot-button-secondary'}`} style={{ fontSize: 12, padding: '8px 14px', minHeight: 'auto' }}>{c.name}</button>
                  ))}
                </div>
              )}

              {/* Tutorial grid */}
              {filteredTutorials.length === 0 ? (
                <div className="ot-empty"><h3>No tutorials found.</h3><p>Try adjusting your search or browse all categories.</p><button className="ot-button ot-button-secondary" onClick={() => { setActiveCategory('all'); setSearchTerm(''); }}>View all</button></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {filteredTutorials.map((tutorial) => (
                    <div key={tutorial.id || tutorial._id} className="ot-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="ot-panel-heading" style={{ borderBottom: '1px solid var(--ot-line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--ot-tint)', color: 'var(--ot-accent)', fontWeight: 600 }}>{tutorial.difficulty || 'Beginner'}</span>
                          {tutorial.popular && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>Popular</span>}
                        </div>
                      </div>
                      <div style={{ padding: '16px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{tutorial.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--ot-muted)', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{tutorial.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--ot-muted)', marginBottom: 16 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> {tutorial.duration}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiBook /> {tutorial.type || 'article'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => navigate(`/tutorial/${tutorial.id || tutorial._id}`)} className="ot-button ot-button-primary" style={{ flex: 1, fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}><FiPlay /> Start</button>
                          <button onClick={() => navigate(`/tutorial/${tutorial.id || tutorial._id}`)} className="ot-button ot-button-secondary" style={{ fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}>Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="ot-container" style={{ paddingBottom: 98 }}>
          <p className="ot-eyebrow">NEED HELP?</p>
          <h2 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-1.3px', lineHeight: 1.2, marginBottom: 22 }}>Still have questions?</h2>
          <p style={{ color: 'var(--ot-muted)', fontSize: 14, lineHeight: 1.8, maxWidth: 425, marginBottom: 25 }}>Our tutorials are designed to be beginner-friendly. Start with the getting-started guides and work your way through.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/create" className="ot-button ot-button-primary">Create an account <FiArrowRight /></Link>
            <Link to="/about" className="ot-text-link">Learn about us <FiArrowUpRight /></Link>
          </div>
        </section>

        <section className="ot-get-started"><div className="ot-container"><div><p className="ot-eyebrow">READY TO START?</p><h2>One less thing on your list.</h2></div><Link to="/create" className="ot-button ot-button-light">Create an account <FiArrowRight /></Link></div></section>
      </main>
      <Footer />
    </div>
  );
};

export default TutorialPage;
