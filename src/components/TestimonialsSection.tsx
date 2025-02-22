import React from 'react';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Slates has transformed how we manage our sports programming. Our customer satisfaction is up 40% and revenue has increased significantly.",
      author: "Sarah Johnson",
      role: "Owner, The Sports Bar NYC",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      quote: "The data-driven insights have helped us make better decisions about which games to show. Our customers love that we always have the most exciting games on.",
      author: "Michael Chen",
      role: "Manager, Victory Sports Lounge",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      quote: "We've seen a 30% increase in average customer spend during game nights since implementing Slates. The ROI has been incredible.",
      author: "David Martinez",
      role: "Owner, Champions Sports Bar",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Trusted by Leading Venues
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            See what our customers have to say about their experience
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative bg-white p-8 rounded-2xl shadow-lg"
            >
              <div className="absolute -top-4 flex justify-center w-full">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-8 w-8 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              <blockquote className="mt-8">
                <p className="text-lg text-gray-600 italic">"{testimonial.quote}"</p>
              </blockquote>
              <div className="mt-6 flex items-center">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={testimonial.image}
                  alt={testimonial.author}
                />
                <div className="ml-4">
                  <div className="text-base font-medium text-gray-900">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;