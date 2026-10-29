/* ===== AICC 原型 · 应用逻辑 ===== */

const STORAGE_KEY = 'aicc_module_demo_v1';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getLibrary = () => state.library || MODULE_LIBRARY;
const getModule = (id) => getLibrary().find(m => m.id === id);
const typeLabel = (t) => t === 'prompt_tool' ? '提示词＋工具' : '提示词';

/* ---------- 状态 ---------- */
let state = {
  installed: [],       // { installId, moduleId, version, prompt, modified }
  promptHTML: null     // 主提示词（含模块引用块）
};
let currentDetailModuleId = null;
let currentEditInstallId = null;
let pendingInstallModuleId = null;
let currentRefNode = null;
let savedRange = null;
let moduleReturnToEditor = false; // 是否从智能体搭建页进入模块库

function defaultState() {
  return {
    installed: [
      { installId: 'ins_human', moduleId: 'mod_human', version: 'v1.0', prompt: getModule('mod_human').prompt, modified: false },
      { installId: 'ins_comfort', moduleId: 'mod_comfort', version: 'v1.1', prompt: getModule('mod_comfort').prompt, modified: false }
    ],
    promptHTML: null
  };
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
  } catch (e) { state = defaultState(); }
  if (!state.library) state.library = JSON.parse(JSON.stringify(MODULE_LIBRARY));
}
function resetDemo() { localStorage.removeItem(STORAGE_KEY); location.reload(); }

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- 导航 ---------- */
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  document.querySelector('.main-content').scrollTop = 0;
  const target = page === 'editor' ? 'page-editor' : page === 'modules' ? 'page-modules' : 'page-list';
  $(target).classList.add('active');
  document.querySelectorAll(`.sidebar-item[data-nav="${page === 'editor' ? 'list' : page}"]`)
    .forEach(s => s.classList.add('active'));
  if (page === 'modules') {
    $('moduleBackBtn').style.display = moduleReturnToEditor ? 'inline-block' : 'none';
    renderModuleLibrary();
  }
  if (page === 'editor') {
    moduleReturnToEditor = false;
    renderInstalledModules(); renderTools(); refreshRefBadges();
  }
}

// 打开模块库：fromEditor=true 时显示「返回智能体」入口
function openModuleLibrary(fromEditor) {
  moduleReturnToEditor = !!fromEditor;
  navigateTo('modules');
}
function backToEditor() {
  moduleReturnToEditor = false;
  navigateTo('editor');
}
function toggleSubmenu(el) {
  el.classList.toggle('expanded');
  const submenu = el.nextElementSibling;
  if (submenu && submenu.classList.contains('submenu')) submenu.classList.toggle('show');
}

/* ---------- 智能体卡片 ---------- */
function renderAgentCards() {
  $('agentCardGrid').innerHTML = AGENT_CARDS.map(c => `
    <div class="agent-card" onclick="navigateTo('editor')">
      <div class="card-header">
        <div class="card-avatar ${c.avatar}">${c.icon}</div>
        <div class="card-info">
          <div class="card-title">${esc(c.title)}</div>
          <div class="card-meta"><span class="card-badge ${c.badgeType}">${c.badge}</span><span>${esc(c.meta)}</span></div>
        </div>
      </div>
      <div class="card-desc">${esc(c.desc)}</div>
    </div>`).join('');
}

