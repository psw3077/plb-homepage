const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
const progress=document.getElementById('scrollProgress');
const STORAGE_KEYS={products:'plb_admin_products',documents:'plb_admin_documents',inquiries:'plb_admin_inquiries'};

menuToggle?.addEventListener('click',()=>mainNav?.classList.toggle('open'));
mainNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mainNav.classList.remove('open')));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

window.addEventListener('scroll',()=>{
  const h=document.documentElement;
  const max=h.scrollHeight-h.clientHeight;
  const percent=max>0?(h.scrollTop/max)*100:0;
  if(progress) progress.style.width=percent+'%';
});

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const readList=key=>{try{const value=JSON.parse(localStorage.getItem(key));return Array.isArray(value)?value:[]}catch{return[]}};

// 실제 채널 주소가 등록되기 전에는 문의 영역으로 이동합니다.
document.querySelectorAll('a[href="CLIP_URL"],a[href="KAKAO_URL"],a[href="YOUTUBE_URL"]').forEach(link=>{
  link.setAttribute('href','#contact');link.removeAttribute('target');
  link.addEventListener('click',()=>mainNav?.classList.remove('open'));
});

// 관리자에서 등록한 제품을 공개 홈페이지에 표시합니다.
function setupManagedProducts(){
  const section=document.querySelector('#products .container');
  const grid=document.querySelector('#products .cards');
  if(!section||!grid)return;
  const products=readList(STORAGE_KEYS.products);
  if(!products.length)return;

  const controls=document.createElement('div');
  controls.className='plb-product-controls';
  controls.innerHTML='<input id="plbProductSearch" type="search" placeholder="제품명·제조사·용도 검색" aria-label="제품 검색"><select id="plbMakerFilter"><option value="">전체 제조사</option></select>';
  grid.before(controls);
  const makers=[...new Set(products.map(item=>item.maker).filter(Boolean))].sort();
  controls.querySelector('select').insertAdjacentHTML('beforeend',makers.map(maker=>`<option>${escapeHtml(maker)}</option>`).join(''));

  const render=()=>{
    const keyword=controls.querySelector('input').value.trim().toLowerCase();
    const maker=controls.querySelector('select').value;
    const filtered=products.filter(item=>{
      const haystack=[item.name,item.maker,item.category,item.pack,item.description].join(' ').toLowerCase();
      return (!keyword||haystack.includes(keyword))&&(!maker||item.maker===maker);
    });
    grid.innerHTML=filtered.length?filtered.map(item=>`<article class="product-card reveal visible"><div>🎨</div><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.maker||'PLB')}</strong> · ${escapeHtml(item.category||'산업용 도료')}</p><p>${escapeHtml(item.description||'제품 상세 내용은 전화로 상담해 주세요.')}</p><small>포장 단위: ${escapeHtml(item.pack||'상담')}</small><a class="managed-inquiry-link" href="#contact" data-product-name="${escapeHtml(item.name)}">이 제품 문의하기 →</a></article>`).join(''):'<p class="plb-empty">검색 조건에 맞는 제품이 없습니다.</p>';
  };
  controls.addEventListener('input',render);render();
  section.addEventListener('click',event=>{
    const link=event.target.closest('[data-product-name]');
    if(!link)return;
    const select=document.querySelector('.contact-form select[name="product"]');
    if(select){const name=link.dataset.productName;select.insertAdjacentHTML('beforeend',`<option selected>${escapeHtml(name)}</option>`);}
  });
}

