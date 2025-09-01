import Footer from "./footer";
import Navbar from "./navbar";
import Hero from "./hero";
import Offer from "./offer";
import AdditionalFeature from "./additional_feature";
import Partners from "./partners";
import FAQ from "./faq";
import Rating from "./rating";
import Usecase from "./use-case";
import CTA from "./cta";

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <Hero 
        heading="Buy Airtime, Data, TV, and Electricity in Seconds" 
        subheading="Instant delivery, best prices, and bank‑grade security. Join thousands who top up smarter with OhTopUp." 
        buttonText="Create Free Account" 
        secondButtonText="Download App" 
        href="/create" 
      />

      {/* Quick stats */}
      <section className="bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-2xl font-bold text-blue-600"><span aria-hidden>⚡</span> Instant</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Real‑time delivery</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-2xl font-bold text-blue-600"><span aria-hidden>💸</span> Save</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Competitive pricing</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-2xl font-bold text-blue-600"><span aria-hidden>🔒</span> Secure</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bank‑grade protection</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-2xl font-bold text-blue-600"><span aria-hidden>🕑</span> 24/7</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Always available</p>
          </div>
        </div>
      </section>
      <Offer />
      <AdditionalFeature />
      <Partners />
      <FAQ />
      <Usecase />
      <CTA />
      <Rating />
      <Footer />
    </div>
  );
};

export default HomePage;