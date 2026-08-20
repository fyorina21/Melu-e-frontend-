export const Platform = {
  OS: 'web',
  select: (obj: Record<string, unknown>) => obj.web ?? obj.default,
};