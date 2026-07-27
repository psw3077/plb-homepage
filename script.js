const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
const progress=document.getElementById('scrollProgress');

menuToggle.addEventListener('click',()=>mainNav.classList.toggle('open'));
mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mainNav.classList.remove('open')));

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
  const percent=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;
  progress.style.width=percent+'%';
});
