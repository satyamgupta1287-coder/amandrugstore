// renderer.js — reads #stockData JSON and renders the table, filter UI, and basic search/chips behavior
(function(){
  'use strict';
  function escapeHtml(s){
    return String(s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function parseStockData(){
    const el = document.getElementById('stockData');
    if(!el) return [];
    const raw = el.textContent || el.innerText || '';
    try{
      return JSON.parse(raw);
    }catch(err){
      console.error('stockData JSON parse failed:', err);
      // attempt a safe heuristic: replace unescaped backslash-quote sequences and try again
      try{
        const fixed = raw.replace(/\\"/g,'"').replace(/\"/g,'"');
        return JSON.parse(fixed);
      }catch(err2){
        console.error('Second parse attempt failed:', err2);
        return [];
      }
    }
  }

  function formatQty(v){
    if(v === null || v === undefined || v === '') return '';
    if(typeof v === 'number') return v % 1 === 0 ? String(v) : String(v);
    return String(v);
  }

  function getCompanyFromRow(row){
    // sample data shows company at index 3, fallback to 2
    return row[3] || row[2] || '';
  }

  function renderRows(data, options){
    const tbody = document.getElementById('tbody');
    const empty = document.getElementById('emptyState');
    const countEl = document.getElementById('resultsCount');
    const totalStat = document.getElementById('totalStat');
    if(!tbody || !countEl) return;

    const q = (options.query || '').trim().toLowerCase();
    const company = options.company || '';
    const stockFilter = options.stock || 'all';

    let filtered = data.filter(row => {
      const product = String(row[0] || '').toLowerCase();
      const comp = String(row[1] || '').toLowerCase();
      const companyName = String(getCompanyFromRow(row) || '').toLowerCase();

      if(company && companyName !== company) return false;
      if(q){
        if(product.indexOf(q) === -1 && comp.indexOf(q) === -1 && companyName.indexOf(q) === -1) return false;
      }

      // determine qty value — assume last numeric-ish value in row
      const possible = row.slice().reverse();
      let qty = '';
      for(let i=0;i<possible.length;i++){
        const v = possible[i];
        if(typeof v === 'number' || /^-?\d+(?:\.\d+)?$/.test(String(v))) { qty = Number(v); break; }
      }
      if(stockFilter === 'in' && !(qty > 0)) return false;
      if(stockFilter === 'zero' && !(qty === 0)) return false;
      if(stockFilter === 'neg' && !(qty < 0)) return false;
      return true;
    });

    // pagination / load-more support
    const limit = options.limit || 100;
    const showMore = filtered.length > limit;
    const visible = filtered.slice(0, limit);

    tbody.innerHTML = visible.map(row => {
      const product = escapeHtml(row[0] || '');
      const composition = escapeHtml(row[1] || '');
      const company = escapeHtml(getCompanyFromRow(row) || '');
      const batch = escapeHtml(row[4] || '');
      const rate = escapeHtml(row[5] || '');
      const expiry = escapeHtml(row[6] || '');
      // find last numeric-ish as qty
      let qtyVal = '';
      for(let i=row.length-1;i>=0;i--){
        if(typeof row[i] === 'number' || /^-?\d+(?:\.\d+)?$/.test(String(row[i]))){ qtyVal = row[i]; break; }
      }
      const qty = formatQty(qtyVal);
      // stock dot class
      let dotClass = 'dot-zero';
      const qn = Number(qtyVal);
      if(!isNaN(qn)){
        if(qn > 0) dotClass = 'dot-in';
        else if(qn < 0) dotClass = 'dot-neg';
        else dotClass = 'dot-zero';
      }

      return `
        <tr>
          <td>
            <div class="pname">${product}<span class="pack"></span></div>
          </td>
          <td class="comp">${composition}</td>
          <td>${company}</td>
          <td>${batch}</td>
          <td>${rate}</td>
          <td>${expiry}</td>
          <td class="qty-cell"><span class="stock-dot ${dotClass}"></span>${escapeHtml(String(qty))}</td>
        </tr>
      `.trim();
    }).join('\n');

    if(filtered.length === 0){
      empty && (empty.style.display = 'block');
    }else{
      empty && (empty.style.display = 'none');
    }

    countEl.innerHTML = `<b>${filtered.length}</b> products`;
    totalStat && (totalStat.textContent = `${data.length} products indexed`);

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if(loadMoreBtn){
      if(showMore){
        loadMoreBtn.style.display = 'inline-block';
      }else{
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function uniqueCompanies(data){
    const s = new Set();
    data.forEach(r => { const c = (getCompanyFromRow(r)||'').trim(); if(c) s.add(c); });
    return Array.from(s).sort();
  }

  document.addEventListener('DOMContentLoaded', function(){
    const data = parseStockData();
    const companyFilter = document.getElementById('companyFilter');
    const searchInput = document.getElementById('searchInput');
    const chips = Array.from(document.querySelectorAll('.chip')) || [];
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    let options = { query:'', company:'', stock:'all', limit:100 };

    // populate companies
    if(companyFilter){
      const companies = uniqueCompanies(data);
      companies.forEach(c => {
        const opt = document.createElement('option'); opt.value = c; opt.textContent = c; companyFilter.appendChild(opt);
      });
      companyFilter.addEventListener('change', ()=>{
        options.company = companyFilter.value;
        renderRows(data, options);
      });
    }

    if(searchInput){
      let t; searchInput.addEventListener('input', ()=>{
        clearTimeout(t);
        t = setTimeout(()=>{
          options.query = searchInput.value;
          renderRows(data, options);
        }, 180);
      });
    }

    chips.forEach(ch => {
      ch.addEventListener('click', ()=>{
        chips.forEach(x=>x.classList.remove('active'));
        ch.classList.add('active');
        options.stock = ch.dataset.stock || 'all';
        renderRows(data, options);
      });
    });

    if(loadMoreBtn){
      loadMoreBtn.addEventListener('click', ()=>{
        // show all
        options.limit = Infinity;
        renderRows(data, options);
      });
    }

    // initial render
    renderRows(data, options);
  });

})();
