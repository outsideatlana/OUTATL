import type { AnchorHTMLAttributes, ReactNode } from "react";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  hash?: string;
  params?: Record<string, string>;
  children: ReactNode;
};

export function AppLink({ to, hash, params, children, ...props }: AppLinkProps) {
  let href = to;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      href = href.replace(`$${key}`, value);
    });
  }
  if (hash) href += `#${hash}`;
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
