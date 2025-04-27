document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const htmlCode = document.getElementById('htmlCode');
  const cssCode = document.getElementById('cssCode');
  const jsCode = document.getElementById('jsCode');

  // Helper to set placeholder if empty
  function setPlaceholders() {
    [htmlCode, cssCode, jsCode].forEach(block => {
      if (!block.textContent.trim()) {
        block.innerHTML = '<span class="placeholder">No code extracted yet</span>';
      }
    });
  }

  // Initial placeholder
  setPlaceholders();

  extractBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageCode
    });
    const extractedCode = results[0].result;
    // Remove leading/trailing whitespace and collapse multiple blank lines for HTML
    let htmlPreview = extractedCode.html.replace(/^[\s\n]+|[\s\n]+$/g, '');
    htmlPreview = htmlPreview.replace(/\n{2,}/g, '\n');
    htmlCode.textContent = htmlPreview;
    // Store the full HTML for copying
    htmlCode.dataset.fullhtml = extractedCode.html;

    // Remove leading/trailing whitespace and collapse multiple blank lines for CSS
    let cssPreview = extractedCode.css.replace(/^[\s\n]+|[\s\n]+$/g, '');
    cssPreview = cssPreview.replace(/\n{2,}/g, '\n');
    cssCode.textContent = cssPreview;
    // Store the full CSS for copying
    cssCode.dataset.fullcss = extractedCode.css;

    // For JS preview, remove leading/trailing whitespace and collapse multiple blank lines
    let jsPreview = extractedCode.js.replace(/^[\s\n]+|[\s\n]+$/g, '');
    jsPreview = jsPreview.replace(/\n{2,}/g, '\n');
    jsCode.textContent = jsPreview;
    // Store the full JS for copying
    jsCode.dataset.fulljs = extractedCode.js;
    setPlaceholders();
  });

  // Make each code block clickable for copy
  [htmlCode, cssCode, jsCode].forEach(block => {
    block.style.cursor = 'pointer';
    block.addEventListener('click', async () => {
      let code;
      if (block === jsCode && jsCode.dataset.fulljs) {
        code = jsCode.dataset.fulljs;
      } else if (block === htmlCode && htmlCode.dataset.fullhtml) {
        code = htmlCode.dataset.fullhtml;
      } else if (block === cssCode && cssCode.dataset.fullcss) {
        code = cssCode.dataset.fullcss;
      } else {
        code = block.textContent;
      }
      if (code.trim() === '' || code === 'No code extracted yet') return;
      await navigator.clipboard.writeText(code);
      block.classList.add('copied');
      const original = block.innerHTML;
      block.innerHTML = '<span class="placeholder">Copied!</span>';
      setTimeout(() => {
        block.innerHTML = original;
        block.classList.remove('copied');
      }, 900);
    });
  });

  // Add copy functionality to the new center copy buttons
  document.querySelectorAll('.center-copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const codeBlock = document.getElementById(targetId);
      let code;
      if (codeBlock === jsCode && jsCode.dataset.fulljs) {
        code = jsCode.dataset.fulljs;
      } else if (codeBlock === htmlCode && htmlCode.dataset.fullhtml) {
        code = htmlCode.dataset.fullhtml;
      } else if (codeBlock === cssCode && cssCode.dataset.fullcss) {
        code = cssCode.dataset.fullcss;
      } else {
        code = codeBlock.textContent;
      }
      if (code.trim() === '' || code === 'No code extracted yet') return;
      await navigator.clipboard.writeText(code);
      btn.innerHTML = '<span>✓</span>';
      setTimeout(() => {
        btn.innerHTML = '<span>📋</span>';
      }, 900);
    });
  });

  // Copy all code with dividers
  copyAllBtn.addEventListener('click', async () => {
    const html = htmlCode.dataset.fullhtml || htmlCode.textContent;
    const css = cssCode.dataset.fullcss || cssCode.textContent;
    let js = jsCode.dataset.fulljs || jsCode.textContent;
    const allText =
      '===== HTML =====\n' + (html.trim() === '' || html === 'No code extracted yet' ? '[No code extracted yet]' : html) +
      '\n\n===== CSS =====\n' + (css.trim() === '' || css === 'No code extracted yet' ? '[No code extracted yet]' : css) +
      '\n\n===== JavaScript =====\n' + (js.trim() === '' || js === 'No code extracted yet' ? '[No code extracted yet]' : js);
    await navigator.clipboard.writeText(allText);
    copyAllBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyAllBtn.textContent = 'Copy All';
    }, 900);
  });

  // Download all code as a .txt file with dividers
  downloadBtn.addEventListener('click', () => {
    const html = htmlCode.dataset.fullhtml || htmlCode.textContent;
    const css = cssCode.dataset.fullcss || cssCode.textContent;
    let js = jsCode.dataset.fulljs || jsCode.textContent;
    const allText =
      '===== HTML =====\n' + (html.trim() === '' || html === 'No code extracted yet' ? '[No code extracted yet]' : html) +
      '\n\n===== CSS =====\n' + (css.trim() === '' || css === 'No code extracted yet' ? '[No code extracted yet]' : css) +
      '\n\n===== JavaScript =====\n' + (js.trim() === '' || js === 'No code extracted yet' ? '[No code extracted yet]' : js);
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'html-thief-export.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  });
});

function extractPageCode() {
  const html = document.documentElement.outerHTML;
  const css = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');
  const scripts = Array.from(document.scripts)
    .map(script => script.textContent)
    .join('\n');
  return {
    html,
    css,
    js: scripts
  };
} 