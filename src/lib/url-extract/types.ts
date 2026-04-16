export type UrlExtractMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: string | null;
};

export type UrlExtractResult = {
  url: string;
  meta: UrlExtractMeta;
  /** Plain text body when Readability succeeds */
  body: string | null;
  bodyTruncated: boolean;
  extractMethod: "readability" | "meta_only" | "failed";
  fetchDurationMs: number;
};
