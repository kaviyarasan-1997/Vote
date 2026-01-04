/* 🔹 Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyBLyf_dz6xPC9wdthZSVtpatkc8JgFhE4Q",
  authDomain: "chatbox-chats.firebaseapp.com",
  databaseURL: "https://chatbox-chats-default-rtdb.firebaseio.com",
  projectId: "chatbox-chats",
  storageBucket: "chatbox-chats.appspot.com",
  messagingSenderId: "10200860576",
  appId: "1:10200860576:android:262315d86f6d1732ddc6c5"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* 🔹 Candidate Names */
const names = {
  1:"A.R.Rahman", 2:"Anirudh Ravichander", 3:"Yuvan Shankar Raja", 4:"J. Harris Jayaraj",
  5:"Vijay Anton",6:"Aadhi", 7:"D.imman", 8:"G.V.prakash"
};

/* Set names under images */
for(let i=1;i<=8;i++){
  document.getElementById("n"+i).innerText = names[i];
}

/* 🔹 VOTING DURATION = 2 HOURS */
const VOTING_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms
const timeRef = db.ref("settings/endTime");

/* 🔹 Initialize End Time (only once) */
timeRef.once("value").then(snap=>{
  if(!snap.exists()){
    const serverEnd = Date.now() + VOTING_DURATION;
    timeRef.set(serverEnd);
  }
});

/* 🔹 One device – one vote */
function vote(n){
  timeRef.once("value").then(snap=>{
    if(Date.now() > snap.val()){
      alert("⏰ Voting Closed");
      showWinner();
      return;
    }

    if(localStorage.getItem("voted")){
      alert("❌ One device – one vote only");
      return;
    }

    db.ref("votes/option"+n).transaction(v => (v||0)+1);
    localStorage.setItem("voted","yes");
    alert("✅ Vote submitted");
  });
}

/* 🔹 Countdown Timer */
setInterval(()=>{
  timeRef.once("value").then(snap=>{
    const endTime = snap.val();
    const diff = endTime - Date.now();

    if(diff <= 0){
      document.getElementById("timer").innerText = "⏰ Voting Closed";
      showWinner();
      return;
    }

    const h = Math.floor(diff / (1000*60*60));
    const m = Math.floor((diff % (1000*60*60)) / (1000*60));
    const s = Math.floor((diff % (1000*60)) / 1000);

    document.getElementById("timer").innerText =
      `⏳ ${h}h ${m}m ${s}s Remaining`;
  });
},1000);

/* 🔹 Live Results + Stylish Footer */
db.ref("votes").on("value",snap=>{
  const data = snap.val() || {};
  let total = 0;
  let arr = [];

  for(let i=1;i<=8;i++){
    let v = data["option"+i] || 0;
    total += v;
    arr.push({id:i, name:names[i], votes:v});
  }

  arr.sort((a,b)=>b.votes-a.votes);

  /* Image progress */
  arr.forEach(o=>{
    let percent = total ? (o.votes/total)*100 : 0;
    document.getElementById("p"+o.id).style.width = percent+"%";
  });

  /* Footer render */
  let html = "";
  arr.forEach((o,i)=>{
    let percent = total ? ((o.votes/total)*100).toFixed(1) : 0;
    let rankClass = i==0?"rank-1":i==1?"rank-2":i==2?"rank-3":"";

    html += `
      <div class="footer-row ${rankClass}">
        <div class="footer-name">
          <span>${i+1}. ${o.name}</span>
          <span>${percent}%</span>
        </div>
        <div class="footer-progress">
          <span style="width:${percent}%"></span>
        </div>
        <div class="footer-count">🗳️ ${o.votes} Votes</div>
      </div>
    `;
  });

  document.getElementById("footerResults").innerHTML = html;
});

/* 🔹 Winner Announcement */
function showWinner(){
  db.ref("votes").once("value").then(snap=>{
    const data = snap.val() || {};
    let max = 0, win = 1;

    for(let i=1;i<=8;i++){
      if((data["option"+i]||0) > max){
        max = data["option"+i];
        win = i;
      }
    }

    document.getElementById("winnerImg").src = `img/${win}.jpg`;
    document.getElementById("winnerText").innerText =
      `${names[win]} Wins 🏆 (${max} Votes)`;
    document.getElementById("winnerBox").classList.remove("hidden");
  });
}