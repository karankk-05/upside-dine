import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

const normalizeVegFlag = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return false;
};

export const useCanteenMenu = (canteenId) => {
  return useQuery({
    queryKey: ["menu", canteenId],
    queryFn: async () => {
      const res = await api.get(`/canteens/${canteenId}/menu/`);
      const data = res.data;

      // The API returns { categories: [{ items: [...] }], uncategorized_items: [...] }
      // Flatten into a single array of menu items for the UI
      const items = [];

      if (Array.isArray(data)) {
        return data.map((item) => ({
          ...item,
          is_veg: normalizeVegFlag(item.is_veg),
          _categoryName: item.category_name || item._categoryName || 'Other',
        }));
      }

      // Flatten categorized items
      if (data.categories) {
        for (const cat of data.categories) {
          if (cat.items) {
            for (const item of cat.items) {
              items.push({
                ...item,
                is_veg: normalizeVegFlag(item.is_veg),
                _categoryName: cat.category_name,
              });
            }
          }
        }
      }

      // Add uncategorized items
      if (data.uncategorized_items) {
        for (const item of data.uncategorized_items) {
          items.push({
            ...item,
            is_veg: normalizeVegFlag(item.is_veg),
            _categoryName: 'Other',
          });
        }
      }

      return items;
    },
    enabled: !!canteenId,
  });
};
