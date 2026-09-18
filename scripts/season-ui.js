(() => {
 const toggle=document.querySelector('.menu-toggle'), nav=document.querySelector('.main-nav');
 if(toggle&&nav){
  nav.id=nav.id||'main-navigation';toggle.setAttribute('aria-controls',nav.id);
  const setOpen=open=>{nav.classList.toggle('active',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');};
  setOpen(false);toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setOpen(false);toggle.focus();}});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
 }
 const tabs=[...document.querySelectorAll('[role="tab"]')];
 const selectTab=tab=>{for(const button of tabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;document.getElementById(button.getAttribute('aria-controls')).hidden=!selected;}};
 for(const tab of tabs){tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let index=tabs.indexOf(tab);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();selectTab(tabs[index]);tabs[index].focus();});}
 const search=document.getElementById('rosterSearch'),team=document.getElementById('teamFilter'),status=document.getElementById('statusFilter');
 if(!search||!team||!status)return;
 const cards=[...document.querySelectorAll('.roster-card')];
 function filter(){let count=0;const q=search.value.trim().toLowerCase();for(const card of cards){const visible=card.dataset.name.includes(q)&&(team.value==='all'||card.dataset.team===team.value)&&(status.value==='all'||card.dataset.status===status.value);card.hidden=!visible;if(visible)count++;}document.getElementById('rosterCount').textContent=`${count} players listed`;document.getElementById('rosterEmpty').hidden=count!==0;}
 const requested=new URLSearchParams(location.search).get('team');if(requested&&[...team.options].some(o=>o.value===requested))team.value=requested;
 search.addEventListener('input',filter);team.addEventListener('change',filter);status.addEventListener('change',filter);filter();
})();