/* ---------- 模块库 ---------- */
let moduleTypeFilter = 'all';
function setModuleTypeFilter(el) {
  document.querySelectorAll('#page-modules .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  moduleTypeFilter = el.dataset.mtype;
  renderModuleLibrary();
}
function isInstalled(moduleId) { return state.installed.find(i => i.moduleId === moduleId); }

function renderModuleLibrary() {
  const kw = ($('moduleSearchInput').value || '').trim().toLowerCase();
  const list = getLibrary().filter(m => {
    if (moduleTypeFilter !== 'all' && m.type !== moduleTypeFilter) return false;
    if (kw && !(m.name + m.desc + m.maintainer).toLowerCase().includes(kw)) return false;
    return true;
  });
  $('moduleGrid').innerHTML = list.length ? list.map(m => {
    const inst = isInstalled(m.id);
    return `
    <div class="module-card">
      <div class="module-card-top">
        <span class="module-card-name">${esc(m.name)}</span>
        <span class="module-version-tag">${m.version}</span>
      </div>
      <div class="module-card-desc">${esc(m.desc)}</div>
      <div class="module-card-tools">${m.tools.length
        ? '⚒ 包含工具：' + m.tools.slice(0, 2).map(t => esc(t.name)).join('、') + (m.tools.length > 2 ? ` 等${m.tools.length}个` : '')
        : '📝 纯提示词模块，不包含工具'}</div>
      <div class="module-card-footer">
        <span class="module-installed-flag">${inst ? (inst.modified ? '✓ 已安装 · 已个性化' : '✓ 已安装 · 未修改') : ''}</span>
        <button class="btn-link" onclick="openModuleDetail('${m.id}')">查看详情 →</button>
      </div>
    </div>`;
  }).join('') : '<div class="module-empty">没有符合条件的模块</div>';
}

/* ---------- 公共模块详情抽屉 ---------- */
function openDrawer(name) { $(name + 'Mask').classList.add('open'); $(name + 'Drawer').classList.add('open'); }
function closeDrawer(name) { $(name + 'Mask').classList.remove('open'); $(name + 'Drawer').classList.remove('open'); }
function openModal(name) { $(name + 'Mask').classList.add('open'); }
function closeModal(name) { $(name + 'Mask').classList.remove('open'); }

function openModuleDetail(moduleId) {
  currentDetailModuleId = moduleId;
  const m = getModule(moduleId);
  const inst = isInstalled(moduleId);
  $('moduleDetailBody').innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">模块说明</div>
      <div class="detail-kv"><span class="k">模块名称</span><span class="v">${esc(m.name)}</span></div>
      <div class="detail-kv"><span class="k">功能说明</span><span class="v">${esc(m.desc)}</span></div>
      <div class="detail-kv"><span class="k">模块类型</span><span class="v"><span class="module-type-tag ${m.type}">${typeLabel(m.type)}</span></span></div>
      <div class="detail-kv"><span class="k">来源版本</span><span class="v">${esc(m.source)} · ${m.version}</span></div>
      <div class="detail-kv"><span class="k">维护者</span><span class="v">${esc(m.maintainer)}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">提示词内容</div>
      <div class="detail-notice">这是公共模板。添加到智能体后会创建独立版本，后续修改不会影响公共模块。</div>
      <div class="readonly-prompt">${esc(m.prompt)}</div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">包含的工具</div>
      ${m.tools.length ? m.tools.map(t => `
        <div class="detail-tool-item"><span class="t-icon">⚒</span>
          <div><div class="t-name">${esc(t.name)}</div><div class="t-desc">${esc(t.desc)}</div></div>
        </div>`).join('') : '<div style="font-size:13px;color:var(--text-tertiary)">此模块不包含工具。</div>'}
    </div>`;
  $('moduleDetailFooter').innerHTML = `
    <div style="display:flex;justify-content:space-between;width:100%;gap:10px">
      <div style="display:flex;gap:8px">
        <button class="btn-plain" onclick="openModuleForm('${m.id}')">编辑模块</button>
        <button class="btn-plain danger" onclick="deleteModule('${m.id}')">删除</button>
      </div>
      <div style="display:flex;gap:8px">${inst
        ? `<button class="btn-plain" onclick="closeDrawer('moduleDetail')">关闭</button>
           <button class="btn-primary" onclick="gotoInstalledModule('${inst.installId}')">查看已安装模块</button>`
        : `<button class="btn-plain" onclick="closeDrawer('moduleDetail')">取消</button>
           <button class="btn-primary" onclick="openInstallConfirm('${m.id}')">添加到当前智能体</button>`}
      </div>
    </div>`;
  openDrawer('moduleDetail');
}

function gotoInstalledModule(installId) {
  closeDrawer('moduleDetail');
  navigateTo('editor');
  setTimeout(() => {
    const card = document.querySelector(`.installed-card[data-install="${installId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 1700);
    }
  }, 100);
}

