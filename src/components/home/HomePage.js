import 'bootstrap/dist/css/bootstrap.min.css';
import Categories from './Categories';
import EventCard from './EventCard';
import Footer from './Footer';
import BaseHome from './Home';
import TestimonialSection from './TestimonialSection';

function Home() {
  return (
    <div className="App">
      <BaseHome />
       {/* <Categories /> */}
      <EventCard /> 
      <TestimonialSection />
      {/* <FeaturedEventsSection/> */}

      {/* <Footer /> */}
    </div>
  );
}

export default Home;
