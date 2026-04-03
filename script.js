gsap.registerPlugin(ScrollTrigger);

const isMobile = (window.innerWidth <= 768) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --- MOBILE CANVAS SEQUENCE LOGIC ---
class MobileSequence {
    constructor() {
        this.canvas = document.getElementById('mobile-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.frames = {
            1: [], 2: [], 3: [], 4: []
        };
        this.totalFrames = 240;
        this.currentSlide = 1;
        this.isLoaded = false;
        
        if (isMobile) {
            this.init();
        }
    }

    async init() {
        // Preload first frames immediately
        await this.preloadSlide(1);
        this.draw(1, 1);
        // Preload rest in background
        for (let i = 2; i <= 4; i++) {
            this.preloadSlide(i);
        }
    }

    async preloadSlide(slideIndex) {
        if (this.frames[slideIndex].length > 0) return;
        
        const promises = [];
        for (let i = 1; i <= this.totalFrames; i++) {
            const num = String(i).padStart(3, '0');
            const path = `mobileview/SLIDE${slideIndex}/ezgif-frame-${num}.jpg`;
            promises.push(this.loadImage(path));
        }
        
        this.frames[slideIndex] = await Promise.all(promises);
        if (slideIndex === 1) this.isLoaded = true;
    }

    loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null); // Handle missing frames gracefully
            img.src = src;
        });
    }

    draw(slideIndex, frameIndex) {
        if (!this.canvas || !this.ctx) return;
        
        // Ensure frameIndex is within 1-240
        frameIndex = Math.max(1, Math.min(this.totalFrames, Math.round(frameIndex)));
        const img = this.frames[slideIndex][frameIndex - 1];
        
        if (!img) return;

        // Cover logic
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, x, y;
        
        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            x = 0;
            y = (canvasHeight - drawHeight) / 2;
        } else {
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            x = (canvasWidth - drawWidth) / 2;
            y = 0;
        }
        
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }

    async animate(slideIndex, direction = 'forward', onComplete) {
        this.currentSlide = slideIndex;
        let start = (direction === 'forward') ? 1 : this.totalFrames;
        let end = (direction === 'forward') ? this.totalFrames : 1;
        
        gsap.to({ frame: start }, {
            frame: end,
            duration: 1.5, // Match desktop video duration approx
            ease: "none",
            onUpdate: function() {
                mobileSeq.draw(slideIndex, this.targets()[0].frame);
            },
            onComplete: onComplete
        });
    }
}

const mobileSeq = new MobileSequence();

const customCursor = document.getElementById("cursor");
const cursorFollower = document.getElementById("cursor-follower");

// Ultra-snappy follower
const xFol = gsap.quickTo(cursorFollower, "x", {duration: 0.08, ease: "power1.out", xPercent: -50});
const yFol = gsap.quickTo(cursorFollower, "y", {duration: 0.08, ease: "power1.out", yPercent: -50});

window.addEventListener("mousemove", (e) => {
  if (isMobile) return; // Completely disable cursor logic on mobile
  
  // Use set for the main dot (zero latency)
  gsap.set(customCursor, { x: e.clientX, y: e.clientY });
  xFol(e.clientX);
  yFol(e.clientY);
});

if (isMobile) {
  if (customCursor) customCursor.style.display = 'none';
  if (cursorFollower) cursorFollower.style.display = 'none';
}

document.querySelectorAll('.feature-item, #hold-button, .cupboard, .parallax-project').forEach(item => {
  item.addEventListener('mouseenter', () => cursorFollower.classList.add('hover-active'));
  item.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover-active'));
});

// Intro Interaction
let holdTween;
let startHold, endHold;

function setupInteraction() {
  const holdBtn = document.getElementById('hold-button');
  const holdFill = document.querySelector('.hold-fill');
  if (!holdBtn) return;
  
  if (isMobile) {
    // 📱 MOBILE: One tap triggers everything instantly
    const handleMobileTap = (e) => {
       e.preventDefault();
       if (window.navigator.vibrate) window.navigator.vibrate(100);
       gsap.to(holdFill, { scale: 1, duration: 0.3, ease: "power2.out", onComplete: turnOn });
       holdBtn.removeEventListener('touchstart', handleMobileTap);
    };
    holdBtn.addEventListener('touchstart', handleMobileTap, {passive: false});
    return;
  }

  // 💻 DESKTOP: Existing Hold Logic - NO CHANGES
  if (!startHold) {
    startHold = (e) => {
      e.preventDefault(); 
      if (!holdFill) return;
      holdTween = gsap.to(holdFill, {
        scale: 1, duration: 1.5, ease: "power1.inOut",
        onComplete: () => {
          turnOn();
          holdBtn.removeEventListener('mousedown', startHold);
          window.removeEventListener('mouseup', endHold);
        }
      });
    };
  }

  if (!endHold) {
    endHold = () => {
      if (holdTween && holdTween.progress() < 1) {
        holdTween.kill();
        gsap.to(holdFill, { scale: 0, duration: 0.5, ease: "power2.out" });
      }
    };
  }

  // Cleanup & Add
  holdBtn.removeEventListener('mousedown', startHold);
  window.removeEventListener('mouseup', endHold);
  holdBtn.addEventListener('mousedown', startHold);
  window.addEventListener('mouseup', endHold);
}

