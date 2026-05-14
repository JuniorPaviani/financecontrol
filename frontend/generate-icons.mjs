/**
 * Generates icon-192.png and icon-512.png from icon.svg
 * Run once: node generate-icons.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

const svg = readFileSync('./public/icon.svg', 'utf-8');

async function generate(size) {
  // Use canvas to draw a simple branded icon (canvas doesn't render SVG directly)
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#140D07';
  const r = size * 0.19;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Gradient overlay
  const grd = ctx.createRadialGradient(size * 0.3, size * 0.2, 0, size * 0.5, size * 0.5, size * 0.8);
  grd.addColorStop(0, 'rgba(155,35,53,0.45)');
  grd.addColorStop(1, 'rgba(20,13,7,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Road decoration
  ctx.strokeStyle = 'rgba(201,123,60,0.2)';
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.12, size * 0.9);
  ctx.bezierCurveTo(size * 0.35, size * 0.62, size * 0.5, size * 0.58, size * 0.88, size * 0.31);
  ctx.stroke();

  // FC text
  ctx.fillStyle = '#F5E6D3';
  ctx.font = `bold ${size * 0.38}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FC', size * 0.5, size * 0.46);

  // Red accent line
  ctx.fillStyle = '#9B2335';
  ctx.fillRect(size * 0.26, size * 0.62, size * 0.48, size * 0.016);

  // Subtitle
  ctx.fillStyle = '#C97B3C';
  ctx.font = `${size * 0.082}px Arial, sans-serif`;
  ctx.letterSpacing = `${size * 0.012}px`;
  ctx.fillText('FINANCE', size * 0.5, size * 0.76);

  return canvas.toBuffer('image/png');
}

try {
  const { createCanvas: cc } = await import('canvas');
  const buf192 = await generate(192);
  const buf512 = await generate(512);
  writeFileSync('./public/icon-192.png', buf192);
  writeFileSync('./public/icon-512.png', buf512);
  console.log('Icons generated: icon-192.png, icon-512.png');
} catch (e) {
  console.error('canvas not available, using fallback:', e.message);
  process.exit(1);
}
