const site=document.querySelector('.site');
try{site.classList.toggle('light',localStorage.getItem('theme')==='light')}catch{}
document.querySelector('[aria-label="Toggle color theme"]')?.addEventListener('click',()=>{site.classList.toggle('light');try{localStorage.setItem('theme',site.classList.contains('light')?'light':'dark')}catch{}});
const entries=[...document.querySelectorAll('.entry')];
if(entries.length){
 const empty=document.createElement('div');empty.className='empty';empty.innerHTML='<h3>No matching writeups</h3><p>Try another technique or select All.</p><button>Clear filters</button>';entries.at(-1).after(empty);
 let filter='All';const input=document.querySelector('input');const count=document.querySelector('.archivefoot');
 function update(){let visibleCount=0;for(const entry of entries){const text=entry.textContent.toLowerCase();const matchesQuery=text.includes(input.value.trim().toLowerCase());const matchesFilter=filter==='All'||(filter==='Linux'||filter==='Windows'?entry.dataset.os===filter:text.includes(filter.toLowerCase()));const visible=matchesQuery&&matchesFilter;entry.hidden=!visible;entry.style.display=visible?'':'none';visibleCount+=Number(visible)}empty.hidden=visibleCount>0;if(count)count.textContent=visibleCount+' of '+entries.length+' entries · Retired-machine reports with documented attack paths.'}
 document.querySelectorAll('.filters button').forEach(button=>button.addEventListener('click',()=>{filter=button.textContent;document.querySelectorAll('.filters button').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});update()}));input.addEventListener('input',update);empty.querySelector('button').addEventListener('click',()=>{input.value='';document.querySelector('.filters button').click()});update();
}
