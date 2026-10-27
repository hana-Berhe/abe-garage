// Customer reviews shown on the home page.
// Add real reviews to REVIEWS, for example:
//   { name: "Lena H.", job: "Brakes · Honda Fit", text: "They called me with the price first." }
// Until there is at least one real review, the live site hides the Reviews section.
// While developing (npm run dev) the sample reviews below are shown, marked as samples.
export const REVIEWS = [];

// Average star rating and how many reviews it is based on, for example { rating: 4.9, count: 120 }.
export const RATING = null;

const SAMPLES = [
  { name: "[Customer name]", job: "Honda Fit", text: "Squeaky brakes fixed the same day. They called me first and there were no surprises when I picked up the car." },
  { name: "[Customer name]", job: "Toyota Hilux", text: "The engine light kept coming on. They found a small air leak, showed me the old part and explained everything clearly." },
  { name: "[Customer name]", job: "Hyundai i10", text: "I dropped the car off at 8 on my way to work and got a message when it was ready. Easy and honest." },
];

export function reviewsToShow() {
  if (REVIEWS.length) return { reviews: REVIEWS, rating: RATING, samples: false };
  if (import.meta.env.DEV) return { reviews: SAMPLES, rating: null, samples: true };
  return { reviews: [], rating: null, samples: false };
}
