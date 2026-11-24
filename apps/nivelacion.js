const $ = selector => document.querySelector(selector);
const tbody = $('#rows');

const example = () => [
  { point: 'BM-1', distance: 0, bs: 1.425, mid: '', fs: '' },
  { point: 'P-1', distance: 20, bs: '', mid: 1.115, fs: '' },
  { point: 'PC-1', distance: 40, bs: '', mid: '', fs: 1.830 },
  { point: 'PC-1', distance: 40, bs: 0.955, mid: '', fs: '' },
  { point: 'P-2', distance: 60, bs: '', mid: 1.275, fs: '' },
  { point: 'BM-2', distance: 80, bs: '', mid: '', fs: 1.060 }
];
let observations = example();

const num = value => value === '' || value == null ? null : Number(value);
const fmt = value => Number.isFinite(value) ? value.toFixed(3) : '—';

function render() {
  tbody.innerHTML = observations.map((o, i) => `
    <tr>
      <td><input aria-label="Punto ${i + 1}" data-i="${i}" data-k="point" value="${o.point}" class="cell-name"></td>
      <td><input aria-label="Distancia ${i + 1}" data-i="${i}" data-k="distance" type="number" step="0.1" value="${o.distance}" class="cell-num"></td>
      <td><input aria-label="Vista atrás ${i + 1}" data-i="${i}" data-k="bs" type="number" step="0.001" value="${o.bs}" placeholder="—" class="cell-num"></td>
      <td><input aria-label="Vista intermedia ${i + 1}" data-i="${i}" data-k="mid" type="number" step="0.001" value="${o.mid}" placeholder="—" class="cell-num"></td>
      <td><input aria-label="Vista adelante ${i + 1}" data-i="${i}" data-k="fs" type="number" step="0.001" value="${o.fs}" placeholder="—" class="cell-num"></td>
      <td class="elevation" id="hi-${i}">—</td>
      <td class="elevation" id="elev-${i}">—</td>
      <td class="slope" id="slope-${i}">—</td>
      <td><button class="remove" data-remove="${i}" aria-label="Eliminar lectura ${i + 1}">×</button></td>
    </tr>`).join('');
  calculate();
}

function calculate() {
  const benchmark = num($('#benchmark').value);
  let elevation = benchmark !== null && Number.isFinite(benchmark) ? benchmark : NaN;
  let hi = null;
  const rows = observations.map(o => {
    const bs = num(o.bs), mid = num(o.mid), fs = num(o.fs);
    let type = '';
    if (bs !== null && Number.isFinite(bs)) {
      hi = elevation + bs;
      type = 'VA';
    } else if (mid !== null && Number.isFinite(mid)) {
      elevation = hi === null ? NaN : hi - mid;
      type = 'VI';
    } else if (fs !== null && Number.isFinite(fs)) {
      elevation = hi === null ? NaN : hi - fs;
      type = 'VF';
    }
    return { elevation, hi, type, distance: num(o.distance), point: o.point };
  });

  const measured = rows.filter(row => row.type && Number.isFinite(row.elevation) && Number.isFinite(row.distance));
  rows.forEach((row, i) => {
    const hiCell = $(`#hi-${i}`), elevationCell = $(`#elev-${i}`), slopeCell = $(`#slope-${i}`);
    if (hiCell) hiCell.textContent = row.type ? fmt(row.hi) : '—';
    if (elevationCell) elevationCell.textContent = row.type ? fmt(row.elevation) : '—';

    const measuredIndex = measured.indexOf(row);
    const priorMeasured = measured.slice(0, measuredIndex).at(-1);
    const previous = row.type && Number.isFinite(row.elevation) && Number.isFinite(row.distance) &&
      priorMeasured?.distance !== row.distance
      ? measured.slice(0, measuredIndex).reverse().find(point => row.distance - point.distance > 0)
      : null;
    if (slopeCell) {
      slopeCell.classList.remove('slope-up', 'slope-down');
      if (!previous) {
        slopeCell.textContent = '—';
        slopeCell.title = row.type ? 'No hay un punto previo a distinta distancia.' : 'Agrega una lectura para calcular la pendiente.';
      } else {
        const slope = ((row.elevation - previous.elevation) / (row.distance - previous.distance)) * 100;
        slopeCell.textContent = `${slope > 0 ? '+' : ''}${slope.toFixed(2)}%`;
        slopeCell.title = `(${fmt(row.elevation)} − ${fmt(previous.elevation)}) ÷ (${fmt(row.distance)} − ${fmt(previous.distance)}) × 100`;
        slopeCell.classList.toggle('slope-up', slope > 0);
        slopeCell.classList.toggle('slope-down', slope < 0);
      }
    }
  });

  const sumBS = observations.reduce((sum, o) => sum + (num(o.bs) || 0), 0);
  const sumFS = observations.reduce((sum, o) => sum + (num(o.fs) || 0), 0);
  const last = measured.at(-1);
  const lastSlope = last ? $(`#slope-${rows.indexOf(last)}`)?.textContent : '—';
  const count = measured.length;
  $('#summary').innerHTML = `<b>Σ VA</b> ${fmt(sumBS)} m<br><b>Σ VF</b> ${fmt(sumFS)} m<br><b>Δ cota</b> ${fmt(sumBS - sumFS)} m<br><b>Puntos</b> ${count}<br><b>Cota final</b> ${last ? fmt(last.elevation) + ' m' : '—'}<br><b>Última pendiente</b> ${lastSlope || '—'}`;
  $('#lesson').innerHTML = `<strong>La derivada del perfil</strong> describe la pendiente del terreno. Como tenemos mediciones discretas, aquí se aproxima con Δcota ÷ Δdistancia × 100. Un valor positivo indica subida y uno negativo, bajada. La última pendiente calculada es <strong>${lastSlope || '—'}</strong>.`;
  draw(rows);
}

