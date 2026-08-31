import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = "Search for courses, lectures, or topics..." }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition duration-200" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition font-medium"
        />
        
        {/* Search Action Button */}
        <button
          type="submit"
          className="btn-primary absolute right-2 px-4 py-1.5 text-xs font-bold"
        >
          Search
        </button>
      </div>
    </form>
  );
}
