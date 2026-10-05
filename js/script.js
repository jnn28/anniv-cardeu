/*STARTEU*/
const CORRECT_CODE = "1003"; 

/* starters*/
const digitInputs = Array.from(document.querySelectorAll(".digit"));
const gateError = document.getElementById("gate-error");
const gateSection = document.getElementById("gate");
const htmlEl = document.documentElement; 
const dotsNav = document.getElementById("dots");
const muteBtn = document.getElementById("mute-btn");
const music = document.getElementById("bg-music");
const letterMusic = document.getElementById("letter-music"); 
const outroMusic = document.getElementById("outro-music");

/* password */
digitInputs.forEach((input, i) => {
  input.addEventListener("input", () => {
   
    input.value = input.value.replace(/[^0-9]/g, "");

    if (input.value && i < digitInputs.length - 1) {
      digitInputs[i + 1].focus();
    }

    // i hate this
    if (digitInputs.every((d) => d.value.length === 1)) {
      checkCode();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && i > 0) {
      digitInputs[i - 1].focus();
    }
  });
});

function getEnteredCode() {
  return digitInputs.map((d) => d.value).join("");
}

function checkCode() {
  const entered = getEnteredCode();

  if (entered === CORRECT_CODE) {
    unlockSite();
  } else {
    showWrongCodeFeedback();
  }
}

function showWrongCodeFeedback() {
  gateError.classList.add("show");
  gateSection.querySelector(".gate-card").classList.add("shake");

  // annimation
  setTimeout(() => {
    gateSection.querySelector(".gate-card").classList.remove("shake");
  }, 400);

  //clear boxes
  digitInputs.forEach((d) => (d.value = ""));
  digitInputs[0].focus();
}

/* password function*/
function unlockSite() {
  gateError.classList.remove("show");
  
  gateSection.querySelector(".gate-card").classList.add("unlocking");

  // music start
  music.volume = 0.5;
  music.play().catch((err) => {
    // quiet fail safe
    console.log("Music couldn't autoplay yet:", err);
  });
  muteBtn.classList.remove("hidden");


  letterMusicObserver.observe(document.getElementById("letter"));
  outroMusicObserver.observe(document.getElementById("outro"));


  setTimeout(() => {
    htmlEl.classList.add("unlocked");
    dotsNav.classList.remove("hidden");
    document.getElementById("lobby").scrollIntoView({ behavior: "smooth" });
  }, 800);
}

/* MUTE BUTTON */
let isMusicMuted = false;

function applyMusicMuted() {
  music.muted = isMusicMuted;
  letterMusic.muted = isMusicMuted;
  outroMusic.muted = isMusicMuted;
  muteBtn.textContent = isMusicMuted ? "🔇" : "🔊";
}

muteBtn.addEventListener("click", () => {
  isMusicMuted = !isMusicMuted;
  applyMusicMuted();
});

/* navigation */
const dotLinks = Array.from(document.querySelectorAll(".dot"));

dotLinks.forEach((dot) => {
  dot.addEventListener("click", (e) => {
    e.preventDefault();

    
    if (dot.classList.contains("locked")) {
      nudgePuzzleLocked();
      return;
    }

    const target = document.getElementById(dot.dataset.target);
    target.scrollIntoView({ behavior: "smooth" });
  });
});


let currentSectionId = "gate";
const sections = document.querySelectorAll(".section");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        dotLinks.forEach((d) => d.classList.remove("active"));
        const match = document.querySelector(`.dot[data-target="${entry.target.id}"]`);
        if (match) match.classList.add("active");
        currentSectionId = entry.target.id;
      }
    });
  },
  { threshold: 0.6 }
);
sections.forEach((s) => observer.observe(s));


digitInputs[0].focus();

/* puzzle */

const PUZZLE_SIZE = 4;       // 4x4 
const PIECE_PX = 72;         
const BOARD_GAP_PX = 3;      
const BOARD_PADDING_PX = 3;  
const PUZZLE_IMAGE = "assets/images/puzzle-photo.jpg";

