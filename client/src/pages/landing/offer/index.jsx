const Offer = () => (
  <section id="about" className="py-20 bg-gray-100">
    <div className="container mx-auto text-center">
      <h3 className="text-3xl font-bold mb-6">What We Offer</h3>
      <div className="flex flex-col md:flex-row justify-around flex-wrap">
        <div className="bg-white shadow-md p-6 rounded-lg m-4 md:w-72">
          <h4 className="font-semibold text-xl">Fast Transactions</h4>
          <p>Experience lightning-fast data top-ups at your fingertips.</p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg m-4 md:w-72">
          <h4 className="font-semibold text-xl">Secure Payments</h4>
          <p>
            Your transactions are secured with the best encryption technologies.
          </p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg m-4 md:w-72">
          <h4 className="font-semibold text-xl">24/7 Support</h4>
          <p>Our support team is here to help you at any time of the day.</p>
        </div>
      </div>
    </div>
  </section>
);

export default Offer;
