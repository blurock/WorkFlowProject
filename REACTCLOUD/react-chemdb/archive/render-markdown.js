(async function renderArchiveMarkdown() {
  const targets = Array.from(document.querySelectorAll("[data-markdown-src]"));
  if (targets.length === 0) return;

  const cache = new Map();

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatInline(text) {
    let s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  }

  function renderMarkdownLite(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inCode = false;
    let inUl = false;
    let inOl = false;
    let inTable = false;
    let inParagraph = false;
    let paragraph = [];

    function flushParagraph() {
      if (!inParagraph) return;
      html.push("<p>" + paragraph.map(formatInline).join(" ") + "</p>");
      inParagraph = false;
      paragraph = [];
    }

    function closeLists() {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
    }

    function closeTable() {
      if (inTable) {
        html.push("</tbody></table>");
        inTable = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        flushParagraph();
        closeLists();
        closeTable();
        if (!inCode) {
          html.push("<pre><code>");
          inCode = true;
        } else {
          html.push("</code></pre>");
          inCode = false;
        }
        continue;
      }

      if (inCode) {
        html.push(escapeHtml(line) + "\n");
        continue;
      }

      if (!trimmed) {
        flushParagraph();
        closeLists();
        closeTable();
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        closeLists();
        closeTable();
        const level = heading[1].length;
        html.push("<h" + level + ">" + formatInline(heading[2]) + "</h" + level + ">");
        continue;
      }

      const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
      if (ordered) {
        flushParagraph();
        closeTable();
        if (!inOl) {
          closeLists();
          html.push("<ol>");
          inOl = true;
        }
        html.push("<li>" + formatInline(ordered[1]) + "</li>");
        continue;
      }

      const bullet = trimmed.match(/^[-*]\s+(.*)$/);
      if (bullet) {
        flushParagraph();
        closeTable();
        if (!inUl) {
          closeLists();
          html.push("<ul>");
          inUl = true;
        }
        html.push("<li>" + formatInline(bullet[1]) + "</li>");
        continue;
      }

      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushParagraph();
        closeLists();
        const cols = trimmed.slice(1, -1).split("|").map((x) => x.trim());
        const next = (lines[i + 1] || "").trim();
        if (!inTable) {
          html.push("<table><thead><tr>" + cols.map((c) => "<th>" + formatInline(c) + "</th>").join("") + "</tr></thead>");
          if (next.startsWith("|") && next.includes("---")) {
            i += 1;
          }
          html.push("<tbody>");
          inTable = true;
        } else {
          html.push("<tr>" + cols.map((c) => "<td>" + formatInline(c) + "</td>").join("") + "</tr>");
        }
        continue;
      }

      if (trimmed.startsWith(">")) {
        flushParagraph();
        closeLists();
        closeTable();
        html.push("<blockquote><p>" + formatInline(trimmed.replace(/^>\s?/, "")) + "</p></blockquote>");
        continue;
      }

      closeLists();
      closeTable();
      if (!inParagraph) {
        inParagraph = true;
      }
      paragraph.push(trimmed);
    }

    flushParagraph();
    closeLists();
    closeTable();
    if (inCode) {
      html.push("</code></pre>");
    }

    return html.join("");
  }

  async function loadSource(source) {
    if (cache.has(source)) return cache.get(source);
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load markdown source");
    }
    const markdown = await response.text();
    cache.set(source, markdown);
    return markdown;
  }

  for (const target of targets) {
    const source = target.getAttribute("data-markdown-src");
    if (!source) continue;

    try {
      const markdown = await loadSource(source);
      if (window.marked && typeof window.marked.parse === "function") {
        target.innerHTML = window.marked.parse(markdown, {
          breaks: true,
          gfm: true
        });
      } else {
        target.innerHTML = renderMarkdownLite(markdown);
      }
    } catch (err) {
      target.innerHTML = "<p>Could not render archive markdown for this section.</p>";
    }
  }
})();
