"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showClear, setShowClear] = useState(Boolean(defaultValue?.trim()));
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitModeRef = useRef<"push" | "replace">("push");

  const submitFormClientSide = useCallback(
    (form: HTMLFormElement) => {
      const action = form.getAttribute("action") || window.location.pathname;
      const url = new URL(action, window.location.origin);
      const params = new URLSearchParams();

      for (const [key, value] of new FormData(form).entries()) {
        const text = typeof value === "string" ? value.trim() : "";
        if (!key || !text) continue;
        params.append(key, text);
      }

      const target = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      const current = `${window.location.pathname}${window.location.search}`;
      const mode = submitModeRef.current;
      submitModeRef.current = "push";
      if (target === current) return;

      startTransition(() => {
        if (mode === "replace") {
          router.replace(target, { scroll: false });
        } else {
          router.push(target, { scroll: false });
        }
      });
    },
    [router],
  );

  useEffect(() => {
    const form = inputRef.current?.closest("form");
    if (!form) return undefined;

    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      submitFormClientSide(form);
    };

    form.addEventListener("submit", onSubmit);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      form.removeEventListener("submit", onSubmit);
    };
  }, [submitFormClientSide]);

  const scheduleDebouncedSubmit = () => {
    if (!debouncedAutoSubmitMs) return;
    const form = inputRef.current?.closest("form");
    if (!form) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      submitModeRef.current = "replace";
      form.requestSubmit();
    }, debouncedAutoSubmitMs);
  };

  return (
    <div
      className={`discovery-search-query discovery-search-query--enhanced${
        isPending ? " discovery-search-query--pending" : ""
      }`}
      aria-busy={isPending}
    >
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
              if (debouncedAutoSubmitMs && form) {
                submitModeRef.current = "replace";
                form.requestSubmit();
              }
            }
          }}
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