function buildPuzzle() {
  const board = document.getElementById("puzzle-board");
  const tray = document.getElementById("puzzle-tray");

  
  board.innerHTML = "";
  tray.innerHTML = "";

  const totalPieces = PUZZLE_SIZE * PUZZLE_SIZE;
  const correctOrder = Array.from({ length: totalPieces }, (_, i) => i); // [0,1,2,...]

  const boardSize =
    PIECE_PX * PUZZLE_SIZE +
    BOARD_GAP_PX * (PUZZLE_SIZE - 1) +
    BOARD_PADDING_PX * 2;

  board.style.width = `${boardSize}px`;
  board.style.height = `${boardSize}px`;
  board.style.gridTemplateColumns = `repeat(${PUZZLE_SIZE}, ${PIECE_PX}px)`;
  board.style.gridTemplateRows = `repeat(${PUZZLE_SIZE}, ${PIECE_PX}px)`;

  correctOrder.forEach((i) => {
    const slot = document.createElement("div");
    slot.className = "puzzle-slot";
    slot.dataset.slot = i;
    board.appendChild(slot);
  });

  const solvedPhoto = document.createElement("img");
  solvedPhoto.className = "puzzle-solved-photo";
  solvedPhoto.alt = "";
  solvedPhoto.src = PUZZLE_IMAGE;
  board.appendChild(solvedPhoto);

  const shuffledOrder = [...correctOrder];
  shuffleInPlace(shuffledOrder);

  
  const gridPx = PIECE_PX * PUZZLE_SIZE; 
  const photo = new Image();
  photo.onload = () => {
    const scale = gridPx / Math.min(photo.naturalWidth, photo.naturalHeight);
    const scaledW = photo.naturalWidth * scale;
    const scaledH = photo.naturalHeight * scale;

    const offsetX = (scaledW - gridPx) / 2;
    const offsetY = (scaledH - gridPx) / 2;

    shuffledOrder.forEach((i) => {
      const row = Math.floor(i / PUZZLE_SIZE);
      const col = i % PUZZLE_SIZE;

      const piece = document.createElement("div");
      piece.className = "puzzle-piece";
      piece.dataset.piece = i; 
      piece.style.width = `${PIECE_PX}px`;
      piece.style.height = `${PIECE_PX}px`;

    
      piece.style.backgroundImage = `url("${PUZZLE_IMAGE}")`;
      piece.style.backgroundSize = `${scaledW}px ${scaledH}px`;
      piece.style.backgroundPosition =
        `${-(col * PIECE_PX + offsetX)}px ${-(row * PIECE_PX + offsetY)}px`;

      makeDraggable(piece);
      tray.appendChild(piece);
    });

    updateProgress();
  };
  photo.onerror = () => {
    console.error(
      `Puzzle photo failed to load from "${PUZZLE_IMAGE}" — double-check that file exists and the name (including capitalization) matches PUZZLE_IMAGE exactly.`
    );
  };
  photo.src = PUZZLE_IMAGE;
}


function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}


let dragInProgress = false;

function makeDraggable(piece) {
  piece.addEventListener("pointerdown", (e) => {
    if (dragInProgress) return;
    dragInProgress = true;

    e.preventDefault();
    piece.setPointerCapture(e.pointerId);
    piece.classList.add("dragging");

    const startX = e.clientX;
    const startY = e.clientY;

    function onPointerMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      piece.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    function onPointerUp(ev) {
      piece.releasePointerCapture(e.pointerId);
      piece.removeEventListener("pointermove", onPointerMove);
      piece.removeEventListener("pointerup", onPointerUp);
      piece.classList.remove("dragging");
      piece.style.transform = ""; 

      handleDrop(piece, ev.clientX, ev.clientY);
      dragInProgress = false;
    }

    piece.addEventListener("pointermove", onPointerMove);
    piece.addEventListener("pointerup", onPointerUp);
  });
}

function findSlotAtPoint(x, y) {
  const slots = document.querySelectorAll(".puzzle-slot");
  for (const slot of slots) {
    const r = slot.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return slot;
    }
  }
  return null;
}

