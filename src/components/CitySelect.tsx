import { TURKEY_CITIES } from "@/lib/cities";

export default function CitySelect({
  id,
  name,
  defaultValue,
  required: requiredProp,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  /** Marka influencer aramasinda sehir opsiyonel olabilir */
  required?: boolean;
}) {
  const required = requiredProp ?? true;
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
