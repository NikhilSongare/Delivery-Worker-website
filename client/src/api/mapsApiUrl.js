import { getApiBase } from './axiosConfig';

export function mapsApiUrl(path) {
  const base = getApiBase();
  const segment = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api/maps${segment}`;
}
