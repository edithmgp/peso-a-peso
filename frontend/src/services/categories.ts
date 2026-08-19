import { fetchApi } from "./api";
import { Category } from "../types";

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    return fetchApi<Category[]>("/categories");
  },
};