function draw(rows) {
  const canvas = $('#profile'), ctx = canvas.getContext('2d'), rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const width = rect.width, height = rect.height, pad = { left: 55, right: 18, top: 20, bottom: 38 };
  const valid = rows.filter(row => row.type && Number.isFinite(row.elevation) && Number.isFinite(row.distance));
  ctx.clearRect(0, 0, width, height);
  if (!valid.length) return;

  let xmin = Math.min(...valid.map(row => row.distance)), xmax = Math.max(...valid.map(row => row.distance));
  if (xmin === xmax) xmax = xmin + 1;
  let ymin = Math.min(...valid.map(row => row.elevation)), ymax = Math.max(...valid.map(row => row.elevation));
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const padding = (ymax - ymin) * 0.15;
  ymin -= padding; ymax += padding;
  const px = x => pad.left + (x - xmin) / (xmax - xmin) * (width - pad.left - pad.right);
  const py = y => height - pad.bottom - (y - ymin) / (ymax - ymin) * (height - pad.top - pad.bottom);

  ctx.font = '11px DM Mono,monospace';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (height - pad.top - pad.bottom) * i / 4;
    const value = ymax - (ymax - ymin) * i / 4;
    ctx.strokeStyle = '#e8eee8';
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#738078'; ctx.fillText(value.toFixed(2), 4, y + 4);
  }
  ctx.strokeStyle = '#176c51'; ctx.lineWidth = 2.5; ctx.beginPath();
  valid.forEach((row, i) => i ? ctx.lineTo(px(row.distance), py(row.elevation)) : ctx.moveTo(px(row.distance), py(row.elevation)));
  ctx.stroke();
  valid.forEach(row => {
    ctx.fillStyle = '#e68a4b'; ctx.beginPath(); ctx.arc(px(row.distance), py(row.elevation), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#52645a'; ctx.fillText(row.point, px(row.distance), py(row.elevation) - 9);
  });
  ctx.fillStyle = '#738078'; ctx.fillText('Distancia (m)', width / 2 - 30, height - 7);
}

tbody.addEventListener('input', event => {
  const input = event.target;
  if (input.dataset.i !== undefined) {
    observations[Number(input.dataset.i)][input.dataset.k] = input.value;
    calculate();
  }
});
tbody.addEventListener('click', event => {
  if (event.target.dataset.remove !== undefined) {
    observations.splice(Number(event.target.dataset.remove), 1);
    render();
  }
});
$('#addRow').addEventListener('click', () => {
  const last = observations.at(-1);
  observations.push({ point: `P-${observations.length}`, distance: (Number(last?.distance) || 0) + 20, bs: '', mid: '', fs: '' });
  render();
});
$('#benchmark').addEventListener('input', calculate);
$('#startName').addEventListener('input', () => {
  if (observations.length) observations[0].point = $('#startName').value;
  render();
});
$('#reset').addEventListener('click', () => {
  observations = example();
  $('#benchmark').value = '100.000';
  $('#startName').value = 'BM-1';
  render();
});
window.addEventListener('resize', calculate);
render();
