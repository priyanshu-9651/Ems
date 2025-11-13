import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

const HomeCarousel = () => {
  return (
    <Carousel fade interval={3000} pause={false} touch={false}>
      <Carousel.Item>
        <img
          className="d-block w-100"
          src="https://picsum.photos/1350/500?random=101"
          alt="First slide"
          style={{ width: '900px', height: '500px', objectFit: 'cover', margin: 'auto' }}
        />
      </Carousel.Item>

      <Carousel.Item>
        <img
          className="d-block w-100"
          src="https://picsum.photos/1350/500?random=102"
          alt="Second slide"
          style={{ width: '900px', height: '500px', objectFit: 'cover', margin: 'auto' }}
        />
      </Carousel.Item>

      <Carousel.Item>
        <img
          className="d-block w-100"
          src="https://picsum.photos/1350/500?random=103"
          alt="Third slide"
          style={{ width: '900px', height: '500px', objectFit: 'cover', margin: 'auto' }}
        />
      </Carousel.Item>
    </Carousel>
  );
};

export default HomeCarousel;