setupInteraction();

// Ensure loader video is at first frame on start
window.addEventListener('load', () => {
  const loaderVideo = document.getElementById('loader-video');
  if (loaderVideo) {
    loaderVideo.currentTime = 0;
    loaderVideo.pause();
    loaderVideo.style.opacity = 1; // Reveal initial state after hidden in CSS
  }
});

const videos = [
  document.getElementById("vid-1"),
  document.getElementById("vid-2"),
  document.getElementById("vid-3"),
  document.getElementById("vid-4")
];

const revVideos = [
  document.getElementById("vid-1-rev"),
  document.getElementById("vid-2-rev"),
  document.getElementById("vid-3-rev"),
  document.getElementById("vid-4-rev")
];

function turnOn() {
  const loaderVideo = document.getElementById('loader-video');
  const holdBtn = document.getElementById('hold-button');
  document.body.style.overflow = "hidden"; 
  
  // Hide UI immediately so we can see the full video transition
  if (holdBtn) {
    gsap.to([holdBtn, '.hold-text'], { scale: 0, opacity: 0, duration: 0.4, ease: "back.in(1.7)" });
  }
  
  if (loaderVideo) {
    activeTransitionVideo = loaderVideo; // Enable scroll-based speedup
    loaderVideo.play();
    
    // When video is almost finished, start revealing the main content
    loaderVideo.ontimeupdate = () => {
      if (loaderVideo.currentTime >= loaderVideo.duration - 0.6) {
        loaderVideo.ontimeupdate = null; 
        revealMainContent();
      }
    };

    loaderVideo.onended = () => {
       activeTransitionVideo = null; // Clear after completion
    };
  } else {
    revealMainContent();
  }
}

