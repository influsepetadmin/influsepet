import { Search } from "lucide-react";

export function DiscoverySearchQueryField({
  id,
  name = "q",
  defaultValue = "",
  placeholder = "ör. zeynepbastık, zeynep bastık veya kitapsec",
}: {
  id: string;
  /** GET query param name (default `q`). */
  name?: string;
  /** Value from URL after search or reload. */
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="discovery-search-query">
      <Search className="discovery-search-query__icon" size={18} strokeWidth={1.75} aria-hidden />
      <input
        id={id}
        name={name}
        type="search"
        className="discovery-search-query__input"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        aria-label="İsim veya kullanıcı adı ara"
        enterKeyHint="search"
      />
    </div>
  );
}
