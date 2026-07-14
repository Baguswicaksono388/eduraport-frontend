export interface PaginatedMeta {
  page: number;
  item_per_page: number;
  total_item: number;
  total_page: number;
  list_pagination: number[];
}

export interface PaginatedResponse<T> extends PaginatedMeta {
  data: T[];
}
