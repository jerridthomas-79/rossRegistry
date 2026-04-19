let supabase = null;

const loginView = document.getElementById('loginView');
const inventoryView = document.getElementById('inventoryView');
const loginForm = document.getElementById('loginForm');
const loginPasscode = document.getElementById('loginPasscode');
const tableBody = document.getElementById('inventoryTableBody');
const addBtn = document.getElementById('openAddModalButton');
const modal = document.getElementById('gunModal');
const gunForm = document.getElementById('gunForm');

let editId = null;

function getPasscode(){
  return localStorage.getItem('passcode') || APP_CONFIG.DEFAULT_PASSCODE;
}

function initSupabase(){
  try {
    supabase = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
  } catch(e){
    console.error('Supabase init failed', e);
  }
}

loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(loginPasscode.value === getPasscode()){
    loginView.classList.remove('active');
    inventoryView.classList.add('active');
    initSupabase();
    loadData();
  } else {
    alert('Wrong passcode');
  }
});

addBtn.addEventListener('click', ()=> modal.classList.remove('hidden'));
document.getElementById('closeGunModalButton').onclick = ()=> modal.classList.add('hidden');

gunForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = {
    make: document.getElementById('make').value,
    model: document.getElementById('model').value,
    serial_number: document.getElementById('serialNumber').value,
    year: document.getElementById('year').value,
    caliber: document.getElementById('caliber').value,
    purchase_price: document.getElementById('purchasePrice').value,
    description: document.getElementById('description').value,
    condition: document.getElementById('condition').value
  };

  if(!supabase) return alert('Database not connected');

  if(editId){
    await supabase.from('inventory_items').update(data).eq('id', editId);
  } else {
    await supabase.from('inventory_items').insert([data]);
  }

  modal.classList.add('hidden');
  editId = null;
  gunForm.reset();
  loadData();
});

async function seedData(){
  const { data } = await supabase.from('inventory_items').select('*');
  if(data.length === 0){
    await supabase.from('inventory_items').insert([
      { make:'Glock', model:'19', serial_number:'G19-001', year:'2022', caliber:'9mm', purchase_price:550, description:'Compact reliable pistol', condition:'Excellent' },
      { make:'Sig Sauer', model:'P320', serial_number:'SIG-320A', year:'2021', caliber:'9mm', purchase_price:600, description:'Modular striker-fired handgun', condition:'Very Good' },
      { make:'Smith & Wesson', model:'M&P Shield', serial_number:'SW-SHLD', year:'2020', caliber:'9mm', purchase_price:450, description:'Slim carry pistol', condition:'Good' }
    ]);
  }
}

async function loadData(){
  if(!supabase) return;
  await seedData();
  const { data } = await supabase.from('inventory_items').select('*').order('id', { ascending: false });
  tableBody.innerHTML = '';

  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.make||''}</td>
      <td>${row.model||''}</td>
      <td>${row.serial_number||''}</td>
      <td>${row.year||''}</td>
      <td>${row.caliber||''}</td>
      <td>${row.purchase_price||''}</td>
      <td>${row.description||''}</td>
      <td>${row.condition||''}</td>
      <td>
        <button onclick="editRow(${row.id})">✏️</button>
        <button onclick="deleteRow(${row.id})">🗑️</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

window.editRow = async (id)=>{
  const { data } = await supabase.from('inventory_items').select('*').eq('id', id).single();
  editId = id;
  document.getElementById('make').value = data.make||'';
  document.getElementById('model').value = data.model||'';
  document.getElementById('serialNumber').value = data.serial_number||'';
  document.getElementById('year').value = data.year||'';
  document.getElementById('caliber').value = data.caliber||'';
  document.getElementById('purchasePrice').value = data.purchase_price||'';
  document.getElementById('description').value = data.description||'';
  document.getElementById('condition').value = data.condition||'';
  modal.classList.remove('hidden');
};

window.deleteRow = async (id)=>{
  if(confirm('Are you sure?')){
    await supabase.from('inventory_items').delete().eq('id', id);
    loadData();
  }
};
