(function () {
    const cursor = document.createElement("div");
    const cursorRing = document.createElement("div");

    cursor.className = "smart-cursor";
    cursorRing.className = "smart-cursor-ring";

    document.body.appendChild(cursor);
    document.body.appendChild(cursorRing);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let colorCache = new Map();

    function parseRGB(str) {
        if (!str || typeof str !== "string") return null;
        const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (!m) return null;
        return {
            r: Number(m[1]),
            g: Number(m[2]),
            b: Number(m[3]),
            a: m[4] !== undefined ? Number(m[4]) : 1
        };
    }

    function luminance({ r, g, b }) {
        const L = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2];
    }

    function getCompositeBackground(el) {
        const layers = [];
        let current = el;

        while (current) {
            const style = window.getComputedStyle(current);
            const bg = style.backgroundColor;
            const rgb = parseRGB(bg);
            if (rgb && rgb.a > 0.001) {
                layers.push(rgb);
            }
            if (current === document.documentElement) break;
            current = current.parentElement;
        }

        const docBg = parseRGB(window.getComputedStyle(document.documentElement).backgroundColor);
        const bodyBg = parseRGB(window.getComputedStyle(document.body).backgroundColor);
        const base = docBg || bodyBg || { r: 255, g: 255, b: 255, a: 1 };

        if (layers.length === 0) {
            return { r: base.r, g: base.g, b: base.b, a: 1 };
        }

        let result = { r: base.r, g: base.g, b: base.b };

        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.r === base.r && layer.g === base.g && layer.b === base.b && layer.a === base.a) {
                continue;
            }
            const a = layer.a;
            result.r = layer.r * a + result.r * (1 - a);
            result.g = layer.g * a + result.g * (1 - a);
            result.b = layer.b * a + result.b * (1 - a);
        }

        return { r: Math.round(result.r), g: Math.round(result.g), b: Math.round(result.b), a: 1 };
    }

    function extractPageColors() {
        const colors = new Set();
        document.querySelectorAll("*").forEach(el => {
            const st = getComputedStyle(el);
            if (st.backgroundColor && st.backgroundColor !== "rgba(0, 0, 0, 0)" && st.backgroundColor !== "transparent") {
                colors.add(st.backgroundColor);
            }
        });
        return [...colors];
    }

    function isSaturated(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max > 0 ? (max - min) / max > 0.2 : false;
    }

    function findAccent(bgColor) {
        if (colorCache.has(bgColor)) return colorCache.get(bgColor);

        const bgRGB = parseRGB(bgColor);
        if (!bgRGB) return "white";

        const bgLum = luminance(bgRGB);
        const pageColors = extractPageColors();

        let best = null;
        let bestScore = 0;

        pageColors.forEach(c => {
            const rgb = parseRGB(c);
            if (!rgb) return;

            const diff =
                Math.abs(rgb.r - bgRGB.r) +
                Math.abs(rgb.g - bgRGB.g) +
                Math.abs(rgb.b - bgRGB.b);

            if (diff < 50) return;

            const lum = luminance(rgb);
            const contrast = (Math.max(lum, bgLum) + 0.05) / (Math.min(lum, bgLum) + 0.05);

            if (contrast > 1.5 && contrast > bestScore) {
                best = c;
                bestScore = contrast;
            }
        });

        if (!best) best = bgLum > 0.55 ? "black" : "white";

        colorCache.set(bgColor, best);
        return best;
    }

    document.addEventListener("mousemove", e => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursor.style.left = mouseX + "px";
        cursor.style.top = mouseY + "px";

        const prevCursorVis = cursor.style.visibility || "";
        const prevRingVis = cursorRing.style.visibility || "";
        cursor.style.visibility = "hidden";
        cursorRing.style.visibility = "hidden";

        const underneath = document.elementFromPoint(mouseX, mouseY) || e.target;

        cursor.style.visibility = prevCursorVis;
        cursorRing.style.visibility = prevRingVis;

        let current = underneath;
        let found = null;
        while (current && current !== document.documentElement) {
            const bg = getComputedStyle(current).backgroundColor;
            const rgb = parseRGB(bg);
            if (rgb && rgb.a > 0.001) {
                found = current;
                break;
            }
            current = current.parentElement;
        }

        let composite;
        if (found) {
            composite = getCompositeBackground(found);
        } else {
            composite = getCompositeBackground(document.body);
        }

        const brightness = luminance(composite);
        const contrastColor = brightness > 0.5 ? "rgba(51, 51, 51, 0.85)" : "rgba(255,255,255,0.9)";
        cursorRing.style.borderColor = contrastColor;

        const compositeStr = `rgb(${Math.round(composite.r)}, ${Math.round(composite.g)}, ${Math.round(composite.b)})`;
        cursor.style.background = findAccent(compositeStr);
    });

    function animate() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        cursorRing.style.left = ringX + "px";
        cursorRing.style.top = ringY + "px";

        requestAnimationFrame(animate);
    }
    animate();

    const interactive =
        'a, button, input, textarea, select, [role="button"], .card, .interactive-area, .dark-section, .light-section';

    document.addEventListener("mouseover", e => {
        if (e.target.matches(interactive) || e.target.closest(interactive)) {
            cursor.classList.add("expand");
            cursorRing.classList.add("expand");
        }
    });

    document.addEventListener("mouseout", e => {
        if (e.target.matches(interactive) || e.target.closest(interactive)) {
            cursor.classList.remove("expand");
            cursorRing.classList.remove("expand");
        }
    });
})();