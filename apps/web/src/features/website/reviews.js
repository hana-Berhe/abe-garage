// Customer reviews shown on the home page.
// Add real reviews to REVIEWS, for example:
//   { name: "Lena H.", job: "Brakes · Honda Fit", text: "They called me with the price first." }
// Until there is at least one real review, the live site hides the Reviews section.
// While developing (npm run dev) the sample reviews below are shown, marked as samples.
export const REVIEWS = [];

// Average star rating and how many reviews it is based on, for example { rating: 4.9, count: 120 }.
export const RATING = null;

const SAMPLES = [
  { name: "[Customer name]", job: "Brakes · Honda Fit", text: "They called me with the price before touching anything, and the bill matched to the cent." },
  { name: "[Customer name]", job: "Diagnostics · Toyota Hilux", text: "I followed the whole repair from my phone at work. Picked the car up the same afternoon." },
  { name: "[Customer name]", job: "Oil change · Hyundai i10", text: "Honest local garage. They told me what could wait and what could not." },
];

export function reviewsToShow() {
  if (REVIEWS.length) return { reviews: REVIEWS, rating: RATING, samples: false };
  if (import.meta.env.DEV) return { reviews: SAMPLES, rating: null, samples: true };
  return { reviews: [], rating: null, samples: false };
}