function handleDrop(piece, dropClientX, dropClientY) {
  const tray = document.getElementById("puzzle-tray");
  const targetSlot = findSlotAtPoint(dropClientX, dropClientY);

  if (targetSlot && !targetSlot.firstElementChild) {
    
    targetSlot.appendChild(piece);
  } else if (targetSlot && targetSlot.firstElementChild === piece) {
    
  } else {
    
    tray.appendChild(piece);
  }

  updateProgress();
}

function updateProgress() {
  const slots = document.querySelectorAll(".puzzle-slot");
  const board = document.getElementById("puzzle-board");
  const message = document.getElementById("solved-message");
  const progressEl = document.getElementById("puzzle-progress");

  let correctCount = 0;
  slots.forEach((slot) => {
    const child = slot.firstElementChild;
    if (child && child.dataset.piece === slot.dataset.slot) correctCount += 1;
  });

  progressEl.textContent = `${correctCount} / ${slots.length} placed correctly`;

  const isComplete = correctCount === slots.length;
  
  const justCompleted = isComplete && !board.classList.contains("solved");
  board.classList.toggle("solved", isComplete);
  message.classList.toggle("show", isComplete);

  if (justCompleted) {
    spawnStarRain();
    unlockRestOfSite(); 
  }
}


function spawnStarRain(count = 110) {
  const rain = document.createElement("div");
  rain.className = "star-rain";
  
  document.body.appendChild(rain);

  
  const fallDistance = window.innerHeight + 120;


  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    const isBlack = Math.random() < 0.5;
    star.className = isBlack ? "star-particle star-particle-black" : "star-particle";

    
    star.style.setProperty("--start-x", `${Math.random() * window.innerWidth}px`);
    star.style.setProperty("--fall-distance", `${fallDistance}px`);
    star.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
    star.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);

    star.style.animationDelay = `${Math.random() * 1.2}s`; // staggered starts, so the whole screen doesn't fall in lockstep
    star.style.animationDuration = `${2.8 + Math.random() * 1}s`; // a slower, more "drifting" fall than the old burst had

    const size = 8 + Math.random() * 30; // small flecks up to big showy ones
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    fragment.appendChild(star);
  }

  rain.appendChild(fragment); 
  setTimeout(() => rain.remove(), 5200);
}

buildPuzzle();


let puzzleSolved = false;

const LOCKED_UNTIL_SOLVED = ["gallery", "letter", "outro"];

function unlockRestOfSite() {
  puzzleSolved = true;
  dotLinks.forEach((dot) => {
    if (LOCKED_UNTIL_SOLVED.includes(dot.dataset.target)) {
      dot.classList.remove("locked");
    }
  });
}


function nudgePuzzleLocked() {
  document.getElementById("lobby").scrollIntoView({ behavior: "smooth" });
  const wrap = document.querySelector(".puzzle-wrap");
  setTimeout(() => {
    wrap.classList.add("shake");
    setTimeout(() => wrap.classList.remove("shake"), 400);
  }, 350); 
}


function blockedGoingForward(deltaY) {
  return !puzzleSolved && currentSectionId === "lobby" && deltaY > 0;
}


window.addEventListener(
  "wheel",
  (e) => {
    if (blockedGoingForward(e.deltaY)) {
      e.preventDefault();
      nudgePuzzleLocked();
    }
  },
  { passive: false }
);

let touchStartY = null;
window.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = e.touches[0].clientY;
  },
  { passive: true } 
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (touchStartY === null) return;
    
    const deltaY = touchStartY - e.touches[0].clientY;
    if (blockedGoingForward(deltaY)) {
      e.preventDefault();
      nudgePuzzleLocked();
    }
  },
  { passive: false }
);

const FORWARD_SCROLL_KEYS = ["ArrowDown", "PageDown", " ", "End"];
window.addEventListener("keydown", (e) => {
  if (FORWARD_SCROLL_KEYS.includes(e.key) && !puzzleSolved && currentSectionId === "lobby") {
    e.preventDefault();
    nudgePuzzleLocked();
  }
});

