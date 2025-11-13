import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Designer, Mumbai',
    text: 'Booked an art exhibit through this app — seamless booking and great seats. Highly recommended!',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    name: 'Amit Verma',
    role: 'Product Manager, Bengaluru',
    text: 'Loved the event discovery features. Found exactly what I wanted within minutes.',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    name: 'Sara Khan',
    role: 'Musician, Delhi',
    text: 'Great platform for both attendees and organizers. Smooth experience and lovely UI.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
];

const TestimonialSection = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="py-5 bg-white">
      <div className="container">
        <h3 className="h5 mb-4 text-center">What our customers say</h3>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div
              className="card shadow-sm border-0 p-4 text-center"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div style={{ minHeight: 110 }}>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45 }}
                  >
                    <p className="mb-3 fst-italic">“{testimonials[index].text}”</p>

                    <div className="d-flex align-items-center justify-content-center">
                      <img
                        src={testimonials[index].avatar}
                        alt={testimonials[index].name}
                        className="rounded-circle me-3"
                        style={{ width: 56, height: 56, objectFit: 'cover' }}
                      />
                      <div className="text-start">
                        <div className="fw-semibold">{testimonials[index].name}</div>
                        <small className="text-muted">{testimonials[index].role}</small>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 d-flex justify-content-center">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm rounded-circle mx-1 ${i === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Show testimonial ${i + 1}`}
                    style={{ width: 12, height: 12, padding: 0 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