// 관리자에서 등록한 MSDS·TDS·카탈로그 자료를 홈페이지에 표시합니다.
function setupManagedDocuments(){
  const section=document.querySelector('#makers .container');
  if(!section)return;
  const documents=readList(STORAGE_KEYS.documents);
  if(!documents.length)return;
  const block=document.createElement('div');
  block.className='plb-document-library reveal visible';
  block.innerHTML=`<div class="plb-library-head"><div><p class="eyebrow">PLB DOCUMENTS</p><h3>등록 자료실</h3></div><input id="plbDocumentSearch" type="search" placeholder="MSDS·TDS·카탈로그 검색"></div><div id="plbDocumentRows"></div>`;
  section.append(block);
  const input=block.querySelector('input');
  const rows=block.querySelector('#plbDocumentRows');
  const render=()=>{
    const keyword=input.value.trim().toLowerCase();
    const filtered=documents.filter(item=>[item.title,item.maker,item.type].join(' ').toLowerCase().includes(keyword));
    rows.innerHTML=filtered.length?filtered.map(item=>`<article class="plb-document-row"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.maker||'PLB')} · ${escapeHtml(item.type||'자료')}</span></div>${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">자료 열기</a>`:'<em>링크 준비 중</em>'}</article>`).join(''):'<p class="plb-empty">검색 조건에 맞는 자료가 없습니다.</p>';
  };
  input.addEventListener('input',render);render();
}

// 문의 내용을 브라우저 관리자함에 저장하고 이메일 작성 화면도 제공합니다.
const contactForm=document.querySelector('.contact-form');
contactForm?.addEventListener('submit',event=>{
  event.preventDefault();
  const button=contactForm.querySelector('button[type="submit"]');
  if(button){button.disabled=true;button.textContent='문의 저장 중...';}
  const form=new FormData(contactForm);
  const inquiries=readList(STORAGE_KEYS.inquiries);
  const inquiry={
    id:crypto.randomUUID(),company:String(form.get('company')||'').trim(),name:String(form.get('name')||'').trim(),phone:String(form.get('phone')||'').trim(),product:String(form.get('product')||'').trim(),message:String(form.get('message')||'').trim(),status:'접수',createdAt:new Date().toISOString()
  };
  inquiries.unshift(inquiry);localStorage.setItem(STORAGE_KEYS.inquiries,JSON.stringify(inquiries));
  const subject=encodeURIComponent(`[PLB 홈페이지 문의] ${inquiry.company||inquiry.name}`);
  const body=encodeURIComponent(`회사명: ${inquiry.company}\n담당자: ${inquiry.name}\n연락처: ${inquiry.phone}\n문의제품: ${inquiry.product}\n\n문의내용:\n${inquiry.message}`);
  const result=document.createElement('div');result.className='plb-form-result';result.innerHTML=`문의가 저장되었습니다. 빠른 상담은 <a href="tel:0553136778">055-313-6778</a> 또는 <a href="mailto:plb6498@naver.com?subject=${subject}&body=${body}">이메일 보내기</a>를 이용해 주세요.`;
  contactForm.append(result);contactForm.reset();
  if(button){button.disabled=false;button.textContent='문의 보내기';}
});

const dynamicStyle=document.createElement('style');
dynamicStyle.textContent=`
.plb-product-controls{display:grid;grid-template-columns:2fr 1fr;gap:12px;margin:0 0 24px}.plb-product-controls input,.plb-product-controls select,.plb-library-head input{width:100%;padding:14px 16px;border:1px solid #cbd5df;border-radius:10px;background:#fff;font:inherit}.managed-inquiry-link{display:inline-block;margin-top:15px;font-weight:700;text-decoration:none}.product-card small{display:block;margin-top:10px;color:#617180}.plb-document-library{margin-top:38px;padding:24px;background:#fff;border-radius:18px;color:#10283a}.plb-library-head{display:grid;grid-template-columns:1fr minmax(220px,360px);align-items:end;gap:20px;margin-bottom:16px}.plb-library-head h3{font-size:26px;margin:3px 0}.plb-document-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:15px 4px;border-top:1px solid #e2e8ee}.plb-document-row div{display:grid;gap:4px}.plb-document-row span,.plb-document-row em{color:#687986;font-size:14px}.plb-document-row a{font-weight:700;text-decoration:none}.plb-empty{grid-column:1/-1;padding:22px;text-align:center}.plb-form-result{grid-column:1/-1;padding:14px 16px;border-radius:10px;background:#e8f5ec;color:#174d29;line-height:1.6}.plb-form-result a{font-weight:700;color:inherit}@media(max-width:700px){.plb-product-controls,.plb-library-head{grid-template-columns:1fr}.plb-document-row{align-items:flex-start;flex-direction:column}}
`;
document.head.append(dynamicStyle);
setupManagedProducts();setupManagedDocuments();
