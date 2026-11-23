let formulas = [];
let activeFormula = null;
let currentCategory = 'physics';

const themes = {
    chemistry: '#10b981',
    physics: '#00f2fe',
    math: '#a855f7',
    electrical: '#f59e0b',
    astrophysics: '#ec4899'
};

// --- Canvas Animation Engine ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [], frame = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
}
window.addEventListener('resize', resize);

function initParticles() {
    particles = [];
    const count = currentCategory === 'astrophysics' ? 120 : 45;
    const mathSymbols = ['π', '∑', '∫', '√', '∞', 'Δ', 'θ', 'λ'];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            r: Math.random() * 2.5 + 1,
            symbol: mathSymbols[i % mathSymbols.length],
            angle: Math.random() * Math.PI * 2
        });
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    const color = themes[currentCategory] || '#00f2fe';
    frame += 0.02;

    if (currentCategory === 'chemistry') {
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 130) {
                    ctx.strokeStyle = color + '33';
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });
    } else if (currentCategory === 'physics') {
        for (let w = 0; w < 3; w++) {
            ctx.beginPath();
            ctx.strokeStyle = color + (w === 0 ? '66' : '33');
            ctx.lineWidth = 2;
            for (let x = 0; x < width; x += 10) {
                const y = height / 2 + Math.sin(x * 0.008 + frame + w * 2) * (60 + w * 25);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    } else if (currentCategory === 'math') {
        ctx.font = '20px Orbitron, sans-serif';
        ctx.fillStyle = color + '44';
        particles.forEach(p => {
            p.y -= 0.5;
            if (p.y < -20) p.y = height + 20;
            ctx.fillText(p.symbol, p.x, p.y);
        });
    } else if (currentCategory === 'electrical') {
        particles.forEach(p => {
            if (Math.random() < 0.02) {
                if (Math.abs(p.vx) > 0) { p.vy = p.vx; p.vx = 0; }
                else { p.vx = p.vy || 1.5; p.vy = 0; }
            }
            p.x = (p.x + p.vx * 1.5 + width) % width;
            p.y = (p.y + p.vy * 1.5 + height) % height;
            ctx.fillStyle = color;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.strokeStyle = color + '44';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 15, p.y - p.vy * 15);
            ctx.stroke();
        });
    } else if (currentCategory === 'astrophysics') {
        particles.forEach(p => {
            const alpha = Math.abs(Math.sin(frame + p.angle));
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.strokeStyle = color + '33';
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, 260, 90, 0.3, 0, Math.PI * 2);
        ctx.stroke();
    }
    requestAnimationFrame(animate);
}
resize();
animate();

// --- Dashboard Logic ---
fetch('/categories')
    .then(res => res.json())
    .then(cats => {
        const tabs = document.getElementById('category-tabs');
        cats.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.innerText = c.toUpperCase();
            btn.onclick = () => selectCategory(c, btn);
            tabs.appendChild(btn);
            if (idx === 0) selectCategory(c, btn);
        });
    });

function selectCategory(category, btnElement) {
    currentCategory = category.toLowerCase();
    initParticles();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');

    const color = themes[currentCategory] || '#00f2fe';
    document.documentElement.style.setProperty('--accent', color);
    document.getElementById('search-box').value = '';

    fetch(`/formulas/${category}`)
        .then(res => res.json())
        .then(data => {
            formulas = data;
            renderCards(formulas);
            if (formulas.length > 0) selectFormula(formulas[0], 0);
        });
}

function renderCards(list) {
    const grid = document.getElementById('formula-grid');
    grid.innerHTML = '';
    if (list.length === 0) {
        grid.innerHTML = '<p class="empty">No formulas found.</p>';
        return;
    }
    list.forEach((f, i) => {
        const card = document.createElement('div');
        card.className = 'formula-card';
        card.id = `card_${i}`;
        card.innerHTML = `<h3>${f.name}</h3><p>${f.equation.replace(' - ', ' = ')}</p>`;
        card.onclick = () => selectFormula(f, i);
        grid.appendChild(card);
    });
}

function selectFormula(f, index) {
    activeFormula = f;
    document.querySelectorAll('.formula-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.getElementById(`card_${index}`);
    if (activeCard) activeCard.classList.add('active');

    document.getElementById('active-title').innerText = f.name;
    document.getElementById('active-equation').innerText = f.equation.replace(' - ', ' = ');
    document.getElementById('result').innerText = '';
    document.getElementById('calc-btn').style.display = 'block';

    const container = document.getElementById('inputs');
    container.innerHTML = '';
    f.variables.forEach(v => {
        const unit = f.units && f.units[v] ? ` (${f.units[v]})` : '';
        container.innerHTML += `<input type="number" step="any" id="var_${v}" placeholder="${v}${unit}">`;
    });
}

document.getElementById('search-box').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = formulas.filter(f => f.name.toLowerCase().includes(q));
    renderCards(filtered);
});

function calculate() {
    if (!activeFormula) return;
    let values = {};
    activeFormula.variables.forEach(v => {
        values[v] = document.getElementById(`var_${v}`).value;
    });

    fetch('/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            equation: activeFormula.equation,
            values: values,
            units: activeFormula.units || {}
        })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('result').innerText = data.result || data.error;
    });
}