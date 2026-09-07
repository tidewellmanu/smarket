import {auth} from "./firebase.js";
import {RecaptchaVerifier,signInWithPhoneNumber,PhoneAuthProvider,updatePhoneNumber} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
let confirmation=null, verifier=null;
const status=document.getElementById("otp-status");const msg=x=>status.textContent=x?.message||x||"";
if(document.getElementById("recaptcha-container")) verifier=new RecaptchaVerifier(auth,"recaptcha-container",{size:"normal"});
document.getElementById("send-otp")?.addEventListener("click",async()=>{try{confirmation=await signInWithPhoneNumber(auth,document.getElementById("phone").value,verifier);msg("OTP sent.")}catch(e){msg(e)}});
document.getElementById("confirm-otp")?.addEventListener("click",async()=>{try{await confirmation.confirm(document.getElementById("otp").value);msg("Phone verified.");}catch(e){msg(e)}});
