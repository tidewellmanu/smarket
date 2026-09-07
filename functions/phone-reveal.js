/*
 Server-side Firebase callable function.
 This is intentionally isolated from the static frontend. The frontend contains no Node/npm/build tooling.
 Deploy this function using a supported Firebase Cloud Functions runtime and its required server-side dependency manifest.
*/
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
initializeApp();
const db=getFirestore();

exports.revealPhone=onCall({enforceAppCheck:true},async request=>{
  if(!request.auth) throw new HttpsError("unauthenticated","Sign in required.");
  const viewer=request.auth.uid, listingId=request.data?.listingId;
  if(typeof listingId!=="string" || !listingId) throw new HttpsError("invalid-argument","Listing ID required.");
  const listing=await db.doc(`listings/${listingId}`).get();
  if(!listing.exists) throw new HttpsError("not-found","Listing not found.");
  const l=listing.data();
  if(l.status!=="active") throw new HttpsError("failed-precondition","Listing is not active.");
  if(l.sellerId===viewer) throw new HttpsError("failed-precondition","This is your listing.");
  const since=new Date(Date.now()-60*60*1000);
  const recent=await db.collection("phoneReveals").where("viewerId","==",viewer).where("createdAt",">",since).limit(21).get();
  if(recent.size>=20) throw new HttpsError("resource-exhausted","Phone reveal limit reached. Try again later.");
  const user=await db.doc(`users/${l.sellerId}`).get();
  if(!user.exists || !user.data().phone) throw new HttpsError("not-found","Seller phone is unavailable.");
  await db.collection("phoneReveals").add({viewerId:viewer,listingId,sellerId:l.sellerId,createdAt:FieldValue.serverTimestamp()});
  return {phone:user.data().phone};
});
