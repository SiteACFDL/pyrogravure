// Gallery lightbox + per-image reviews (Firebase Realtime Database)

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDysN1XOBSPLi9VHPIBcjXlm_wCvypZ9sM",
  authDomain: "pyrogravure-avis.firebaseapp.com",
  databaseURL: "https://pyrogravure-avis-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pyrogravure-avis",
  storageBucket: "pyrogravure-avis.firebasestorage.app",
  messagingSenderId: "728269112390",
  appId: "1:728269112390:web:d17359a46ef0ad47d1b647",
  measurementId: "G-PWSRBCP3Z2"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

const thumbs = document.querySelectorAll('.thumb');
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lb-image');
const lbClose = document.getElementById('lb-close');
const lbNext = document.getElementById('lb-next');
const lbPrev = document.getElementById('lb-prev');
const lbStarGroup = document.getElementById('lb-star-group');
const lbStars = () => Array.from(document.querySelectorAll('#lb-star-group .lb-star'));
const lbReviewText = document.getElementById('lb-review-text');
const lbSubmit = document.getElementById('lb-submit-review');
const lbReviewsList = document.getElementById('lb-reviews-list');

let currentIndex = 0;
let images = Array.from(thumbs).map(t => t.dataset.src);
let currentRating = 0;

// ===== FIREBASE FUNCTIONS =====

/**
 * Load all reviews from Firebase
 */
async function loadAllReviews(){
  try {
    const snapshot = await firebase.database().ref('reviews').get();
    return snapshot.val() || {};
  } catch (err) {
    console.error('Firebase load error:', err);
    return {};
  }
}

/**
 * Load reviews for a specific image source
 */
async function loadReviewsFor(src){
  try {
    const encodedSrc = encodeImageSrc(src);
    const snapshot = await firebase.database().ref(`reviews/${encodedSrc}`).get();
    const data = snapshot.val();
    if (!data) return [];
    // Convert object to array and sort by date descending
    return Object.values(data).sort((a, b) => b.date - a.date);
  } catch (err) {
    console.error('Firebase load reviews error:', err);
    return [];
  }
}

/**
 * Save a review to Firebase
 */
async function saveReviewFor(src, review){
  try {
    const encodedSrc = encodeImageSrc(src);
    // Store the original src with the review
    const reviewData = { ...review, imageSrc: src };
    await firebase.database().ref(`reviews/${encodedSrc}`).push(reviewData);
  } catch (err) {
    console.error('Firebase save error:', err);
    alert('Erreur lors de la sauvegarde de l\'avis');
  }
}

/**
 * Load global comments from Firebase
 */
async function loadGlobalComments(){
  try {
    const snapshot = await firebase.database().ref('comments').get();
    const data = snapshot.val();
    if (!data) return [];
    return Object.values(data).sort((a, b) => b.date - a.date);
  } catch (err) {
    console.error('Firebase load comments error:', err);
    return [];
  }
}

/**
 * Save global comment to Firebase
 */
async function saveGlobalComment(text, imageSrc){
  try {
    const data = { text, date: Date.now() };
    if (imageSrc) data.imageSrc = imageSrc;
    await firebase.database().ref('comments').push(data);
  } catch (err) {
    console.error('Firebase save comment error:', err);
    alert('Erreur lors de la sauvegarde du commentaire');
  }
}

/**
 * Encode image source for Firebase (Firebase doesn't allow "/" in keys)
 */
