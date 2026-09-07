import {auth,db,storage} from "./firebase.js";
import {addDoc,collection,doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import {loadCategories} from "./categories.js";import {populateLocationSelect} from "./locations.js";import {currentCountry} from "./countries.js";import {escapeHtml,getParam} from "./utils.js";
const form=document.getElementById("listing-form"),status=document.getElementById("form-status");
async function fill(){const c=await loadCategories();const cs=document.getElementById("category");if(cs)cs.innerHTML=c.map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("");populateLocationSelect(document.getElementById("location"),false)}
document.getElementById("images")?.addEventListener("change",e=>{const p=document.getElementById("image-preview");p.innerHTML=[...e.target.files].slice(0,8).map(f=>`<img src="${URL.createObjectURL(f)}" alt="">`).join("")});
form?.addEventListener("submit",async e=>{e.preventDefault();if(!auth.currentUser){location.href="login.html";return}status.textContent="Publishing…";try{
 const data={title:title.value.trim(),description:description.value.trim(),categoryId:category.value,location:location.value,price:Number(price.value),condition:condition.value,negotiable:negotiable.checked,countryCode:currentCountry(),sellerId:auth.currentUser.uid,status:"pending",createdAt:serverTimestamp(),updatedAt:serverTimestamp(),searchTokens:[...new Set((title.value+" "+description.value).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1).slice(0,80))]};
 const d=await addDoc(collection(db,"listings"),data);let coverImage="";for(const file of [...images.files].slice(0,8)){if(file.size>5*1024*1024)continue;const r=ref(storage,`listingImages/${auth.currentUser.uid}/${d.id}/${crypto.randomUUID()}-${file.name}`);await uploadBytes(r,file,{contentType:file.type});const u=await getDownloadURL(r);if(!coverImage)coverImage=u}
 if(coverImage)await updateDoc(doc(db,"listings",d.id),{coverImage});
 status.textContent="Listing submitted for moderation.";form.reset();document.getElementById("image-preview").innerHTML="";
 }catch(e){status.textContent=e.message}}
);
fill();