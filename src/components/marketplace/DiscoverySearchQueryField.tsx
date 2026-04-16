import { Search } from "lucide-react";

/**
 * UI-only query field for future fuzzy search. Omit `name` so GET forms do not send this value yet.
 */
export function DiscoverySearchQueryField({
  id,
  placeholder = "ör. zeynepbastık, zeynep bastık veya kitapsec",
}: {
  id: string;
  placeholder?: string;
}) {
  return (
    <div className="discovery-search-query">
      <Search className="discovery-search-query__icon" size={18} strokeWidth={1.75} aria-hidden />
      <input
        id={id}
        type="search"
        className="discovery-search-query__input"
        placeholder={placeholder}
        autoComplete="off"
        aria-label="İsim veya kullanıcı adı ara"
        enterKeyHint="search"
      />
    </div>
  );
}