/* ---------- 安装确认 ---------- */
function openInstallConfirm(moduleId) {
  pendingInstallModuleId = moduleId;
  const m = getModule(moduleId);
  $('installConfirmTitle').textContent = `添加“${m.name}”？`;
  $('installConfirmBody').innerHTML = `
    <div style="margin-bottom:8px;color:var(--text-secondary)">将在当前智能体中：</div>
    <ul class="install-change-list">
      <li>创建一份独立的提示词版本</li>
      <li>生成模块变量「${esc(m.varName)}」</li>
      ${m.tools.map(t => {
        const exists = getInstalledTools().some(x => x.id === t.id);
        return `<li>添加工具：${esc(t.name)} <span class="${exists ? 'tool-state-reuse' : 'tool-state-new'}">${exists ? '（已存在，将直接复用）' : '（将新增）'}</span></li>`;
      }).join('')}
    </ul>`;
  openModal('installConfirm');
}

function confirmInstall() {
  const m = getModule(pendingInstallModuleId);
  if (!m) return;
  if (isInstalled(m.id)) { closeModal('installConfirm'); toast('该模块已安装，不会重复创建'); return; }
  const installId = 'ins_' + m.id + '_' + Date.now();
  state.installed.push({ installId, moduleId: m.id, version: m.version, prompt: m.prompt, modified: false });
  persist();
  closeModal('installConfirm');
  closeDrawer('moduleDetail');
  renderInstalledModules();
  renderTools();
  toast(`已添加“${m.name}”，可在已安装模块中插入或编辑`);
  gotoInstalledModule(installId);
}

/* ---------- 已安装模块 ---------- */
function renderInstalledModules() {
  $('installedCount').textContent = state.installed.length;
  $('installedModuleList').innerHTML = state.installed.length ? state.installed.map(i => {
    const m = getModule(i.moduleId);
    return `
    <div class="installed-card" data-install="${i.installId}">
      <div class="installed-card-top">
        <span class="installed-card-name">${esc(m.name)}</span>
        <span class="installed-status ${i.modified ? 'modified' : 'unmodified'}">${i.modified ? '已个性化' : '未修改'}</span>
        <div class="installed-card-ops">
          <button class="btn-link" onclick="insertModuleRef('${i.installId}')">插入</button>
          <button class="btn-link" onclick="openModuleEdit('${i.installId}')">编辑</button>
          <button class="btn-link" style="color:var(--text-tertiary)" onclick="removeModule('${i.installId}')">移除</button>
        </div>
      </div>
      <div class="installed-card-meta">
        <div><span class="meta-key">来源</span> 智能体模块库 ${i.version}</div>
        <div><span class="meta-key">工具</span> ${m.tools.length ? m.tools.map(t => esc(t.name)).join('、') : '无'}</div>
      </div>
    </div>`;
  }).join('') : '<div class="installed-empty">暂未安装模块，点击右上角「添加模块」从模块库选择。</div>';
}

function removeModule(installId) {
  const inst = state.installed.find(i => i.installId === installId);
  if (!inst) return;
  const m = getModule(inst.moduleId);
  if (!confirm(`移除模块“${m.name}”？\n主提示词中对该模块的引用将一并移除；仍被其他模块使用的工具会保留。`)) return;
  state.installed = state.installed.filter(i => i.installId !== installId);
  document.querySelectorAll(`.module-ref[data-install="${installId}"]`).forEach(n => n.remove());
  state.promptHTML = $('promptEditor').innerHTML;
  persist();
  renderInstalledModules();
  renderTools();
  toast(`已移除“${m.name}”，公共模块不受影响`);
}

/* ---------- 编辑当前智能体版本 ---------- */
function openModuleEdit(installId) {
  const inst = state.installed.find(i => i.installId === installId);
  if (!inst) return;
  currentEditInstallId = installId;
  const m = getModule(inst.moduleId);
  $('moduleEditTitle').textContent = `编辑“${m.name}”`;
  $('moduleEditBody').innerHTML = `
    <div class="detail-notice blue">当前修改只对本智能体生效，不会影响模块库中的公共内容。</div>
    <div class="detail-section">
      <div class="detail-kv"><span class="k">来源模块</span><span class="v">${esc(m.name)}</span></div>
      <div class="detail-kv"><span class="k">安装时版本</span><span class="v">智能体模块库 ${inst.version}</span></div>
      <div class="detail-kv"><span class="k">包含工具</span><span class="v">${m.tools.length ? m.tools.map(t => esc(t.name)).join('、') : '无'}（只读）</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">提示词正文</div>
      <textarea id="moduleEditTextarea" class="readonly-prompt" style="width:100%;min-height:280px;resize:vertical;outline:none;background:white">${esc(inst.prompt)}</textarea>
    </div>`;
  openDrawer('moduleEdit');
}

