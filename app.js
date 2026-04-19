(function () {
  let supabaseClient = null;
  let editId = null;

  const loginView = document.getElementById('loginView');
  const inventoryView = document.getElementById('inventoryView');
  const loginForm = document.getElementById('loginForm');
  const loginPasscode = document.getElementById('loginPasscode');
  const loginMessage = document.getElementById('loginMessage');
  const tableBody = document.getElementById('inventoryTableBody');
  const emptyState = document.getElementById('emptyState');
  const addBtn = document.getElementById('openAddModalButton');
  const refreshButton = document.getElementById('refreshButton');
  const settingsButton = document.getElementById('settingsButton');
  const settingsMenu = document.getElementById('settingsMenu');
  const changePasscodeMenuItem = document.getElementById('changePasscodeMenuItem');
  const logoutMenuItem = document.getElementById('logoutMenuItem');

  const gunModal = document.getElementById('gunModal');
  const gunForm = document.getElementById('gunForm');
  const closeGunModalButton = document.getElementById('closeGunModalButton');
  const cancelGunButton = document.getElementById('cancelGunButton');

  const passcodeModal = document.getElementById('passcodeModal');
  const changePasscodeForm = document.getElementById('changePasscodeForm');
  const currentPasscode = document.getElementById('currentPasscode');
  const newPasscode = document.getElementById('newPasscode');
  const confirmNewPasscode = document.getElementById('confirmNewPasscode');
  const passcodeMessage = document.getElementById('passcodeMessage');
  const closePasscodeModalButton = document.getElementById('closePasscodeModalButton');
  const cancelPasscodeButton = document.getElementById('cancelPasscodeButton');

  function getPasscode() {
    return localStorage.getItem('passcode') || APP_CONFIG.DEFAULT_PASSCODE;
  }

  function setPasscode(value) {
    localStorage.setItem('passcode', value);
  }

  function showLoggedOutView() {
    loginView.classList.add('active');
    inventoryView.classList.remove('active');
    loginView.style.display = 'block';
    inventoryView.style.display = 'none';
    settingsMenu.classList.add('hidden');
    loginPasscode.value = '';
    loginMessage.textContent = '';
  }

  function showLoggedInView() {
    loginView.classList.remove('active');
    inventoryView.classList.add('active');
    loginView.style.display = 'none';
    inventoryView.style.display = 'block';
    settingsMenu.classList.add('hidden');
  }

  function initSupabase() {
    if (supabaseClient) return;
    try {
      supabaseClient = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
    } catch (error) {
      console.error('Supabase init failed', error);
    }
  }

  function openGunModal() {
    gunModal.classList.remove('hidden');
  }

  function closeGunModal() {
    gunModal.classList.add('hidden');
    gunForm.reset();
    editId = null;
  }

  function openPasscodeModal() {
    passcodeModal.classList.remove('hidden');
    passcodeMessage.textContent = '';
    currentPasscode.value = '';
    newPasscode.value = '';
    confirmNewPasscode.value = '';
    settingsMenu.classList.add('hidden');
  }

  function closePasscodeModal() {
    passcodeModal.classList.add('hidden');
    passcodeMessage.textContent = '';
  }

  async function seedData() {
    const { data, error } = await supabaseClient.from('inventory_items').select('*');
    if (error) {
      console.error(error);
      return;
    }
    if (data.length === 0) {
      await supabaseClient.from('inventory_items').insert([
        { make: 'Glock', model: '19', serial_number: 'G19-001', year: '2022', caliber: '9mm', purchase_price: 550, description: 'Compact reliable pistol', condition: 'Excellent' },
        { make: 'Sig Sauer', model: 'P320', serial_number: 'SIG-320A', year: '2021', caliber: '9mm', purchase_price: 600, description: 'Modular striker-fired handgun', condition: 'Very Good' },
        { make: 'Smith & Wesson', model: 'M&P Shield', serial_number: 'SW-SHLD', year: '2020', caliber: '9mm', purchase_price: 450, description: 'Slim carry pistol', condition: 'Good' }
      ]);
    }
  }

  async function loadData() {
    if (!supabaseClient) return;

    await seedData();
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    tableBody.innerHTML = '';
    emptyState.classList.toggle('hidden', data.length > 0);

    data.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.make || ''}</td>
        <td>${row.model || ''}</td>
        <td>${row.serial_number || ''}</td>
        <td>${row.year || ''}</td>
        <td>${row.caliber || ''}</td>
        <td>${row.purchase_price ?? ''}</td>
        <td>${row.description || ''}</td>
        <td>${row.condition || ''}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${row.id}" type="button">✏️</button>
          <button class="action-btn" data-action="delete" data-id="${row.id}" type="button">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  async function editRow(id) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    editId = id;
    document.getElementById('make').value = data.make || '';
    document.getElementById('model').value = data.model || '';
    document.getElementById('serialNumber').value = data.serial_number || '';
    document.getElementById('year').value = data.year || '';
    document.getElementById('caliber').value = data.caliber || '';
    document.getElementById('purchasePrice').value = data.purchase_price ?? '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('condition').value = data.condition || '';
    openGunModal();
  }

  async function deleteRow(id) {
    const ok = window.confirm('Are you sure?');
    if (!ok) return;

    const { error } = await supabaseClient.from('inventory_items').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    await loadData();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loginPasscode.value !== getPasscode()) {
      loginMessage.textContent = 'Wrong passcode';
      return;
    }

    loginMessage.textContent = '';
    showLoggedInView();
    initSupabase();
    await loadData();
  });

  addBtn.addEventListener('click', openGunModal);
  closeGunModalButton.addEventListener('click', closeGunModal);
  cancelGunButton.addEventListener('click', closeGunModal);

  refreshButton.addEventListener('click', async () => {
    await loadData();
  });

  settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('hidden');
  });

  changePasscodeMenuItem.addEventListener('click', openPasscodeModal);

  logoutMenuItem.addEventListener('click', () => {
    showLoggedOutView();
  });

  closePasscodeModalButton.addEventListener('click', closePasscodeModal);
  cancelPasscodeButton.addEventListener('click', closePasscodeModal);

  changePasscodeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (currentPasscode.value !== getPasscode()) {
      passcodeMessage.textContent = 'Current passcode is incorrect.';
      return;
    }
    if (newPasscode.value !== confirmNewPasscode.value) {
      passcodeMessage.textContent = 'New passcodes do not match.';
      return;
    }

    setPasscode(newPasscode.value);
    passcodeMessage.textContent = 'Passcode changed successfully. Please log in again.';

    window.setTimeout(() => {
      closePasscodeModal();
      showLoggedOutView();
    }, 1000);
  });

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') {
      await editRow(id);
    }
    if (button.dataset.action === 'delete') {
      await deleteRow(id);
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-wrap')) {
      settingsMenu.classList.add('hidden');
    }
  });

  showLoggedOutView();
})();
