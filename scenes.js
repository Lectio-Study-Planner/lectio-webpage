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

// Timer: a pomodoro in fast-forward. 25 minutes run down in 8 seconds, the
// phase-end pop-up asks what next, and a break runs in green. The Mac's mini
// player follows it in the page's corner. Focus Clock works under Reduce
// Motion too.
{
    const card = document.querySelector('.timer-card');
    const ring = card.querySelector('.timer-ring');
    const fill = ring.querySelector('.ring-fill');
    const phase = card.querySelector('.timer-phase');
    const clock = card.querySelector('.timer-clock');
    const dots = [...card.querySelectorAll('.timer-dots i')];
    const popup = card.querySelector('.phase-end');
    const go = popup.querySelector('.go');
    const mini = document.querySelector('.mini-player');
    const miniClock = mini.querySelector('.mini-clock');
    const miniFill = mini.querySelector('.mini-fill');

    const toggle = card.querySelector('.focus-toggle');
    toggle.addEventListener('click', () => {
        const on = card.classList.toggle('clock');
        toggle.setAttribute('aria-pressed', on);
        toggle.textContent = on ? 'Done' : 'Focus Clock';
    });

    // Each phase: its length in seconds, how long it plays in ms, its colour.
    const phases = {
        focus: { label: 'Focus', seconds: 1500, plays: 8000, colour: 'orange' },
        ask: { plays: 2300 },
        break: { label: 'Short Break', seconds: 300, plays: 3200, colour: 'green' },
    };
    let current = 'focus';
    let block = 1;
    let began = 0;
    let played = 0;
    let frame = 0;

    const show = (left, { seconds, label, colour }) => {
        const share = left / seconds;
        fill.style.strokeDashoffset = 552.92 * (1 - share);
        miniFill.style.strokeDashoffset = 75.4 * (1 - share);
        ring.style.setProperty('--c', `var(--${colour})`);
        miniFill.style.stroke = `var(--${colour})`;
        phase.textContent = label;
        clock.textContent = clockText(left);
        miniClock.textContent = clockText(left);
    };
    const enter = (name, now) => {
        current = name;
        began = now;
    };
    const tick = (now) => {
        const spec = phases[current];
        const progress = Math.min(1, (now - began) / spec.plays);
        if (current === 'ask') {
            go.classList.toggle('press', progress > 0.8);
            if (progress === 1) {
                go.classList.remove('press');
                popup.classList.remove('in');
                enter('break', now);
            }
        } else {
            show(spec.seconds * (1 - progress), spec);
            if (progress === 1 && current === 'focus') {
                popup.classList.add('in');
                enter('ask', now);
            } else if (progress === 1) {
                block = (block % 4) + 1;
                dots.forEach((dot, index) => dot.classList.toggle('on', index < block));
                enter('focus', now);
            }
        }
        frame = requestAnimationFrame(tick);
    };
    const run = () => {
        cancelAnimationFrame(frame);
        began = performance.now() - played;
        mini.classList.add('in');
        frame = requestAnimationFrame(tick);
    };
    scene('.timer-card', () => ({
        start() {
            current = 'focus';
            block = 1;
            played = 0;
            popup.classList.remove('in');
            dots.forEach((dot, index) => dot.classList.toggle('on', index < block));
            run();
        },
        resume: run,
        pause() {
            cancelAnimationFrame(frame);
            played = performance.now() - began;
            mini.classList.remove('in');
        },
    }));
}

// Study time: the ring sweeps in course by course and the day bars rise. A
// tapped day narrows the ring to that day, as on the Study Time screen; taps
// work under Reduce Motion too.
{
    const card = document.querySelector('.study-card');
    const segments = [...card.querySelectorAll('.segment')];
    const total = card.querySelector('.donut-face b');
    const label = card.querySelector('.donut-face small');
    const bars = card.querySelector('.day-bars');
    const days = [...bars.querySelectorAll('button')];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Minutes per course and day, Monday first, in the legend's order.
    const minutes = [
        [40, 55, 20, 0, 0, 0, 0],
        [20, 0, 45, 0, 0, 0, 0],
        [0, 25, 0, 0, 0, 0, 0],
        [15, 0, 0, 0, 0, 0, 0],
    ];
    const circumference = 389.56;
    const gap = 3;
    const hoursMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
    let picked = -1;

    const draw = () => {
        const values = minutes.map((row) => (picked < 0 ? row.reduce((a, b) => a + b, 0) : row[picked]));
        const sum = values.reduce((a, b) => a + b, 0);
        let offset = 0;
        segments.forEach((segment, index) => {
            const length = sum ? (values[index] / sum) * circumference : 0;
            segment.style.strokeDasharray = `${Math.max(0, length - gap)} ${circumference}`;
            segment.style.strokeDashoffset = -offset;
            offset += length;
        });
        total.textContent = hoursMinutes(sum);
        label.textContent = picked < 0 ? 'This week' : dayNames[picked];
        bars.classList.toggle('picked', picked >= 0);
        days.forEach((day, index) => day.setAttribute('aria-pressed', index === picked));
    };
    days.forEach((day, index) => day.addEventListener('click', () => {
        picked = picked === index ? -1 : index;
        draw();
    }));

    scene('.study-card', () => ({
        async start() {
            picked = -1;
            segments.forEach((segment) => {
                segment.style.strokeDasharray = `0 ${circumference}`;
                segment.style.strokeDashoffset = 0;
            });
            bars.classList.add('grow-from-zero');
            await sleep(150);
            draw();
            bars.classList.remove('grow-from-zero');
        },
    }));
}

// Progress: the credits count up, the bar fills by category, and the GPA
// settles on its grade before its band shows.
scene('.progress-card', (card) => {
    const credits = card.querySelector('.credit-count');
    const gpa = card.querySelector('.gpa-value');
    const band = card.querySelector('.gpa-band');
    const bar = card.querySelector('.credit-bar');
    return {
        async start() {
            bar.classList.add('empty');
            credits.textContent = '0';
            gpa.textContent = '4.0';
            band.textContent = 'GPA';
            await sleep(200);
            bar.classList.remove('empty');
            count(0, 96, 1500, (value) => { credits.textContent = Math.round(value); });
            count(4, 1.7, 1500, (value) => { gpa.textContent = value.toFixed(1); });
            await sleep(1600);
            band.textContent = 'GPA · gut';
        },
    };
});

// Import: the latest Moodle check found three files. Each is ticked, then
// moves into the course marked New, and the red count runs down.
scene('.moodle-sync', (sync) => {
    const found = [...sync.querySelectorAll('.moodle-new li')];
    const incoming = [...sync.querySelectorAll('.moodle-course .incoming')];
    const badge = sync.querySelector('.badge-count');
    const setBadge = (n) => {
        badge.textContent = n;
        badge.classList.toggle('none', n === 0);
    };
    return loop(async (stopped) => {
        found.forEach((li) => {
            li.classList.remove('added');
            li.querySelector('.check').classList.remove('on');
        });
        incoming.forEach((li) => li.classList.add('waiting'));
        incoming.forEach((li) => li.classList.remove('arrive'));
        setBadge(found.length);
        await sleep(900);
        for (const li of found) {
            if (stopped()) return;
            li.querySelector('.check').classList.add('on');
            await sleep(380);
        }
        await sleep(500);
        for (const [index, li] of found.entries()) {
            if (stopped()) return;
            li.classList.add('added');
            incoming[index].classList.remove('waiting');
            incoming[index].classList.add('arrive');
            setBadge(found.length - index - 1);
            await sleep(450);
        }
        await sleep(3200);
    });
});
