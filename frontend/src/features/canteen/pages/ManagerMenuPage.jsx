import { useManagerMenu } from "../hooks/useManagerMenu";
import { useUpdateMenuItem } from "../hooks/useUpdateMenuItem";

export default function ManagerMenuPage() {
  const { data: menu = [], isLoading, refetch } =
    useManagerMenu();

  const { mutate: updateMenuItem } = useUpdateMenuItem();

  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category_name || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const handleToggleAvailability = (item) => {
    updateMenuItem(
      {
        id: item.id,
        is_available: !item.is_available,
      },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading menu...
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-xl font-semibold mb-4">
        Manage Menu
      </h1>

      {Object.keys(groupedMenu).length === 0 ? (
        <div className="text-gray-400 text-center mt-10">
          No menu items found
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMenu).map(
            ([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold mb-2 text-gray-300">
                  {category}
                </h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${
                              item.is_veg
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />

                          <p className="text-sm font-medium">
                            {item.item_name}
                          </p>
                        </div>

                        <p className="text-xs text-gray-400 mt-1">
                          ₹{item.price} •{" "}
                          {item.preparation_time_mins} min
                        </p>

                        {!item.is_available && (
                          <p className="text-xs text-red-400 mt-1">
                            Currently unavailable
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}

                        <button
                          onClick={() =>
                            handleToggleAvailability(item)
                          }
                          className={`text-xs px-3 py-1 rounded ${
                            item.is_available
                              ? "bg-green-500 text-black"
                              : "bg-gray-700 text-white"
                          }`}
                        >
                          {item.is_available
                            ? "Available"
                            : "Unavailable"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}