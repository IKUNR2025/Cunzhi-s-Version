import {getCurrentUser} from '../services/session';
import {trackActivityAPI} from '../services/analytics';

export const useTracker = () => {
    const trackEvent = async (action = 'click', target_type = null, query = null, target_id = null, url = null, overrideAuid = null) => {
        const user = getCurrentUser();

        let auid = overrideAuid || user?.auid || user?.username || null;


        const details = {
            target_type: target_type ? target_type.toLowerCase() : null,
            target_id: target_id ? target_id.toLowerCase() : null,
            search_query: query ? query : null,
            url: url ? url : null
        };

        return await trackActivityAPI(auid, action, details);
    };

    return {trackEvent};
};