import { readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const csvPath = resolve(projectRoot, 'tmp/ok_geo.csv');
const outPath = resolve(projectRoot, 'lib/data/china-coords.json');

console.log('Reading CSV...');
const raw = readFileSync(csvPath, 'utf-8');

// Parse CSV - handle BOM, quoted fields, and commas inside quotes
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

const lines = raw.trim().split('\n');

// Skip header (remove BOM)
const headerLine = lines[0].replace(/^﻿/, '');
const headers = parseCSVLine(headerLine);
console.log('Headers:', headers);

// Indexes
const idIdx = headers.indexOf('id');
const pidIdx = headers.indexOf('pid');
const deepIdx = headers.indexOf('deep');
const nameIdx = headers.indexOf('name');
const extIdx = headers.indexOf('ext_path');
const geoIdx = headers.indexOf('geo');

// Parse geo string "lng lat" -> { longitude, latitude }
function parseGeo(geoStr) {
  const parts = geoStr.trim().split(/\s+/);
  return {
    longitude: parseFloat(parts[0]),
    latitude: parseFloat(parts[1]),
  };
}

// Parse ext_path into parts
function parseExtPath(extPath) {
  return extPath.split(/\s+/).filter(Boolean);
}

// First pass: collect all records
const provinces = []; // deep=0
const cities = [];    // deep=1
const districts = []; // deep=2

console.log('Parsing records...');
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const fields = parseCSVLine(line);
  const deep = parseInt(fields[deepIdx], 10);
  const record = {
    id: fields[idIdx],
    pid: fields[pidIdx],
    deep,
    name: fields[nameIdx],
    ext_path: fields[extIdx],
    geo: fields[geoIdx],
  };

  if (deep === 0) provinces.push(record);
  else if (deep === 1) cities.push(record);
  else if (deep === 2) districts.push(record);
}

console.log(`Found: ${provinces.length} provinces, ${cities.length} cities, ${districts.length} districts`);

// Build hierarchy
console.log('Building hierarchy...');
const result = { provinces: [] };

// Map for quick lookup
const provinceMap = new Map(); // name -> province object
const cityMap = new Map();     // "provinceId_cityId" -> city object (for fallback)

for (const p of provinces) {
  const geo = parseGeo(p.geo);
  const provinceObj = {
    name: p.name,
    longitude: geo.longitude,
    latitude: geo.latitude,
    cities: [],
  };
  result.provinces.push(provinceObj);
  provinceMap.set(p.id, provinceObj);
}

let orphanCities = 0;
let orphanDistricts = 0;

for (const c of cities) {
  const geo = parseGeo(c.geo);
  const pathParts = parseExtPath(c.ext_path);
  const cityName = pathParts.length >= 2 ? pathParts[1] : c.name;

  const cityObj = {
    name: cityName,
    longitude: geo.longitude,
    latitude: geo.latitude,
    districts: [],
  };

  const province = provinceMap.get(c.pid);
  if (province) {
    province.cities.push(cityObj);
    cityMap.set(c.id, cityObj);
  } else {
    orphanCities++;
  }
}

for (const d of districts) {
  const geo = parseGeo(d.geo);
  const pathParts = parseExtPath(d.ext_path);
  const districtName = pathParts.length >= 3 ? pathParts[2] : d.name;

  const districtObj = {
    name: districtName,
    longitude: geo.longitude,
    latitude: geo.latitude,
  };

  const city = cityMap.get(d.pid);
  if (city) {
    city.districts.push(districtObj);
  } else {
    orphanDistricts++;
  }
}

console.log(`Orphans: ${orphanCities} cities, ${orphanDistricts} districts`);

// Sort provinces, cities, districts by name for consistency
result.provinces.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
for (const p of result.provinces) {
  p.cities.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  for (const c of p.cities) {
    c.districts.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }
}

// Write output
console.log('Writing output...');
writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

// Stats
const totalCities = result.provinces.reduce((sum, p) => sum + p.cities.length, 0);
const totalDistricts = result.provinces.reduce(
  (sum, p) => sum + p.cities.reduce((s, c) => s + c.districts.length, 0),
  0,
);

// Check special regions
const hk = result.provinces.find((p) => p.name.includes('香港'));
const mo = result.provinces.find((p) => p.name.includes('澳门'));
const tw = result.provinces.find((p) => p.name.includes('台湾'));

// Beijing and Chongqing district counts
const beijing = result.provinces.find((p) => p.name === '北京市');
const chongqing = result.provinces.find((p) => p.name === '重庆市');
const shanghai = result.provinces.find((p) => p.name === '上海市');
const tianjin = result.provinces.find((p) => p.name === '天津市');

const getDistrictCount = (p) =>
  p ? p.cities.reduce((s, c) => s + c.districts.length, 0) : 0;

console.log('\n=== Data Statistics ===');
console.log(`Total provinces: ${result.provinces.length}`);
console.log(`Total cities: ${totalCities}`);
console.log(`Total districts: ${totalDistricts}`);
console.log(`Contains 香港: ${!!hk}`);
console.log(`Contains 澳门: ${!!mo}`);
console.log(`Contains 台湾: ${!!tw}`);
console.log(`北京市 districts: ${getDistrictCount(beijing)}`);
console.log(`重庆市 districts: ${getDistrictCount(chongqing)}`);
console.log(`上海市 districts: ${getDistrictCount(shanghai)}`);
console.log(`天津市 districts: ${getDistrictCount(tianjin)}`);

// File size
const { size } = statSync(outPath);
const sizeKB = (size / 1024).toFixed(1);
console.log(`\nOutput file size: ${sizeKB} KB`);

if (size > 1_000_000) {
  console.warn('WARNING: Output file exceeds 1MB target!');
}

// Integrity checks
console.log('\n=== Integrity Checks ===');
let allOk = true;
if (result.provinces.length < 31) { console.warn('FAIL: provinces < 31'); allOk = false; }
if (totalCities < 290) { console.warn('FAIL: cities < 290'); allOk = false; }
if (totalDistricts < 2800) { console.warn('FAIL: districts < 2800'); allOk = false; }
if (!hk) { console.warn('FAIL: 香港 missing'); allOk = false; }
if (!mo) { console.warn('FAIL: 澳门 missing'); allOk = false; }
if (!tw) { console.warn('FAIL: 台湾 missing'); allOk = false; }
if (getDistrictCount(beijing) < 16) { console.warn('FAIL: 北京市 districts < 16'); allOk = false; }
if (getDistrictCount(chongqing) < 37) { console.warn('FAIL: 重庆市 districts < 37'); allOk = false; }

if (allOk) console.log('All integrity checks passed!');
else console.log('Some checks failed - review above warnings.');
