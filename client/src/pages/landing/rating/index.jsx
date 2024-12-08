const Rating = () => (
    <section className="py-20 bg-white">
      <div className="container mx-auto text-center">
        <h3 className="text-3xl font-bold mb-6">Customer Ratings</h3>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="text-yellow-500 text-4xl sm:text-5xl">⭐⭐⭐⭐⭐</div>
          <p className="text-lg max-w-lg">
            "Best platform for quick and reliable data top-ups!"
          </p>
        </div>
      </div>
    </section>
  );
  
  export default Rating;