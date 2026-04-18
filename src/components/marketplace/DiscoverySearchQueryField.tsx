"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function DiscoverySearchQueryField({
  id,
  name = "q",
  defaultValue = "",
  placeholder = "ör. zeynepbastık, akbir kırtasiye, elbistan, kitap…",
  debouncedAutoSubmitMs,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Keşfet GET formu: yazmayı bıraktıktan sonra otomatik gönder (ms). */
  debouncedAutoSubmitMs?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showClear, setShowClear] = useState(Boolean(defaultValue?.trim()));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleDebouncedSubmit = () => {
    if (!debouncedAutoSubmitMs) return;
    const form = inputRef.current?.closest("form");
    if (!form) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      form.requestSubmit();
    }, debouncedAutoSubmitMs);
  };

  return (
    <div className="discovery-search-query discovery-search-query--enhanced">
      <Search className="discovery-search-query__icon" size={18} strokeWidth={1.75} aria-hidden />
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="search"
        className="discovery-search-query__input"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        aria-label="Arama"
        enterKeyHint="search"
        onInput={(e) => {
          setShowClear(Boolean((e.target as HTMLInputElement).value.trim()));
          scheduleDebouncedSubmit();
        }}
      />
      {showClear ? (
        <button
          type="button"
          className="discovery-search-query__clear"
          aria-label="Aramayı temizle"
          onClick={() => {
            const el = inputRef.current;
            const form = el?.closest("form");
            if (el) {
              el.value = "";
              setShowClear(false);
              el.focus();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = null;
              if (debouncedAutoSubmitMs && form) form.requestSubmit();
            }
          }}
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
