import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { COUNTRIES, currentCountry, COUNTRY_ORDER, setCountry } from "./countries.js";

export function renderShell(){
  const code=currentCountry();
  const header=document.getElementById("site-header");
  if(header) header.innerHTML=`<header class="topbar"><div class="container"><div class="header-main">
    <a class="brand" href="index.html">Market<span>Hub</span><em> GH</em></a>
    <nav class="header-actions">
      <a class="btn btn-secondary btn-small optional" href="favorites.html">Favorites</a>
      <a class="btn btn-secondary btn-small optional" href="messages.html">Messages</a>
      <a class="btn btn-primary btn-small" href="sell.html">Sell</a>
      <a id="account-link" class="btn btn-secondary btn-small" href="login.html">Sign in</a>
    </nav></div></div></header>`;

  onAuthStateChanged(auth,u=>{
    const a=document.getElementById("account-link");
    if(a){a.textContent=u?"Account":"Sign in";a.href=u?"dashboard.html":"login.html";}
  });

  const footer=document.getElementById("site-footer");
  if(footer){
    footer.className="site-footer";
    footer.innerHTML=`<div class="container">
      <div class="country-section">
        <div class="section-label">Choose marketplace</div>
        <div class="country-scroll" aria-label="Countries">
          ${COUNTRY_ORDER.map(k=>`<a class="${k===code?"active":""}" href="country.html?country=${k}" data-country="${k}">${COUNTRIES[k].name}</a>`).join("")}
        </div>
      </div>
      <div class="footer-grid">
        <div><a class="brand" href="index.html">Market<span>Hub</span><em> GH</em></a><p class="meta">An original marketplace platform.</p></div>
        <div><strong>Marketplace</strong><a href="search.html">Search</a><a href="sell.html">Sell</a><a href="favorites.html">Favorites</a></div>
        <div><strong>Safety</strong><a href="safety.html">Safety tips</a><a href="reports.html">Report</a></div>
        <div><strong>Legal</strong><a href="terms.html">Terms</a><a href="privacy.html">Privacy</a></div>
      </div></div>`;
    footer.querySelectorAll("[data-country]").forEach(a=>a.addEventListener("click",e=>{
      setCountry(e.currentTarget.dataset.country);
    }));
  }

  const nav=document.getElementById("mobile-nav");
  if(nav) nav.innerHTML=`<nav class="mobile-nav">
    <a href="index.html">Home</a><a href="search.html">Search</a><a href="sell.html">Sell</a>
    <a href="messages.html">Messages</a><a href="dashboard.html">Account</a>
  </nav>`;
}
