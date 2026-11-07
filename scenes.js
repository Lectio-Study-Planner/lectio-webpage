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

// Hero: the mark's bars fill in turn, and the semester's weeks fill up to
// this one.
scene('.hero-mark', (mark) => ({
    start: () => mark.classList.add('playing'),
    resume: () => mark.classList.add('playing'),
    pause: () => mark.classList.remove('playing'),
}));

scene('.weeks', (weeks) => {
    const cells = [...weeks.querySelectorAll('li')];
    const finished = cells.map((cell) => cell.className);
    return {
        async start() {
            cells.forEach((cell) => cell.classList.remove('done', 'now', 'pulse'));
            await sleep(300);
            for (const [index, cell] of cells.entries()) {
                if (!finished[index]) continue;
                await sleep(110);
                cell.className = finished[index];
            }
            weeks.querySelector('.now')?.classList.add('pulse');
        },
        resume: () => weeks.querySelector('.now')?.classList.add('pulse'),
        pause: () => weeks.querySelector('.now')?.classList.remove('pulse'),
    };
});

// Plan: a course's tags cycle by themselves until a visitor taps one, and the
// ring follows the share of items in a done tag. Taps work under Reduce
// Motion too; only the autoplay is a scene.
{
    const card = document.querySelector('.course');
    // The default tag sets: name, colour and whether the tag is in Done.
    const tagSets = {
        reading: [['pending', 'red', false], ['seen', 'orange', false], ['summarized', 'blue', true], ['studied', 'green', true]],
        task: [['pending', 'red', false], ['done', 'blue', true], ['studied', 'green', true]],
    };
    // The course's other items: 9 of its 14 are done before these four.
    const otherDone = 9;
    const total = 14;
    const circumference = 163.36;
    const ring = card.querySelector('.ring-fill');
    const percent = card.querySelector('.ring output');
    const items = [...card.querySelectorAll('.items li')].map((row) => {
        const button = row.querySelector('.tag');
        return { row, button, set: tagSets[button.dataset.set], tag: Number(button.dataset.tag) };
    });

    const draw = (item, bump) => {
        const [name, colour, done] = item.set[item.tag];
        item.button.textContent = name;
        item.button.style.setProperty('--c', `var(--tag-${colour})`);
        item.row.classList.toggle('done', done);
        if (bump) {
            item.button.classList.remove('bump');
            void item.button.offsetWidth;
            item.button.classList.add('bump');
        }
    };
    const drawRing = () => {
        const done = otherDone + items.filter((item) => item.set[item.tag][2]).length;
        const share = Math.round((done / total) * 100);
        ring.style.strokeDashoffset = circumference * (1 - share / 100);
        percent.textContent = `${share}%`;
    };

    let autoplay = true;
    let timer = 0;
    items.forEach((item) => item.button.addEventListener('click', () => {
        autoplay = false;
        clearInterval(timer);
        item.tag = (item.tag + 1) % item.set.length;
        draw(item, true);
        drawRing();
    }));

    const step = () => {
        const next = items.find((item) => item.tag < item.set.length - 1);
        if (next) {
            next.tag += 1;
            draw(next, true);
        } else {
            items.forEach((item) => { item.tag = 0; draw(item); });
        }
        drawRing();
    };
    const run = () => {
        clearInterval(timer);
        if (autoplay) timer = setInterval(step, 1400);
    };
    scene('.course', () => ({
        start() {
            items.forEach((item) => { item.tag = 0; draw(item); });
            drawRing();
            run();
        },
        resume: run,
        pause: () => clearInterval(timer),
    }));
}

// Up Next: an item swipes away, the undo bar offers it back, and it returns.
scene('.upnext', (card) => {
    const row = card.querySelector('[data-dismiss]');
    const bar = card.querySelector('.undo-bar');
    return loop(async (stopped) => {
        row.classList.remove('swiped', 'gone');
        bar.classList.remove('in');
        await sleep(2400);
        if (stopped()) return;
        row.classList.add('swiped');
        await sleep(800);
        if (stopped()) return;
        row.classList.add('gone');
        bar.classList.add('in');
        await sleep(2800);
        if (stopped()) return;
        bar.classList.remove('in');
        row.classList.remove('gone', 'swiped');
        await sleep(1800);
    });
});