/* photos */
const CAROUSEL_PHOTOS = [
  
  { src: "assets/images/carousel/01-january-1.jpg", alt: "January photo 1", caption: "i made a little album of us! i tried making it niteharts theme because we technically met because of it haha" },
  { src: "assets/images/carousel/01-january-2.jpg", alt: "January photo 2" },
  {
    src: "assets/images/carousel/01-january-3.jpg",
    alt: "January photo 3",
    caption: "our first date dinner <3",
    stickers: [
      { src: "assets/images/carousel/stickers/washi-tape.png", width: 185, top: "-26px", left: "-26px", rotate: -8 },
    ],
  },
  { src: "assets/images/carousel/02-february-2.jpg", alt: "February photo 2", caption: "the pretttiiieessstttt bouquet i've ever seen" },
  {
    src: "assets/images/carousel/02-february-3.jpg",
    alt: "February photo 3",
    caption: "i had no more photos of the same day but i got one of you admiring the bathroom",
    stickers: [
      { src: "assets/images/carousel/stickers/washi-tape-blue.png", width: 185, top: "-26px", right: "-26px", rotate: 7 },
    ],
  },
  { src: "assets/images/carousel/04-april-1.jpg", alt: "April photo 1", caption: "farm date farm date" },
  { src: "assets/images/carousel/04-april-2.jpg", alt: "April photo 2" },
  {
    src: "assets/images/carousel/02-february-1-video.mp4",
    alt: "February video 1",
    caption: "not gonna lie, i forgot we did this photobooth, it's so cute",
    type: "video",
    
    stickers: [
      { src: "assets/images/carousel/stickers/butterfly-sticker.png", width: 130, top: "-22px", left: "-30px", rotate: -10 },
    ],
  },
  {
    src: "assets/images/carousel/05-may-1.jpg",
    alt: "May photo 1",
    caption: "this was the first time i really liked the ramen",
    
    stickers: [
      { src: "assets/images/carousel/stickers/camera-sticker.png", width: 135, top: "-24px", right: "-30px", rotate: 8 },
    ],
  },
  { src: "assets/images/carousel/05-may-2.jpg", caption: "one piece exhibit!", alt: "May photo 2" },
  {
    src: "assets/images/carousel/05-may-3.jpg",
    alt: "May photo 3",
    caption: "i actually really like this pic you took of me, niceu",
    stickers: [
      { src: "assets/images/carousel/stickers/sun-sticker.png", width: 130, top: "-24px", left: "-22px", rotate: 10 },
    ],
  },
  { src: "assets/images/carousel/05-may-4.jpg", alt: "May photo 4" },
  {
    src: "assets/images/carousel/06-june-1.jpg",
    alt: "June photo 1",
    caption: "the spiciest mf food i ever had",
    stickers: [
      { src: "assets/images/carousel/stickers/washi-tape.png", width: 190, top: "-26px", left: "-30px", rotate: -10 },
      { src: "assets/images/carousel/stickers/star-sticker.png", width: 100, bottom: "-20px", left: "-20px", rotate: -16 },
    ],
  },
  { src: "assets/images/carousel/07-july-2.jpg", alt: "July photo 2", caption: "you're highkey mogging in this pic" },
  {
    src: "assets/images/carousel/10-october-3.jpg",
    alt: "October photo 3",
    caption: "ty for always matching w/ me <3",
    
    stickers: [
      { src: "assets/images/carousel/stickers/cassette-sticker.png", width: 150, on: "caption", top: "-24px", right: "-22px", rotate: -6 },
    ],
  },
  { src: "assets/images/carousel/07-july-1-video.mp4", alt: "July video 1", caption: "i thought this was so cute", type: "video" },
  { src: "assets/images/carousel/06-june-2.jpg", alt: "June photo 2" },
  {
    src: "assets/images/carousel/07-july-3.jpg",
    alt: "July photo 3",
    caption: "the day you ordered pineapple beer that was as big as your head",
    
    stickers: [
      { src: "assets/images/carousel/stickers/sparkle-sticker.png", width: 115, top: "-20px", left: "-24px", rotate: -6 },
    ],
  },
  { src: "assets/images/carousel/08-august-1.jpg", alt: "August photo 1", caption: "call me betty crocker the baker" },
  { src: "assets/images/carousel/08-august-2.jpg", alt: "August photo 2", caption: "thank you for teaching me how to snowboard (& for your patience)" },
  { src: "assets/images/carousel/11-november-2.jpg", alt: "November photo 2" },
  {
    src: "assets/images/carousel/10-october-1.jpg",
    alt: "October photo 1",
    
    stickers: [
      { src: "assets/images/carousel/stickers/washi-tape-blue.png", width: 185, top: "-24px", right: "-28px", rotate: 9 },
    ],
  },
  { src: "assets/images/carousel/12-december-1-video.mp4", alt: "December video 1", caption: "thank you for always doing photobooths with me <3", type: "video" },
  { src: "assets/images/carousel/10-october-2.jpg", alt: "October photo 2" },
  {
    src: "assets/images/carousel/11-november-3.jpg",
    alt: "November photo 3",
    caption: ":P",
    
    stickers: [
      { src: "assets/images/carousel/stickers/polaroid-sticker.png", width: 120, top: "-20px", left: "-32px", rotate: -9 },
    ],
  },
  { src: "assets/images/carousel/12-december-2.jpg", alt: "December photo 2" },
  { src: "assets/images/carousel/12-december-4.jpg", alt: "December photo 4", caption: "'babe, pose'" },
  {
    src: "assets/images/carousel/12-december-3.jpg",
    alt: "December photo 3",
    caption: "'no, babe, do something different'",
    
    stickers: [
      { src: "assets/images/carousel/stickers/ticket-sticker.png", width: 140, on: "caption", bottom: "-22px", left: "-20px", rotate: -6 },
    ],
  },
  {
    src: "assets/images/carousel/12-december-5.jpg",
    alt: "December photo 5",
    caption: "'you look so proud of yourself'",
    
    stickers: [
      { src: "assets/images/carousel/stickers/paperclip-sticker.png", width: 95, top: "-30px", right: "-16px", rotate: 12 },
    ],
  },
  {
    src: "assets/images/carousel/11-november-1.jpg",
    alt: "November photo 1",
    caption: "your allergies really beat you up this day",
    
    stickers: [
      { src: "assets/images/carousel/stickers/ribbon-banner-sticker.png", width: 140, on: "caption", top: "-22px", left: "-22px", rotate: -5 },
    ],
  },
  { src: "assets/images/carousel/03-march-1.jpg", alt: "March photo 1", caption: "rahhh medieval times!!" },
  { src: "assets/images/carousel/05-may-5-video.mp4", alt: "May video", caption: "thank you for taking me out on dates <3", type: "video" },
  { src: "assets/images/carousel/09-september-1.jpg", alt: "September photo 1", caption: "& back to the present, i love you - mwah" },
];

