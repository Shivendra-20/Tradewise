export default function Input({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="block mb-2 text-gray-300">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
      />
    </div>
  );
}