const STORAGE_KEYS={products:'plb_admin_products',documents:'plb_admin_documents',inquiries:'plb_admin_inquiries'};
const defaults={
  products:[
    {id:crypto.randomUUID(),name:'산업용 페인트',maker:'KCC',category:'산업용 도료',pack:'상담',description:'금속, 기계, 설비 및 산업제품용 전문 도료',createdAt:new Date().toISOString()},
    {id:crypto.randomUUID(),name:'분체도료',maker:'삼화페인트',category:'분체도료',pack:'20kg',description:'내구성과 작업 효율을 고려한 용도별 분체도료',createdAt:new Date().toISOString()}
  ],
  documents:[
    {id:crypto.randomUUID(),title:'산업용 도료 제품자료',maker:'PLB',type:'카탈로그',url:'',createdAt:new Date().toISOString()}
  ],
  inquiries:[]
};

function load(key){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEYS[key]));
    if(Array.isArray(saved)) return saved;
  }catch(e){console.warn('저장 데이터 읽기 실패',e)}
  localStorage.setItem(STORAGE_KEYS[key],JSON.stringify(defaults[key]));
  return [...defaults[key]];
}
function save(key,value){localStorage.setItem(STORAGE_KEYS[key],JSON.stringify(value));}

let products=load('products');
let documents=load('documents');
let inquiries=load('inquiries');

const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function updateStats(){
  $('#productCount').textContent=products.length;
  $('#documentCount').textContent=documents.length;
  $('#inquiryCount').textContent=inquiries.filter(item=>item.status!=='완료').length;
}

function renderProducts(){
  const target=$('#productRows');
  target.innerHTML=products.length?products.map(item=>`<tr>
    <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></td>
    <td>${escapeHtml(item.maker)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.pack)}</td>
    <td><button class="danger mini" data-delete-product="${item.id}">삭제</button></td>
  </tr>`).join(''):'<tr><td colspan="5" class="empty">등록된 제품이 없습니다.</td></tr>';
}

function renderDocuments(){
  const target=$('#documentRows');
  target.innerHTML=documents.length?documents.map(item=>`<tr>
    <td><strong>${escapeHtml(item.title)}</strong></td><td>${escapeHtml(item.maker)}</td><td>${escapeHtml(item.type)}</td>
    <td>${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">열기</a>`:'미등록'}</td>
    <td><button class="danger mini" data-delete-document="${item.id}">삭제</button></td>
  </tr>`).join(''):'<tr><td colspan="5" class="empty">등록된 자료가 없습니다.</td></tr>';
}

function renderInquiries(){
  const target=$('#inquiryRows');
  target.innerHTML=inquiries.length?inquiries.map(item=>`<tr>
    <td>${escapeHtml(item.company||'-')}</td><td>${escapeHtml(item.name||'-')}</td><td>${escapeHtml(item.phone||'-')}</td>
    <td>${escapeHtml(item.product||'-')}</td><td><select data-status="${item.id}"><option ${item.status==='접수'?'selected':''}>접수</option><option ${item.status==='처리중'?'selected':''}>처리중</option><option ${item.status==='완료'?'selected':''}>완료</option></select></td>
  </tr>`).join(''):'<tr><td colspan="5" class="empty">저장된 문의가 없습니다. 공개 홈페이지 문의는 배포 서비스의 Forms 또는 Supabase 연결 후 자동 수집됩니다.</td></tr>';
}

function renderAll(){updateStats();renderProducts();renderDocuments();renderInquiries();}

$('#productForm').addEventListener('submit',event=>{
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  products.unshift({id:crypto.randomUUID(),name:form.get('name').trim(),maker:form.get('maker').trim(),category:form.get('category'),pack:form.get('pack').trim(),description:form.get('description').trim(),createdAt:new Date().toISOString()});
  save('products',products);event.currentTarget.reset();renderAll();showToast('제품이 등록되었습니다.');
});

$('#documentForm').addEventListener('submit',event=>{
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  documents.unshift({id:crypto.randomUUID(),title:form.get('title').trim(),maker:form.get('maker').trim(),type:form.get('type'),url:form.get('url').trim(),createdAt:new Date().toISOString()});
  save('documents',documents);event.currentTarget.reset();renderAll();showToast('자료가 등록되었습니다.');
});

document.addEventListener('click',event=>{
  const productId=event.target.dataset.deleteProduct;
  const documentId=event.target.dataset.deleteDocument;
  if(productId){products=products.filter(item=>item.id!==productId);save('products',products);renderAll();showToast('제품을 삭제했습니다.');}
  if(documentId){documents=documents.filter(item=>item.id!==documentId);save('documents',documents);renderAll();showToast('자료를 삭제했습니다.');}
});

document.addEventListener('change',event=>{
  const id=event.target.dataset.status;
  if(!id)return;
  inquiries=inquiries.map(item=>item.id===id?{...item,status:event.target.value}:item);
  save('inquiries',inquiries);renderAll();showToast('문의 상태를 변경했습니다.');
});

$('#exportButton').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({products,documents,inquiries},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`plb-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
});

function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);}
renderAll();