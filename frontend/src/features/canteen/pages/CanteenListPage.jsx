import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useCanteenList } from "../hooks/useCanteenList";
import CanteenCard from "../components/CanteenCard";
import MenuSearch from "../components/MenuSearch";

export default function CanteenListPage() {
  const navigate = useNavigate();

  const { data: canteens = [], isLoading } = useCanteenList();

  const [search, setSearch] = useState("");

  const filteredCanteens = canteens.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading canteens...
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-xl font-semibold mb-4">Canteens</h1>

      <div className="mb-4">
        <MenuSearch value={search} onChange={setSearch} />
      </div>

      {filteredCanteens.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          No canteens found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCanteens.map((canteen) => (
            <div
              key={canteen.id}
              onClick={() =>
                navigate(`/canteen/${canteen.id}`)
              }
              className="cursor-pointer"
            >
              <CanteenCard canteen={canteen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}