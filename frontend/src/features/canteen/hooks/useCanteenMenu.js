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

export const canteenMenuQueryKey = (canteenId) => ["menu", canteenId];

export const fetchCanteenMenu = async (canteenId) => {
  const res = await api.get(`/canteens/${canteenId}/menu/`);
  const data = res.data;

  const items = [];

  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...item,
      is_veg: normalizeVegFlag(item.is_veg),
      _categoryName: item.category_name || item._categoryName || 'Other',
    }));
  }

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
};

export const useCanteenMenu = (canteenId) => {
  return useQuery({
    queryKey: canteenMenuQueryKey(canteenId),
    queryFn: () => fetchCanteenMenu(canteenId),
    enabled: !!canteenId,
    staleTime: 120000,
  });
};
