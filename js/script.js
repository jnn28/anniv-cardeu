/* =========================================================
   1. THE PASSWORD
   =========================================================
   Heads up (this is a good thing to understand as a beginner):
   ANY code that runs in the browser can be viewed by opening
   "View Page Source" or the dev tools, including this file. So a
   password checked in JavaScript like this is really just a fun
   gate/easter-egg for someone snooping casually — it is NOT real
   security. That's completely fine for a personal gift site like
   this one, but never use this pattern to protect anything you
   actually need to keep private (bank info, private documents,
   etc.) — that requires checking the password on a server, which
   is a different (and much bigger) topic.
   ========================================================= */
const CORRECT_CODE = "1003"; // <-- change this to whatever 4 digits you want

/* =========================================================
   2. GRABBING THE ELEMENTS WE NEED
   ========================================================= */
const digitInputs = Array.from(document.querySelectorAll(".digit"));
const gateError = document.getElementById("gate-error");
const gateSection = document.getElementById("gate");
const htmlEl = document.documentElement; // the <html> tag — see the CSS comment on why scrolling/snap lives here, not on <body>
const dotsNav = document.getElementById("dots");
const muteBtn = document.getElementById("mute-btn");
const music = document.getElementById("bg-music");
const letterMusic = document.getElementById("letter-music"); // the section-5 track that swaps in for #letter — see "LETTER MUSIC SWAP" near the bottom of this file
const outroMusic = document.getElementById("outro-music"); // the section-6 (P.S. footer) track — same crossfade idea, see "OUTRO MUSIC SWAP" near the bottom of this file

/* =========================================================
   3. THE 4-DIGIT CODE INPUT BEHAVIOR
   Each digit lives in its own little box. We want it to feel like
   typing a phone verification code:
     - typing a digit jumps focus to the next box
     - backspace on an empty box jumps focus to the previous box
     - once all 4 boxes are filled, we automatically check the code
   ========================================================= */
