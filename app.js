import { Client, Databases, ID, Query, Realtime } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

// ==== CONFIGURATION ====
// Replace these IDs with your Appwrite project info
const client = new Client().setEndpoint("https://<YOUR-ENDPOINT>").setProject("<YOUR-PROJECT-ID>");
const databases = new Databases(client);
const dbID = "<YOUR-DATABASE-ID>";
const colContent = "<CONTENT-COLLECTION-ID>";
const colComments = "<COMMENT-COLLECTION-ID>";
const colLikes = "<LIKE-COLLECTION-ID>";
const colSubs = "<SUBSCRIBER-COLLECTION-ID>";

// ==== THEME ====
const themeToggle = document.getElementById('themeToggle');
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem('theme', document.body.classList.contains("dark") ? "dark" : "light");
};
if(localStorage.getItem('theme') === "dark") document.body.classList.add("dark");

// ==== MOBILE MENU ====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const nav = document.getElementById('mainNav');
hamburgerBtn.onclick = () => nav.classList.toggle('open');

// ==== CONTACT MODAL ====
const contactBtn = document.getElementById('contactBtn');
const contactModal = document.getElementById('contactModal');
const closeContact = document.getElementById('closeContact');
contactBtn.onclick = () => contactModal.style.display = "flex";
closeContact.onclick = () => contactModal.style.display = "none";
window.addEventListener("click", e => {
  if (e.target === contactModal) contactModal.style.display = "none";
});

// ==== CATEGORY FILTER ====
let currentCategory = "all";
const catBtns = document.querySelectorAll('.cat-btn, .nav-btn');
catBtns.forEach(btn => {
  btn.onclick = function() {
    catBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentCategory = this.dataset.category;
    loadContent();
  };
});

// ==== NEWSLETTER MODAL ====
const subscribeBtn = document.getElementById('subscribeBtn');
const newsletterModal = document.getElementById('newsletterModal');
const closeNewsletter = document.getElementById('closeNewsletter');
const newsletterSubmit = document.getElementById('newsletterSubmit');
subscribeBtn.onclick = () => newsletterModal.style.display = "flex";
closeNewsletter.onclick = () => newsletterModal.style.display = "none";
window.addEventListener("click", e => {
  if (e.target === newsletterModal) newsletterModal.style.display = "none";
});
newsletterSubmit.onclick = async () => {
  const email = document.getElementById('newsletterEmail').value;
  const status = document.getElementById('newsletterStatus');
  if(!email) return status.textContent = "Please enter your email.";
  try {
    await databases.createDocument(dbID, colSubs, ID.unique(), { email });
    status.textContent = "🎉 Subscribed!";
  } catch {
    status.textContent = "❌ Failed to subscribe.";
  }
};

// ==== FOOTER POLICY MODAL ====
const showPrivacy = document.getElementById('showPrivacy');
const showTerms = document.getElementById('showTerms');
const policyModal = document.getElementById('policyModal');
const closePolicy = document.getElementById('closePolicy');
const policyContent = document.getElementById('policyContent');
showPrivacy.onclick = () => {
  policyModal.style.display = "flex";
  policyContent.innerHTML = `<h3>Privacy Policy</h3><p>We value your privacy. Data is secured and never sold.</p>`;
};
showTerms.onclick = () => {
  policyModal.style.display = "flex";
  policyContent.innerHTML = `<h3>Terms of Service</h3><p>Use SportsEra responsibly. All rights reserved.</p>`;
};
closePolicy.onclick = () => policyModal.style.display = "none";
window.addEventListener("click", e => {
  if (e.target === policyModal) policyModal.style.display = "none";
});

// ==== LOAD CONTENT ====
const contentList = document.getElementById('contentList');
async function loadContent() {
  let queries = [];
  if(currentCategory !== "all") queries.push(Query.equal('category', [currentCategory]));
  const { documents } = await databases.listDocuments(dbID, colContent, queries);
  contentList.innerHTML = "";
  for (const doc of documents) {
    contentList.appendChild(renderContentCard(doc));
  }
}
window.loadContent = loadContent;

