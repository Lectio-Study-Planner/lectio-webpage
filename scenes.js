// The landing page's motion. Sections fade in as they scroll into view, and
// each drawn section plays its scene while it is on screen.
//
// The HTML is each drawing's finished frame: without JavaScript, or under
// Reduce Motion, that frame is what shows and nothing moves. A scene rewinds
// the drawing when it starts, plays it, and stops its loops while it is off
// screen, so the page does no work for what nobody sees.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canObserve = 'IntersectionObserver' in window;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fades each .reveal in once it scrolls into view; reduced motion is handled
// in the stylesheet.
if (canObserve) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('shown');
                observer.unobserve(entry.target);
            }
        }
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('shown'));
}

// Registers a scene. `setup(element)` returns `{ start, pause, resume }`:
// start runs the first time the element is mostly on screen, pause when it
// leaves, resume when it comes back. Nothing runs under Reduce Motion.
function scene(selector, setup) {
    const element = document.querySelector(selector);
    if (!element || reduceMotion || !canObserve) return;
    const play = setup(element);
    let started = false;
    new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                if (started) {
                    play.resume?.();
                } else {
                    started = true;
                    play.start();
                }
            } else if (started) {
                play.pause?.();
            }
        }
    }, { threshold: 0.35 }).observe(element);
}

// Plays an async sequence over and over while its scene is on screen. The
// sequence gets `stopped()`, which turns true once it should give up, and
// checks it after each wait.
function loop(sequence) {
    let run = 0;
    const go = async () => {
        const id = ++run;
        const stopped = () => id !== run;
        while (!stopped()) {
            await sequence(stopped);
        }
    };
    return { start: go, resume: go, pause: () => { run++; } };
}

// Counts a number up (or down) to `to` over `duration` ms, easing out.
function count(from, to, duration, draw) {
    const begin = performance.now();
    const frame = (now) => {
        const progress = Math.min(1, (now - begin) / duration);
        draw(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

// "mm:ss" for a number of seconds.
const clockText = (seconds) => {
    const whole = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
};
