import React from 'react';

const FeaturedOn = () => {
  return (
<section className="py-12 px-6 bg-muted/50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Featured On
        </h2>
        <div className="flex justify-center">
          <a href="https://fazier.com/launches/fablespace.space" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light" 
              width={250} 
              alt="Fazier badge" 
            />
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOn;
