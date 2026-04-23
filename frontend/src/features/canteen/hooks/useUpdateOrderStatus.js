import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import { managerOrderDetailQueryKey } from "./useManagerOrderDetail";
import { MANAGER_ORDERS_QUERY_KEY } from "./useManagerOrders";
import { MANAGER_STATS_QUERY_KEY } from "./useManagerStats";

const STATUS_TO_STATS_FIELD = {
  pending: "pending_orders",
  preparing: "preparing_orders",
  ready: "ready_orders",
  delivered: "completed_orders",
  picked_up: "completed_orders",
};

const adjustStatValue = (value, delta) => Math.max(0, Number(value || 0) + delta);

const applyOptimisticStatus = (order, nextStatus, estimatedReadyTime) => ({
  ...order,
  status: nextStatus,
  estimated_ready_time:
    estimatedReadyTime === undefined ? order.estimated_ready_time : estimatedReadyTime,
  updated_at: new Date().toISOString(),
});

const applyOptimisticStats = (stats, canteenId, previousStatus, nextStatus) => {
  if (!Array.isArray(stats) || !canteenId) {
    return stats;
  }

  const previousField = STATUS_TO_STATS_FIELD[previousStatus];
  const nextField = STATUS_TO_STATS_FIELD[nextStatus];

  if (!previousField && !nextField) {
    return stats;
  }

  return stats.map((entry) => {
    if (entry.canteen_id !== canteenId) {
      return entry;
    }

    const updatedEntry = { ...entry };
    if (previousField) {
      updatedEntry[previousField] = adjustStatValue(updatedEntry[previousField], -1);
    }
    if (nextField) {
      updatedEntry[nextField] = adjustStatValue(updatedEntry[nextField], 1);
    }
    return updatedEntry;
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, estimated_ready_time, delivery_person_id }) => {
      const body = { status, estimated_ready_time };
      if (delivery_person_id) body.delivery_person_id = delivery_person_id;
      const res = await api.patch(`/canteen-manager/orders/${id}/status/`, body);
      return res.data;
    },
    onMutate: (variables) => {
      const detailQueryKey = managerOrderDetailQueryKey(variables.id);

      // Let the UI paint the optimistic state immediately instead of waiting
      // for any background polling requests to finish cancelling first.
      void queryClient.cancelQueries({ queryKey: MANAGER_ORDERS_QUERY_KEY });
      void queryClient.cancelQueries({ queryKey: MANAGER_STATS_QUERY_KEY });
      void queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousOrders = queryClient.getQueryData(MANAGER_ORDERS_QUERY_KEY);
      const previousStats = queryClient.getQueryData(MANAGER_STATS_QUERY_KEY);
      const previousOrderDetail = queryClient.getQueryData(detailQueryKey);
      const previousOrder =
        (Array.isArray(previousOrders) &&
          previousOrders.find((order) => String(order.id) === String(variables.id))) ||
        previousOrderDetail;
      const canteenId = previousOrder?.canteen?.id;

      queryClient.setQueryData(MANAGER_ORDERS_QUERY_KEY, (currentOrders) =>
        Array.isArray(currentOrders)
          ? currentOrders.map((order) =>
              String(order.id) === String(variables.id)
                ? applyOptimisticStatus(order, variables.status, variables.estimated_ready_time)
                : order
            )
          : currentOrders
      );

      queryClient.setQueryData(detailQueryKey, (currentOrder) =>
        currentOrder
          ? applyOptimisticStatus(currentOrder, variables.status, variables.estimated_ready_time)
          : currentOrder
      );

      queryClient.setQueryData(MANAGER_STATS_QUERY_KEY, (currentStats) =>
        applyOptimisticStats(currentStats, canteenId, previousOrder?.status, variables.status)
      );

      return {
        detailQueryKey,
        previousOrders,
        previousStats,
        previousOrderDetail,
      };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(MANAGER_ORDERS_QUERY_KEY, context.previousOrders);
      queryClient.setQueryData(MANAGER_STATS_QUERY_KEY, context.previousStats);
      queryClient.setQueryData(context.detailQueryKey, context.previousOrderDetail);
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(managerOrderDetailQueryKey(variables.id), (currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status: variables.status,
              estimated_ready_time:
                variables.estimated_ready_time === undefined
                  ? currentOrder.estimated_ready_time
                  : variables.estimated_ready_time,
            }
          : currentOrder
      );
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: MANAGER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: managerOrderDetailQueryKey(variables.id) });
    },
  });
};