// Schedule: the week's classes drop in, the deadlines draw their lines, then
// a new class is drawn on an empty spot and the New sheet opens on it.
scene('.schedule-week', (card) => {
    const classes = [...card.querySelectorAll('.cls, .due-mark')];
    const drawn = card.querySelector('.drawn-class');
    const sheet = card.querySelector('.new-sheet');
    let built = false;
    const drawing = loop(async (stopped) => {
        drawn.classList.remove('in', 'grown');
        sheet.classList.remove('in');
        if (!built) {
            classes.forEach((el) => el.classList.add('hidden'));
            await sleep(300);
            for (const el of classes) {
                if (stopped()) return;
                el.classList.remove('hidden');
                await sleep(130);
            }
            built = true;
        }
        await sleep(1400);
        if (stopped()) return;
        drawn.classList.add('in');
        await sleep(50);
        drawn.classList.add('grown');
        await sleep(1300);
        if (stopped()) return;
        sheet.classList.add('in');
        await sleep(2800);
        if (stopped()) return;
        sheet.classList.remove('in');
        drawn.classList.remove('in', 'grown');
        await sleep(1600);
    });
    return {
        ...drawing,
        start() {
            built = false;
            drawing.start();
        },
        pause() {
            drawing.pause();
            classes.forEach((el) => el.classList.remove('hidden'));
            built = true;
        },
    };
});

// Reminders: the alert comes in, Mark as Done is pressed, and the task in the
// Edit sheet turns done.
scene('.notify', (visual) => {
    const note = visual.querySelector('.notification');
    const action = visual.querySelector('.notification-action');
    const status = visual.querySelector('.edit-sheet .tag');
    const setStatus = (name, colour) => {
        status.textContent = name;
        status.style.setProperty('--c', `var(--tag-${colour})`);
    };
    return loop(async (stopped) => {
        note.classList.add('away');
        action.classList.remove('press');
        setStatus('pending', 'red');
        await sleep(900);
        if (stopped()) return;
        note.classList.remove('away');
        await sleep(2200);
        if (stopped()) return;
        action.classList.add('press');
        await sleep(250);
        action.classList.remove('press');
        note.classList.add('away');
        await sleep(350);
        setStatus('done', 'blue');
        status.classList.add('bump');
        await sleep(2600);
        status.classList.remove('bump');
    });
});

// Friends: ticking a friend lays their classes beside yours, in a lane of
// their own, and turns yours to the accent colour. The checks tick by
// themselves until a visitor taps one.
{
    const week = document.querySelector('.friends-week');
    const checks = [...week.querySelectorAll('.friend-check')];
    const shown = Object.fromEntries(checks.map((check) => [check.dataset.friend, check.getAttribute('aria-pressed') === 'true']));
    const apply = () => {
        let lane = 0;
        for (const check of checks) {
            const friend = check.dataset.friend;
            check.setAttribute('aria-pressed', shown[friend]);
            if (shown[friend]) lane += 1;
            week.querySelectorAll(`.cls[data-friend="${friend}"]`).forEach((cls) => {
                cls.classList.toggle('hidden', !shown[friend]);
                if (shown[friend]) cls.style.setProperty('--lane', lane);
            });
        }
        week.style.setProperty('--lanes', lane + 1);
        week.classList.toggle('friends-on', lane > 0);
    };

    let autoplay = true;
    checks.forEach((check) => check.addEventListener('click', () => {
        autoplay = false;
        shown[check.dataset.friend] = !shown[check.dataset.friend];
        apply();
    }));

    // Lena, then Mia, then neither, and again.
    const steps = [{ lena: true, mia: false }, { lena: true, mia: true }, { lena: false, mia: true }, { lena: false, mia: false }];
    scene('.friends-week', () => loop(async (stopped) => {
        for (const step of steps) {
            await sleep(2200);
            if (stopped() || !autoplay) return;
            Object.assign(shown, step);
            apply();
        }
    }));
}
