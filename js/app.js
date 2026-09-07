import { renderShell } from "./ui.js";
import { db } from "./firebase.js";
import { collection,query,where,orderBy,limit,getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { formatPrice,currentCountry } from "./countries.js";
import { loadCategories } from "./categories.js";
import { populateLocationSelect } from "./locations.js";
import { escapeHtml,imageOrPlaceholder } from "./utils.js";

const urlCountry=new URLSearchParams(location.search).get("country");
if(urlCountry) localStorage.setItem("mh_country",urlCountry);
renderShell();

const locationSelect=document.getElementById("search-location"); if(locationSelect) populateLocationSelect(locationSelect,false);
const searchForm=document.getElementById("hero-search");
searchForm?.addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("search-input").value.trim();const loc=document.getElementById("search-location").value;location.href=`search.html?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`;});

async function homeListings(){
 const grid=document.getElementById("listing-grid"); if(!grid)return;
 try{
  const s=await getDocs(query(collection(db,"listings"),where("status","==","active"),where("countryCode","==",currentCountry()),orderBy("createdAt","desc"),limit(24)));
  if(s.empty){grid.innerHTML="";document.getElementById("home-empty")?.classList.remove("hidden");return;}
  grid.innerHTML=s.docs.map(d=>{const x=d.data();return `<a class="listing-card" href="listing.html?id=${d.id}"><img class="thumb" loading="lazy" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="${escapeHtml(x.title)}"><div class="body"><h3>${escapeHtml(x.title)}</h3><div class="price">${formatPrice(x.price,x.countryCode)}</div><div class="meta">${escapeHtml(x.location||"Ghana")}</div></div></a>`}).join("");
 }catch(e){grid.innerHTML=`<div class="empty">Connect Firebase and deploy Firestore rules to load live listings.</div>`;}
}
if(document.getElementById("listing-grid")) homeListings();