const carouselTrack = document.getElementById("carousel-track");
const carouselPositionLabel = document.getElementById("carousel-position");
const carouselPrevBtn = document.getElementById("carousel-prev");
const carouselNextBtn = document.getElementById("carousel-next");

let carouselSlideEls = [];
let carouselIndex = 0; 
let carouselNavLocked = false;

function buildCarousel() {
  carouselTrack.innerHTML = "";

  CAROUSEL_PHOTOS.forEach((photo, i) => {
    const slide = document.createElement("div");

    if (photo.caption) {
      slide.className = i % 2 === 1 ? "carousel-slide side-right" : "carousel-slide";
    } else {
      slide.className = "carousel-slide no-caption";
    }

    
    const frame = document.createElement("div");
    frame.className = "carousel-photo-frame";
    const inner = document.createElement("div");
    inner.className = "carousel-photo-inner";
    frame.appendChild(inner);

    if (photo.type === "video") {
      const video = document.createElement("video");
      video.src = photo.src;
      video.setAttribute("aria-label", photo.alt);
      video.muted = true; 
      video.loop = true;
      video.playsInline = true; 
      video.preload = "metadata"; 
      inner.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt;
  
      img.loading = "lazy";
      img.decoding = "async";
      inner.appendChild(img);
    }
    slide.appendChild(frame);

    
    let captionEl = null;
    if (photo.caption) {
      captionEl = document.createElement("p");
      captionEl.className = "carousel-caption";
      captionEl.textContent = photo.caption;
      slide.appendChild(captionEl);
    }

    // stickers
    (photo.stickers || []).forEach((sticker) => {
      const stickerEl = document.createElement("img");
      stickerEl.src = sticker.src;
      stickerEl.className = "carousel-sticker";
      stickerEl.alt = ""; 
      stickerEl.setAttribute("aria-hidden", "true");
      stickerEl.loading = "lazy";
      stickerEl.decoding = "async";
      stickerEl.style.width = `${sticker.width || 150}px`;
      
      if (sticker.top !== undefined) stickerEl.style.top = sticker.top;
      if (sticker.left !== undefined) stickerEl.style.left = sticker.left;
      if (sticker.right !== undefined) stickerEl.style.right = sticker.right;
      if (sticker.bottom !== undefined) stickerEl.style.bottom = sticker.bottom;
      stickerEl.style.transform = `rotate(${sticker.rotate || 0}deg)`;
      
      const attachTo = sticker.on === "caption" && captionEl ? captionEl : frame;
      attachTo.appendChild(stickerEl);
    });

    carouselTrack.appendChild(slide);
  });

  carouselSlideEls = Array.from(carouselTrack.children);
  updateCarouselUI(0);
}

