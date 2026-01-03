// ================================================
// CAROUSEL FUNCTIONALITY
// ================================================

const slides = document.querySelectorAll(".slide");
const indicators = document.querySelectorAll(".indicator");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let currentIndex = 0;
let autoPlayInterval;

// Function to show a specific slide
function showSlide(index) {
  // Remove active class from all slides and indicators
  slides.forEach(slide => slide.classList.remove("active"));
  indicators.forEach(ind => ind.classList.remove("active"));
  
  // Add active class to current slide and indicator
  slides[index].classList.add("active");
  indicators[index].classList.add("active");
  
  currentIndex = index;
}

// Next slide
function nextSlide() {
  let next = (currentIndex + 1) % slides.length;
  showSlide(next);
  resetAutoPlay();
}

// Previous slide
function prevSlide() {
  let prev = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(prev);
  resetAutoPlay();
}

// Auto-play carousel
function startAutoPlay() {
  autoPlayInterval = setInterval(() => {
    nextSlide();
  }, 5000); // Change slide every 5 seconds
}

// Reset auto-play
function resetAutoPlay() {
  clearInterval(autoPlayInterval);
  startAutoPlay();
}

// Event listeners
prevBtn.addEventListener("click", prevSlide);
nextBtn.addEventListener("click", nextSlide);

// Indicator clicks
indicators.forEach((indicator, index) => {
  indicator.addEventListener("click", () => {
    showSlide(index);
    resetAutoPlay();
  });
});

// Start auto-play on page load
startAutoPlay();

// Pause auto-play on hover (optional)
const carouselSection = document.querySelector(".carousel-section");
carouselSection.addEventListener("mouseenter", () => {
  clearInterval(autoPlayInterval);
});

carouselSection.addEventListener("mouseleave", () => {
  startAutoPlay();
});
