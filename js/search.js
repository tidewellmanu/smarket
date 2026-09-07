/* Efficient marketplace search: keyword + filters + relevance ranking */
import { db } from "./firebase.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  startAfter, documentId
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const PAGE_SIZE = 24;
const MAX_FALLBACK_SCAN = 400;

function normalize(value="") {
  return value.toString().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

function terms(q) {
  return [...new Set(normalize(q).split(" ").filter(x => x.length >= 2))];
}

function haystack(item) {
  return normalize([
    item.title, item.description, item.category, item.subcategory,
    item.region, item.city, item.location, item.brand, item.model,
    ...(Array.isArray(item.searchKeywords) ? item.searchKeywords : [])
  ].join(" "));
}

function relevance(item, queryText) {
  const q = normalize(queryText);
  if (!q) return 0;
  const h = haystack(item);
  const ts = terms(q);
  let score = 0;

  if (normalize(item.title) === q) score += 1000;
  if (normalize(item.title).startsWith(q)) score += 450;
  if (normalize(item.title).includes(q)) score += 300;
  if (h.includes(q)) score += 150;

  for (const t of ts) {
    if (normalize(item.title).includes(t)) score += 80;
    else if (h.includes(t)) score += 25;
  }

  // Useful marketplace signals.
  if (item.featured) score += 18;
  if (item.verifiedSeller) score += 12;
  if (item.condition === "new") score += 5;
  if (item.updatedAt) score += 1;
  return score;
}

function matches(item, queryText) {
  const ts = terms(queryText);
  if (!ts.length) return true;
  const h = haystack(item);
  // Every keyword must be represented somewhere so a multi-word query stays useful.
  return ts.every(t => h.includes(t));
}

async function fetchActiveListings(filters={}) {
  const ref = collection(db, "listings");
  const constraints = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(MAX_FALLBACK_SCAN)
  ];

  if (filters.countryCode) {
    constraints.splice(1, 0, where("countryCode", "==", filters.countryCode));
  }
  if (filters.category) {
    constraints.splice(1, 0, where("category", "==", filters.category));
  }

  try {
    const snap = await getDocs(query(ref, ...constraints));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (err) {
    // If an optional compound index is not ready, fall back to the simplest active query.
    const snap = await getDocs(query(
      ref, where("status","==","active"), limit(MAX_FALLBACK_SCAN)
    ));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  }
}

export async function searchListings({q="", countryCode="", category=""}={}) {
  const all = await fetchActiveListings({countryCode, category});
  const filtered = all.filter(x => matches(x, q));
  filtered.sort((a,b) => relevance(b,q) - relevance(a,q));
  return filtered;
}

export async function getRecommendations(currentListing, options={}) {
  const all = await fetchActiveListings({countryCode: currentListing.countryCode});
  const currentTerms = terms([
    currentListing.title,
    currentListing.category,
    currentListing.subcategory,
    currentListing.brand,
    currentListing.model,
    ...(currentListing.searchKeywords || [])
  ].join(" "));

  const score = (item) => {
    if (item.id === currentListing.id) return -Infinity;
    const h = haystack(item);
    let s = 0;

    if (item.category && item.category === currentListing.category) s += 70;
    if (item.subcategory && item.subcategory === currentListing.subcategory) s += 35;
    if (item.region && item.region === currentListing.region) s += 20;
    if (item.city && item.city === currentListing.city) s += 15;
    if (item.condition && item.condition === currentListing.condition) s += 8;

    for (const t of currentTerms) {
      if (h.includes(t)) s += 8;
      if (normalize(item.title).includes(t)) s += 18;
    }

    // Gentle price proximity preference when both prices are numeric.
    const a = Number(currentListing.price), b = Number(item.price);
    if (Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0) {
      const ratio = Math.abs(b-a) / a;
      if (ratio <= .10) s += 20;
      else if (ratio <= .25) s += 10;
    }

    if (item.featured) s += 8;
    if (item.verifiedSeller) s += 5;
    return s;
  };

  return all
    .map(item => ({item, score:score(item)}))
    .filter(x => Number.isFinite(x.score) && x.score > 0)
    .sort((a,b) => b.score-a.score)
    .slice(0, options.limit || 12)
    .map(x => x.item);
}

export { normalize, relevance, matches };
