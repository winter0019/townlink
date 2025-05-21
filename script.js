const businesses = [
  {
    id: 1,
    name: "Mama Zainab's Kitchen",
    category: "Restaurant",
    lga: "Daura",
    address: "123 Market Rd, Daura, Katsina State",
    phone: "0803 123 4567",
    hours: "9AM - 9PM",
    description: "Home-cooked meals and local delicacies.",
    rating: 4,
    premium: true,
  },
  {
    id: 2,
    name: "Funtua Tech Repairs",
    category: "Electronics",
    lga: "Funtua",
    address: "5 Junction Street, Funtua",
    phone: "0810 987 6543",
    hours: "10AM - 6PM",
    description: "Phone and laptop repairs, accessories sales.",
    rating: 5,
    premium: false,
  },
];

let selectedBiz = null;
let reviewRating = 0;

const bizGrid = document.getElementById("businessGrid");
const searchInput = document.getElementById("searchInput");

function renderBusinesses(list) {
  bizGrid.innerHTML = "";
  list.forEach((biz) => {
    const card = document.createElement("div");
    card.className = `card ${biz.premium ? "premium" : ""}`;
    card.innerHTML = `
      <h2>${biz.name} ${biz.premium ? "★ Premium" : ""}</h2>
      <p>${biz.category} — ${biz.lga}</p>
      <p>${biz.address}</p>
      <p>📞 ${biz.phone}</p>
      <p>${biz.hours}</p>
      <p>${biz.description}</p>
      <div>${"★".repeat(biz.rating)}</div>
      <button onclick="openReview(${biz.id})">Leave a Review</button>
    `;
    bizGrid.appendChild(card);
  });
}

function openReview(id) {
  selectedBiz = businesses.find((b) => b.id === id);
  document.getElementById("reviewTitle").textContent = `Review ${selectedBiz.name}`;
  document.getElementById("reviewModal").classList.remove("hidden");
  updateStars();
}

function updateStars() {
  const starContainer = document.getElementById("ratingStars");
  starContainer.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.style.cursor = "pointer";
    star.style.color = i <= reviewRating ? "gold" : "gray";
    star.onclick = () => {
      reviewRating = i;
      updateStars();
    };
    starContainer.appendChild(star);
  }
}

document.getElementById("submitReview").onclick = () => {
  alert(`Thank you for rating ${selectedBiz.name} ${reviewRating} star(s)!`);
  document.getElementById("reviewModal").classList.add("hidden");
  reviewRating = 0;
};

document.getElementById("cancelReview").onclick = () => {
  document.getElementById("reviewModal").classList.add("hidden");
};

document.getElementById("toggleFormBtn").onclick = () => {
  document.getElementById("addFormContainer").classList.remove("hidden");
};

document.getElementById("cancelForm").onclick = () => {
  document.getElementById("addFormContainer").classList.add("hidden");
};

document.getElementById("submitBiz").onclick = () => {
  const newBiz = {
    id: businesses.length + 1,
    name: document.getElementById("bizName").value,
    category: document.getElementById("bizCategory").value,
    lga: document.getElementById("bizLga").value,
    address: document.getElementById("bizAddress").value,
    phone: document.getElementById("bizPhone").value,
    description: document.getElementById("bizDescription").value,
    rating: 0,
    premium: false,
  };
  businesses.unshift(newBiz);
  renderBusinesses(businesses);
  document.getElementById("addFormContainer").classList.add("hidden");
};

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.lga.toLowerCase().includes(q)
  );
  renderBusinesses(filtered);
});

renderBusinesses(businesses);