function goToSlide(i) {
  if (carouselNavLocked) return;

  
  const clamped = Math.max(0, Math.min(i, carouselSlideEls.length - 1));

  
  carouselSlideEls[clamped].scrollIntoView({
    behavior: "smooth",
    block: "nearest", 
    inline: "start",
  });

  carouselNavLocked = true;
  setTimeout(() => {
    carouselNavLocked = false;
  }, 450); 
}

function updateCarouselUI(index) {
  carouselIndex = index;
  const photo = CAROUSEL_PHOTOS[index];

  const kind = photo.type === "video" ? "Video" : "Photo";
  carouselPositionLabel.textContent = `${kind} ${index + 1} of ${carouselSlideEls.length}`;


  carouselPrevBtn.disabled = index === 0;
  carouselNextBtn.disabled = index === carouselSlideEls.length - 1;

  
  carouselSlideEls.forEach((slide, i) => {
    const video = slide.querySelector("video");
    if (!video) return;
    if (i === index) {
      video.currentTime = 0; 
      video.play().catch((err) => {
        console.log("Video couldn't autoplay yet:", err);
      });
    } else {
      video.pause();
    }
  });
}

carouselPrevBtn.addEventListener("click", () => goToSlide(carouselIndex - 1));
carouselNextBtn.addEventListener("click", () => goToSlide(carouselIndex + 1));


const carouselObserver = new IntersectionObserver(
  (entries) => {
    
    const mostVisible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (mostVisible) {
      updateCarouselUI(carouselSlideEls.indexOf(mostVisible.target));
    }
  },
  { root: carouselTrack, threshold: 0.6 }
);

buildCarousel();
carouselSlideEls.forEach((slide) => carouselObserver.observe(slide));

