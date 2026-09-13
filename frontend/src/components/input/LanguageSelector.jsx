import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";
import { SUPPORTED_LANGUAGE_OPTIONS, normalizeLanguageCode } from "../../utils/language";
import { useMediaQuery } from "../../pragna/hooks/useMediaQuery";

export default function LanguageSelector() {
  const { language, setLanguage } = useContext(ChatContext);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const currentCode = normalizeLanguageCode(language);
  const currentOption = SUPPORTED_LANGUAGE_OPTIONS.find((item) => item.code === currentCode) || SUPPORTED_LANGUAGE_OPTIONS[0];

  return (
    <div className="group relative flex h-[34px] shrink-0 items-center rounded-lg transition-colors duration-150 hover:bg-[#1a1710]">
      {/* Visual trigger */}
      <div
        className="flex items-center gap-1.5 px-2.5 h-[34px] rounded-lg border border-border/40 bg-surface-subtle/30 text-[12px] font-semibold text-[#d8cbb0] group-hover:text-[var(--pragna-gold-soft)] group-hover:border-[var(--pragna-gold-soft)]/40 transition-colors pointer-events-none"
      >
        <span className="text-[12px] opacity-80">🌐</span>
        <span className="tracking-wide">
          {isMobile ? currentCode.toUpperCase() : (currentOption.nativeName ? `${currentOption.nativeName} (${currentOption.label})` : currentOption.label)}
        </span>
        <svg
          className="h-[9px] w-[9px] text-[#c9bda2] transition-colors group-hover:text-[var(--pragna-gold-soft)] ml-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Invisible accessible native select covering the trigger */}
      <select
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        value={currentCode}
        onChange={(e) => setLanguage(normalizeLanguageCode(e.target.value))}
        title="Choose language"
      >
        {SUPPORTED_LANGUAGE_OPTIONS.map((item) => (
          <option
            key={item.code}
            value={item.code}
            style={{ backgroundColor: "#1e1e1e", color: "#ffffff" }}
          >
            {item.nativeName && item.nativeName !== item.label ? `${item.nativeName} (${item.label})` : item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