function saveModuleEdit() {
  const inst = state.installed.find(i => i.installId === currentEditInstallId);
  if (!inst) return;
  const newPrompt = $('moduleEditTextarea').value;
  inst.modified = newPrompt !== getModule(inst.moduleId).prompt;
  inst.prompt = newPrompt;
  persist();
  closeDrawer('moduleEdit');
  renderInstalledModules();
  refreshRefBadges();
  toast(inst.modified ? '已保存，模块状态更新为「已个性化」' : '已保存，内容与公共模板一致，状态为「未修改」');
}

function viewPublicTemplate(installId) {
  const inst = state.installed.find(i => i.installId === installId);
  if (inst) openModuleDetail(inst.moduleId);
}
function viewPublicTemplateFromEdit() {
  closeDrawer('moduleEdit');
  viewPublicTemplate(currentEditInstallId);
}

/* ---------- 主提示词：模块引用 ---------- */
function initPromptEditor() {
  const editor = $('promptEditor');
  editor.innerHTML = state.promptHTML ||
    '<div>你是儿童手表售后客服。</div><div><br></div><div>处理完成后向用户确认是否还有其他问题。</div>';
  editor.addEventListener('input', () => { state.promptHTML = editor.innerHTML; persist(); });
  editor.addEventListener('click', (e) => {
    const ref = e.target.closest('.module-ref');
    if (ref) openRefAction(ref);
  });
  // 记录光标位置，供“插入模块”使用
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel.rangeCount && editor.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
  });
}

function openModulePickerFromEditor() {
  openModuleLibrary(true);
  toast('选择公共模块，查看详情后点击「添加到当前智能体」；也可点击左上角「返回智能体」');
}

function openInsertModuleModal() {
  if (!state.installed.length) { toast('当前智能体还未安装模块，请先在「已安装模块」中添加'); return; }
  $('insertModuleList').innerHTML = state.installed.map(i => {
    const m = getModule(i.moduleId);
    return `<div class="insert-module-item" onclick="insertModuleRef('${i.installId}')">
      <span>🧩 ${esc(m.name)}</span>
      <span class="installed-status ${i.modified ? 'modified' : 'unmodified'}">${i.modified ? '已个性化' : '未修改'}</span>
    </div>`;
  }).join('');
  openModal('insertModule');
}

function insertModuleRef(installId) {
  const inst = state.installed.find(i => i.installId === installId);
  if (!inst) return;
  closeModal('insertModule');
  navigateTo('editor');
  const editor = $('promptEditor');
  editor.focus();
  const ref = document.createElement('span');
  ref.className = 'module-ref' + (inst.modified ? ' modified' : '');
  ref.contentEditable = 'false';
  ref.dataset.install = installId;
  ref.textContent = '🧩 模块：' + getModule(inst.moduleId).name;
  let range = savedRange && editor.contains(savedRange.commonAncestorContainer) ? savedRange : null;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    // 末尾补一行，避免插入到最后一段文字中间
    const br = document.createElement('div');
    editor.appendChild(br);
    range.setStart(br, 0);
  }
  range.deleteContents();
  range.insertNode(ref);
  range.setStartAfter(ref);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  savedRange = range.cloneRange();
  state.promptHTML = editor.innerHTML;
  persist();
  toast(`已插入模块「${getModule(inst.moduleId).name}」，可点击「预览最终提示词」查看展开效果`);
}

function refreshRefBadges() {
  document.querySelectorAll('.module-ref').forEach(ref => {
    const inst = state.installed.find(i => i.installId === ref.dataset.install);
    ref.classList.toggle('modified', !!(inst && inst.modified));
  });
}