/* lettah */
const LETTER_PARAGRAPHS = [
  "Hi Love,",
  "Happy Anniversary AND Happy National Boyfriend's Day!!",
  "Can you believe it's been a YEAR already? Time mf flies... with the best boyfriend EVERR yayay!",
  "You are such a genuine person, and it makes me really happy to see you thrive and go after your own interests and passions, it's so hot idk. Especially since you are very level-headed about it too.",
  "You are always so loving, kind, caring, and considerate. I'm sure you've heard me yap about it multiple times throughout the year, but I really do admire how kind and ambitious you are.",
  "AND I really enjoy my time with you! Even on days where one of us is more irritable than the other, or we are doing quite literally nothing, I still really enjoy your company (even if you are sleeping sometimes..)",
  "Thank you for your patience with me too, I know I can be a little short-tempered or easily annoyed, but in case I have not said it enough, I do appreciate everything you do for me and our relationship.",
  "I know there can be some pretty bad or stressful days that don't go as ideally planned, however I hope it doesn't discourage you!",
  "You're so smart and learn so many things extremely quickly (like snowboarding). I really have no doubt that you would reach your goals and wishes, and I am so so excited for you for when you do.",
  "I also enjoy being there for the process as well, I like being support nyahaha. It makes me so happy seeing good things happen to you!",
  "Alternatively, I hope you aren't annoyed at me yet for still getting nervous and shy around you.. I'm working on it trust, you're just so handsome nyahaha.",
  "Hey babe, off topic, but I feel bad for you. You must have so many parking tickets cause you've got FINE written all over you :3 (imagine my raccoon flirting sticker here)",
  "Like, you're so baddie, so cunty!, you have such a nice taste in style and aesthetic, you lowkey take good pics, your body tea, your facecard never decline, and geeezzz waist is missing too, police are still looking, I hear.",
  "But on top of that, who you are as a person, you are so lovable. I admire so many things about you and you, yourself. I'm so proud of my boyfriend.",
  "Anyways! I hope you didn't find this or the photo slideshow or the entire website itself cringe either... I forgot my crafts at home and this was the next best idea I had :P I also hope I did not make you feel diminished in anyway either, I never intend to make you feel like a baby.",
  "Lastly, thank you for always making time in your busy schedule to drive up and see me, now that I unfortunately live farther away. Thank you for always taking care of me, and for going along with my interests, even if it is not particularly your own interest.",
  "I said lastly but I actually could go on, I'm just stopping cause I know you don't like reading too much (yes, I did choose this song from your playlist cause you said you like reading/studying with high bpm songs haha).",
  "Happy Anniversary, Ken <3 I love you!",
  "With lotsss of love,\nmwahh<3",
];

const envelopeBtn = document.getElementById("envelope-btn");
const letterHint = document.getElementById("letter-hint");
const letterPaper = document.getElementById("letter-paper");
const letterTextEl = document.getElementById("letter-text");

function buildLetter() {
  letterTextEl.innerHTML = "";
  LETTER_PARAGRAPHS.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    letterTextEl.appendChild(p);
  });
}

let letterOpened = false;

function openLetter() {
  if (letterOpened) return; 
  letterOpened = true;

  envelopeBtn.classList.add("open"); 
  letterPaper.classList.add("open"); 
  letterHint.classList.add("hidden"); 
  envelopeBtn.disabled = true; 
}

/* envelope */
const DRAG_OPEN_DISTANCE = 110; 
const TAP_DISTANCE = 8;         


const ripSound = new Audio("assets/audio/rip.wav");
function playRipSound() {
  if (isMusicMuted) return; 
  ripSound.currentTime = 0; 
  ripSound.play().catch((err) => {
    console.log("Rip sound couldn't play yet:", err);
  });
}


function finishOpeningEnvelope() {
  if (letterOpened) return;
  envelopeBtn.classList.remove("dragging");
  envelopeBtn.style.setProperty("--peel", 1);
  envelopeBtn.style.setProperty("--melt", 1);
  playRipSound();
  openLetter();
}


let suppressNextClick = false;

