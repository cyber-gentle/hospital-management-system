import { apiRequest } from '../../lib/api';

export type StudyStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface ImagingExam { id:string; modality:string; exam_name:string; price:string; }
export interface ImagingRequest {
  id:string; patient_id:string; catalog_id:string; status:StudyStatus;
  report_text:string|null; dicom_study_uid:string|null; requested_by:string;
  radiologist_id:string|null; created_at:string; updated_at:string;
}
export const radiologyApi = {
  catalog: ():Promise<ImagingExam[]> => apiRequest('/radiology/catalog'),
  requests: (offset=0):Promise<ImagingRequest[]> => {
    if (!Number.isSafeInteger(offset) || offset<0) return Promise.reject(new Error('Invalid study page'));
    return apiRequest(`/radiology/requests?limit=100&offset=${offset}`);
  },
  create: (patientId:string,catalogId:string):Promise<ImagingRequest> => apiRequest('/radiology/requests',{method:'POST',body:JSON.stringify({patient_id:patientId,catalog_id:catalogId})}),
  saveReport: (id:string,status:StudyStatus,report:string):Promise<ImagingRequest> => apiRequest(`/radiology/requests/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({status,report_text:report})}),
};
