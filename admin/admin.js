const STORAGE_KEYS={products:'plb_admin_products',documents:'plb_admin_documents',inquiries:'plb_admin_inquiries'};
const defaults={
  products:[
    {id:crypto.randomUUID(),name:'산업용 페인트',maker:'KCC',category:'산업용 도료',pack:'상담',description:'금속, 기계, 설비 및 산업제품용 전문 도료',createdAt:new Date().toISOString()},
    {id:crypto.randomUUID(),name:'분체도료',maker:'삼화페인트',category:'분체도료',pack:'20kg',description:'내구성과 작업 효율을 고려한 용도별 분체도료',createdAt:new Date().toISOString()}
  ],
  documents:[{id:crypto.randomUUID(),title:'산업용 도료 제품자료',maker:'PLB',type:'카탈로그',url:'',createdAt:new Date().toISOString()}],
  inquiries:[]
};
function load(key){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEYS[key]));if(Array.isArray(saved))return saved;}catch(e){console.warn('저장 데이터 읽기 실패',e)}localStorage.setItem(STORAGE_KEYS[key],JSON.stringify(defaults[key]));return[...defaults[key]];}
function save(key,value){localStorage.setItem(STORAGE_KEYS[key],JSON.stringify(value));}
let products=load('products');let documents=load('documents');let inquiries=load('inquiries');
const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const state={productQuery:'',documentQuery:'',inquiryQuery:'',inquiryStatus:''};

function injectToolbar(){
  const main=document.querySelector('main');if(!main)return;
  const bar=document.createElement('section');bar.className='section admin-tools';
  bar.innerHTML=`<h2>빠른 검색·백업 복원</h2><div class="admin-tool-grid"><input id="productSearch" placeholder="제품 검색"><input id="documentSearch" placeholder="자료 검색"><input id="inquirySearch" placeholder="문의 검색"><select id="inquiryStatusFilter"><option value="">문의 전체 상태</option><option>접수</option><option>처리중</option><option>완료</option></select><label class="import-label">백업 불러오기<input id="importFile" type="file" accept="application/json"></label></div>`;
  const firstSection=main.querySelector('.section');firstSection?.before(bar);
  $('#productSearch')?.addEventListener('input',e=>{state.productQuery=e.target.value.toLowerCase();renderProducts();});
  $('#documentSearch')?.addEventListener('input',e=>{state.documentQuery=e.target.value.toLowerCase();renderDocuments();});
  $('#inquirySearch')?.addEventListener('input',e=>{state.inquiryQuery=e.target.value.toLowerCase();renderInquiries();});
  $('#inquiryStatusFilter')?.addEventListener('change',e=>{state.inquiryStatus=e.target.value;renderInquiries();});
  $('#importFile')?.addEventListener('change',importBackup);
}

