export declare function isExternalHref(href?: string | null): boolean;
export declare function externalAttrs(href?: string | null): {
  target?: "_blank";
  rel?: "noopener noreferrer";
};
export default isExternalHref;
