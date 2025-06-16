import axios, { AxiosInstance } from "axios";
import { getPreferenceValues } from "@raycast/api";
import {
  ERPNextPreferences,
  DocType,
  DocTypeItem,
  FrappeResponse,
  DocTypeMeta,
} from "./types";

class ERPNextAPI {
  private client: AxiosInstance;
  private preferences: ERPNextPreferences;

  constructor() {
    this.preferences = getPreferenceValues<ERPNextPreferences>();

    this.client = axios.create({
      baseURL: this.preferences.erpnext_url,
      headers: {
        Authorization: `token ${this.preferences.api_key}:${this.preferences.api_secret}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getDocTypes(): Promise<DocType[]> {
    try {
      const response = await this.client.get<FrappeResponse<DocType>>(
        "/api/resource/DocType",
        {
          params: {
            fields: [
              "name",
              "module",
              "custom",
              "is_submittable",
              "is_child_table",
              "track_changes",
              "description",
            ],
            filters: [["DocType", "istable", "!=", 1]], // Exclude child tables
            limit_page_length: 200,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching DocTypes:", error);
      throw new Error(
        "Failed to fetch DocTypes. Please check your ERPNext connection settings.",
      );
    }
  }

  async getDocTypeItems(doctype: string, limit = 20): Promise<DocTypeItem[]> {
    try {
      const response = await this.client.get<FrappeResponse<DocTypeItem>>(
        `/api/resource/${encodeURIComponent(doctype)}`,
        {
          params: {
            limit_page_length: limit,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching items for DocType ${doctype}:`, error);
      throw new Error(`Failed to fetch items for ${doctype}`);
    }
  }

  async getDocTypeMeta(doctype: string): Promise<DocTypeMeta> {
    try {
      const response = await this.client.get(
        `/api/resource/DocType/${encodeURIComponent(doctype)}`,
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching meta for DocType ${doctype}:`, error);
      throw new Error(`Failed to fetch meta for ${doctype}`);
    }
  }

  async searchDocTypeItems(
    doctype: string,
    searchTerm: string,
    limit = 20,
  ): Promise<DocTypeItem[]> {
    try {
      // Get doctype meta to find the title field
      const meta = await this.getDocTypeMeta(doctype);
      const titleField = meta.title_field || "name";

      const response = await this.client.get<FrappeResponse<DocTypeItem>>(
        `/api/resource/${encodeURIComponent(doctype)}`,
        {
          params: {
            filters: [[doctype, titleField, "like", `%${searchTerm}%`]],
            limit_page_length: limit,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error searching items for DocType ${doctype}:`, error);
      throw new Error(`Failed to search items for ${doctype}`);
    }
  }

  getNewDocumentURL(doctype: string): string {
    return `${this.preferences.erpnext_url}/app/${doctype.toLowerCase().replace(/ /g, "-")}/new`;
  }

  getDocumentURL(doctype: string, name: string): string {
    return `${this.preferences.erpnext_url}/app/${doctype.toLowerCase().replace(/ /g, "-")}/${encodeURIComponent(name)}`;
  }
}

export const erpNextAPI = new ERPNextAPI();