function encodeImageSrc(src){
  return src.replace(/\//g, '_').replace(/\./g, '_');
}

function decodeSrc(encoded){
  return encoded.replace(/_/g, '/').replace(/_/g, '.').slice(0, -1) + '.jpg';
}

function renderThumbPreviews(){
  document.querySelectorAll('.thumb-meta').forEach(async meta => {
    const src = meta.dataset.src;
    const reviews = await loadReviewsFor(src);
    const preview = meta.querySelector('.thumb-preview');
    const starsNode = meta.querySelector('.meta-stars');
    const form = meta.querySelector('.meta-form');

    // Compute average and count
    const count = reviews.length;
    const avg = count ? (reviews.reduce((s,r)=>s+(r.rating||0),0)/count) : 0;
    const avgRounded = Math.round(avg);

    if(count === 0){
      if(preview) preview.innerHTML = '<div class="thumb-review-none">Aucun avis</div>';
    } else {
      // Show numeric average in preview area
      if(preview) {
        const avgText = `${avg.toFixed(1)} / 5 (${count})`;
        preview.innerHTML = `<div class="thumb-review"><div class="thumb-review-text">${avgText}</div></div>`;
      }
    }

    // set stars state for meta-stars if present
    if(starsNode){
      const stars = Array.from(starsNode.querySelectorAll('.meta-star'));
      stars.forEach(s => s.textContent = (Number(s.dataset.value) <= avgRounded) ? '★' : '☆');
      // reset/hide form
      if(form){ form.style.display = 'none'; form.setAttribute('aria-hidden','true'); form.dataset.rating = 0; form.querySelector('.meta-comment').value = ''; }
    }
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function openLightbox(index){
  currentIndex = index;
  const src = images[currentIndex];
  lbImage.src = src;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  currentRating = 0; setLBStars(0); lbReviewText.value = '';
  renderLightboxReviews(src);
}

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
}

function nextImage(){
  currentIndex = (currentIndex + 1) % images.length;
  openLightbox(currentIndex);
}

function prevImage(){
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  openLightbox(currentIndex);
}

thumbs.forEach((t, i)=>{ t.addEventListener('click', ()=> openLightbox(i)); });
lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', nextImage);
lbPrev.addEventListener('click', prevImage);
lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLightbox(); });

// keyboard
window.addEventListener('keydown', (e)=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'ArrowRight') nextImage();
  if(e.key === 'ArrowLeft') prevImage();
  if(e.key === 'Escape') closeLightbox();
});

// Lightbox star interactions
function setLBStars(r){
  currentRating = r;
  lbStars().forEach(s => s.textContent = (Number(s.dataset.value) <= r) ? '★' : '☆');
}

document.addEventListener('click', (e)=>{
  if(e.target.classList && e.target.classList.contains('lb-star')){
    setLBStars(Number(e.target.dataset.value));
  }
});

document.addEventListener('mouseover', (e)=>{
  if(e.target.classList && e.target.classList.contains('lb-star')){
    const v = Number(e.target.dataset.value);
    lbStars().forEach(s => s.textContent = (Number(s.dataset.value) <= v) ? '★' : '☆');
  }
});

document.addEventListener('mouseout', (e)=>{
  if(e.target.classList && e.target.classList.contains('lb-star')){
    setLBStars(currentRating);
  }
});

async function renderLightboxReviews(src){
  const reviews = await loadReviewsFor(src);
  lbReviewsList.innerHTML = '';
  if(reviews.length === 0){ lbReviewsList.innerHTML = '<div class="lb-no-reviews">Aucun avis pour cette image.</div>'; }
  else {
    reviews.forEach(r => {
      const el = document.createElement('div'); el.className = 'lb-review-item';
      el.innerHTML = `<div class="review-meta">${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))} • <span class="rev-date">${new Date(r.date).toLocaleString('fr-FR')}</span></div><p class="review-body">${escapeHtml(r.text||'')}</p>`;
      lbReviewsList.appendChild(el);
    });
  }
}

lbSubmit.addEventListener('click', async ()=>{
  const text = lbReviewText.value.trim();
  if(currentRating === 0){ alert('Veuillez sélectionner une note (1-5 étoiles).'); return; }
  const src = images[currentIndex];
  const review = { rating: currentRating, text: text, date: Date.now() };
  await saveReviewFor(src, review);
  await renderLightboxReviews(src);
  await renderThumbPreviews();
  await renderAllComments();
  lbReviewText.value = '';
  currentRating = 0;
  setLBStars(0);
  // keep modal open so user sees review
});

// init
renderThumbPreviews();

