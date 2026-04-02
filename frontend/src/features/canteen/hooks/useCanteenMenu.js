import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

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
        // If it's already a flat array, return as-is
        return data;
      }

      // Flatten categorized items
      if (data.categories) {
        for (const cat of data.categories) {
          if (cat.items) {
            for (const item of cat.items) {
              items.push({ ...item, _categoryName: cat.category_name });
            }
          }
        }
      }

      // Add uncategorized items
      if (data.uncategorized_items) {
        for (const item of data.uncategorized_items) {
          items.push({ ...item, _categoryName: 'Other' });
        }
      }

      return items;
    },
    enabled: !!canteenId,
  });
};