function revealMainContent() {
  const tl = gsap.timeline();
  
  // Lazy load: ensure first 2 videos are ready
  preloadVideosForIndex(0);
  
  // Ensure section 1 and background are ready
  sectionElements = document.querySelectorAll('.sec');
  // Hide contents BEFORE making section visible to prevent flashing
  gsap.set([".logo-switcher", ".side-hero-logo", ".features-list", "#off-button", ".interactive-square"], { opacity: 0 });
  
  gsap.set(sectionElements[0], { opacity: 1, visibility: "visible", pointerEvents: "auto" });
  if (isMobile) {
      mobileSeq.draw(1, 1);
  } else if (videos[0]) {
      videos[0].style.opacity = 1;
      // Force a frame on mobile by seeking slightly past zero
      videos[0].currentTime = 0.05; 
  }

  tl.to("#hold-button", { scale: 0, opacity: 0, duration: 0.2 })
    .to("#loader", { opacity: 0, pointerEvents: "none", duration: 0.4, ease: "none" }) 
    .set("#scrolly-container", { display: "block" }, "-=0.4")
    .to("#video-container", { opacity: 1, duration: 0.4, ease: "none" }, "-=0.4")
    
    // Matched entrance from goToPrevSlide
    .fromTo(".logo-switcher", { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" }, "-=0.2")
    .fromTo(".side-hero-logo", { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" }, "-=1.6")
    .fromTo(".features-list", { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, ease: "power3.out" }, "-=1.6")
    .fromTo("#off-button", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out" }, "-=1.6")
    .fromTo(".scroll-indicator", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }, "-=1.4")
    .add(() => {
        animateSquaresIn();
        initSquaresInteraction();
        scrollingLocked = false; 
    }, "-=1.6"); 
    
  setTimeout(() => {
    initSliderAnimations(); // Prep other sections and ensures slide elements are ready
    ScrollTrigger.refresh();
  }, 100);
}

let currentSectionIndex = 0;
const totalSections = 5;
let scrollingLocked = true; // Start locked during loader
let sectionElements = [];

let activeTransitionVideo = null;
let scrollIntensity = 0;

let isSpeedKeyHeld = false;

// Update playback rate based on scroll intensity
gsap.ticker.add(() => {
  if (scrollingLocked && isSpeedKeyHeld) {
    // Inject artificial scroll delta every frame (60fps) if key is held
    handleIntensiveScroll(25);
  }

  if (activeTransitionVideo) {
    // Smoothen the intensity decay
    scrollIntensity *= 0.92;
    if (scrollIntensity < 0.01) scrollIntensity = 0;
    
    // Normal speed is 1.0, max is ~3.5
    const targetRate = 1 + (scrollIntensity * 0.015);
    activeTransitionVideo.playbackRate = Math.min(targetRate, 3.5);
  }
});

function handleIntensiveScroll(delta) {
  if (scrollingLocked) {
    scrollIntensity += Math.abs(delta);
  }
}

// Global Event Listeners - Call once
function setupGlobalEventListeners() {
  const offBtn = document.getElementById("off-button");
  if (offBtn) offBtn.addEventListener("click", turnOff);
  
  window.addEventListener("wheel", (e) => {
    handleIntensiveScroll(e.deltaY);
    if (scrollingLocked) return;
    if (e.deltaY > 30) goToNextSlide();
    else if (e.deltaY < -30) goToPrevSlide();
  });

  window.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowRight", "PageDown", " ", "ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        isSpeedKeyHeld = true;
    }

    if (scrollingLocked) return;
    
    // We only trigger next/prev slide on physical key press, disregarding repeat holding behavior
    if (e.repeat) return;
    
    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      goToNextSlide();
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      goToPrevSlide();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (["ArrowDown", "ArrowRight", "PageDown", " ", "ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        isSpeedKeyHeld = false;
    }
  });

  let touchStartY = 0;
  window.addEventListener("touchstart", e => { touchStartY = e.touches[0].clientY; }, {passive: false});
  window.addEventListener("touchmove", e => { 
    if (!scrollingLocked) e.preventDefault(); 
    if (scrollingLocked) {
      const currentY = e.touches[0].clientY;
      handleIntensiveScroll((touchStartY - currentY) * 2);
    }
  }, {passive: false}); 

  window.addEventListener("touchend", e => {
    if (scrollingLocked) return;
    const touchEndY = e.changedTouches[0].clientY;
    if (touchStartY - touchEndY > 40) goToNextSlide();
    else if (touchEndY - touchStartY > 40) goToPrevSlide();
  });

  // Attach mobile touch effects once
  if (isMobile) {
    document.querySelectorAll('.feature-item, .dev-link-btn, #off-button').forEach(el => {
      el.addEventListener('touchstart', () => el.classList.add('touch-active'), {passive: true});
      el.addEventListener('touchend', () => el.classList.remove('touch-active'), {passive: true});
      el.addEventListener('touchcancel', () => el.classList.remove('touch-active'), {passive: true});
    });
  }

  initOrbitNavigation();
}
setupGlobalEventListeners();

function initSliderAnimations() {
  sectionElements = document.querySelectorAll('.sec');
  
  // Set all but section 1 to hidden
  gsap.set(Array.from(sectionElements).slice(1), { opacity: 0, pointerEvents: "none", visibility: "hidden" });
  
  // Ensure section 1 is flagged as the current one correctly but leave animations to revealMainContent
  gsap.set(sectionElements[0], { opacity: 1, pointerEvents: "auto", visibility: "visible" });
}

function turnOff() {
  scrollingLocked = true;
  const loaderVidRev = document.getElementById("loader-video-rev");
  const loaderVid = document.getElementById("loader-video");
  
  if (loaderVid) {
    loaderVid.pause();
    loaderVid.currentTime = 0;
  }
  
  const tl = gsap.timeline();
  
  // IMMEDIATELY prep video visibility before any other animation starts
  tl.set(loaderVid, { opacity: 0 })
    .set(loaderVidRev, { opacity: 1 })
    .set("#hold-button", { opacity: 0, scale: 0 }) 
    .set(".hold-fill", { scale: 0 });

  // Slide UI back out of frame - Matched Slide 1 exit from goToNextSlide
  tl.to(".logo-switcher", { x: -200, opacity: 0, duration: 1, ease: "power2.in" })
    .to(".side-hero-logo", { x: 300, opacity: 0, duration: 1.2, ease: "power2.in" }, "-=0.8")
    .to(".features-list", { y: -150, opacity: 0, duration: 1, ease: "power2.in" }, "-=1.0")
    .to("#off-button", { opacity: 0, duration: 0.5 }, "-=0.8")
    .add(() => animateSquaresOut(), "-=1.0")
    
    .to("#scrolly-container", { opacity: 0, duration: 0.8, ease: "power2.in" }, "-=0.6")
    .to("#video-container", { opacity: 0, duration: 0.8, ease: "power2.in" }, "-=0.8")
    .to("#loader", { opacity: 1, duration: 0.8, ease: "power2.out", pointerEvents: "auto" }, "-=0.8")
    .add(() => {
      if (loaderVidRev) {
        activeTransitionVideo = loaderVidRev; // Enable scroll-based speedup
        loaderVidRev.currentTime = 0;
        loaderVidRev.play();
        
        loaderVidRev.ontimeupdate = () => {
           if (loaderVidRev.currentTime >= loaderVidRev.duration - 0.4) {
              loaderVidRev.ontimeupdate = null;
              gsap.to("#hold-button", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" });
           }
        };

        loaderVidRev.onended = () => {
          activeTransitionVideo = null; // Clear active video
          // SEAMLESS RESET: No reload used to prevent flash
          if (loaderVidRev) loaderVidRev.pause();
          if (loaderVid) loaderVid.pause();
          
          gsap.set(loaderVidRev, { opacity: 0 });
          gsap.set(loaderVid, { opacity: 1 }); // Show start video again for next loop
          
          currentSectionIndex = 0;
          scrollingLocked = true;
          
          // Reset UI states for next time
          gsap.set(".sec", { opacity: 0, visibility: "hidden" });
          gsap.set(sectionElements[0], { opacity: 1, visibility: "visible" });
          gsap.set(".features-list", { opacity: 0, y: 30 });
          gsap.set(".side-hero-logo", { opacity: 0, x: 300 });
          gsap.set(".logo-switcher", { opacity: 1, x: 0 });
          gsap.set("#video-container", { opacity: 0 });
          gsap.set("#scrolly-container", { opacity: 1, display: "none" }); // Reset for next fade in
          
          videos.forEach(v => { if(v) { v.pause(); v.style.opacity = 0; v.currentTime = 0; } });
          revVideos.forEach(v => { if(v) { v.pause(); v.style.opacity = 0; v.currentTime = 0; } });
          
          // Re-enable hold interaction
          setupInteraction();
        };
      } else {
        window.location.reload();
      }
    });
}

function goToNextSlide() {
  if (currentSectionIndex >= totalSections - 1) return;
  scrollingLocked = true;

  const currentSec = sectionElements[currentSectionIndex];
  const nextSectionIndex = currentSectionIndex + 1;
  const nextSec = sectionElements[nextSectionIndex];
  const currentContent = currentSec.querySelector('.hero-text-container, .content-wrapper');
  const nextContent = nextSec.querySelector('.content-wrapper');

  // Exit Current Content
  if (currentSectionIndex === 0) {
     gsap.to("#off-button", { opacity: 0, duration: 0.5 });
     gsap.to(".logo-switcher", { x: -200, opacity: 0, duration: 1, ease: "power2.in" });
     gsap.to(".side-hero-logo", { x: 300, opacity: 0, duration: 1.2, ease: "power2.in" });
     gsap.to(".features-list", { y: -150, opacity: 0, duration: 1, ease: "power2.in" });
     animateSquaresOut();
  } else if (currentContent) {
     const exitDir = { opacity: 0, top: -200, left: 0, duration: 0.8, ease: "power2.in" };
     if (currentSec.classList.contains('sec-2') || currentSec.classList.contains('sec-4')) {
        exitDir.left = 300; exitDir.top = 0;
     }
     gsap.to(currentContent, exitDir);
  }
  
  gsap.to(currentSec, { opacity: 0, duration: 0.8, delay: 0.4, onComplete: () => {
    gsap.set(currentSec, {visibility: "hidden", pointerEvents: "none"});
  }});

  const activeVideo = videos[currentSectionIndex];
  const nextVideo = videos[nextSectionIndex];

  if (isMobile) {
      // 📱 MOBILE: Frame-based Canvas Animation
      mobileSeq.animate(currentSectionIndex + 1, 'forward', () => {
          currentSectionIndex = nextSectionIndex;
          gsap.set(nextSec, { visibility: "visible", opacity: 1, pointerEvents: "auto" });
          setTimeout(() => { scrollingLocked = false; }, 800);
      });

      // Trigger UI entrance halfway through
      setTimeout(() => {
          gsap.set(nextSec, { visibility: "visible", opacity: 1 });
          if (nextContent) {
              const enterFrom = { opacity: 0, top: 200, left: 0, scale: 0.95 };
              if (nextSec.classList.contains('sec-2') || nextSec.classList.contains('sec-4')) {
                enterFrom.left = 200; enterFrom.top = 0;
              }
              gsap.fromTo(nextContent, enterFrom, { opacity: 1, left: 0, top: 0, scale: 1, duration: 1.5, ease: "power3.out", clearProps: "left,top,scale" });
              nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door').forEach(el => el.style.setProperty('--blur-amt', '20px'));
          }
      }, 750);
      
      return; 
  }
  
  if (nextVideo) {
      nextVideo.pause();
      nextVideo.currentTime = 0; 
  }
  
  if (activeVideo) {
      activeTransitionVideo = activeVideo;
      activeVideo.style.opacity = 1;
      activeVideo.currentTime = 0;
      activeVideo.play();
      
      let uiTriggered = false;

      const timeUpdateCheck = () => {
          if (!uiTriggered && activeVideo.currentTime >= activeVideo.duration - 1.2) {
              uiTriggered = true;
              gsap.set(nextSec, { visibility: "visible", opacity: 1 });
              
              if (nextContent) {
                  gsap.set(nextContent, { position: "relative" }); 
                  const enterFrom = { opacity: 0, top: 300, left: 0, scale: 0.95 };
                  if (nextSec.classList.contains('sec-2') || nextSec.classList.contains('sec-4')) {
                    enterFrom.left = 500; enterFrom.top = 0;
                  }
                  gsap.fromTo(nextContent, enterFrom, { opacity: 1, left: 0, top: 0, scale: 1, duration: 2, ease: "power3.out", clearProps: "left,top,scale" });
                  
                  if (!isMobile) {
                    const glass = nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door');
                    if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 2, ease: "power3.out", clearProps: "--blur-amt" });
                  } else {
                    nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door').forEach(el => el.style.setProperty('--blur-amt', '20px'));
                  }
              }
          }
      };

      activeVideo.addEventListener("timeupdate", timeUpdateCheck);

      activeVideo.onended = () => {
         activeVideo.removeEventListener("timeupdate", timeUpdateCheck);
         activeTransitionVideo = null;
         activeVideo.playbackRate = 1.0;
         
         if (nextVideo) {
            nextVideo.style.opacity = 1;
            activeVideo.style.opacity = 0; 
            activeVideo.pause();
         }

         currentSectionIndex = nextSectionIndex;
         preloadVideosForIndex(currentSectionIndex);
         
         if (!uiTriggered) {
             gsap.set(nextSec, { visibility: "visible", opacity: 1 });
             if (nextContent) {
                  gsap.fromTo(nextContent, { opacity: 0, top: 100 }, { opacity: 1, top: 0, duration: 1.5, clearProps: "all" });
                  
                  if (!isMobile) {
                    const glass = nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard');
                    if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 1.5, ease: "power3.out", clearProps: "--blur-amt" });
                  } else {
                    nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard').forEach(el => el.style.setProperty('--blur-amt', '20px'));
                  }
             }
         }
         
         gsap.set(nextSec, { pointerEvents: "auto" });
         
         // Prevent double-skipping from trackpad inertia and let UI finish revealing
         setTimeout(() => { scrollingLocked = false; }, 1200);
      };
      
      activeVideo.onerror = () => activeVideo.onended();
  } else {
      setTimeout(() => {
         currentSectionIndex = nextSectionIndex;
         gsap.set(nextSec, { visibility: "visible", opacity: 1 });
         if (nextContent) {
            gsap.fromTo(nextContent, { opacity: 0, top: 100 }, { opacity: 1, top: 0, duration: 1.5, clearProps: "all" });
            const glass = nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door');
            if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 1.5, ease: "power3.out", clearProps: "--blur-amt" });
         }
         setTimeout(() => { scrollingLocked = false; }, 1200);
      }, 1500);
  }
}