/* ---------- 引用块操作 ---------- */
function openRefAction(refNode) {
  currentRefNode = refNode;
  const inst = state.installed.find(i => i.installId === refNode.dataset.install);
  if (!inst) { refNode.remove(); toast('该模块已移除，引用已清理'); return; }
  const m = getModule(inst.moduleId);
  $('refActionTitle').textContent = `模块：${m.name}`;
  $('refActionBody').innerHTML = `
    <div class="detail-kv"><span class="k">模块变量</span><span class="v">${esc(m.varName)}</span></div>
    <div class="detail-kv"><span class="k">修改状态</span><span class="v">${inst.modified ? '已个性化' : '未修改'}</span></div>
    <div class="detail-section-title" style="margin-top:12px">当前变量值</div>
    <div class="readonly-prompt" style="max-height:220px;overflow-y:auto">${esc(inst.prompt)}</div>`;
  openModal('refAction');
}
function removeCurrentRef() {
  if (currentRefNode) currentRefNode.remove();
  state.promptHTML = $('promptEditor').innerHTML;
  persist();
  closeModal('refAction');
  toast('已从主提示词移除引用，模块仍保留在已安装模块中');
}
function editCurrentRef() {
  const installId = currentRefNode && currentRefNode.dataset.install;
  closeModal('refAction');
  if (installId) openModuleEdit(installId);
}

/* ---------- 预览最终提示词 ---------- */
function serializeEditor() {
  const parts = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) { parts.push({ type: 'text', text: node.textContent }); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList && node.classList.contains('module-ref')) {
      parts.push({ type: 'module', installId: node.dataset.install });
      return;
    }
    if (node.tagName === 'BR') { parts.push({ type: 'text', text: '\n' }); return; }
    node.childNodes.forEach(walk);
    if (['DIV', 'P'].includes(node.tagName)) parts.push({ type: 'text', text: '\n' });
  };
  $('promptEditor').childNodes.forEach(walk);
  return parts;
}

function openFinalPromptPreview() {
  const parts = serializeEditor();
  const html = parts.map(p => {
    if (p.type === 'text') return esc(p.text);
    const inst = state.installed.find(i => i.installId === p.installId);
    if (!inst) return '';
    const m = getModule(inst.moduleId);
    return `<div class="final-module-block">
      <div class="final-module-source">来自模块：${esc(m.name)}（${inst.modified ? '已个性化' : '未修改'} · 来源 ${inst.version}）</div>
      <div>${esc(inst.prompt)}</div>
    </div>`;
  }).join('');
  $('finalPromptView').innerHTML = html || '<span style="color:var(--text-tertiary)">主提示词为空</span>';
  openModal('finalPrompt');
}

/* ---------- 工具区联动 ---------- */
function getInstalledTools() {
  const map = new Map();
  state.installed.forEach(i => {
    const m = getModule(i.moduleId);
    m.tools.forEach(t => {
      if (!map.has(t.id)) map.set(t.id, { ...t, sources: [] });
      map.get(t.id).sources.push(m.name);
    });
  });
  return [...map.values()];
}

function renderTools() {
  const tools = getInstalledTools();
  $('toolCountLabel').textContent = `${tools.length}/${tools.length} 启用`;
  $('toolList').innerHTML = tools.length ? tools.map(t => `
    <div class="var-item">
      <div class="var-key" style="min-width:150px">⚒ ${esc(t.name)}</div>
      <span class="tool-source">由模块“${t.sources.map(esc).join('”、“')}”添加</span>
      <button class="tool-remove-btn" onclick="tryRemoveTool('${t.id}')" title="删除工具">✕</button>
    </div>`).join('')
    : '<div style="font-size:13px;color:var(--text-tertiary);padding:4px 0">暂无工具，添加「提示词＋工具」模块后自动带入。</div>';
}

function tryRemoveTool(toolId) {
  const tool = getInstalledTools().find(t => t.id === toolId);
  if (tool) {
    toast(`“${tool.name}”正在被模块“${tool.sources.join('”、“')}”使用。请先移除该模块。`);
  }
}

/* ---------- 公共模块 CRUD ---------- */
let editingModuleId = null;
let formTools = [];

