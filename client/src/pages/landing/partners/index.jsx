import React, { useState, useEffect } from "react";
import ibadan from "../../../assets/ibadan.png";
import dstv from "../../../assets/dstv.png";
import mtn from "../../../assets/mtn.png";
import glo from "../../../assets/glo.png";
import vtpass from "../../../assets/vtpass.png";
import monnify from "../../../assets/monnify.png";

const partners = [ibadan, dstv, mtn, glo, vtpass, monnify];

const Partners = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % partners.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="partners" className="py-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6">Our Partners</h3>
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{
              transform: `translateX(-${currentIndex * (100 / partners.length)}%)`,
            }}
          >
            {partners.map((partner, index) => (
              <div key={index} className="flex-shrink-0 w-32 sm:w-40 mx-4">
                <img
                  src={partner}
                  alt={`Partner ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;