function goToPrevSlide() {
  if (currentSectionIndex <= 0) return;
  scrollingLocked = true;

  const currentSec = sectionElements[currentSectionIndex];
  const prevSectionIndex = currentSectionIndex - 1;
  const prevSec = sectionElements[prevSectionIndex];
  const currentContent = currentSec.querySelector('.content-wrapper');
  const prevContent = (prevSectionIndex === 0) ? prevSec.querySelector('.hero-text-container') : prevSec.querySelector('.content-wrapper');

  // Exit Current Content
  if (currentContent) {
     const exitDir = { opacity: 0, top: 300, left: 0, duration: 0.8, ease: "power2.in" };
     if (currentSec.classList.contains('sec-2') || currentSec.classList.contains('sec-4')) {
        exitDir.left = 500; exitDir.top = 0;
     }
     gsap.to(currentContent, exitDir);
  }
  gsap.to(currentSec, { opacity: 0, duration: 0.8, delay: 0.4, onComplete: () => gsap.set(currentSec, {visibility: "hidden"}) });

  const revVideo = revVideos[prevSectionIndex];
  const targetForwardVideo = videos[prevSectionIndex];

  if (isMobile) {
      // 📱 MOBILE: Frame-based Canvas Animation (BACKWARD)
      mobileSeq.animate(prevSectionIndex + 1, 'backward', () => {
          currentSectionIndex = prevSectionIndex;
          gsap.set(prevSec, { visibility: "visible", opacity: 1, pointerEvents: "auto" });
          setTimeout(() => { scrollingLocked = false; }, 800);
      });

      // Trigger UI entrance halfway through
      setTimeout(() => {
          if (prevSectionIndex === 0) {
              gsap.to("#off-button", { opacity: 1, duration: 1.5, ease: "power3.out" });
              gsap.fromTo(".logo-switcher", { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
              gsap.fromTo(".side-hero-logo", { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
              gsap.fromTo(".features-list", { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
              animateSquaresIn();
          } else if (prevContent) {
              const enterFrom = { opacity: 0, top: -200, left: 0, scale: 0.95 };
              if (prevSec.classList.contains('sec-2') || prevSec.classList.contains('sec-4')) {
                enterFrom.left = -200; enterFrom.top = 0;
              }
              gsap.fromTo(prevContent, enterFrom, { opacity: 1, left: 0, top: 0, scale: 1, duration: 1.5, ease: "power3.out", clearProps: "left,top,scale" });
              prevContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door').forEach(el => el.style.setProperty('--blur-amt', '20px'));
          }
      }, 750);
      
      return;
  }
  
  if (revVideo) {
      activeTransitionVideo = revVideo;
      revVideo.style.opacity = 1;
      revVideo.currentTime = 0;
      revVideo.play();
      
      videos.forEach(v => { if(v) v.style.opacity = 0; });
      revVideos.forEach((v, idx) => { if(v && idx !== prevSectionIndex) v.style.opacity = 0; });

      let uiTriggered = false;

      const timeUpdateCheck = () => {
          if (!uiTriggered && revVideo.currentTime >= revVideo.duration - 1.2) {
              uiTriggered = true;
              gsap.set(prevSec, { visibility: "visible", opacity: 1 });
              
              if (prevSectionIndex === 0) {
                 gsap.to("#off-button", { opacity: 1, duration: 1.5, ease: "power3.out" });
                 gsap.fromTo(".logo-switcher", { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
                 gsap.fromTo(".side-hero-logo", { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
                 gsap.fromTo(".features-list", { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, ease: "power3.out" });
                 animateSquaresIn();
              } else if (prevContent) {
                 gsap.set(prevContent, { position: "relative", cursor: "pointer", transition: "all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)", overflow: "visible" });
                 const enterFrom = { opacity: 0, top: -250, left: 0, scale: 0.95 };
                 if (prevSec.classList.contains('sec-2') || prevSec.classList.contains('sec-4')) {
                    enterFrom.left = -500; enterFrom.top = 0; // Mirror exit direction
                 }
                 gsap.fromTo(prevContent, enterFrom, { opacity: 1, left: 0, top: 0, scale: 1, duration: 2, ease: "power3.out", clearProps: "left,top,scale" });
                 
                 if (!isMobile) {
                    const glass = prevContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door');
                    if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 2, ease: "power3.out", clearProps: "--blur-amt" });
                 } else {
                    prevContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door').forEach(el => el.style.setProperty('--blur-amt', '20px'));
                 }
              }
          }
      };

      revVideo.addEventListener("timeupdate", timeUpdateCheck);

      revVideo.onended = () => {
          revVideo.removeEventListener("timeupdate", timeUpdateCheck);
          activeTransitionVideo = null;
          revVideo.playbackRate = 1.0;
          
          if (targetForwardVideo) {
              targetForwardVideo.pause();
              targetForwardVideo.style.opacity = 1;
              targetForwardVideo.currentTime = 0; 
              revVideo.pause();
              revVideo.style.opacity = 0;
          }

          currentSectionIndex = prevSectionIndex;
          preloadVideosForIndex(currentSectionIndex);
          gsap.set(prevSec, { pointerEvents: "auto" });
          
          // Prevent double-skipping from trackpad inertia and let UI finish revealing
          setTimeout(() => { scrollingLocked = false; }, 1200);
      };

      revVideo.onerror = () => revVideo.onended();
  } else {
      setTimeout(() => {
          currentSectionIndex = prevSectionIndex;
          gsap.set(prevSec, { visibility: "visible", opacity: 1, pointerEvents: "auto" });
          if (prevContent) {
             gsap.fromTo(prevContent, { opacity: 0, top: -200 }, { opacity: 1, top: 0, duration: 1.5, clearProps: "all" });
             const glass = prevContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door');
             if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 1.5, ease: "power3.out", clearProps: "--blur-amt" });
          }
          setTimeout(() => { scrollingLocked = false; }, 1200);
      }, 1000);
  }
}
// Squares Interaction logic
function initSquaresInteraction() {
  const squares = document.querySelectorAll('.interactive-square');
  const wrapper = document.querySelector('.side-logo-wrapper');
  let isAnySquareHovered = false;

  function startChaos(sq) {
    if (!isAnySquareHovered) return;
    
    gsap.to(sq, {
      x: gsap.utils.random(-window.innerWidth * 0.45, window.innerWidth * 0.45),
      y: gsap.utils.random(-window.innerHeight * 0.45, window.innerHeight * 0.45),
      duration: gsap.utils.random(4, 6), // Slower, more flowing motion
      ease: "power1.inOut",
      onComplete: () => startChaos(sq)
    });
  }

  function stopAllChaos() {
    isAnySquareHovered = false;
    squares.forEach(sq => {
      gsap.killTweensOf(sq);
      gsap.to(sq, {
        x: 0,
        y: 0,
        duration: 4.5, // Slow, graceful return as requested
        ease: "power2.inOut"
      });
    });
  }

  squares.forEach(sq => {
    // Trigger "Chaos Flight" for all squares when ANY square is hovered
    sq.addEventListener('mouseenter', () => {
      if (!isAnySquareHovered) {
        isAnySquareHovered = true;
        squares.forEach(square => startChaos(square));
      }
      cursorFollower.classList.add('hover-active');
    });

    sq.addEventListener('mouseleave', () => {
      cursorFollower.classList.remove('hover-active');
    });
  });

  // Global reset: When mouse leaves the entire logo area, all squares return slowly
  if (wrapper) {
    wrapper.addEventListener('mouseleave', stopAllChaos);
  }
}

function initOrbitNavigation() {
  const orbitItems = document.querySelectorAll('.feature-item');
  orbitItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (scrollingLocked) return;
      // Orbit 1 is Section 2 (index 1), Orbit 2 is Section 3 (index 2), etc.
      skipToSection(index + 1);
    });
    // Add hover states for cursor
    item.addEventListener('mouseenter', () => cursorFollower.classList.add('hover-active'));
    item.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover-active'));
  });
}

function skipToSection(targetIdx) {
  if (targetIdx === currentSectionIndex) return;
  scrollingLocked = true;
  
  const currentSec = sectionElements[currentSectionIndex];
  const nextSec = sectionElements[targetIdx];
  const currentContent = currentSec.querySelector('.hero-text-container, .content-wrapper');
  const nextContent = nextSec.querySelector('.content-wrapper');

  // Fade out current section UI AND Background
  gsap.to(currentSec, { opacity: 0, duration: 0.4 });
  gsap.to(videos, { opacity: 0, duration: 0.4 });

  setTimeout(() => {
    // Hide old UI instantly
    gsap.set(currentSec, { visibility: "hidden", pointerEvents: "none" });

    // Switch background videos
    if (isMobile) {
        const slideToDraw = Math.min(targetIdx + 1, 4);
        const frameToDraw = (targetIdx === 4) ? 240 : 1;
        mobileSeq.draw(slideToDraw, frameToDraw);
    } else {
        const targetVideoIdx = Math.min(targetIdx, videos.length - 1);
        const isLastSlide = (targetIdx >= videos.length);
        
        // Hide ALL videos first
        videos.forEach(v => { if(v) v.style.opacity = 0; });
        revVideos.forEach(rv => { if(rv) rv.style.opacity = 0; });

        const v = isLastSlide ? revVideos[targetVideoIdx] : videos[targetVideoIdx];
        
        if (v) {
           v.pause();
           // Use first frame of Slide4_Rev (which corresponds to Slide4_End/Section 5)
           v.currentTime = 0; 
           
           setTimeout(() => {
              gsap.to(v, { opacity: 1, duration: 0.8 });
           }, 250);
        }
    }

    // Fade in next section UI
    currentSectionIndex = targetIdx;
    
    gsap.set(nextSec, { visibility: "visible", opacity: 0, pointerEvents: "auto" });
    gsap.to(nextSec, { opacity: 1, duration: 1.2, ease: "power2.out" });
    
    preloadVideosForIndex(targetIdx);

    if (nextContent) {
      if (!isMobile) {
        const glass = nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door');
        gsap.fromTo(nextContent, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" });
        if(glass.length) gsap.fromTo(glass, { "--blur-amt": "0px" }, { "--blur-amt": "20px", duration: 2, ease: "power2.out" });
      } else {
        gsap.fromTo(nextContent, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 });
        nextContent.querySelectorAll('.glass-panel, .glass-window, .cupboard, .levitating-door').forEach(el => el.style.setProperty('--blur-amt', '20px'));
      }
    }

    setTimeout(() => { scrollingLocked = false; }, 1800);
  }, 500);
}

function initModalLogic() {
  const modal = document.getElementById('projects-modal');
  const openBtn = document.getElementById('open-gallery');
  const closeBtn = document.querySelector('.close-modal');
  const overlay = document.querySelector('.modal-overlay');
  const track = document.querySelector('.gallery-track');

  if (!modal || !openBtn || !track) return;

  let loopTween;
  let mouseX = 0;
  let speed = 1.5; // Base scroll speed

  // Setup Infinite Loop
  const setupLoop = () => {
    const trackWidth = track.offsetWidth / 2; // Since we duplicated
    loopTween = gsap.to(track, {
      x: -trackWidth,
      duration: 30,
      ease: "none",
      repeat: -1,
      onRepeat: () => {
        gsap.set(track, { x: 0 });
      }
    });
  };

  // Mouse reaction for speed: Only move when swiping to the left
  const handleMouseMove = (e) => {
    const halfWidth = window.innerWidth / 2;
    // Normalized distance from center (-1 to 1)
    const dist = (e.clientX - halfWidth) / halfWidth;
    
    // Only move when mouse is on the left side (dist < 0)
    let targetTimeScale = 0;
    if (dist < 0) {
       targetTimeScale = Math.abs(dist) * 10; // Faster when further left
    }
    
    gsap.to(loopTween, { timeScale: targetTimeScale, duration: 2, ease: "power2.out" });
  };

  const openModal = () => {
    modal.classList.add('active');
    scrollingLocked = true;
    if (!loopTween) setupLoop();
    else loopTween.play();
    window.addEventListener('mousemove', handleMouseMove);
  };

  const closeModal = () => {
    modal.classList.remove('active');
    scrollingLocked = false;
    if (loopTween) loopTween.pause();
    window.removeEventListener('mousemove', handleMouseMove);
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Call modal init in initSliderAnimations or at start
initModalLogic();

function animateSquaresIn() {
  gsap.to(".interactive-square", { 
    opacity: 1, 
    scale: 1,
    rotate: 45, 
    duration: 0.8, // Snappier
    stagger: 0.1,  // Faster sequence
    ease: "power2.out"
  });
}

function animateSquaresOut() {
  gsap.to(".interactive-square", { 
    opacity: 0, 
    scale: 0.5,
    x: 0, 
    y: 0, 
    duration: 0.5,
    ease: "power2.in"
  });
}

// 📱 Footer Link Handler
function initFooterLinks() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const instaLink = document.getElementById('insta-dev-link');
  if (instaLink) {
    if (isMobile) {
      instaLink.href = "https://www.instagram.com/intellex.web?igsh=MXR5dGZjNWF5b2E=5.437";
    } else {
      instaLink.href = "https://www.instagram.com/intellex.web?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
    }
  }
}

function initBookshelfLogic() {
  const books = document.querySelectorAll('.book');
  
  books.forEach(book => {
    book.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const isOpen = book.classList.contains('open');
      const cupboard = book.closest('.cupboard');
      
      // Close all other books first
      document.querySelectorAll('.book.open').forEach(b => {
        b.classList.remove('open');
        const c = b.closest('.cupboard');
        if (c) c.style.zIndex = "10";
      });
      
      if (!isOpen && cupboard) {
        // Calculate center of the cupboard for the book to land in
        const cupboardRect = cupboard.getBoundingClientRect();
        const bookRect = book.getBoundingClientRect();
        
        const cupCenterX = cupboardRect.left + (cupboardRect.width / 2);
        const cupCenterY = cupboardRect.top + (cupboardRect.height / 2);
        
        const bookCenterX = bookRect.left + (bookRect.width / 2);
        const bookCenterY = bookRect.top + (bookRect.height / 2);
        
        // Deep nudge upwards to place the opened book in the upper half of the cupboard
        let moveX = cupCenterX - bookCenterX;
        let moveY = (cupCenterY - bookCenterY) - 140; 
        
        // Custom: If it's the LEFTMOST cupboard, nudge it slightly to the RIGHT (+70px) 
        // to move it away from the screen edge
        const shelves = document.querySelectorAll('.cupboard');
        if (cupboard === shelves[0]) {
           moveX += 70;
        }
        
        book.classList.add('open');
        
        // Apply the offset
        book.style.setProperty('--center-x', `${moveX}px`);
        book.style.setProperty('--center-y', `${moveY}px`);
        
        // Bring cupboard to the front
        cupboard.style.zIndex = "3000";
      } else {
        book.classList.remove('open');
        if (cupboard) cupboard.style.zIndex = "10";
      }
    });
  });

  // Close book when clicked elsewhere
  window.addEventListener('click', () => {
    document.querySelectorAll('.book.open').forEach(b => {
      b.classList.remove('open');
      const cupboard = b.closest('.cupboard');
      if (cupboard) cupboard.style.zIndex = "10";
    });
  });
}

// Run on boot
initFooterLinks();
initBookshelfLogic();
function preloadVideosForIndex(idx) {
  if (isMobile) return;
  // Always ensure current, next, and prev are loading
  const targets = [idx, idx + 1, idx - 1];
  targets.forEach(i => {
    if (i >= 0 && i < videos.length) {
      if (videos[i]) videos[i].preload = "auto";
      if (revVideos[i]) revVideos[i].preload = "auto";
    }
  });
}