function openModuleForm(moduleId) {
  editingModuleId = moduleId || null;
  const m = moduleId ? getModule(moduleId) : null;
  $('moduleFormTitle').textContent = m ? `编辑公共模块“${m.name}”` : '创建模块';
  $('formModuleName').value = m ? m.name : '';
  $('formModuleDesc').value = m ? m.desc : '';
  $('formModuleType').value = m ? m.type : 'prompt';
  $('formModuleMaintainer').value = m ? m.maintainer : '语音平台组';
  $('formModulePrompt').value = m ? m.prompt : '';
  formTools = m ? JSON.parse(JSON.stringify(m.tools)) : [];
  toggleFormTools();
  renderFormTools();
  openDrawer('moduleForm');
}

function toggleFormTools() {
  $('formToolsSection').style.display = $('formModuleType').value === 'prompt_tool' ? 'block' : 'none';
}

function renderFormTools() {
  $('formToolRows').innerHTML = formTools.map((t, idx) => `
    <div class="form-tool-row">
      <input class="debug-input" placeholder="工具名称，如：手机号格式校验" value="${esc(t.name)}" oninput="formTools[${idx}].name=this.value">
      <input class="debug-input" placeholder="工具描述（选填）" value="${esc(t.desc)}" oninput="formTools[${idx}].desc=this.value">
      <button class="tool-remove-btn" onclick="removeFormTool(${idx})">✕</button>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text-tertiary)">尚未添加工具，点击下方「添加工具」。</div>';
}
function addFormTool() {
  formTools.push({ id: 'tool_' + Date.now() + '_' + formTools.length, name: '', desc: '' });
  renderFormTools();
}
function removeFormTool(idx) { formTools.splice(idx, 1); renderFormTools(); }

function bumpVersion(v) {
  const m = /^v(\d+)\.(\d+)$/.exec(v || '');
  return m ? `v${m[1]}.${+m[2] + 1}` : 'v1.1';
}

function saveModuleForm() {
  const name = $('formModuleName').value.trim();
  const desc = $('formModuleDesc').value.trim();
  const type = $('formModuleType').value;
  const maintainer = $('formModuleMaintainer').value.trim() || '未指定';
  const prompt = $('formModulePrompt').value.trim();
  if (!name || !desc || !prompt) { toast('请填写模块名称、功能说明和提示词正文'); return; }
  const tools = type === 'prompt_tool' ? formTools.filter(t => t.name.trim()) : [];
  if (type === 'prompt_tool' && !tools.length) { toast('「提示词＋工具」模块至少需要一个有名称的工具'); return; }

  if (editingModuleId) {
    const m = getModule(editingModuleId);
    if (!m) return;
    Object.assign(m, { name, desc, type, maintainer, prompt, tools, version: bumpVersion(m.version) });
    toast(`公共模块已更新为 ${m.version}，已安装的智能体副本不受影响`);
  } else {
    const ts = Date.now();
    getLibrary().push({
      id: 'mod_' + ts, name, desc, type, maintainer, prompt, tools,
      version: 'v1.0', source: '平台模块',
      varName: name, varKey: `modules.custom_${ts}.prompt`
    });
    toast(`模块“${name}”已创建`);
  }
  persist();
  closeDrawer('moduleForm');
  renderModuleLibrary();
  // 若详情抽屉仍打开，刷新其内容
  if ($('moduleDetailDrawer').classList.contains('open') && currentDetailModuleId) {
    openModuleDetail(currentDetailModuleId);
  }
}

function deleteModule(moduleId) {
  const m = getModule(moduleId);
  if (!m) return;
  if (isInstalled(moduleId)) {
    toast(`“${m.name}”已安装到当前智能体，请先在已安装模块中移除，再删除公共模块`);
    return;
  }
  if (!confirm(`确定删除公共模块“${m.name}”？\n删除后不可恢复。`)) return;
  state.library = getLibrary().filter(x => x.id !== moduleId);
  persist();
  closeDrawer('moduleDetail');
  renderModuleLibrary();
  toast(`公共模块“${m.name}”已删除`);
}

/* ---------- 时钟 & 初始化 ---------- */
function updateClock() {
  const now = new Date();
  $('topbarTime').textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
}

document.addEventListener('DOMContentLoaded', () => {
  restore();
  renderAgentCards();
  renderModuleLibrary();
  initPromptEditor();
  renderInstalledModules();
  renderTools();
  updateClock();
  setInterval(updateClock, 1000);
});
