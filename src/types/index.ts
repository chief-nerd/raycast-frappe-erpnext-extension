export interface DocType {
  name: string;
  module?: string;
  custom?: boolean;
  label?: string;
  is_submittable?: boolean;
  is_child_table?: boolean;
  track_changes?: boolean;
  description?: string;
}

export interface DocTypeItem {
  name: string;
  [key: string]: any; // Allow dynamic fields since ERPNext documents can have any fields
}

export interface FrappeResponse<T> {
  data: T[];
  message?: string;
}

export interface DocField {
  fieldname: string;
  fieldtype: string;
  label: string;
  reqd?: boolean;
  options?: string;
  description?: string;
}

export interface DocTypeMeta {
  name: string;
  fields: DocField[];
  is_submittable?: boolean;
  title_field?: string;
}

export interface ERPNextPreferences {
  erpnext_url: string;
  api_key: string;
  api_secret: string;
}