// ==== RENDER CONTENT CARD ====
function renderContentCard(doc) {
  // doc: { $id, header, media_url, media_type, rate, views, comments, description, category }
  const postUrl = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(doc.$id)}`;
  const card = document.createElement('div');
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">${doc.header || "Untitled"}</div>
    <div class="card-media">
      ${doc.media_type === "video"
        ? `<video src="${doc.media_url}" controls poster="${doc.media_poster || ''}"></video>`
        : `<img src="${doc.media_url || 'default.jpg'}" alt="media"/>`
      }
    </div>
    <div class="card-meta">
      <span class="rate">⭐ ${doc.rate || 0}</span>
      <span class="views">👁️ ${doc.views || 0}</span>
      <span class="comments">💬 ${doc.comments || 0}</span>
    </div>
    <div class="card-actions">
      <button class="like-btn" onclick="likeContent('${doc.$id}', this)">
        ❤️ <span class="like-count">${doc.like_count || 0}</span>
      </button>
      <button class="comment-btn" onclick="toggleCommentSection('${doc.$id}')">
        💬 <span class="comment-count">${doc.comment_count || 0}</span>
      </button>
      <button class="share-btn" onclick="shareContent('${doc.$id}', '${encodeURIComponent(doc.header)}', '${encodeURIComponent(postUrl)}', this)">
        🔗 Share
      </button>
    </div>
    <div class="card-desc">${doc.description || ""}</div>
    <div class="comment-section" id="comment-section-${doc.$id}">
      <div class="comment-input-wrap">
        <input class="comment-input" id="comment-input-${doc.$id}" placeholder="Add a comment..." />
        <button class="comment-send-btn" onclick="sendComment('${doc.$id}')">Send</button>
      </div>
      <div class="comment-list" id="comment-list-${doc.$id}"></div>
    </div>
  `;
  return card;
}

// ==== LIKE CONTENT ====
window.likeContent = async (id, btn) => {
  const key = `like_${id}`;
  if(localStorage.getItem(key)) return;
  try {
    await databases.createDocument(dbID, colLikes, ID.unique(), { contentId: id });
    localStorage.setItem(key, "1");
    btn.classList.add("liked");
  } catch {}
};

// ==== COMMENT ====
window.toggleCommentSection = (id) => {
  const section = document.getElementById(`comment-section-${id}`);
  section.classList.toggle("active");
  if(section.classList.contains("active")) loadComments(id);
};
async function loadComments(id) {
  const { documents } = await databases.listDocuments(dbID, colComments, [Query.equal('contentId', [id])]);
  const list = document.getElementById(`comment-list-${id}`);
  list.innerHTML = documents.map(c => `<div class="comment-item">${c.text}</div>`).join('');
}
window.sendComment = async (id) => {
  const input = document.getElementById(`comment-input-${id}`);
  const text = input.value.trim();
  if(!text) return;
  try {
    await databases.createDocument(dbID, colComments, ID.unique(), { contentId: id, text });
    input.value = "";
    loadComments(id);
  } catch {}
};

// ==== SHARE CONTENT ====
window.shareContent = (id, header, url, btn) => {
  url = decodeURIComponent(url); header = decodeURIComponent(header);
  if (navigator.share) {
    navigator.share({ title: header, text: header, url: url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = "✅ Copied Link";
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = "🔗 Share";
      }, 1300);
    });
  }
};

// ==== REALTIME UPDATES ====
const rt = new Realtime(client);
rt.subscribe([
  `databases.${dbID}.collections.${colLikes}.documents`,
  `databases.${dbID}.collections.${colComments}.documents`
], resp => { loadContent(); });

// ==== INITIAL LOAD ====
loadContent();

// ==== SERVICE WORKER ====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker registered'));
}