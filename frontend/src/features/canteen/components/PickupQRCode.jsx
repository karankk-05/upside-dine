import { Search, X } from "lucide-react";

export default function MenuSearch({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="relative">
      {/* Search Icon */}
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white pl-9 pr-9 py-2 rounded-xl outline-none text-sm border border-gray-800 focus:border-red-500"
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}