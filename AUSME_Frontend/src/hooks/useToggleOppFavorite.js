import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavoriteOpp } from '../services/opp';

export function useToggleOppFavorite({
  effectiveAuid,
  oppId,
  bookmarksMode = false,
  getIsFavorite,
  onLocalOppPatch,
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFavoriteOpp(effectiveAuid, oppId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['opportunities'] });
      const wasFavorite = !!getIsFavorite?.();

      // Update Opportunities lists (cards page)
      queryClient.setQueriesData({ queryKey: ['opportunities'] }, (oldData) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            let updatedResults = page.results.map((opt) =>
              opt.opp_id === oppId ? { ...opt, is_favorite: !opt.is_favorite } : opt
            );

            // If viewing bookmarks list and we unbookmarked, remove it immediately
            if (bookmarksMode && wasFavorite) {
              updatedResults = updatedResults.filter((opt) => opt.opp_id !== oppId);
            }

            return { ...page, results: updatedResults };
          }),
        };
      });

      // Update the modal snapshot (selectedOpp) if provided
      onLocalOppPatch?.({ is_favorite: !wasFavorite });

      return { previousQueries };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousQueries) {
        ctx.previousQueries.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'], refetchType: 'none' });
    },
  });
}