const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
const progress=document.getElementById('scrollProgress');

menuToggle?.addEventListener('click',()=>mainNav?.classList.toggle('open'));
mainNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mainNav.classList.remove('open')));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});

document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

window.addEventListener('scroll',()=>{
  const h=document.documentElement;
  const max=h.scrollHeight-h.clientHeight;
  const percent=max>0?(h.scrollTop/max)*100:0;
  if(progress) progress.style.width=percent+'%';
});

// 실제 채널 주소가 등록되기 전에는 깨진 외부 페이지 대신 문의 영역으로 이동합니다.
document.querySelectorAll('a[href="CLIP_URL"],a[href="KAKAO_URL"],a[href="YOUTUBE_URL"]').forEach(link=>{
  link.setAttribute('href','#contact');
  link.removeAttribute('target');
  link.addEventListener('click',()=>mainNav?.classList.remove('open'));
});

// 문의 양식 전송 중 중복 클릭을 방지합니다.
const contactForm=document.querySelector('.contact-form');
contactForm?.addEventListener('submit',()=>{
  const button=contactForm.querySelector('button[type="submit"]');
  if(button){
    button.disabled=true;
    button.textContent='문의 전송 중...';
  }
});
