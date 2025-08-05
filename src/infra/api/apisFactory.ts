import { ICrmApi } from '../../core/api/ICrmApi';
import { CrmApi } from './CrmApi';

export function createCrmApi(): ICrmApi {
  return new CrmApi();
}