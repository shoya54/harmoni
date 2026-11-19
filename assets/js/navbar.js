(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const sesiAdmin = JSON.parse(sessionStorage.getItem("admin_harmoni"));
  const isLoggedIn = true; // Boolean(sesiAdmin && sesiAdmin.username);
  const menuAdmin = isLoggedIn ? 
    `<li class="nav-item">
      <a class="nav-link ${currentPage === 'admin.html' ? 'nav-link-menu text-white' : ''}" href="admin.html">Admin</a>
    </li>` : '';
  
  const navHTML = `
    <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark shadow p-0 mb-3">
      <div class="container-fluid px-4">
        <div class="navbar-brand d-flex align-items-center gap-2 fw-bold text-light" style="cursor:pointer;">
          <a class="navbar-brand m-0" href="#">
            <img src="assets/images/dompet-bgwhite.png" alt="Logo" width="30">
          </a>
          Kas Harmoni
        </div>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto gap-2">
            <li class="nav-item">
              <a class="nav-link ${currentPage === 'index.html' ? 'nav-link-menu text-white' : ''} " href="index.html">Rekap</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPage === 'transaksi.html' ? 'nav-link-menu text-white' : ''} " href="transaksi.html">Transaksi</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPage === 'jimpitan.html' ? 'nav-link-menu text-white' : ''} " href="jimpitan.html">Jimpitan</a>
            </li>
            ${menuAdmin}
          </ul>
        </div>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', navHTML);
}) ();
