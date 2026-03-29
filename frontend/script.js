// LOAD DATA
let jobs = JSON.parse(localStorage.getItem("jobs")) || [];
let products = [
  { name: "Shoes", price: 3000 },
  { name: "Sofa", price: 15000 },
];

// POST JOB
const form = document.getElementById("jobForm");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const job = {
      title: document.getElementById("title").value,
      desc: document.getElementById("desc").value,
      price: document.getElementById("price").value,
    };

    jobs.push(job);
    localStorage.setItem("jobs", JSON.stringify(jobs));

    alert("Job posted!");
    form.reset();
  });
}

// DISPLAY JOBS
const jobListEl = document.getElementById("jobList");
if (jobListEl) {
  jobListEl.innerHTML = jobs.length
    ? jobs
        .map(
          (job, i) => `
        <div class="card">
          <h3>${job.title}</h3>
          <p>${job.desc}</p>
          <p>Ksh ${job.price}</p>
          <a href="job-details.html" onclick="selectJob(${i})">View</a>
        </div>
      `,
        )
        .join("")
    : "<p>No jobs yet</p>";
}

// DISPLAY PRODUCTS
const productListEl =
  document.getElementById("productList") ||
  document.getElementById("marketList");
if (productListEl) {
  productListEl.innerHTML = products
    .map(
      (p, i) => `
    <div class="card">
      <h3>${p.name}</h3>
      <p>Ksh ${p.price}</p>
      <a href="product-details.html" onclick="selectProduct(${i})">View</a>
    </div>
  `,
    )
    .join("");
}

// PAYMENT
function payNow() {
  const status = document.getElementById("status");
  if (!status) return;

  status.innerText = "Payment Held Securely...";

  setTimeout(() => {
    status.innerText = "Waiting for delivery confirmation...";
  }, 1500);
}

// CONFIRM DELIVERY (ESCROW RELEASE)
function confirmDelivery() {
  alert("Delivery confirmed. Funds released ✅");
}
