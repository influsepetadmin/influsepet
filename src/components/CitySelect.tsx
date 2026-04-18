import { TURKEY_CITIES } from "@/lib/cities";

export default function CitySelect({
  id,
  name,
  defaultValue,
  required: requiredProp,
  searchable = false,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  /** Marka influencer aramasinda sehir opsiyonel olabilir */
  required?: boolean;
  /** Keşfet filtreleri: yazarak daraltılabilir şehir (datalist). Profil formlarında kapalı tutun. */
  searchable?: boolean;
}) {
  const required = requiredProp ?? true;
  const datalistId = `${id}-city-datalist`;

  if (searchable) {
    return (
      <>
        <input
          id={id}
          name={name}
          type="text"
          className="city-select city-select--searchable"
          defaultValue={defaultValue ?? ""}
          list={datalistId}
          placeholder="Şehir yazın veya listeden seçin"
          autoComplete="off"
          aria-label="Şehir"
          required={required}
        />
        <datalist id={datalistId}>
          {TURKEY_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </>
    );
  }

  return (
    <select id={id} name={name} defaultValue={defaultValue ?? ""} required={required}>
      <option value="">Sehir seciniz</option>
      {TURKEY_CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