function updateStats(){$('#productCount').textContent=products.length;$('#documentCount').textContent=documents.length;$('#inquiryCount').textContent=inquiries.filter(item=>item.status!=='완료').length;}
function renderProducts(){
  const target=$('#productRows');const filtered=products.filter(item=>[item.name,item.maker,item.category,item.pack,item.description].join(' ').toLowerCase().includes(state.productQuery));
  target.innerHTML=filtered.length?filtered.map(item=>`<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></td><td>${escapeHtml(item.maker)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.pack)}</td><td><button class="danger mini" data-delete-product="${item.id}">삭제</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">검색 조건에 맞는 제품이 없습니다.</td></tr>';
}
function renderDocuments(){
  const target=$('#documentRows');const filtered=documents.filter(item=>[item.title,item.maker,item.type].join(' ').toLowerCase().includes(state.documentQuery));
  target.innerHTML=filtered.length?filtered.map(item=>`<tr><td><strong>${escapeHtml(item.title)}</strong></td><td>${escapeHtml(item.maker)}</td><td>${escapeHtml(item.type)}</td><td>${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">열기</a>`:'미등록'}</td><td><button class="danger mini" data-delete-document="${item.id}">삭제</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">검색 조건에 맞는 자료가 없습니다.</td></tr>';
}
function renderInquiries(){
  const target=$('#inquiryRows');const filtered=inquiries.filter(item=>{const match=[item.company,item.name,item.phone,item.product,item.message].join(' ').toLowerCase().includes(state.inquiryQuery);return match&&(!state.inquiryStatus||item.status===state.inquiryStatus);});
  target.innerHTML=filtered.length?filtered.map(item=>`<tr><td><strong>${escapeHtml(item.company||'-')}</strong><small>${escapeHtml(item.message||'')}</small></td><td>${escapeHtml(item.name||'-')}</td><td><a href="tel:${escapeHtml(item.phone||'')}">${escapeHtml(item.phone||'-')}</a></td><td>${escapeHtml(item.product||'-')}</td><td><select data-status="${item.id}"><option ${item.status==='접수'?'selected':''}>접수</option><option ${item.status==='처리중'?'selected':''}>처리중</option><option ${item.status==='완료'?'selected':''}>완료</option></select><button class="danger mini" data-delete-inquiry="${item.id}">삭제</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">조건에 맞는 문의가 없습니다.</td></tr>';
}
function renderAll(){updateStats();renderProducts();renderDocuments();renderInquiries();}

$('#productForm')?.addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.currentTarget);products.unshift({id:crypto.randomUUID(),name:form.get('name').trim(),maker:form.get('maker').trim(),category:form.get('category'),pack:form.get('pack').trim(),description:form.get('description').trim(),createdAt:new Date().toISOString()});save('products',products);event.currentTarget.reset();renderAll();showToast('제품이 등록되었습니다.');});
$('#documentForm')?.addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.currentTarget);documents.unshift({id:crypto.randomUUID(),title:form.get('title').trim(),maker:form.get('maker').trim(),type:form.get('type'),url:form.get('url').trim(),createdAt:new Date().toISOString()});save('documents',documents);event.currentTarget.reset();renderAll();showToast('자료가 등록되었습니다.');});
document.addEventListener('click',event=>{const productId=event.target.dataset.deleteProduct;const documentId=event.target.dataset.deleteDocument;const inquiryId=event.target.dataset.deleteInquiry;if(productId&&confirm('이 제품을 삭제할까요?')){products=products.filter(item=>item.id!==productId);save('products',products);renderAll();showToast('제품을 삭제했습니다.');}if(documentId&&confirm('이 자료를 삭제할까요?')){documents=documents.filter(item=>item.id!==documentId);save('documents',documents);renderAll();showToast('자료를 삭제했습니다.');}if(inquiryId&&confirm('이 문의를 삭제할까요?')){inquiries=inquiries.filter(item=>item.id!==inquiryId);save('inquiries',inquiries);renderAll();showToast('문의를 삭제했습니다.');}});
document.addEventListener('change',event=>{const id=event.target.dataset.status;if(!id)return;inquiries=inquiries.map(item=>item.id===id?{...item,status:event.target.value}:item);save('inquiries',inquiries);renderAll();showToast('문의 상태를 변경했습니다.');});
$('#exportButton')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),products,documents,inquiries},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`plb-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);});
async function importBackup(event){
  const file=event.target.files?.[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!Array.isArray(data.products)||!Array.isArray(data.documents)||!Array.isArray(data.inquiries))throw new Error('형식 오류');if(!confirm('현재 데이터를 백업 파일 내용으로 교체할까요?'))return;products=data.products;documents=data.documents;inquiries=data.inquiries;save('products',products);save('documents',documents);save('inquiries',inquiries);renderAll();showToast('백업을 복원했습니다.');}catch{alert('올바른 PLB 백업 JSON 파일이 아닙니다.');}finally{event.target.value='';}
}
function showToast(message){const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);}
const style=document.createElement('style');style.textContent=`.admin-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.admin-tool-grid input,.admin-tool-grid select,.import-label{width:100%;padding:12px;border-radius:9px;border:1px solid var(--line);background:#0b2131;color:var(--text);font:inherit}.import-label{display:flex;align-items:center;justify-content:center;cursor:pointer}.import-label input{display:none}td small{display:block;color:var(--muted);margin-top:5px;max-width:440px}td a{color:var(--text)}td select{margin-right:8px}@media(max-width:900px){.admin-tool-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.admin-tool-grid{grid-template-columns:1fr}}`;document.head.append(style);
injectToolbar();renderAll();
