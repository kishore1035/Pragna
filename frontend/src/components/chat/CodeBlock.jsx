import { useState, useContext } from "react";
import { CopyIcon, CheckIcon, EyeIcon } from "../icons/PragnaIcon";
import { ChatContext } from "../../context/ChatContext";

export default function CodeBlock({ code, language = "python" }) {
  const [copied, setCopied] = useState(false);
  const { openArtifact } = useContext(ChatContext) || {};

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const languageMap = {
    python: "py",
    javascript: "js",
    jsx: "jsx",
    typescript: "ts",
    tsx: "tsx",
    html: "html",
    css: "css",
    sql: "sql",
    bash: "bash",
    shell: "sh",
    json: "json",
    svg: "svg",
    markdown: "md",
  };

  const normalizedLang = (language || "").toLowerCase();
  const displayLang = languageMap[normalizedLang] || normalizedLang || "code";

  const isPreviewable =
    ["html", "htm", "svg", "xml", "markdown", "md", "json", "js", "jsx", "tsx", "css"].includes(
      normalizedLang
    ) ||
    code.trim().startsWith("<svg") ||
    code.trim().startsWith("<!DOCTYPE") ||
    code.trim().startsWith("<html") ||
    (code.trim().startsWith("<div") && code.trim().endsWith("</div>"));

  const handleOpenArtifact = () => {
    openArtifact?.({
      title: `${displayLang.toUpperCase()} Artifact`,
      content: code,
      type: normalizedLang,
    });
  };

  return (
    <div className="rounded-[14px] overflow-hidden border border-border shadow-premium-md my-2.5">
      <div className="flex items-center justify-between px-4 py-[9px] bg-surface-subtle border-b border-border">
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.8px]"
          style={{ color: "var(--pragna-gold)" }}
        >
          {displayLang}
        </span>
        <div className="flex items-center gap-2">
          {isPreviewable && openArtifact && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-[7px] border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.1)] px-[11px] py-1 text-[12px] transition-all duration-150 text-[var(--pragna-gold-soft)] hover:bg-[rgba(212,175,55,0.2)] hover:border-[var(--pragna-gold-soft)] cursor-pointer"
              onClick={handleOpenArtifact}
              title="Open in interactive Split-View Artifact panel"
            >
              <EyeIcon />
              <span>Preview</span>
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-[7px] border border-border bg-transparent px-[11px] py-1 text-[12px] transition-colors duration-150 text-[color:var(--pragna-text-muted)] hover:text-accent-400 hover:border-accent-500/35 cursor-pointer"
            onClick={copyToClipboard}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
      <pre
        className={`m-0 overflow-x-auto px-[18px] py-4 font-mono text-[13.5px] leading-[1.6] language-${language}`}
        style={{ background: "#101010", color: "#e8dcc0" }}
      >
        <code className="font-inherit text-inherit bg-transparent p-0">{code}</code>
      </pre>
    </div>
  );
}