digitInputs.forEach((input, i) => {
  input.addEventListener("input", () => {
    // Strip out anything that isn't 0-9 (in case someone pastes text)
    input.value = input.value.replace(/[^0-9]/g, "");

    if (input.value && i < digitInputs.length - 1) {
      digitInputs[i + 1].focus();
    }

    // If every box has a digit in it, try to unlock
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

  // Clear the shake class after the animation finishes so it can
  // replay next time (CSS animations don't restart on their own
  // if the class never gets removed).
  setTimeout(() => {
    gateSection.querySelector(".gate-card").classList.remove("shake");
  }, 400);

  // Clear the boxes and send focus back to the first one
  digitInputs.forEach((d) => (d.value = ""));
  digitInputs[0].focus();
}

/* =========================================================
   4. UNLOCKING THE SITE
   Runs once, when the correct code is entered.
   ========================================================= */
function unlockSite() {
  gateError.classList.remove("show");
  // Only fade out the card (title/subtitle/inputs) — not the whole
  // gate section — so the background photo is still there if the
  // visitor scrolls back up to the top later. See the matching CSS
  // comment on .gate-card.unlocking for why.
  gateSection.querySelector(".gate-card").classList.add("unlocking");

  // Start the music now — this click/keystroke is genuine user
  // interaction, so the browser's autoplay-blocking rules allow it.
  music.volume = 0.5;
  music.play().catch((err) => {
    // If it still gets blocked for some reason, we fail quietly
    // instead of showing the visitor a scary console error.
    console.log("Music couldn't autoplay yet:", err);
  });
  muteBtn.classList.remove("hidden");

  // Only start watching #letter (and #outro, just below) for their
  // music swaps (see "LETTER MUSIC SWAP" / "OUTRO MUSIC SWAP" near the
  // bottom of this file) once we're actually past the gate — this is a
  // small extra safety net on top of the geometry already making this
  // basically impossible before unlock (neither section is scrolled
  // into view yet), so there's no chance whatsoever of letterMusic or
  // outroMusic trying to play themselves before any real user
  // interaction has happened.
  letterMusicObserver.observe(document.getElementById("letter"));
  outroMusicObserver.observe(document.getElementById("outro"));

  // Wait for the fade-out animation (0.8s, set in CSS) before we
  // actually allow scrolling and reveal the dot navigation.
  setTimeout(() => {
    htmlEl.classList.add("unlocked");
    dotsNav.classList.remove("hidden");
    document.getElementById("lobby").scrollIntoView({ behavior: "smooth" });
  }, 800);
}

/* =========================================================
   5. MUSIC MUTE/UNMUTE BUTTON
   All three tracks (bg-music, letter-music, outro-music) need to stay
   in sync with each other — otherwise muting on the gallery, then
   scrolling to the letter or the footer, could suddenly un-mute you
   as whichever OTHER track fades in. isMusicMuted is the one shared
   source of truth; applyMusicMuted() is the only place that actually
   touches any <audio> element's .muted property, called both from
   here and from the crossfade itself (see "LETTER MUSIC SWAP" /
   "OUTRO MUSIC SWAP") whenever a track newly starts.
   ========================================================= */
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

/* =========================================================
   6. SIDE NAV DOTS — click to jump, and highlight whichever
   section is currently on screen.
   ========================================================= */
const dotLinks = Array.from(document.querySelectorAll(".dot"));

dotLinks.forEach((dot) => {
  dot.addEventListener("click", (e) => {
    e.preventDefault();

    // The gallery/letter/outro dots start (and stay, until the puzzle
    // is solved) with the "locked" class — see the PUZZLE GATE part of
    // this file, further down, for what actually enforces this same
    // rule against scrolling/swiping/keyboard navigation too, and for
    // nudgePuzzleLocked() itself.
    if (dot.classList.contains("locked")) {
      nudgePuzzleLocked();
      return;
    }

    const target = document.getElementById(dot.dataset.target);
    target.scrollIntoView({ behavior: "smooth" });
  });
});

// IntersectionObserver watches each <section> and tells us when it
// becomes (roughly) centered in the viewport, so we can light up the
// matching dot automatically as the visitor scrolls. currentSectionId
// is a plain record of "whichever section that was" for other code
// (the puzzle gate, below) to check without re-querying the DOM.
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

// Convenience for testing while we build: focus the first digit box
// as soon as the page loads.
digitInputs[0].focus();

/* =========================================================
   7. THE JIGSAW PUZZLE
   =========================================================
   How this works, in order:
     a) buildPuzzle() creates the board's "slot" squares (in correct
        order) and every loose "piece" (shuffled), placing pieces
        into the tray below the board. Each piece shows a different
        zoomed-in slice of the same photo, using background-position
        — this is the classic "CSS sprite" trick.
     b) makeDraggable() wires up Pointer Events (the modern, unified
        way to handle mouse AND touch input) so any piece can be
        picked up and moved with the finger/cursor, from wherever it
        currently sits — the tray or a board slot. Neither the tray
        nor a slot needs any manual positioning code: CSS flexbox and
        grid handle "where does this piece sit" automatically, and we
        only use a temporary visual transform while actively dragging.
     c) handleDrop() figures out what's underneath the piece when you
        let go: an empty slot snaps it into place; anywhere else it
        just returns to the tray.
     d) updateProgress() runs after every drop, counts how many
        pieces are correctly placed, updates the live "x / y placed
        correctly" counter, and reveals the "You did it!" message
        only once every single one matches.
   ========================================================= */

const PUZZLE_SIZE = 4;       // 4x4 = 16 pieces. Change this to any number — 3 for easy, 6+ for hard.
const PIECE_PX = 72;         // each piece's width/height, in pixels. Bumped up from 64 for a bigger, easier-to-grab puzzle — this is about as large as it can go while still fitting comfortably on the narrowest phone screens (tested down to 360px wide) without the board overflowing. The board's total size is CALCULATED from this (see below), never guessed separately.
const BOARD_GAP_PX = 3;      // must match .puzzle-board's "gap" in style.css
const BOARD_PADDING_PX = 3;  // must match .puzzle-board's "padding" in style.css
const PUZZLE_IMAGE = "assets/images/puzzle-photo.jpg"; // swap this for your real photo later — any shape/aspect ratio works now (see the cropping math below), no need to pre-crop it to a square yourself

function buildPuzzle() {
  const board = document.getElementById("puzzle-board");
  const tray = document.getElementById("puzzle-tray");

  // Wipe out anything already there (so re-running this — say, after
  // a page refresh — always starts clean).
  board.innerHTML = "";
  tray.innerHTML = "";

  const totalPieces = PUZZLE_SIZE * PUZZLE_SIZE;
  const correctOrder = Array.from({ length: totalPieces }, (_, i) => i); // [0,1,2,...]

  // --- Size the board to fit exactly PUZZLE_SIZE x PUZZLE_SIZE ---
  // IMPORTANT: this is the fix for a real bug — the board's total
  // pixel size must be built UP from the piece size (accounting for
  // the gaps between cells and the board's own padding), not guessed
  // independently. Earlier, the board size and piece size were two
  // separate numbers that didn't quite add up, so CSS Grid's "1fr"
  // columns ended up very slightly smaller than each piece actually
  // was. A track can never be smaller than the content forced into
  // it, so any row/column holding a placed piece silently grew a few
  // pixels to fit it, while still-empty rows/columns didn't — which
  // is exactly what caused the dashed grid to warp as you filled it
  // in. Calculating one size FROM the other guarantees they always
  // match exactly, no matter what PUZZLE_SIZE is set to.
  const boardSize =
    PIECE_PX * PUZZLE_SIZE +
    BOARD_GAP_PX * (PUZZLE_SIZE - 1) +
    BOARD_PADDING_PX * 2;

  board.style.width = `${boardSize}px`;
  board.style.height = `${boardSize}px`;
  board.style.gridTemplateColumns = `repeat(${PUZZLE_SIZE}, ${PIECE_PX}px)`;
  board.style.gridTemplateRows = `repeat(${PUZZLE_SIZE}, ${PIECE_PX}px)`;

  // --- Build the board slots, always in correct reading order ---
  correctOrder.forEach((i) => {
    const slot = document.createElement("div");
    slot.className = "puzzle-slot";
    slot.dataset.slot = i; // "this slot's correct piece number is i"
    board.appendChild(slot);
  });

  // --- The real, uncut photo that fades in once solved (see
  // .puzzle-solved-photo in style.css) — sitting on top of the
  // pieces from the start, just invisible (opacity: 0) until then.
  // Unlike every .puzzle-piece, this is a plain <img> showing the
  // WHOLE photo with no slicing at all, so there's no per-piece
  // rounded corner or drop shadow left to make it look chopped up —
  // just the photo, like you asked for.
  const solvedPhoto = document.createElement("img");
  solvedPhoto.className = "puzzle-solved-photo";
  solvedPhoto.alt = "";
  solvedPhoto.src = PUZZLE_IMAGE;
  board.appendChild(solvedPhoto);

  // --- Build one piece per position, in shuffled order, into the tray ---
  const shuffledOrder = [...correctOrder];
  shuffleInPlace(shuffledOrder);

  // --- Figure out how to slice the photo WITHOUT distorting it ---
  // The board is a perfect PUZZLE_SIZE x PUZZLE_SIZE SQUARE, but a
  // real photo almost never is one (a typical phone photo is closer
  // to a 3:4 or 9:16 rectangle). The old version scaled the photo by
  // PERCENTAGE — "400% of this piece's own box" — which stretches
  // width and height independently and has no idea what shape the
  // photo actually is. Force a rectangle to fill a square like that
  // and it comes out squashed or stretched, exactly like a reflection
  // in a funhouse mirror — that's the distortion.
  // The fix: load the photo first so its REAL pixel dimensions are
  // known, then scale it up by just enough that its SHORTER side
  // exactly fills the board, and center-crop away whatever hangs over
  // on the longer side. That's the same "fill the frame, crop the
  // excess, never stretch" idea as CSS's own `background-size: cover`
  // — just worked out by hand, in pixels, so the one big scaled photo
  // can be sliced across many separate piece elements and still line
  // up seamlessly, piece to piece, once solved.
  const gridPx = PIECE_PX * PUZZLE_SIZE; // the pieces sit flush against each other with no gap once solved (see .puzzle-board.solved in style.css), so this — not boardSize above, which also counts gap/padding — is the true total size the photo needs to cover.
  const photo = new Image();
  photo.onload = () => {
    const scale = gridPx / Math.min(photo.naturalWidth, photo.naturalHeight);
    const scaledW = photo.naturalWidth * scale;
    const scaledH = photo.naturalHeight * scale;
    // Whatever got scaled past the board on each axis is the part
    // that'll be cropped off — split it evenly on both sides so the
    // crop centers the photo instead of favoring one edge.
    const offsetX = (scaledW - gridPx) / 2;
    const offsetY = (scaledH - gridPx) / 2;

    shuffledOrder.forEach((i) => {
      const row = Math.floor(i / PUZZLE_SIZE);
      const col = i % PUZZLE_SIZE;

      const piece = document.createElement("div");
      piece.className = "puzzle-piece";
      piece.dataset.piece = i; // "this piece's correct slot number is i"
      piece.style.width = `${PIECE_PX}px`;
      piece.style.height = `${PIECE_PX}px`;

      // Every piece shares the exact same full-size, correctly
      // scaled background photo, just shifted by its own row/column
      // (plus the crop offset above) so each one shows a different,
      // perfectly-aligned window into it — like a projector throwing
      // one big picture across a wall of separate tiles. Pixels, not
      // percentages, on purpose: percentages here would be relative
      // to each tiny piece's own box again, undoing all of the above.
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

// The Fisher-Yates shuffle: the standard, unbiased way to shuffle an
// array. Walk backwards through the array, and for each spot, swap it
// with a random earlier (or equal) spot.
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Guards against two drags ever being "in flight" at the same time.
// Normally impossible with a single mouse/finger, but this keeps
// things predictable no matter what.
let dragInProgress = false;

function makeDraggable(piece) {
  piece.addEventListener("pointerdown", (e) => {
    if (dragInProgress) return;
    dragInProgress = true;

    e.preventDefault();
    piece.setPointerCapture(e.pointerId); // keeps sending move/up events to this element even if the pointer leaves it
    piece.classList.add("dragging");

    const startX = e.clientX;
    const startY = e.clientY;

    function onPointerMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Move the piece visually without changing its actual place in
      // the page's layout yet — transform is purely visual.
      piece.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    function onPointerUp(ev) {
      piece.releasePointerCapture(e.pointerId);
      piece.removeEventListener("pointermove", onPointerMove);
      piece.removeEventListener("pointerup", onPointerUp);
      piece.classList.remove("dragging");
      piece.style.transform = ""; // snap back — its new home (tray or slot) positions it correctly on its own

      handleDrop(piece, ev.clientX, ev.clientY);
      dragInProgress = false;
    }

    piece.addEventListener("pointermove", onPointerMove);
    piece.addEventListener("pointerup", onPointerUp);
  });
}

// Finds whichever board slot's rectangle contains the given point, by
// checking real geometry (getBoundingClientRect) rather than asking
// the browser "what element is visually on top here" (the DOM method
// elementFromPoint) — that turned out to be unreliable the instant
// any other piece was nearby, since it could end up reporting a
// neighboring piece instead of the slot beneath it. Comparing plain
// rectangles is simpler AND more dependable.
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
    // Empty slot under the drop point — place the piece there.
    targetSlot.appendChild(piece);
  } else if (targetSlot && targetSlot.firstElementChild === piece) {
    // Dropped back onto the exact slot it was already sitting in —
    // nothing to do.
  } else {
    // Either there's no slot here, or it's already occupied by a
    // DIFFERENT piece. Simplest, most predictable behavior: send it
    // back to the tray, where flex-wrap neatly re-flows every piece —
    // so nothing ever ends up crowded, overlapping, or off-screen.
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
  // Only true on the EXACT drop that finishes the puzzle — checked
  // before we toggle the "solved" class below — so the star rain (and
  // unlocking the rest of the site) fires exactly once, not on every
  // subsequent drop afterward.
  const justCompleted = isComplete && !board.classList.contains("solved");
  board.classList.toggle("solved", isComplete);
  message.classList.toggle("show", isComplete);

  if (justCompleted) {
    spawnStarRain();
    unlockRestOfSite(); // see the "PUZZLE GATE" part of this file, further down
  }
}

// A little celebration the instant the puzzle is completed: a big
// flurry of black-and-white paper-star "stickers" starts above the top
// of the screen and tumbles down past the bottom over a few slow
// seconds, staggered so they trickle down rather than falling as one
// rigid wave (see the matching .star-rain/.star-particle rules in
// style.css for the actual shapes/animation). Built fresh each time
// rather than reusing fixed elements, so there's nothing to reset
// between plays — it just cleans itself up afterward.
function spawnStarRain(count = 110) {
  const rain = document.createElement("div");
  rain.className = "star-rain";
  // Appended to <body>, not anywhere inside the puzzle — the stars
  // below are positioned with "position: fixed" (viewport coordinates),
  // so they can fall the full height of the screen regardless of where
  // the puzzle itself happens to sit on the page.
  document.body.appendChild(rain);

  // How far down a star has to travel to fully clear the screen,
  // whatever size it is — starting just above the top (see
  // .star-particle's "top: -40px" in the CSS) and needing to reach past
  // the bottom edge.
  const fallDistance = window.innerHeight + 120;

  // Build every star into an invisible, in-memory DocumentFragment first,
  // instead of calling rain.appendChild(star) 110 times directly. Every
  // append straight into the live page can force the browser to redo
  // layout/style work right then; batching them into a fragment and
  // appending it ONCE below means all 110 stars get inserted in a single
  // layout pass instead of up to 110 separate ones.
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    const isBlack = Math.random() < 0.5;
    star.className = isBlack ? "star-particle star-particle-black" : "star-particle";

    // A random point across the FULL WIDTH of the screen to fall from,
    // a gentle side-to-side sway on the way down, and a random spin —
    // read by the @keyframes starFall animation in CSS via these custom
    // properties (plus the two inline animation-* properties below), so
    // JS only has to pick the randomness once, not animate anything
    // frame-by-frame itself.
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

  rain.appendChild(fragment); // one single insertion into the live page, not 110

  // Clean up once every star has finished (longest possible delay +
  // duration is 1.2s + 3.8s = 5s) so these don't quietly pile up in the
  // page if the puzzle were ever solved more than once in a visit.
  setTimeout(() => rain.remove(), 5200);
}

buildPuzzle();

/* =========================================================
   PUZZLE GATE — no peeking at the rest of the site until it's solved
   =========================================================
   Blocks scrolling/swiping past the lobby section, and clicking any
   nav dot past it (see part 6, above, for that half), until the
   puzzle is actually solved. Three separate listeners below because
   there are three separate ways a visitor could try to move forward
   — the mouse wheel/trackpad, a touchscreen swipe, and the keyboard
   (arrows/space/page-down/end) — scroll-snap itself doesn't offer one
   single hook to block, so each has to be caught before the browser
   acts on it, not after.
   ========================================================= */
let puzzleSolved = false;

// Which nav dots are locked at the start — kept as one list so the
// dot-locking below and the click-guard up in part 6 both read from
// the same source, instead of two separate hardcoded copies.
const LOCKED_UNTIL_SOLVED = ["gallery", "letter", "outro"];

function unlockRestOfSite() {
  puzzleSolved = true;
  dotLinks.forEach((dot) => {
    if (LOCKED_UNTIL_SOLVED.includes(dot.dataset.target)) {
      dot.classList.remove("locked");
    }
  });
}

// The shared "nope" feedback for every blocked attempt below — same
// shake animation the wrong-password gate card uses. Scrolls back to
// the lobby first (in case the attempt came from a dot click made
// while sitting somewhere earlier, like the gate, where the puzzle
// itself isn't even on screen yet to shake) so the feedback is always
// actually visible, not just felt.
function nudgePuzzleLocked() {
  document.getElementById("lobby").scrollIntoView({ behavior: "smooth" });
  const wrap = document.querySelector(".puzzle-wrap");
  setTimeout(() => {
    wrap.classList.add("shake");
    setTimeout(() => wrap.classList.remove("shake"), 400);
  }, 350); // gives the scroll above a moment to actually arrive before shaking
}

// True only when a forward (downward) scroll/swipe/key-press happens
// while the puzzle isn't solved yet AND the lobby is the section
// currently on screen — scrolling forward from any EARLIER point
// isn't actually possible anyway, since scroll-snap-stop: always (see
// the CSS) stops at every section in order, so the lobby is always the
// first place this could ever come up.
function blockedGoingForward(deltaY) {
  return !puzzleSolved && currentSectionId === "lobby" && deltaY > 0;
}

// { passive: false } is required on both of these — it's what allows
// preventDefault() inside the handler to actually stop the scroll;
// without it, the browser is allowed to ignore preventDefault() for
// performance reasons and scroll anyway.
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
  { passive: true } // just recording a starting point — nothing to block yet, so this one can stay passive (cheaper for the browser)
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (touchStartY === null) return;
    // Finger moving UP the screen is what scrolls the page DOWN — same
    // sign convention as wheel's deltaY above, just derived by hand
    // instead of read directly off the event.
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

/* =========================================================
   8. PHOTO CAROUSEL
   =========================================================
   Same data-driven pattern as the puzzle above: the photos are just
   a plain list, and JS builds the actual slide/dot/month elements
   from it at runtime. Swap in your real photos later by editing
   CAROUSEL_PHOTOS — add, remove, or reorder entries however you
   like, in whatever order you actually want them to appear, and
   every piece of navigation logic below keeps working the same no
   matter how many there are.

   "caption" is entirely optional, photo by photo — leave it out of
   an entry entirely (like several below) and that photo just shows
   with no caption at all, no empty gap left behind.

   "type" is also optional — leave it out (like most entries below)
   and it's treated as a photo. Set it to "video" and that entry
   becomes a muted, looping video instead (see the February entry
   below for an example): it plays automatically the moment it
   scrolls into view and pauses again the moment you move on, so
   there's never more than one video actually playing at once.

   "stickers" is also entirely optional — a little extra flourish
   scattered on top of that one slide (a washi-tape strip, a small
   sticker, even a tiny second photo) for a scrapbook-page feel. Leave
   it out (like most entries below) and the slide is just the photo +
   caption, nothing extra. A whole pile of starter stickers is already
   sitting in assets/images/carousel/stickers/, ready to use or swap
   out for your own, grouped roughly by vibe:
     - heart-sticker.png, bow-sticker.png, ribbon-banner-sticker.png
     - star-sticker.png, sparkle-sticker.png, sun-sticker.png, moon-sticker.png
     - flower-sticker.png, butterfly-sticker.png, cloud-sticker.png
     - washi-tape.png, washi-tape-blue.png (both now a dark-navy-and-
       silver diagonal stripe, just mirrored — one navy-on-silver, one
       silver-on-navy)
     - cassette-sticker.png, camera-sticker.png, polaroid-sticker.png,
       ticket-sticker.png, paperclip-sticker.png (a more "retro desk
       drawer" set)
   The January, February, March, April, May, June, July, August,
   September, October, November, and December entries below each show
   one or more of these in use, as a working reference. Each one in the
   "stickers" list looks like:
     { src: "assets/images/carousel/stickers/heart-sticker.png", width: 130, top: "-20px", right: "-18px", rotate: 12 }
   - src: any image works, not just the starter ones — drop your own
     PNG (ideally with a transparent background) into that stickers
     folder and point src at it, exactly like a carousel photo.
   - width: how big it renders, in pixels. Height follows automatically
     from the image's own proportions. Leave it out and it defaults to
     150px — deliberately big, so a sticker reads as a bold scrapbook
     decoration rather than a tiny icon in the corner; style.css also
     caps it (see ".carousel-sticker") so an unusually large value
     still can't swallow a narrow phone screen. Since every sticker is
     pinned to a corner (see "top/left/right/bottom" below), going
     bigger mostly means it hangs further off that corner — the CENTER
     of the photo/caption stays clear either way, which is what
     actually keeps a big sticker from "covering" the photo itself.
   - top / left / right / bottom: where it sits, pinned to whichever
     edges you set (only set the ones you need — e.g. top + right pins
     it to a corner). Negative values (like "-20px") let it hang off
     the edge, the way a real sticker would — the bigger the sticker,
     the more negative you'll usually want this so it still reads as
     "hanging off a corner" instead of "sitting squarely on top."
     Nothing stops you from pinning to "bottom" instead of "top" too —
     several entries below do exactly that, for a corner peeking out
     the bottom of the photo instead of the top.
   - rotate: an optional tilt, in degrees (negative tilts left).
   - on: which box the sticker hangs off of. Leave it out (the default)
     and it pins to a corner of the PHOTO itself, like every sticker
     used to. Set it to "caption" instead and it pins to a corner of
     the CAPTION'S own box instead — same idea, just a smaller box to
     hang off of, out by the words rather than on the picture. (A
     "caption" sticker on an entry with no caption at all just falls
     back to the photo, since there's no caption box there to attach
     to.) The October, November, and December ("New year's eve prep")
     entries below show this in action.
   - The INNER corner (the one facing the gap between the photo and
     its caption, rather than the outer edge of the slide) works
     exactly the same way — it's just a choice of "left" vs. "right"
     on an ordinary photo-pinned sticker. Since the photo and caption
     swap sides every other entry (see the note above buildCarousel),
     which edge counts as "inner" flips too: a normal-layout entry
     (photo left, caption right) has its inner edge on the RIGHT of
     the photo; a ".side-right" entry (photo right, caption left) has
     it on the LEFT. The February ("Valentine's Day"), May ("That
     weekend trip"), November ("Game night"), and December ("Wrapping
     up the year") entries below all tuck a sticker right into that
     gap, straddling the photo and caption at once.
   A slide can list more than one sticker — just add more objects to
   its "stickers" array.
   ========================================================= */
const CAROUSEL_PHOTOS = [
  // ---------------------------------------------------------------
  // Reordered by hand (not chronologically anymore) — see the note
  // just below the array for the two stickers that needed a small
  // tweak because of it.
  // ---------------------------------------------------------------
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
    // This entry landed on an odd index after reordering, so it's
    // still ".side-right" (photo right, caption left) — its INNER
    // edge (the one facing the caption, not the outer edge of the
    // slide) is still the LEFT of the photo, so this didn't need to
    // change.
    stickers: [
      { src: "assets/images/carousel/stickers/butterfly-sticker.png", width: 130, top: "-22px", left: "-30px", rotate: -10 },
    ],
  },
  {
    src: "assets/images/carousel/05-may-1.jpg",
    alt: "May photo 1",
    caption: "this was the first time i really liked the ramen",
    // Inner-corner sticker — after reordering, this entry now lands on
    // a normal-layout (even) index (photo left, caption right), so its
    // inner edge flipped from left to the RIGHT of the photo. Changed
    // "left" to "right" here so the camera still tucks into the gap
    // next to the caption instead of hanging off the outer edge. Now
    // pinned to the top-right corner instead of bottom-right.
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
    // "on: caption" hangs this off the CAPTION's own corner instead of
    // the photo's — same negative-offset trick as any other corner
    // sticker, just a smaller box to hang off of. This kind of sticker
    // doesn't care which side of the slide the caption ends up on, so
    // reordering never affects it.
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
    // A little night-sky twinkle instead of the daytime sun over on May.
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
    // Moved to the top-left corner (the photo's outer edge on this
    // slide, rather than the inner one tucked toward the caption).
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
    // A third "on: caption" sticker. This slide is ".side-right" (photo
    // right, caption left), and this used to be pinned bottom-RIGHT —
    // the caption's INNER edge, facing the open gap toward the photo
    // with nothing there to anchor it to, which is what made it look
    // like it was floating in empty space. Moved to bottom-LEFT
    // instead, the caption's OUTER edge, so it actually hangs off the
    // text like the other caption stickers do.
    stickers: [
      { src: "assets/images/carousel/stickers/ticket-sticker.png", width: 140, on: "caption", bottom: "-22px", left: "-20px", rotate: -6 },
    ],
  },
  {
    src: "assets/images/carousel/12-december-5.jpg",
    alt: "December photo 5",
    caption: "'you look so proud of yourself'",
    // This entry landed on a normal-layout (even) index again after
    // reordering (photo left, caption right), so its inner edge is
    // still the RIGHT of the photo — a paperclip pinched right onto
    // that corner, like it's holding the year's photos together.
    stickers: [
      { src: "assets/images/carousel/stickers/paperclip-sticker.png", width: 95, top: "-30px", right: "-16px", rotate: 12 },
    ],
  },
  {
    src: "assets/images/carousel/11-november-1.jpg",
    alt: "November photo 1",
    caption: "your allergies really beat you up this day",
    // Another "on: caption" sticker — this one pinned to the opposite
    // (top-left) corner of its caption, just for a little variety.
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
let carouselIndex = 0; // which photo (by position in CAROUSEL_PHOTOS) is currently in view

// Guards against a rapid double-click on the arrows (or one landing
// right before/after a swipe is still settling) starting a second
// smooth-scroll before the first one finishes — same idea as
// dragInProgress up in the puzzle code. Without this, interrupting one
// scroll mid-flight with another can leave the UI one step out of sync
// with whichever photo the track actually settles on.
let carouselNavLocked = false;

function buildCarousel() {
  carouselTrack.innerHTML = "";

  CAROUSEL_PHOTOS.forEach((photo, i) => {
    const slide = document.createElement("div");

    // Scrapbook-style layout: the photo sits in a frame pinned to one
    // side, and (when there IS a caption) alternates left/right from
    // slide to slide — even positions default to the photo on the
    // left, odd positions get ".side-right", which is just the same
    // markup visually mirrored via CSS (flex-direction: row-reverse).
    // A photo with NO caption has nothing to put on the other side,
    // so it skips the side split and just centers itself instead
    // (".no-caption" in the CSS).
    if (photo.caption) {
      slide.className = i % 2 === 1 ? "carousel-slide side-right" : "carousel-slide";
    } else {
      slide.className = "carousel-slide no-caption";
    }

    // "frame" sizes and positions the photo (and is what any stickers
    // below pin themselves to); "inner" is the part that actually
    // clips to rounded corners + crops the image — split into two
    // elements specifically so a sticker can hang slightly off frame's
    // edge without inner's overflow: hidden cutting it off too.
    const frame = document.createElement("div");
    frame.className = "carousel-photo-frame";
    const inner = document.createElement("div");
    inner.className = "carousel-photo-inner";
    frame.appendChild(inner);

    if (photo.type === "video") {
      const video = document.createElement("video");
      video.src = photo.src;
      video.setAttribute("aria-label", photo.alt);
      video.muted = true; // required by every browser for autoplay to be allowed at all, regardless of user interaction
      video.loop = true;
      video.playsInline = true; // stops iOS Safari from hijacking it into fullscreen the moment it plays
      video.preload = "metadata"; // don't download the full video for every slide up front — just enough to show a first frame — the rest loads once it's actually the active slide and told to play()
      inner.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt;
      // All 29+ photos used to get requested from the server the
      // instant the page loaded, whether or not you'd ever scroll
      // down to the gallery yet — every one of them competing for
      // bandwidth and decode time right as you're also trying to
      // solve the puzzle. That pile-up finishing mid-scroll was the
      // main cause of the lag/glitch right as the gallery came into
      // view. "lazy" tells the browser to hold off requesting each
      // photo until it's actually about to scroll into sight (it
      // understands the sideways carousel scrolling too, not just
      // the page's own up/down scroll); "async" keeps the decoding
      // work off the main thread once it does load, instead of
      // blocking whatever animation/scroll is happening that frame.
      img.loading = "lazy";
      img.decoding = "async";
      inner.appendChild(img);
    }
    slide.appendChild(frame);

    // Only create a caption element at all when this particular photo
    // has one — same "no empty gap left behind" idea as the old
    // shared-caption version, just decided per-slide now instead of
    // toggling a .hidden class on one shared element. Kept in its own
    // variable (rather than just appended and forgotten) because a
    // "caption"-pinned sticker below needs to attach to this exact
    // element.
    let captionEl = null;
    if (photo.caption) {
      captionEl = document.createElement("p");
      captionEl.className = "carousel-caption";
      captionEl.textContent = photo.caption;
      slide.appendChild(captionEl);
    }

    // Optional decorations — see CAROUSEL_PHOTOS' comment block above
    // and the ".carousel-sticker" rule in style.css. Nothing renders
    // at all for a photo whose entry doesn't include a "stickers" list.
    (photo.stickers || []).forEach((sticker) => {
      const stickerEl = document.createElement("img");
      stickerEl.src = sticker.src;
      stickerEl.className = "carousel-sticker";
      stickerEl.alt = ""; // purely decorative — screen readers should skip it, not announce "image"
      stickerEl.setAttribute("aria-hidden", "true");
      stickerEl.loading = "lazy";
      stickerEl.decoding = "async";
      stickerEl.style.width = `${sticker.width || 150}px`;
      // Only set whichever edges this particular sticker actually
      // specifies — e.g. a sticker pinned via top+left has no "right"
      // or "bottom" set at all, rather than those defaulting to some
      // arbitrary 0 that would stretch/distort its positioning.
      if (sticker.top !== undefined) stickerEl.style.top = sticker.top;
      if (sticker.left !== undefined) stickerEl.style.left = sticker.left;
      if (sticker.right !== undefined) stickerEl.style.right = sticker.right;
      if (sticker.bottom !== undefined) stickerEl.style.bottom = sticker.bottom;
      stickerEl.style.transform = `rotate(${sticker.rotate || 0}deg)`;
      // "on" picks which box the sticker hangs off of — "photo" (the
      // default) appends it to "frame", so top/left/right/bottom above
      // pin it to a corner of the PHOTO, the way every sticker used to
      // work. "caption" appends it to the caption paragraph itself
      // instead, so it hangs off a corner of the CAPTION'S own (much
      // smaller) box — same "small negative offset lets it hang off
      // the edge" idea, just anchored to a different element. Falls
      // back to the photo frame if this particular photo has no
      // caption to attach to (an "on: caption" sticker on a caption-
      // less entry would otherwise silently vanish onto the full-page
      // background instead of erroring).
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

  // Clamp so a repeated click on prev/next past either end just does
  // nothing instead of erroring — belt-and-suspenders alongside the
  // disabled buttons below.
  const clamped = Math.max(0, Math.min(i, carouselSlideEls.length - 1));

  // The arrows only ever move one photo at a time, and so does a
  // swipe/drag (the browser's own native scrolling handles that part,
  // not this function) — so a plain smooth scrollIntoView is always
  // enough here. (An earlier version of this carousel also let you
  // jump straight to a far-off photo via a month-picker, which needed
  // a special instant-scroll path to avoid a multi-second animated
  // scroll through every photo in between — worth remembering if a
  // "jump to a specific photo" feature ever gets added back.)
  carouselSlideEls[clamped].scrollIntoView({
    behavior: "smooth",
    block: "nearest", // don't let this ALSO try to scroll the whole page vertically — stay within the horizontal track only
    inline: "start",
  });

  carouselNavLocked = true;
  setTimeout(() => {
    carouselNavLocked = false;
  }, 450); // a little longer than the smooth-scroll itself typically takes
}

function updateCarouselUI(index) {
  carouselIndex = index;
  const photo = CAROUSEL_PHOTOS[index];

  const kind = photo.type === "video" ? "Video" : "Photo";
  carouselPositionLabel.textContent = `${kind} ${index + 1} of ${carouselSlideEls.length}`;

  // (No caption update here anymore — each slide already has its own
  // caption built right into it, alongside its photo, from buildCarousel.)

  carouselPrevBtn.disabled = index === 0;
  carouselNextBtn.disabled = index === carouselSlideEls.length - 1;

  // Play whichever slide is now active IF it's a video, and pause
  // every other video — simplest way to guarantee at most one video
  // is ever playing (and using data/battery) at a time, no matter how
  // navigation got us here (an arrow or a swipe).
  carouselSlideEls.forEach((slide, i) => {
    const video = slide.querySelector("video");
    if (!video) return;
    if (i === index) {
      video.currentTime = 0; // always start from the beginning when a video becomes the active slide
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

// Whenever the visitor swipes/drags the track by hand — not just via
// the buttons — figure out which slide that left centered on screen,
// and update the dots/arrows to match. This is the exact same "watch
// what's on screen and react" trick the side nav dots use for the
// page's sections (way up in part 6 above), just scoped to this one
// scrolling track instead of the whole page.
const carouselObserver = new IntersectionObserver(
  (entries) => {
    // Usually only one slide's visibility changes at a time, so
    // there'd just be one entry here. But the VERY FIRST callback
    // right after we start observing is a special case: the browser
    // reports the starting state of every observed slide together in
    // one batch, and — since layout for a freshly-built, horizontally
    // scrolling track isn't always fully settled at that exact
    // instant — more than one of them can come back marked as
    // "intersecting" even though only the first slide is genuinely
    // on screen. Taking whichever entry is simply LAST in that batch
    // (as opposed to whichever is MOST visible) was picking the wrong
    // one. Sorting by intersectionRatio and keeping only the winner
    // fixes both that startup case and any other moment multiple
    // entries arrive together.
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

/* =========================================================
   9. THE LETTER
   =========================================================
   Same "the content is just a list" pattern one more time: the words
   themselves live in LETTER_PARAGRAPHS below, and JS turns that list
   into the actual <p> elements. Edit LETTER_PARAGRAPHS with whatever
   you actually want your letter to say — each entry becomes its own
   paragraph, so use as many (or as few) as you like. A literal line
   break typed inside any entry (like the one in the signature below)
   will show up as a real line break — see the CSS comment on
   .letter-text p (white-space: pre-line) for why that works.

   The envelope itself is always clickable — what actually keeps a
   visitor from reaching this section before they've solved the
   puzzle is the scroll/swipe/keyboard/nav-dot gate over in the
   "PUZZLE GATE" part of this file, further down, not anything here.
   ========================================================= */
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
  if (letterOpened) return; // stays open once opened — nothing to toggle back
  letterOpened = true;

  envelopeBtn.classList.add("open"); // starts the flap-open + envelope-fade-out animation (see the CSS)
  letterPaper.classList.add("open"); // starts the letter's fade/grow-in animation, timed via CSS transition-delay to follow right behind it
  letterHint.classList.add("hidden"); // "tap to open" no longer applies once it's already open
  envelopeBtn.disabled = true; // nothing left here to click a second time
}

/* ---------------------------------------------------------
   OPENING THE ENVELOPE: drag (or tap) to tear it open
   ---------------------------------------------------------
   Press anywhere on the envelope and drag it open, like peeling off a
   sticker — the flap peels back and the wax seal "melts" in real
   time, tracking your finger/cursor 1:1 (see the --peel/--melt custom
   properties this sets, and the matching .envelope-flap/.envelope-seal
   rules in style.css that read them). Drag far enough
   (DRAG_OPEN_DISTANCE) and it finishes opening — plays a little rip
   sound and reveals the letter — on its own, even before you let go.
   Let go earlier than that and it springs back shut. A plain tap or
   click (barely any movement) still opens it outright too, so
   dragging is the fun way in, never the ONLY way in.
   ----------------------------------------------------------- */
const DRAG_OPEN_DISTANCE = 110; // px of drag = fully torn open
const TAP_DISTANCE = 8;         // less movement than this on release counts as "just a tap", not a drag

// Unlike bg-music/letter-music up top, this doesn't need to live in
// the HTML — it's a one-shot sound effect, never looped, never needs
// to keep existing in the background — so a plain JS Audio object
// (never attached to the page itself) is all it takes.
const ripSound = new Audio("assets/audio/rip.wav");
function playRipSound() {
  if (isMusicMuted) return; // respect the same mute button as the music tracks
  ripSound.currentTime = 0; // in case it's still finishing from a moment ago
  ripSound.play().catch((err) => {
    console.log("Rip sound couldn't play yet:", err);
  });
}

// Actually finishes opening the envelope — called either mid-drag (the
// instant you've dragged the full distance) or on release (a full
// drag, or a simple tap/click/keyboard-Enter). Safe to call more than
// once per gesture: openLetter() above already no-ops after the first
// time, which matters because a mid-drag finish AND the click event
// that can still follow releasing a button sometimes BOTH end up
// calling this for the very same gesture.
function finishOpeningEnvelope() {
  if (letterOpened) return;
  envelopeBtn.classList.remove("dragging");
  envelopeBtn.style.setProperty("--peel", 1);
  envelopeBtn.style.setProperty("--melt", 1);
  playRipSound();
  openLetter();
}

// A mouse "click" event fires right after mouseup as long as mousedown
// and mouseup happened on the same element — EVEN after real, visible
// dragging in between, as long as you never left the button's own
// edges. Without this flag, that click would come along right after
// onPointerUp below finishes springing an incomplete drag back shut,
// and immediately reopen it anyway — this is what makes the click
// listener further down defer to whatever onPointerUp already decided,
// and only actually act on its own for a "real" click, i.e. one with no
// pointerdown/pointerup pair of ours in front of it (a keyboard
// Enter/Space press being the only case that leaves this untouched).
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
    suppressNextClick = true; // the click event about to follow this same gesture is already handled right here — see the comment on this flag above
    if (letterOpened) return; // already finished mid-drag, just above

    const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    if (distance <= TAP_DISTANCE) {
      // Barely moved at all — treat it as a simple tap/click instead
      // of an incomplete drag.
      finishOpeningEnvelope();
    } else {
      // Let go partway through — spring back shut. cleanup() already
      // removed "dragging", which turns the flap/seal's own CSS
      // transitions back on, so this eases back smoothly instead of
      // snapping instantly.
      envelopeBtn.style.setProperty("--peel", 0);
      envelopeBtn.style.setProperty("--melt", 0);
    }
  }

  envelopeBtn.addEventListener("pointermove", onPointerMove);
  envelopeBtn.addEventListener("pointerup", onPointerUp);
  envelopeBtn.addEventListener("pointercancel", onPointerUp);
});

// Keyboard users (Enter/Space on the focused button) never fire
// pointerdown at all, so this click listener is what opens it for
// them — routed through the same finishOpeningEnvelope() so they still
// get the rip sound and the same animation, just without dragging. Any
// click that followed one of OUR pointerdown/pointerup pairs instead
// (mouse or touch) is skipped via suppressNextClick — see that flag's
// comment above for why it's needed.
envelopeBtn.addEventListener("click", () => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  finishOpeningEnvelope();
});

buildLetter();

/* =========================================================
   10. SPOTIFY FOOTER
   =========================================================
   Paste a Spotify "embed" link here once you have one, and this
   section builds the real player automatically. To get one: open the
   song/playlist/album in Spotify -> Share -> Embed track (or
   playlist/album) -> Copy embed, and paste it here. It'll look like
   <iframe src="https://open.spotify.com/embed/track/XXXXXXXX...">
   — you only need the src="..." URL itself, not the whole <iframe>
   tag Spotify gives you.
   Left as an empty string, a friendly placeholder card shows instead
   of a broken player, explaining exactly this same thing.
   ========================================================= */
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
    // What this "allow" list is for, briefly: Spotify's player needs
    // permission for its own play button to actually start audio
    // (autoplay), and for a few of its other built-in controls
    // (fullscreen art view, its share/clipboard button, etc.) to work
    // once embedded on someone else's page like this one.
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

/* =========================================================
   11. LETTER & OUTRO MUSIC SWAPS
   =========================================================
   Crossfades smoothly between bg-music and letter-music/outro-music
   as those two sections scroll into (and back out of) view, rather
   than abruptly cutting one off and starting the other —
   switchMusicTrack ramps the old track's volume down to 0 while
   ramping the new one's up to 1 over FADE_MS, in small steps via
   setInterval, then pauses the track that just faded out (so it's
   not silently using battery in the background) and resets its
   volume back to full for next time. currentMusicTrack keeps track
   of which track is conceptually "on" right now, so this only ever
   does anything when the target is actually different from what's
   already playing.

   Letter and outro are two SEPARATE IntersectionObservers (one per
   section, watching independently), but they can't just each call
   switchMusicTrack directly with their own hardcoded fallback — when
   scrolling from outro back up into letter, both observers fire
   within moments of each other (outro's "I'm leaving" and letter's
   "I'm entering"), and whichever one happened to run its callback
   LAST would silently win, occasionally leaving bg-music playing
   instead of letter-music depending on tiny timing differences. So
   instead, each observer only updates a flag for whether its own
   section is currently on screen, and updateActiveMusicTrack() below
   is the one single place that turns "which sections are currently
   active" into "which track should be playing" — outro takes
   priority over letter, which takes priority over plain bg-music —
   so the answer comes out the same regardless of which observer
   happened to fire first. */
const FADE_MS = 1000;
const FADE_STEPS = 30;

// Every track this crossfade knows how to switch between — used just
// below to clean up anything left over from an interrupted fade.
const ALL_MUSIC_TRACKS = [music, letterMusic, outroMusic];

let currentMusicTrack = music;
let musicFadeTimer = null;

function switchMusicTrack(toTrack) {
  if (toTrack === currentMusicTrack) return;
  const fromTrack = currentMusicTrack;
  currentMusicTrack = toTrack;

  // If a previous fade was still running (a very quick scroll back
  // and forth could trigger that), cancel it rather than letting two
  // fades fight over the same <audio> elements' volume at once.
  if (musicFadeTimer) clearInterval(musicFadeTimer);

  // With THREE tracks now instead of two, cancelling a fade early
  // (right above) can leave a track stranded mid-fade — e.g. scroll
  // letter → outro → letter fast enough, and the very first fade
  // (letter fading OUT toward bg-music) can get cut off before its
  // own pause() ever runs, leaving letter-music quietly playing
  // forever at whatever volume it was interrupted at. Anything that
  // isn't part of THIS fade (not fromTrack, not toTrack) shouldn't
  // still be playing, so just flatly stop it here.
  ALL_MUSIC_TRACKS.forEach((track) => {
    if (track !== fromTrack && track !== toTrack && !track.paused) {
      track.pause();
      track.volume = 1; // reset for next time, same as a normal completed fade-out does below
    }
  });

  toTrack.muted = isMusicMuted; // keep whichever track we're fading IN synced with the mute button
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
      fromTrack.volume = 1; // reset now, quietly, so it's back at full volume ready for the NEXT time it fades in
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

// Neither observer is actually watching anything until unlockSite()
// calls letterMusicObserver.observe(...) / outroMusicObserver.observe(...)
// — see the comment there for why.
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

/* =========================================================
   12. SCROLL-REVEAL ANIMATIONS
   =========================================================
   Any element with the "reveal" class starts hidden and shifted down
   a bit in CSS (see .reveal in style.css) and gently fades + slides
   into place the FIRST time it scrolls into view — the same
   IntersectionObserver pattern used everywhere else on this site (the
   nav dots, the carousel, the letter-music swap above), just simpler:
   once an element has revealed itself we stop watching it
   (unobserve), rather than ever hiding it again on the way back out,
   so scrolling up and down later doesn't make text repeatedly flicker
   in and out.
   ========================================================= */
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