envelopeBtn.addEventListener("pointerdown", (e) => {
  if (letterOpened) return;

  e.preventDefault();
  envelopeBtn.setPointerCapture(e.pointerId);
  envelopeBtn.classList.add("dragging");

  const startX = e.clientX;
  const startY = e.clientY;

  function cleanup() {
    envelopeBtn.releasePointerCapture(e.pointerId);
    envelopeBtn.removeEventListener("pointermove", onPointerMove);
    envelopeBtn.removeEventListener("pointerup", onPointerUp);
    envelopeBtn.removeEventListener("pointercancel", onPointerUp);
    envelopeBtn.classList.remove("dragging");
  }

  function onPointerMove(ev) {
    const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    const progress = Math.min(distance / DRAG_OPEN_DISTANCE, 1);
    envelopeBtn.style.setProperty("--peel", progress);
    envelopeBtn.style.setProperty("--melt", progress);

    if (progress >= 1) {
      cleanup();
      finishOpeningEnvelope();
    }
  }

  function onPointerUp(ev) {
    cleanup();
    suppressNextClick = true; 
    if (letterOpened) return; 

    const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    if (distance <= TAP_DISTANCE) {
      
      finishOpeningEnvelope();
    } else {
      
      envelopeBtn.style.setProperty("--peel", 0);
      envelopeBtn.style.setProperty("--melt", 0);
    }
  }

  envelopeBtn.addEventListener("pointermove", onPointerMove);
  envelopeBtn.addEventListener("pointerup", onPointerUp);
  envelopeBtn.addEventListener("pointercancel", onPointerUp);
});


envelopeBtn.addEventListener("click", () => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  finishOpeningEnvelope();
});

buildLetter();

/* footer */
const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/track/7EZzLjvLJlAbOixtiExeE8?utm_source=generator&theme=0&si=ef495bb031864c4f";

const spotifyWrap = document.getElementById("spotify-embed-wrap");

function buildSpotifyFooter() {
  spotifyWrap.innerHTML = "";

  if (SPOTIFY_EMBED_URL) {
    const iframe = document.createElement("iframe");
    iframe.src = SPOTIFY_EMBED_URL;
    iframe.width = "100%";
    iframe.height = "152";
    iframe.frameBorder = "0";
    iframe.loading = "lazy";
    
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    spotifyWrap.appendChild(iframe);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "spotify-placeholder";
    placeholder.innerHTML = `
      <div class="spotify-placeholder-icon">🎵</div>
      <p>
        Add your song here — open it in Spotify, tap Share &rarr; Embed,
        and paste the link as <code>SPOTIFY_EMBED_URL</code> near the
        bottom of js/script.js.
      </p>
    `;
    spotifyWrap.appendChild(placeholder);
  }
}

buildSpotifyFooter();

/* bg */
const FADE_MS = 1000;
const FADE_STEPS = 30;


const ALL_MUSIC_TRACKS = [music, letterMusic, outroMusic];

let currentMusicTrack = music;
let musicFadeTimer = null;

function switchMusicTrack(toTrack) {
  if (toTrack === currentMusicTrack) return;
  const fromTrack = currentMusicTrack;
  currentMusicTrack = toTrack;

  
  if (musicFadeTimer) clearInterval(musicFadeTimer);

  
  ALL_MUSIC_TRACKS.forEach((track) => {
    if (track !== fromTrack && track !== toTrack && !track.paused) {
      track.pause();
      track.volume = 1; 
    }
  });

  toTrack.muted = isMusicMuted; 
  toTrack.volume = 0;
  toTrack.play().catch((err) => {
    console.log("Track couldn't play yet:", err);
  });

  let step = 0;
  musicFadeTimer = setInterval(() => {
    step++;
    const t = step / FADE_STEPS;
    fromTrack.volume = Math.max(0, 1 - t);
    toTrack.volume = Math.min(1, t);

    if (step >= FADE_STEPS) {
      clearInterval(musicFadeTimer);
      musicFadeTimer = null;
      fromTrack.pause();
      fromTrack.volume = 1; 
    }
  }, FADE_MS / FADE_STEPS);
}

let isInLetterSection = false;
let isInOutroSection = false;

function updateActiveMusicTrack() {
  if (isInOutroSection) {
    switchMusicTrack(outroMusic);
  } else if (isInLetterSection) {
    switchMusicTrack(letterMusic);
  } else {
    switchMusicTrack(music);
  }
}


const letterMusicObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      isInLetterSection = entry.isIntersecting;
    });
    updateActiveMusicTrack();
  },
  { threshold: 0.6 }
);

const outroMusicObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      isInOutroSection = entry.isIntersecting;
    });
    updateActiveMusicTrack();
  },
  { threshold: 0.6 }
);

/* animation s */
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);
revealEls.forEach((el) => revealObserver.observe(el));