// per-thumb inline stars + form handlers
document.querySelectorAll('.thumb-wrap').forEach((wrap, idx) => {
  const src = wrap.querySelector('.thumb').dataset.src;
  const starsNode = wrap.querySelector('.meta-stars');
  const stars = starsNode ? Array.from(starsNode.querySelectorAll('.meta-star')) : [];
  const form = wrap.querySelector('.meta-form');
  const textarea = form ? form.querySelector('.meta-comment') : null;
  const submit = form ? form.querySelector('.meta-submit') : null;

  if(!starsNode) return;

  function setLocalStars(r){ stars.forEach(s => s.textContent = (Number(s.dataset.value) <= r) ? '★' : '☆'); }

  stars.forEach(s => {
    s.addEventListener('mouseenter', ()=>{ const v = Number(s.dataset.value); setLocalStars(v); });
    s.addEventListener('mouseleave', async ()=>{ 
      const reviews = await loadReviewsFor(src); 
      const latest = reviews.length ? reviews[0].rating : 0; 
      setLocalStars(latest); 
    });
    s.addEventListener('click', ()=>{
      // open inline form under this thumb
      if(form){ form.style.display = 'block'; form.setAttribute('aria-hidden','false'); form.dataset.rating = s.dataset.value; textarea.focus(); }
      setLocalStars(Number(s.dataset.value));
    });
  });

  if(submit){
    submit.addEventListener('click', async ()=>{
      const rating = Number(form.dataset.rating || 0);
      const text = textarea.value.trim();
      if(rating === 0){ alert('Veuillez sélectionner une note.'); return; }
      const review = { rating, text, date: Date.now() };
      await saveReviewFor(src, review);
      await renderThumbPreviews();
      await renderAllComments();
      textarea.value = '';
      form.style.display = 'none';
      form.data.rating = 0;
    });
  }

});

// small entrance animation for thumbs
window.addEventListener('load', ()=>{
  document.querySelectorAll('.thumb').forEach((t,i)=>{ t.style.animation = `popIn 0.45s ease ${i*0.06}s both`; });
});

// helper animation CSS injected if missing
(function injectCSS(){
  const css = `@keyframes popIn{from{opacity:0; transform: translateY(10px) scale(0.98)} to{opacity:1; transform:none}}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
})();

// -------------------------
// Summary table & all comments
// -------------------------

// summary table removed: averages shown directly under thumbnails

async function renderAllComments(){
  const target = document.getElementById('all-comments-list');
  if(!target) return;
  target.innerHTML = '';
  const all = await loadAllReviews();
  const entries = [];
  
  // Add image-specific reviews (with imageSrc stored in Firebase)
  Object.keys(all).forEach(encodedSrc => {
    const reviewsArr = Array.isArray(all[encodedSrc]) ? all[encodedSrc] : Object.values(all[encodedSrc]);
    reviewsArr.forEach(r => {
      entries.push({ src: r.imageSrc || decodeSrc(encodedSrc), r });
    });
  });
  
  // Add global comments
  const globalComments = await loadGlobalComments();
  globalComments.forEach(g => entries.push({ src: g.imageSrc || null, r: { rating: 0, text: g.text, date: g.date } }));
  
  if(entries.length === 0){ target.innerHTML = '<p>Aucun commentaire pour le moment.</p>'; return; }
  
  // Sort by date desc
  entries.sort((a,b)=> b.r.date - a.r.date);
  
  entries.forEach(e => {
    const el = document.createElement('div'); el.className = 'all-comment-item';
    if(e.src){
      el.innerHTML = `<div class="ac-meta"><img src="${e.src}" style="width:56px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px"/> <strong>${'★'.repeat(e.r.rating||0)}${'☆'.repeat(5-(e.r.rating||0))}</strong> • <span class="rev-date">${new Date(e.r.date).toLocaleString('fr-FR')}</span></div><p class="ac-body">${escapeHtml(e.r.text||'')}</p>`;
    } else {
      el.innerHTML = `<div class="ac-meta"><strong>Commentaire</strong> • <span class="rev-date">${new Date(e.r.date).toLocaleString('fr-FR')}</span></div><p class="ac-body">${escapeHtml(e.r.text||'')}</p>`;
    }
    target.appendChild(el);
  });
}

// populate image select for global comment form
// global comments (bottom of page) - simple posting
document.getElementById('all-comment-submit').addEventListener('click', async ()=>{
  const txt = document.getElementById('all-comment-text');
  const imgSelect = document.getElementById('all-comment-image');
  const text = txt.value.trim();
  const imageSrc = imgSelect.value || null;
  
  if(!text){ alert('Écrivez un commentaire.'); return; }
  await saveGlobalComment(text, imageSrc);
  txt.value = '';
  imgSelect.value = '';
  await renderAllComments();
});

// initial render of comments and thumbs
renderAllComments();
renderThumbPreviews();
