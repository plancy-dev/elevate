/**
 * Third-party share intent URLs for blog posts (title + canonical URL).
 */
export type BlogShareUrls = {
  x: string;
  facebook: string;
  linkedin: string;
  threads: string;
  email: string;
};

export function buildBlogShareUrls(title: string, url: string): BlogShareUrls {
  const text = `${title}\n\n${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const tweetText = encodeURIComponent(title);
  return {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${tweetText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    threads: `https://www.threads.net/intent/post?text=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
  };
}
