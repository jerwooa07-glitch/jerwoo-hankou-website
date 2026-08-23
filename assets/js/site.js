window.JERWOO={lineUrl:"https://line.me/R/ti/p/@yrh5443u"};document.addEventListener("DOMContentLoaded",()=>document.querySelectorAll("[data-line]").forEach(a=>a.href=window.JERWOO.lineUrl));
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if(btn && menu){
    btn.addEventListener('click', function(){
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', function(){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }));
  }
});
